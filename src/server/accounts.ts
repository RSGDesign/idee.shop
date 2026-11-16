import { createHash, randomBytes, pbkdf2, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { DatabaseSync } from "node:sqlite";
import {
  isValidEmail,
  normalizeEmail,
  parseAuthRecord,
  ITERATIONS,
  type AuthRecord,
} from "../lib/auth.ts";
export type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  active: boolean;
  createdAt: string;
};
export const COOKIE = "idee_session";
const derive = promisify(pbkdf2);
export class AccessError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function publicUser(row: Record<string, unknown>): User {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role === "admin" ? "admin" : "user",
    active: Boolean(row.active),
    createdAt: String(row.created_at),
  };
}
export function validateAccount(
  name: unknown,
  email: unknown,
  password: unknown,
) {
  if (typeof name !== "string" || !name.trim() || name.length > 200)
    throw new AccessError("Completează numele (maximum 200 caractere).");
  if (typeof email !== "string" || !isValidEmail(email))
    throw new AccessError("Introdu o adresă de email validă.");
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 1024
  )
    throw new AccessError(
      "Parola trebuie să aibă între 8 și 1024 de caractere.",
    );
  return { name: name.trim(), email: normalizeEmail(email), password };
}
async function passwordHash(password: string, salt: string) {
  return (
    await derive(
      password,
      Buffer.from(salt, "base64"),
      ITERATIONS,
      32,
      "sha256",
    )
  ).toString("base64");
}
export async function passwordMatches(
  password: string,
  salt: string,
  hash: string,
) {
  const calculated = await passwordHash(password, salt);
  const a = Buffer.from(calculated, "base64"),
    b = Buffer.from(hash, "base64");
  return a.length === b.length && timingSafeEqual(a, b);
}
export function throttle(
  db: DatabaseSync,
  key: string,
  now: number,
  limit = 10,
) {
  db.prepare("DELETE FROM auth_throttle WHERE expires_at<=?").run(now);
  db.prepare(
    "INSERT INTO auth_throttle(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
  ).run(key, now + 15 * 60 * 1000);
  const row = db
    .prepare("SELECT count FROM auth_throttle WHERE key=?")
    .get(key)!;
  if (Number(row.count) > limit)
    throw new AccessError(
      "Prea multe încercări. Încearcă din nou peste 15 minute.",
      429,
    );
}
export function createSetupToken(db: DatabaseSync, now: number): string {
  if (db.prepare("SELECT id FROM users WHERE role='admin'").get())
    throw new AccessError("Administratorul este deja configurat.");
  const token = randomBytes(32).toString("base64url");
  db.prepare(
    "INSERT OR REPLACE INTO admin_setup(id,token_hash,expires_at) VALUES(1,?,?)",
  ).run(digest(token), now + 24 * 60 * 60 * 1000);
  return token;
}
export async function register(
  db: DatabaseSync,
  input: Record<string, unknown>,
  now: number,
  setup = false,
  legacyVerified = false,
): Promise<User> {
  const fields = validateAccount(input.name, input.email, input.password);
  const salt = randomBytes(16).toString("base64");
  const hash = await passwordHash(fields.password, salt);
  db.exec("BEGIN IMMEDIATE");
  try {
    if (db.prepare("SELECT id FROM users WHERE email=?").get(fields.email))
      throw new AccessError(
        "Nu putem crea acest cont. Încearcă autentificarea sau contactează administratorul.",
      );
    if (setup) {
      const record = db
        .prepare("SELECT token_hash,expires_at FROM admin_setup WHERE id=1")
        .get();
      if (
        db.prepare("SELECT id FROM users WHERE role='admin'").get() ||
        !record ||
        Number(record.expires_at) <= now ||
        typeof input.code !== "string" ||
        digest(input.code) !== record.token_hash
      )
        throw new AccessError(
          "Cheia de configurare este invalidă sau a expirat.",
          403,
        );
    }
    const role = setup ? "admin" : "user";
    const result = db
      .prepare(
        "INSERT INTO users(name,email,salt,hash,iterations,role,created_at) VALUES(?,?,?,?,?,?,?)",
      )
      .run(
        fields.name,
        fields.email,
        salt,
        hash,
        ITERATIONS,
        role,
        new Date(now).toISOString(),
      );
    const id = Number(result.lastInsertRowid);
    if (setup || legacyVerified)
      db.prepare("INSERT INTO browser_import_owners(user_id) VALUES(?)").run(
        id,
      );
    const legacy = setup
      ? db.prepare("SELECT revision,payload FROM workspace WHERE id=1").get()
      : null;
    db.prepare(
      "INSERT INTO user_workspaces(user_id,revision,payload) VALUES(?,?,?)",
    ).run(
      id,
      legacy ? Number(legacy.revision) : 0,
      legacy
        ? String(legacy.payload)
        : JSON.stringify({ version: 1, ideas: [] }),
    );
    if (setup) {
      db.prepare(
        "INSERT INTO user_history(user_id,revision,payload,saved_at) SELECT ?,revision,payload,saved_at FROM workspace_history",
      ).run(id);
      db.prepare(
        "INSERT INTO user_migrations(user_id,digest) SELECT ?,digest FROM browser_migrations",
      ).run(id);
      db.exec("DELETE FROM admin_setup");
      audit(db, id, "configure-admin", id);
    }
    db.exec("COMMIT");
    return publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(id)!);
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
export async function login(
  db: DatabaseSync,
  input: Record<string, unknown>,
  now: number,
): Promise<User> {
  const email =
    typeof input.email === "string" ? normalizeEmail(input.email) : "";
  throttle(db, "login:all", now, 60);
  throttle(db, `login:${email.slice(0, 254)}`, now);
  const password =
    typeof input.password === "string" && input.password.length <= 1024
      ? input.password
      : "";
  let row = db.prepare("SELECT * FROM users WHERE email=?").get(email);
  // An old browser profile may be imported only after proving knowledge of its password.
  if (!row && input.legacy) {
    let legacy: AuthRecord | undefined;
    try {
      legacy = parseAuthRecord(JSON.stringify(input.legacy));
    } catch {}
    if (
      legacy &&
      legacy.email === email &&
      password.length >= 8 &&
      (await passwordMatches(password, legacy.salt, legacy.hash))
    ) {
      // Imported identities are ordinary users; admin setup remains owner-only.
      return register(
        db,
        { name: legacy.name, email, password },
        now,
        false,
        true,
      );
    }
  }
  const valid = await passwordMatches(
    password,
    row ? String(row.salt) : Buffer.alloc(16).toString("base64"),
    row ? String(row.hash) : Buffer.alloc(32).toString("base64"),
  );
  if (!row || !row.active || !valid)
    throw new AccessError("Emailul sau parola sunt incorecte.", 401);
  db.prepare("DELETE FROM auth_throttle WHERE key=?").run(`login:${email}`);
  row = db.prepare("SELECT * FROM users WHERE id=?").get(Number(row.id));
  return publicUser(row!);
}
export function startServerSession(
  db: DatabaseSync,
  userId: number,
  remember: boolean,
  now: number,
) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = now + (remember ? 7 * 24 : 12) * 60 * 60 * 1000;
  db.prepare("DELETE FROM sessions WHERE expires_at<=?").run(now);
  db.prepare(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
  ).run(digest(token), userId, expiresAt);
  return { token, expiresAt };
}
export function sessionUser(
  db: DatabaseSync,
  token: string | undefined,
  now: number,
): User | null {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const row = db
    .prepare(
      "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1",
    )
    .get(digest(token), now);
  return row ? publicUser(row) : null;
}
export function requestUser(
  db: DatabaseSync,
  request: Request,
  now = Date.now(),
) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  return sessionUser(db, token, now);
}
export function logout(db: DatabaseSync, request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (token)
    db.prepare("DELETE FROM sessions WHERE token_hash=?").run(digest(token));
}
export function audit(
  db: DatabaseSync,
  actor: number,
  action: string,
  target: number | null = null,
) {
  db.prepare(
    "INSERT INTO admin_events(actor_id,action,target_id) VALUES(?,?,?)",
  ).run(actor, action, target);
}
export async function adminUpdate(
  db: DatabaseSync,
  actor: User,
  input: Record<string, unknown>,
) {
  if (actor.role !== "admin") throw new AccessError("Acces interzis.", 403);
  const id = Number(input.userId);
  if (!Number.isSafeInteger(id)) throw new AccessError("Utilizator invalid.");
  const assertActor = () => {
    const current = db
      .prepare("SELECT role,active FROM users WHERE id=?")
      .get(actor.id);
    if (!current || current.role !== "admin" || !current.active)
      throw new AccessError("Acces interzis.", 403);
  };
  assertActor();
  if (input.action === "password") {
    if (
      typeof input.password !== "string" ||
      input.password.length < 8 ||
      input.password.length > 1024
    )
      throw new AccessError(
        "Parola trebuie să aibă între 8 și 1024 de caractere.",
      );
    const salt = randomBytes(16).toString("base64");
    const hash = await passwordHash(input.password, salt);
    if (!db.prepare("SELECT id FROM users WHERE id=?").get(id))
      throw new AccessError("Utilizator inexistent.", 404);
    db.exec("BEGIN IMMEDIATE");
    try {
      assertActor();
      db.prepare("UPDATE users SET salt=?,hash=?,iterations=? WHERE id=?").run(
        salt,
        hash,
        ITERATIONS,
        id,
      );
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(id);
      audit(db, actor.id, "reset-password", id);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    return;
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    assertActor();
    const target = db.prepare("SELECT * FROM users WHERE id=?").get(id);
    if (!target) throw new AccessError("Utilizator inexistent.", 404);
    if (input.action === "revoke") {
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(id);
    } else {
      const role =
        input.action === "role"
          ? input.role === "admin"
            ? "admin"
            : input.role === "user"
              ? "user"
              : null
          : target.role;
      const active =
        input.action === "active"
          ? typeof input.active === "boolean"
            ? Number(input.active)
            : null
          : Number(target.active);
      if (
        !["role", "active"].includes(String(input.action)) ||
        role === null ||
        active === null
      )
        throw new AccessError("Acțiune invalidă.");
      if (
        target.role === "admin" &&
        target.active &&
        (role !== "admin" || !active) &&
        Number(
          db
            .prepare(
              "SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active=1",
            )
            .get()!.n,
        ) <= 1
      )
        throw new AccessError(
          "Ultimul administrator activ nu poate fi dezactivat sau retrogradat.",
        );
      db.prepare("UPDATE users SET role=?,active=? WHERE id=?").run(
        String(role),
        Number(active),
        id,
      );
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(id);
    }
    audit(db, actor.id, String(input.action), id);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
