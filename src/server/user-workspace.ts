import type { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { parseStore, type Store } from "../lib/model.ts";
import { ConflictError, type Workspace } from "./database.ts";
export function readUserWorkspace(db: DatabaseSync, id: number): Workspace {
  const row = db
    .prepare("SELECT revision,payload FROM user_workspaces WHERE user_id=?")
    .get(id);
  if (!row) throw new Error("Colecție inexistentă.");
  return {
    revision: Number(row.revision),
    store: parseStore(String(row.payload)),
  };
}
function update(db: DatabaseSync, id: number, store: Store, revision: number) {
  db.prepare(
    "INSERT OR IGNORE INTO user_history(user_id,revision,payload) SELECT user_id,revision,payload FROM user_workspaces WHERE user_id=?",
  ).run(id);
  db.prepare(
    "UPDATE user_workspaces SET revision=?,payload=? WHERE user_id=?",
  ).run(revision + 1, JSON.stringify(store), id);
  db.prepare(
    "DELETE FROM user_history WHERE user_id=? AND revision NOT IN(SELECT revision FROM user_history WHERE user_id=? ORDER BY revision DESC LIMIT 100)",
  ).run(id, id);
  return { store, revision: revision + 1 };
}
export function writeUserWorkspace(
  db: DatabaseSync,
  id: number,
  raw: string,
  revision: number,
  actor?: number,
) {
  const store = parseStore(raw);
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = readUserWorkspace(db, id);
    if (current.revision !== revision)
      throw new ConflictError("Colecția s-a schimbat.");
    const result = update(db, id, store, revision);
    if (actor !== undefined)
      db.prepare(
        "INSERT INTO admin_events(actor_id,action,target_id) VALUES(?,?,?)",
      ).run(actor, "update-workspace", id);
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function migrateUserBrowser(db: DatabaseSync, id: number, raw: string) {
  const legacy = parseStore(raw),
    digest = createHash("sha256").update(JSON.stringify(legacy)).digest("hex");
  db.exec("BEGIN IMMEDIATE");
  try {
    const current = readUserWorkspace(db, id);
    if (
      db
        .prepare(
          "SELECT digest FROM user_migrations WHERE user_id=? AND digest=?",
        )
        .get(id, digest)
    ) {
      db.exec("COMMIT");
      return { ...current, imported: 0 };
    }
    const ideas = [...current.store.ideas];
    let imported = 0;
    for (const idea of legacy.ideas) {
      const old = ideas.find((i) => i.id === idea.id);
      if (old && JSON.stringify(old) === JSON.stringify(idea)) continue;
      ideas.push(
        old
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
      ? update(db, id, merged, current.revision)
      : current;
    db.prepare("INSERT INTO user_migrations(user_id,digest) VALUES(?,?)").run(
      id,
      digest,
    );
    db.exec("COMMIT");
    return { ...result, imported };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
