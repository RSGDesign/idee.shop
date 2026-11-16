import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseStore, type Store } from "../lib/model.ts";

export type Workspace = { store: Store; revision: number };
export class ConflictError extends Error {}
export function databasePath(): string {
  return resolve(
    process.env.IDEE_DATABASE_PATH ||
      resolve(process.cwd(), "data/idee-shop.sqlite"),
  );
}
export function openDatabase(file = databasePath()) {
  if (file !== ":memory:")
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file);
  if (file !== ":memory:") chmodSync(file, 0o600);
  const schema = Number(db.prepare("PRAGMA user_version").get()!.user_version);
  if (schema > 2) {
    db.close();
    throw new Error("Versiune de bază de date incompatibilă.");
  }
  db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS workspace(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS workspace_history(revision INTEGER PRIMARY KEY, payload TEXT NOT NULL, saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS browser_migrations(digest TEXT PRIMARY KEY, imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, hash TEXT NOT NULL, iterations INTEGER NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','user')), active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS user_workspaces(user_id INTEGER PRIMARY KEY REFERENCES users(id),revision INTEGER NOT NULL,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS user_history(user_id INTEGER NOT NULL,revision INTEGER NOT NULL,payload TEXT NOT NULL,saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,revision));
    CREATE TABLE IF NOT EXISTS user_migrations(user_id INTEGER NOT NULL,digest TEXT NOT NULL,PRIMARY KEY(user_id,digest));
    CREATE TABLE IF NOT EXISTS admin_setup(id INTEGER PRIMARY KEY CHECK(id=1),token_hash TEXT NOT NULL,expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS admin_events(id INTEGER PRIMARY KEY,actor_id INTEGER NOT NULL,action TEXT NOT NULL,target_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS browser_import_owners(user_id INTEGER PRIMARY KEY REFERENCES users(id));
    CREATE TABLE IF NOT EXISTS auth_throttle(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS google_calendar(user_id INTEGER PRIMARY KEY REFERENCES users(id), secret TEXT NOT NULL, calendar TEXT);
    CREATE TABLE IF NOT EXISTS google_oauth(state TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), session TEXT NOT NULL, verifier TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS google_events(user_id INTEGER NOT NULL REFERENCES google_calendar(user_id) ON DELETE CASCADE, key TEXT NOT NULL, event TEXT NOT NULL, fingerprint TEXT NOT NULL, PRIMARY KEY(user_id,key));
    CREATE TABLE IF NOT EXISTS mcp_keys(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT NOT NULL UNIQUE);
    PRAGMA foreign_keys=ON;
    PRAGMA user_version=2;`);
  db.prepare(
    "INSERT OR IGNORE INTO workspace(id,revision,payload) VALUES(1,0,?)",
  ).run(JSON.stringify({ version: 1, ideas: [] }));
  return db;
}
export function readWorkspace(db: DatabaseSync): Workspace {
  const row = db
    .prepare("SELECT revision,payload FROM workspace WHERE id=1")
    .get()!;
  return {
    revision: Number(row.revision),
    store: parseStore(String(row.payload)),
  };
}
function writeInsideTransaction(
  db: DatabaseSync,
  store: Store,
  revision: number,
): Workspace {
  db.exec(
    "INSERT OR IGNORE INTO workspace_history(revision,payload) SELECT revision,payload FROM workspace WHERE id=1",
  );
  db.prepare("UPDATE workspace SET payload=?,revision=? WHERE id=1").run(
    JSON.stringify(store),
    revision + 1,
  );
  db.exec(
    "DELETE FROM workspace_history WHERE revision NOT IN (SELECT revision FROM workspace_history ORDER BY revision DESC LIMIT 100)",
  );
  return { store, revision: revision + 1 };
}
export function writeWorkspace(
  db: DatabaseSync,
  raw: string,
  expectedRevision: number,
): Workspace {
  const store = parseStore(raw);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
    throw new Error("Revizie invalidă.");
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = readWorkspace(db);
    if (current.revision !== expectedRevision)
      throw new ConflictError("Colecția s-a schimbat în altă filă.");
    const next = writeInsideTransaction(db, store, current.revision);
    db.exec("COMMIT");
    return next;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
export function migrateBrowser(
  db: DatabaseSync,
  raw: string,
): Workspace & { imported: number } {
  const legacy = parseStore(raw);
  const digest = createHash("sha256")
    .update(JSON.stringify(legacy))
    .digest("hex");
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = readWorkspace(db);
    if (
      db
        .prepare("SELECT digest FROM browser_migrations WHERE digest=?")
        .get(digest)
    ) {
      db.exec("COMMIT");
      return { ...current, imported: 0 };
    }
    const ideas = [...current.store.ideas];
    let imported = 0;
    for (const idea of legacy.ideas) {
      const existing = ideas.find((i) => i.id === idea.id);
      if (existing && JSON.stringify(existing) === JSON.stringify(idea))
        continue;
      ideas.push(
        existing
          ? {
              ...idea,
              id: randomUUID(),
              title: `${idea.title} (copie importată)`,
            }
          : idea,
      );
      imported++;
    }
    const merged = parseStore(JSON.stringify({ ...current.store, ideas }));
    const result = imported
      ? writeInsideTransaction(db, merged, current.revision)
      : current;
    db.prepare("INSERT INTO browser_migrations(digest) VALUES(?)").run(digest);
    db.exec("COMMIT");
    return { ...result, imported };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
export function backupDatabase(db: DatabaseSync, destination: string): void {
  mkdirSync(dirname(destination), { recursive: true, mode: 0o700 });
  db.prepare("VACUUM INTO ?").run(destination);
  chmodSync(destination, 0o600);
}
