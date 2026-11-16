import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { calendarRequest } from "../src/server/google-calendar.ts";
import { openDatabase } from "../src/server/database.ts";
import {
  COOKIE,
  register,
  startServerSession,
} from "../src/server/accounts.ts";
import { writeUserWorkspace } from "../src/server/user-workspace.ts";
import { newIdea, type Store } from "../src/lib/model.ts";

test("OAuth state is single-use and sync creates, updates and removes only mapped events", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "idee-google-"));
  const settings = {
    IDEE_DATABASE_PATH: join(dir, "test.sqlite"),
    IDEE_GOOGLE_CLIENT_ID: "demo",
    IDEE_GOOGLE_CLIENT_SECRET: "test-only",
    IDEE_GOOGLE_ORIGIN: "http://127.0.0.1:3000",
  };
  const previous = Object.fromEntries(
    Object.keys(settings).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, settings);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(dir, { recursive: true, force: true });
  });
  const db = openDatabase();
  t.after(() => db.close());
  const now = Date.now();
  const user = await register(
    db,
    {
      name: "Demo",
      email: "google-demo@example.test",
      password: "demo-test-password",
    },
    now,
  );
  const session = startServerSession(db, user.id, false, now).token;
  const origin = settings.IDEE_GOOGLE_ORIGIN;
  const request = (
    action: string,
    method: string,
    cookies: string,
    query = "",
  ) =>
    new Request(origin + "/api/google-calendar/" + action + query, {
      method,
      headers: {
        host: "127.0.0.1:3000",
        cookie: cookies,
        ...(method === "POST"
          ? { origin, "content-type": "application/json" }
          : {}),
      },
      body: method === "POST" ? "{}" : undefined,
    });
  const post = (action: string) =>
    calendarRequest(request(action, "POST", COOKIE + "=" + session), action);
  const events = new Map<string, Record<string, unknown>>();
  let writes = 0;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    if (url === "https://oauth2.googleapis.com/token")
      return Response.json({
        access_token: "access",
        refresh_token: "refresh",
        scope: "https://www.googleapis.com/auth/calendar.app.created",
      });
    const path = new URL(url).pathname;
    const body = init.body ? JSON.parse(String(init.body)) : {};
    if (path.endsWith("/calendars"))
      return Response.json({ id: "demo-calendar" });
    if (init.method === "POST") {
      events.set(body.id, body);
      writes++;
      return Response.json(body);
    }
    const id = path.split("/").at(-1)!;
    if (!events.has(id)) return Response.json({}, { status: 404 });
    writes++;
    if (init.method === "DELETE") {
      events.delete(id);
      return new Response(null, { status: 204 });
    }
    events.set(id, { ...events.get(id), ...body });
    return Response.json(body);
  });
  assert.equal(
    (await calendarRequest(request("status", "GET", ""), "status")).status,
    401,
  );
  const connected = await post("connect");
  assert.equal(connected.status, 200);
  const { url } = await connected.json();
  const auth = new URL(url);
  assert.equal(auth.searchParams.get("code_challenge_method"), "S256");
  const callbackCookie = connected.headers.get("set-cookie")!.split(";")[0];
  const callback = (cookies: string) =>
    calendarRequest(
      request(
        "callback",
        "GET",
        cookies,
        "?code=test&state=" + auth.searchParams.get("state"),
      ),
      "callback",
    );
  assert.match(await (await callback("")).text(), /calendar=error/);
  assert.match(
    await (await callback(callbackCookie)).text(),
    /calendar=connected/,
  );
  assert.match(await (await callback(callbackCookie)).text(), /calendar=error/);
  const row = db.prepare("SELECT secret FROM google_calendar").get();
  assert.notEqual(row?.secret, "refresh");
  const idea = newIdea("Atelier");
  idea.schedule = [
    { id: "slot", date: "2027-03-10", time: "10:00", endTime: "11:00" },
  ];
  const store: Store = { version: 1, ideas: [idea] };
  writeUserWorkspace(db, user.id, JSON.stringify(store), 0);
  assert.equal((await post("sync")).status, 200);
  assert.equal(events.size, 1);
  assert.equal((await post("sync")).status, 200);
  assert.equal(writes, 1);
  idea.schedule[0].date = "2027-03-12";
  writeUserWorkspace(db, user.id, JSON.stringify(store), 1);
  assert.equal((await post("sync")).status, 200);
  assert.deepEqual([...events.values()][0].start, {
    dateTime: "2027-03-12T10:00:00",
    timeZone: "Europe/Bucharest",
  });
  idea.schedule = [];
  writeUserWorkspace(db, user.id, JSON.stringify(store), 2);
  assert.equal((await post("sync")).status, 200);
  assert.equal(events.size, 0);
  assert.equal((await post("disconnect")).status, 200);
  assert.equal(db.prepare("SELECT 1 FROM google_calendar").get(), undefined);
});
