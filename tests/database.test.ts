import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  backupDatabase,
  openDatabase,
  readWorkspace,
  writeWorkspace,
  migrateBrowser,
  ConflictError,
} from "../src/server/database.ts";
import { newIdea } from "../src/lib/model.ts";
import { register, startServerSession } from "../src/server/accounts.ts";
import { workspaceRequest } from "../src/server/workspace-api.ts";
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "idee-sqlite-"));
  return {
    directory,
    file: join(directory, "test.sqlite"),
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}
test("SQLite păstrează toate datele după închiderea și redeschiderea conexiunii", () => {
  const f = fixture();
  let db = openDatabase(f.file);
  try {
    const idea = newIdea("Colecție persistentă");
    idea.notes = "Notă";
    idea.estimatedMinutes = 180;
    idea.actualMinutes = 15;
    idea.tasks = [
      {
        id: "task",
        title: "Pas",
        done: true,
        estimatedMinutes: 90,
        actualMinutes: 75,
      },
    ];
    idea.entries = [
      {
        id: "entry",
        kind: "income",
        cents: 25000,
        date: "2026-11-03",
        label: "Venit",
      },
    ];
    const store = { version: 1 as const, ideas: [idea] };
    writeWorkspace(db, JSON.stringify(store), 0);
    db.close();
    db = openDatabase(f.file);
    assert.deepEqual(readWorkspace(db), { store, revision: 1 });
  } finally {
    db.close();
    f.cleanup();
  }
});
test("migrarea este idempotentă și păstrează ambele variante ale unui ID conflictual", () => {
  const db = openDatabase(":memory:");
  try {
    const idea = newIdea("Idee originală");
    const raw = JSON.stringify({ version: 1, ideas: [idea] });
    const one = migrateBrowser(db, raw);
    assert.equal(one.imported, 1);
    assert.equal(migrateBrowser(db, raw).revision, one.revision);
    const changed = { ...idea, title: "Versiune nouă" };
    writeWorkspace(
      db,
      JSON.stringify({ version: 1, ideas: [changed] }),
      one.revision,
    );
    assert.equal(migrateBrowser(db, raw).store.ideas.length, 1);
    const other = migrateBrowser(
      db,
      JSON.stringify({
        version: 1,
        ideas: [{ ...idea, notes: "Notă din alt browser" }],
      }),
    );
    assert.equal(other.store.ideas.length, 2);
    assert.equal(other.store.ideas[0].title, "Versiune nouă");
    assert.notEqual(other.store.ideas[1].id, idea.id);
  } finally {
    db.close();
  }
});
test("două conexiuni nu pot suprascrie o versiune mai nouă; date invalide nu sunt aplicate", () => {
  const f = fixture();
  const a = openDatabase(f.file),
    b = openDatabase(f.file);
  try {
    const raw = JSON.stringify({ version: 1, ideas: [newIdea("Păstrat")] });
    writeWorkspace(a, raw, 0);
    assert.throws(
      () => writeWorkspace(b, JSON.stringify({ version: 1, ideas: [] }), 0),
      ConflictError,
    );
    assert.throws(() => writeWorkspace(a, '{"version":2}', 1));
    assert.equal(readWorkspace(b).store.ideas[0].title, "Păstrat");
    assert.equal(
      a.prepare("SELECT COUNT(*) AS n FROM workspace_history").get()!.n,
      1,
    );
  } finally {
    a.close();
    b.close();
    f.cleanup();
  }
});
test("backup SQLite consistent poate fi redeschis independent", () => {
  const f = fixture();
  const db = openDatabase(f.file);
  try {
    writeWorkspace(
      db,
      JSON.stringify({ version: 1, ideas: [newIdea("Backup")] }),
      0,
    );
    const backup = join(f.directory, "backup.sqlite");
    backupDatabase(db, backup);
    const copy = openDatabase(backup);
    try {
      assert.deepEqual(readWorkspace(copy), readWorkspace(db));
    } finally {
      copy.close();
    }
  } finally {
    db.close();
    f.cleanup();
  }
});
test("API loopback: origine externă blocată, cereri validate și conflict HTTP 409", async (t) => {
  const now = 1700000000000;
  t.mock.method(Date, "now", () => now);
  const f = fixture(),
    previous = process.env.IDEE_DATABASE_PATH;
  process.env.IDEE_DATABASE_PATH = f.file;
  const connection = openDatabase(f.file);
  const user = await register(
    connection,
    { name: "Test", email: "api@example.com", password: "test-password-123" },
    now,
  );
  const token = startServerSession(connection, user.id, true, now).token;
  connection.close();
  const url = "http://127.0.0.1:3000/api/workspace";
  const req = (
    method: string,
    body?: unknown,
    origin = "http://127.0.0.1:3000",
  ) =>
    new Request(url, {
      method,
      headers: {
        host: "127.0.0.1:3000",
        cookie: `idee_session=${token}`,
        origin,
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    assert.equal(
      (
        await workspaceRequest(
          req(
            "POST",
            { store: { version: 1, ideas: [] } },
            "https://example.com",
          ),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await workspaceRequest(
          req("PUT", { store: { version: 2 }, revision: 0 }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await workspaceRequest(
          req("PUT", {
            store: { version: 1, ideas: [newIdea("API")] },
            revision: 0,
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await workspaceRequest(
          req("PUT", { store: { version: 1, ideas: [] }, revision: 0 }),
        )
      ).status,
      409,
    );
    const response = await workspaceRequest(req("GET"));
    assert.equal(response.headers.get("cache-control"), "no-store");
    const data = await response.json();
    assert.equal(data.store.ideas[0].title, "API");
    assert.equal(
      (
        await workspaceRequest(
          new Request(url, { headers: { host: "evil.example" } }),
        )
      ).status,
      403,
    );
  } finally {
    if (previous === undefined) delete process.env.IDEE_DATABASE_PATH;
    else process.env.IDEE_DATABASE_PATH = previous;
    f.cleanup();
  }
});
