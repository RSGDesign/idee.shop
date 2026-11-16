import { openDatabase } from "./database.ts";
import { allowed, json, readBody, requestOrigin } from "./http.ts";
import {
  AccessError,
  COOKIE,
  login,
  register,
  requestUser,
  startServerSession,
  logout,
  throttle,
} from "./accounts.ts";
export async function authRequest(request: Request, action: string) {
  if (!allowed(request)) return json({ error: "Cerere nepermisă." }, 403);
  const db = openDatabase();
  try {
    if (request.method === "GET" && action === "me") {
      const user = requestUser(db, request);
      return user
        ? json({ user })
        : json({ error: "Autentifică-te pentru a continua." }, 401);
    }
    if (request.method === "GET" && action === "status")
      return json({
        adminConfigured: Boolean(
          db.prepare("SELECT id FROM users WHERE role='admin'").get(),
        ),
      });
    if (request.method !== "POST")
      return json({ error: "Metodă nepermisă." }, 405);
    const input = await readBody(request);
    const now = Date.now();
    if (action === "logout") {
      logout(db, request);
      return json({ ok: true }, 200, {
        "Set-Cookie": `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
      });
    }
    if (!["login", "register", "setup"].includes(action))
      return json({ error: "Rută inexistentă." }, 404);
    if (action !== "login") throttle(db, "register:all", now, 20);
    const user =
      action === "login"
        ? await login(db, input, now)
        : await register(db, input, now, action === "setup");
    const remember = input.remember === true;
    const session = startServerSession(db, user.id, remember, now);
    const cookie = `${COOKIE}=${session.token}; HttpOnly; SameSite=Strict; Path=/${remember ? "; Max-Age=604800" : ""}${requestOrigin(request)?.startsWith("https:") ? "; Secure" : ""}`;
    return json({ user }, 200, { "Set-Cookie": cookie });
  } catch (error) {
    return json(
      {
        error:
          error instanceof AccessError
            ? error.message
            : "Cererea nu a putut fi procesată. Încearcă din nou.",
      },
      error instanceof AccessError ? error.status : 400,
    );
  } finally {
    db.close();
  }
}
