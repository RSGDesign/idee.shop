import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { openDatabase } from "./database.ts";
import { COOKIE, requestUser } from "./accounts.ts";
import { allowed, json, requestOrigin } from "./http.ts";
import { readUserWorkspace } from "./user-workspace.ts";
import { googleEvents } from "./google-events.ts";

const scope = "https://www.googleapis.com/auth/calendar.app.created";
const route = "/api/google-calendar/";
const stateCookie = "idee_google_state";
const active = new Set<number>();
const hash = (s: string) => createHash("sha256").update(s).digest();
const cookie = (request: Request, name: string) =>
  request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(name + "="))
    ?.slice(name.length + 1);
type Connection = { secret: string; calendar: string | null };
type Mapping = { key: string; event: string; fingerprint: string };
class GoogleError extends Error {
  readonly status: number;
  constructor(status: number) {
    super("Google Calendar nu a putut procesa cererea.");
    this.status = status;
  }
}
async function google<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!res.ok) throw new GoogleError(res.status);
  if (res.status === 204) return undefined as T;
  return res.json();
}
function token(values: Record<string, string>) {
  return google<{
    access_token: string;
    refresh_token?: string;
    scope?: string;
  }>("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams(values),
  });
}
function encrypt(value: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    hash("idee-calendar:" + secret),
    iv,
  );
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}
function decrypt(value: string, secret: string) {
  const data = Buffer.from(value, "base64");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    hash("idee-calendar:" + secret),
    data.subarray(0, 12),
  );
  cipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([
    cipher.update(data.subarray(28)),
    cipher.final(),
  ]).toString("utf8");
}
export async function calendarRequest(request: Request, action: string) {
  const origin = requestOrigin(request);
  if (!origin || !allowed(request))
    return json({ error: "Cerere nepermisă." }, 403);
  const client_id = process.env.IDEE_GOOGLE_CLIENT_ID ?? "";
  const client_secret = process.env.IDEE_GOOGLE_CLIENT_SECRET ?? "";
  const originForOAuth =
    process.env.IDEE_GOOGLE_ORIGIN ?? "http://127.0.0.1:3000";
  const enabled = Boolean(client_id && client_secret);
  if (
    (request.method === "GET" && !["status", "callback"].includes(action)) ||
    (request.method === "POST" &&
      !["connect", "sync", "disconnect"].includes(action))
  )
    return json({ error: "Acțiune necunoscută." }, 405);
  const db = openDatabase();
  const callback = new URL(route + "callback", origin);
  const stateAttrs = `HttpOnly; SameSite=Lax; Path=${route}callback${origin.startsWith("https:") ? "; Secure" : ""}`;
  const finish = (result: "connected" | "error") => {
    const title =
      result === "connected"
        ? "Google Calendar conectat"
        : "Conectarea nu a fost finalizată";
    return new Response(
      `<!doctype html><html lang="ro"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><main><h1>${title}</h1><a href="/app?calendar=${result}">Înapoi la Idee.Shop</a></main></html>`,
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy":
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "Set-Cookie": `${stateCookie}=; ${stateAttrs}; Max-Age=0`,
        },
      },
    );
  };
  const credentials = { client_id, client_secret };
  try {
    if (action === "callback") {
      if (!enabled || origin !== originForOAuth) return finish("error");
      const params = new URL(request.url).searchParams;
      const state = params.get("state");
      if (
        !state ||
        !/^[A-Za-z0-9_-]{43}$/.test(state) ||
        state !== cookie(request, stateCookie)
      )
        return finish("error");
      const entry = db
        .prepare(
          "DELETE FROM google_oauth WHERE state=? AND expires>? RETURNING user_id, session, verifier",
        )
        .get(hash(state).toString("hex"), Date.now());
      if (!entry || !params.get("code")) return finish("error");
      const user = Number(entry.user_id);
      const validSession = () =>
        db
          .prepare(
            "SELECT 1 FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND user_id=? AND expires_at>? AND active=1",
          )
          .get(String(entry.session), user, Date.now());
      if (!validSession() || active.has(user)) return finish("error");
      active.add(user);
      try {
        const result = await token({
          ...credentials,
          grant_type: "authorization_code",
          code: params.get("code")!,
          redirect_uri: callback.href,
          code_verifier: String(entry.verifier),
        });
        if (
          !validSession() ||
          !result.refresh_token ||
          !result.scope?.split(" ").includes(scope)
        )
          return finish("error");
        db.prepare(
          "INSERT INTO google_calendar(user_id,secret,calendar) VALUES(?,?,NULL)",
        ).run(user, encrypt(result.refresh_token, client_secret));
        return finish("connected");
      } finally {
        active.delete(user);
      }
    }
    const user = requestUser(db, request);
    if (!user) return json({ error: "Autentifică-te pentru a continua." }, 401);
    const id = user.id;
    const connection = db
      .prepare("SELECT secret, calendar FROM google_calendar WHERE user_id=?")
      .get(id) as Connection | undefined;
    if (action === "status")
      return json({
        enabled,
        connected: !!connection,
        canConnect: origin === originForOAuth,
      });
    if (!enabled && action !== "disconnect")
      return json(
        { error: "Google Calendar necesită configurarea OAuth." },
        503,
      );
    if (action === "connect") {
      const session = cookie(request, COOKIE);
      if (origin !== originForOAuth || !session || connection)
        return json(
          {
            error:
              "Deschide adresa configurată pentru conectare sau deconectează contul existent.",
          },
          409,
        );
      const state = randomBytes(32).toString("base64url");
      const verifier = randomBytes(32).toString("base64url");
      db.prepare("DELETE FROM google_oauth WHERE expires<=? OR user_id=?").run(
        Date.now(),
        id,
      );
      db.prepare("INSERT INTO google_oauth VALUES(?,?,?,?,?)").run(
        hash(state).toString("hex"),
        id,
        hash(session).toString("hex"),
        verifier,
        Date.now() + 600000,
      );
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({
        client_id,
        redirect_uri: callback.href,
        response_type: "code",
        scope,
        state,
        access_type: "offline",
        prompt: "consent",
        code_challenge: hash(verifier).toString("base64url"),
        code_challenge_method: "S256",
      }).toString();
      return json({ url: url.href }, 200, {
        "Set-Cookie": `${stateCookie}=${state}; ${stateAttrs}; Max-Age=600`,
      });
    }
    if (!connection)
      return json({ error: "Conectează mai întâi Google Calendar." }, 409);
    if (active.has(id))
      return json(
        { error: "O operație Google Calendar este deja în curs." },
        409,
      );
    active.add(id);
    try {
      if (action === "disconnect") {
        db.prepare("DELETE FROM google_oauth WHERE user_id=?").run(id);
        db.prepare("DELETE FROM google_calendar WHERE user_id=?").run(id);
        return json({ ok: true });
      }
      const zone = process.env.IDEE_GOOGLE_TIME_ZONE ?? "Europe/Bucharest";
      const today = new Intl.DateTimeFormat("sv-SE", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      const events = googleEvents(readUserWorkspace(db, id).store, today, zone);
      const { access_token } = await token({
        ...credentials,
        grant_type: "refresh_token",
        refresh_token: decrypt(connection.secret, client_secret),
      });
      const api = <T>(path: string, method: string, body?: object) =>
        google<T>("https://www.googleapis.com/calendar/v3/" + path, {
          method,
          headers: {
            Authorization: "Bearer " + access_token,
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
        });
      let calendar = connection.calendar;
      if (!calendar) {
        calendar = (
          await api<{ id: string }>("calendars", "POST", {
            summary: "Idee.Shop",
            timeZone: zone,
          })
        ).id;
        db.prepare("UPDATE google_calendar SET calendar=? WHERE user_id=?").run(
          calendar,
          id,
        );
      }
      const path = "calendars/" + encodeURIComponent(calendar) + "/events";
      const mappings = db
        .prepare(
          "SELECT key,event,fingerprint FROM google_events WHERE user_id=?",
        )
        .all(id) as Mapping[];
      const index = new Map(mappings.map((row) => [row.key, row]));
      for (const [key, body] of events) {
        const signature = hash(JSON.stringify(body)).toString("hex");
        let row = index.get(key);
        if (row?.fingerprint === signature) continue;
        if (!row) {
          row = {
            key,
            event: randomBytes(20).toString("hex"),
            fingerprint: "",
          };
          db.prepare("INSERT INTO google_events VALUES(?,?,?,?)").run(
            id,
            key,
            row.event,
            "",
          );
        }
        const eventPath = path + "/" + row.event;
        try {
          await api(eventPath, "PATCH", body);
        } catch (error) {
          if (!(error instanceof GoogleError) || error.status !== 404)
            throw error;
          await api(path, "POST", { ...body, id: row.event });
        }
        db.prepare(
          "UPDATE google_events SET fingerprint=? WHERE user_id=? AND key=?",
        ).run(signature, id, key);
      }
      for (const row of mappings) {
        if (events.has(row.key)) continue;
        if (row.key.includes('"repeat"')) {
          const parts = JSON.parse(row.key) as string[];
          if (parts[1] === "repeat" && parts[3] < today) continue;
        }
        try {
          await api(path + "/" + row.event, "DELETE");
        } catch (error) {
          if (
            !(error instanceof GoogleError) ||
            ![404, 410].includes(error.status)
          )
            throw error;
        }
        db.prepare("DELETE FROM google_events WHERE user_id=? AND key=?").run(
          id,
          row.key,
        );
      }
      return json({ count: events.size });
    } finally {
      active.delete(id);
    }
  } catch (error) {
    if (action === "callback") return finish("error");
    return json(
      {
        error:
          error instanceof GoogleError
            ? "Google Calendar a respins cererea. Verifică accesul contului și încearcă din nou."
            : "Sincronizarea nu a putut fi finalizată. Verifică programările și configurarea.",
      },
      502,
    );
  } finally {
    db.close();
  }
}
