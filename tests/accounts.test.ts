import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase, writeWorkspace } from "../src/server/database.ts";
import {
  createSetupToken,
  register,
  login,
  startServerSession,
  sessionUser,
  adminUpdate,
  AccessError,
} from "../src/server/accounts.ts";
import {
  readUserWorkspace,
  writeUserWorkspace,
} from "../src/server/user-workspace.ts";
import { authRequest } from "../src/server/auth-api.ts";
import { workspaceRequest } from "../src/server/workspace-api.ts";
import { adminRequest } from "../src/server/admin-api.ts";
import { createAuthRecord } from "../src/lib/auth.ts";
import { newIdea } from "../src/lib/model.ts";
const now = 1700000000000;
const account = (email: string) => ({
  name: "Test",
  email,
  password: "password-test-123",
});
test("administratorul necesită cheia proprietarului, o singură dată; păstrează datele v1", async () => {
  const db = openDatabase(":memory:");
  try {
    const legacy = { version: 1, ideas: [newIdea("Colecție existentă")] };
    writeWorkspace(db, JSON.stringify(legacy), 0);
    const normal = await register(
      db,
      { ...account("user@example.com"), role: "admin" },
      now,
    );
    assert.equal(normal.role, "user");
    assert.equal(readUserWorkspace(db, normal.id).store.ideas.length, 0);
    await assert.rejects(
      () =>
        register(
          db,
          { ...account("owner@example.com"), code: "invalid" },
          now,
          true,
        ),
      AccessError,
    );
    const code = createSetupToken(db, now);
    const admin = await register(
      db,
      { ...account("owner@example.com"), code },
      now,
      true,
    );
    assert.equal(admin.role, "admin");
    assert.deepEqual(readUserWorkspace(db, admin.id).store, legacy);
    await assert.rejects(() =>
      register(db, { ...account("second@example.com"), code }, now, true),
    );
    assert.equal(
      db.prepare("SELECT COUNT(*) AS n FROM admin_setup").get()!.n,
      0,
    );
  } finally {
    db.close();
  }
});
test("parole în DB doar hash și salt; login corect, generic pentru date greșite; sesiuni revocabile", async () => {
  const db = openDatabase(":memory:");
  try {
    const user = await register(db, account("user@example.com"), now);
    const row = db.prepare("SELECT * FROM users WHERE id=?").get(user.id)!;
    assert.notEqual(row.hash, account("").password);
    assert.equal(Buffer.from(String(row.salt), "base64").length, 16);
    assert.equal(row.iterations, 210000);
    assert.equal("password" in row, false);
    assert.equal(
      (await login(db, account("user@example.com"), now)).id,
      user.id,
    );
    const errors: string[] = [];
    for (const email of ["user@example.com", "missing@example.com"]) {
      try {
        await login(db, { email, password: "wrong-pass-123" }, now);
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    assert.equal(errors[0], errors[1]);
    const session = startServerSession(db, user.id, true, now);
    const stored = db.prepare("SELECT * FROM sessions").get()!;
    assert.notEqual(stored.token_hash, session.token);
    assert.equal(sessionUser(db, session.token, now)?.id, user.id);
    assert.equal(sessionUser(db, session.token, session.expiresAt), null);
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
    assert.equal(sessionUser(db, session.token, now), null);
  } finally {
    db.close();
  }
});
test("izolare colecții, ultimul admin protejat și blocarea contului invalidează sesiunea", async () => {
  const db = openDatabase(":memory:");
  try {
    const code = createSetupToken(db, now),
      admin = await register(
        db,
        { ...account("owner@example.com"), code },
        now,
        true,
      ),
      user = await register(db, account("user@example.com"), now);
    writeUserWorkspace(
      db,
      user.id,
      JSON.stringify({ version: 1, ideas: [newIdea("Privat")] }),
      0,
    );
    assert.equal(readUserWorkspace(db, admin.id).store.ideas.length, 0);
    await assert.rejects(() =>
      adminUpdate(db, admin, {
        action: "role",
        userId: admin.id,
        role: "user",
      }),
    );
    await assert.rejects(() =>
      adminUpdate(db, admin, {
        action: "active",
        userId: admin.id,
        active: false,
      }),
    );
    await assert.rejects(() =>
      adminUpdate(db, user, { action: "role", userId: user.id, role: "admin" }),
    );
    const token = startServerSession(db, user.id, true, now).token;
    await adminUpdate(db, admin, {
      action: "active",
      userId: user.id,
      active: false,
    });
    assert.equal(sessionUser(db, token, now), null);
    assert.equal(readUserWorkspace(db, user.id).store.ideas[0].title, "Privat");
    await adminUpdate(db, admin, {
      action: "active",
      userId: user.id,
      active: true,
    });
    await adminUpdate(db, admin, {
      action: "password",
      userId: user.id,
      password: "replacement-123",
    });
    await assert.rejects(() => login(db, account("user@example.com"), now));
    assert.equal(
      (await login(db, { email: user.email, password: "replacement-123" }, now))
        .id,
      user.id,
    );
  } finally {
    db.close();
  }
});
test("API: 401/403, cookie HttpOnly, falsificarea sesiunii respinsă, admin vede toate fără hash-uri", async (t) => {
  t.mock.method(Date, "now", () => now);
  const folder = mkdtempSync(join(tmpdir(), "idee-accounts-")),
    previous = process.env.IDEE_DATABASE_PATH;
  process.env.IDEE_DATABASE_PATH = join(folder, "accounts.sqlite");
  const request = (
    path: string,
    method = "GET",
    body?: unknown,
    token?: string,
    origin = "http://127.0.0.1:3000",
  ) =>
    new Request(`http://127.0.0.1:3000${path}`, {
      method,
      headers: {
        host: "127.0.0.1:3000",
        origin,
        "content-type": "application/json",
        ...(token ? { cookie: `idee_session=${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    const db = openDatabase();
    const code = createSetupToken(db, now);
    db.close();
    assert.equal(
      (await workspaceRequest(request("/api/workspace"))).status,
      401,
    );
    assert.equal((await adminRequest(request("/api/admin"))).status, 401);
    const setup = await authRequest(
      request("/api/auth/setup", "POST", {
        ...account("owner@example.com"),
        code,
        remember: true,
      }),
      "setup",
    );
    assert.equal(setup.status, 200);
    const cookie = setup.headers.get("set-cookie")!;
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    assert.match(cookie, /Max-Age=604800/);
    const adminToken = cookie.match(/idee_session=([^;]+)/)![1];
    const signed = await authRequest(
      request("/api/auth/register", "POST", account("user@example.com")),
      "register",
    );
    assert.equal(signed.status, 200);
    const userToken = signed.headers
      .get("set-cookie")!
      .match(/idee_session=([^;]+)/)![1];
    assert.doesNotMatch(signed.headers.get("set-cookie")!, /Max-Age/);
    assert.equal(
      (await adminRequest(request("/api/admin", "GET", undefined, userToken)))
        .status,
      403,
    );
    assert.equal(
      (
        await workspaceRequest(
          request("/api/workspace?userId=1", "GET", undefined, userToken),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await authRequest(
          request("/api/auth/me", "GET", undefined, "forged"),
          "me",
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await adminRequest(
          request(
            "/api/admin",
            "POST",
            { action: "backup" },
            adminToken,
            "https://evil.example",
          ),
        )
      ).status,
      403,
    );
    const ordinaryStore = { version: 1, ideas: [newIdea("Idee utilizator")] };
    assert.equal(
      (
        await workspaceRequest(
          request(
            "/api/workspace",
            "PUT",
            { store: ordinaryStore, revision: 0 },
            userToken,
          ),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await workspaceRequest(
          request(
            "/api/workspace",
            "POST",
            { store: ordinaryStore },
            userToken,
          ),
        )
      ).status,
      403,
    );
    const target = await workspaceRequest(
      request("/api/workspace?userId=2", "GET", undefined, adminToken),
    );
    assert.equal(target.status, 200);
    const snapshot = await target.json();
    snapshot.store.ideas[0].notes = "Actualizat de administrator";
    assert.equal(
      (
        await workspaceRequest(
          request(
            "/api/workspace?userId=2",
            "PUT",
            { store: snapshot.store, revision: snapshot.revision },
            adminToken,
          ),
        )
      ).status,
      200,
    );
    const personal = await workspaceRequest(
      request("/api/workspace", "GET", undefined, userToken),
    );
    assert.equal(
      (await personal.json()).store.ideas[0].notes,
      "Actualizat de administrator",
    );
    const all = await adminRequest(
      request("/api/admin", "GET", undefined, adminToken),
    );
    const payload = await all.text();
    assert.equal(all.status, 200);
    assert.equal(JSON.parse(payload).users.length, 2);
    assert.doesNotMatch(payload, /token_hash|"hash"|"salt"|password/);
    const logout = await authRequest(
      request("/api/auth/logout", "POST", {}, userToken),
      "logout",
    );
    assert.equal(logout.status, 200);
    assert.equal(
      (
        await authRequest(
          request("/api/auth/me", "GET", undefined, userToken),
          "me",
        )
      ).status,
      401,
    );
  } finally {
    if (previous === undefined) delete process.env.IDEE_DATABASE_PATH;
    else process.env.IDEE_DATABASE_PATH = previous;
    rmSync(folder, { recursive: true, force: true });
  }
});
test("login limitează încercările repetate fără a divulga existența contului", async () => {
  const db = openDatabase(":memory:");
  try {
    for (let n = 0; n < 10; n++)
      await assert.rejects(() =>
        login(
          db,
          { email: "unknown@example.com", password: "wrong-pass" },
          now,
        ),
      );
    await assert.rejects(
      () =>
        login(
          db,
          { email: "unknown@example.com", password: "wrong-pass" },
          now,
        ),
      (e: unknown) => e instanceof AccessError && e.status === 429,
    );
  } finally {
    db.close();
  }
});

test("profilul vechi se importă doar după parola corectă, fără privilegii admin", async () => {
  const db = openDatabase(":memory:");
  try {
    const legacy = await createAuthRecord(
      "Legacy",
      "legacy@example.com",
      "legacy-password-123",
      now,
    );
    await assert.rejects(() =>
      login(
        db,
        { email: legacy.email, password: "wrong-password", legacy },
        now,
      ),
    );
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users").get()!.n, 0);
    const user = await login(
      db,
      { email: legacy.email, password: "legacy-password-123", legacy },
      now,
    );
    assert.equal(user.role, "user");
    assert.ok(
      db
        .prepare("SELECT user_id FROM browser_import_owners WHERE user_id=?")
        .get(user.id),
    );
    const normal = await register(
      db,
      { ...account("normal@example.com"), legacyVerified: true },
      now,
    );
    assert.equal(
      db
        .prepare("SELECT user_id FROM browser_import_owners WHERE user_id=?")
        .get(normal.id),
      undefined,
    );
  } finally {
    db.close();
  }
});
