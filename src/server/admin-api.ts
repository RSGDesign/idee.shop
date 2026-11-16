import { basename, join, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { openDatabase, backupDatabase, databasePath } from "./database.ts";
import { allowed, json, readBody } from "./http.ts";
import {
  requestUser,
  publicUser,
  adminUpdate,
  audit,
  AccessError,
} from "./accounts.ts";
import { readUserWorkspace } from "./user-workspace.ts";
export async function adminRequest(request: Request) {
  if (!allowed(request)) return json({ error: "Cerere nepermisă." }, 403);
  const db = openDatabase();
  try {
    const actor = requestUser(db, request);
    if (!actor)
      return json({ error: "Autentifică-te pentru a continua." }, 401);
    if (actor.role !== "admin")
      return json({ error: "Nu ai acces la administrare." }, 403);
    if (request.method === "GET") {
      const users = db
        .prepare(
          "SELECT u.*, (SELECT COUNT(*) FROM sessions s WHERE s.user_id=u.id AND s.expires_at>?) AS sessions FROM users u ORDER BY u.id",
        )
        .all(Date.now())
        .map((row) => {
          const workspace = readUserWorkspace(db, Number(row.id));
          return {
            ...publicUser(row),
            sessions: Number(row.sessions),
            workspace,
          };
        });
      const events = db
        .prepare(
          "SELECT e.id,e.action,e.target_id,e.created_at,u.name AS actor FROM admin_events e JOIN users u ON u.id=e.actor_id ORDER BY e.id DESC LIMIT 100",
        )
        .all();
      return json({ users, events });
    }
    if (request.method !== "POST")
      return json({ error: "Metodă nepermisă." }, 405);
    const input = await readBody(request);
    if (input.action === "backup") {
      const file = join(
        dirname(databasePath()),
        "backups",
        `idee-shop-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}.sqlite`,
      );
      backupDatabase(db, file);
      audit(db, actor.id, "backup");
      return json({ ok: true, file: basename(file) });
    }
    await adminUpdate(db, actor, input);
    return json({ ok: true });
  } catch (error) {
    return json(
      {
        error:
          error instanceof AccessError
            ? error.message
            : "Operația nu a putut fi finalizată.",
      },
      error instanceof AccessError ? error.status : 500,
    );
  } finally {
    db.close();
  }
}
