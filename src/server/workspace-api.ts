import { ConflictError, openDatabase } from "./database.ts";
import { requestUser } from "./accounts.ts";
import {
  readUserWorkspace,
  writeUserWorkspace,
  migrateUserBrowser,
} from "./user-workspace.ts";
import { allowed } from "./http.ts";
const MAX_BYTES = 5_000_000;
function response(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
async function readBody(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_BYTES)
    throw new RangeError("Cerere prea mare.");
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Cerere goală.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new RangeError("Cerere prea mare.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
export async function workspaceRequest(request: Request): Promise<Response> {
  if (!allowed(request)) return response({ error: "Cerere nepermisă." }, 403);
  if (request.method === "GET") {
    try {
      const db = openDatabase();
      try {
        const user = requestUser(db, request);
        if (!user)
          return response({ error: "Autentifică-te pentru a continua." }, 401);
        const target = new URL(request.url).searchParams.get("userId");
        if (target && user.role !== "admin")
          return response({ error: "Acces interzis." }, 403);
        const id = target ? Number(target) : user.id;
        if (
          !Number.isSafeInteger(id) ||
          !db.prepare("SELECT id FROM users WHERE id=?").get(id)
        )
          return response({ error: "Utilizator inexistent." }, 404);
        const owner = db.prepare("SELECT name FROM users WHERE id=?").get(id);
        return response({
          ...readUserWorkspace(db, id),
          owner: target ? owner : undefined,
        });
      } finally {
        db.close();
      }
    } catch {
      return response(
        { error: "Datele nu pot fi citite. Încearcă din nou." },
        500,
      );
    }
  }
  {
    const db = openDatabase();
    try {
      if (!requestUser(db, request))
        return response({ error: "Autentifică-te pentru a continua." }, 401);
    } finally {
      db.close();
    }
  }
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return response(
      { error: "Date invalide sau fișier prea mare (maximum 5 MB)." },
      error instanceof RangeError ? 413 : 400,
    );
  }
  if (!body || typeof body !== "object" || !("store" in body))
    return response({ error: "Date invalide." }, 400);
  const payload = body as { store: unknown; revision?: unknown };
  // Validate before opening/writing a database.
  try {
    const { parseStore } = await import("../lib/model.ts");
    parseStore(JSON.stringify(payload.store));
  } catch {
    return response({ error: "Colecția nu are un format valid." }, 400);
  }
  if (
    request.method === "PUT" &&
    (!Number.isSafeInteger(payload.revision) || Number(payload.revision) < 0)
  )
    return response({ error: "Revizie invalidă." }, 400);
  try {
    const db = openDatabase();
    try {
      const user = requestUser(db, request);
      if (!user)
        return response({ error: "Autentifică-te pentru a continua." }, 401);
      const target = new URL(request.url).searchParams.get("userId");
      if (target && user.role !== "admin")
        return response({ error: "Acces interzis." }, 403);
      const id = target ? Number(target) : user.id;
      if (
        !Number.isSafeInteger(id) ||
        !db.prepare("SELECT id FROM users WHERE id=?").get(id)
      )
        return response({ error: "Utilizator inexistent." }, 404);
      if (target && request.method === "POST")
        return response({ error: "Transferul se face în propriul cont." }, 400);
      if (
        request.method === "POST" &&
        !db
          .prepare("SELECT user_id FROM browser_import_owners WHERE user_id=?")
          .get(id)
      )
        return response(
          {
            error:
              "Pentru acest cont nou, importă manual o copie JSON dacă dorești să preiei date anterioare.",
          },
          403,
        );
      const result =
        request.method === "POST"
          ? migrateUserBrowser(db, id, JSON.stringify(payload.store))
          : writeUserWorkspace(
              db,
              id,
              JSON.stringify(payload.store),
              Number(payload.revision),
              target ? user.id : undefined,
            );
      return response(result);
    } finally {
      db.close();
    }
  } catch (error) {
    return response(
      {
        error:
          error instanceof ConflictError
            ? "Colecția s-a schimbat în altă filă. Exportă modificările nesalvate înainte de reîncărcare."
            : "Salvarea a eșuat. Păstrează pagina deschisă și încearcă din nou.",
      },
      error instanceof ConflictError ? 409 : 500,
    );
  }
}
