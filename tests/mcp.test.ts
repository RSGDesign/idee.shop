import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { register, digest } from "../src/server/accounts.ts";
import { openDatabase } from "../src/server/database.ts";
import { mcpRequest } from "../src/server/mcp.ts";
import { readUserWorkspace } from "../src/server/user-workspace.ts";

test("MCP exposes schemas and creates ideas only in the authorized collection", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "idee-mcp-"));
  const original = process.env.IDEE_DATABASE_PATH;
  process.env.IDEE_DATABASE_PATH = join(dir, "test.sqlite");
  const db = openDatabase();
  t.after(() => {
    db.close();
    if (original === undefined) delete process.env.IDEE_DATABASE_PATH;
    else process.env.IDEE_DATABASE_PATH = original;
    rmSync(dir, { recursive: true, force: true });
  });
  const account = await register(
    db,
    { name: "Demo", email: "mcp@example.test", password: "demo-test-password" },
    Date.now(),
  );
  const other = await register(
    db,
    {
      name: "Other",
      email: "other@example.test",
      password: "demo-test-password",
    },
    Date.now(),
  );
  const token = "idee_" + "a".repeat(43);
  db.prepare("INSERT INTO mcp_keys VALUES(?,?)").run(account.id, digest(token));
  function request(
    method: string,
    params: object = {},
    key = token,
    origin?: string,
  ) {
    return mcpRequest(
      new Request("http://127.0.0.1:3000/api/mcp", {
        method: "POST",
        headers: {
          host: "127.0.0.1:3000",
          authorization: "Bearer " + key,
          "content-type": "application/json",
          ...(origin ? { origin } : {}),
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      }),
    );
  }
  assert.equal((await request("tools/list", {}, "wrong")).status, 401);
  assert.equal(
    (await request("tools/list", {}, token, "https://other.example")).status,
    403,
  );
  const init = await (
    await request("initialize", { protocolVersion: "2025-03-26" })
  ).json();
  assert.equal(init.result.protocolVersion, "2025-03-26");
  const discovery = await (await request("tools/list")).json();
  assert.equal(discovery.result.tools.length, 8);
  const call = (name: string, args: object) =>
    request("tools/call", { name, arguments: args });
  const result = await (
    await call("create_idea", {
      title: "Atelier",
      tasks: [{ title: "Pregătește materialele", priority: "Ridicată" }],
    })
  ).json();
  const created = JSON.parse(result.result.content[0].text);
  assert.equal(created.taskCount, 1);
  assert.equal(
    readUserWorkspace(db, account.id).store.ideas[0].tasks[0].title,
    "Pregătește materialele",
  );
  assert.equal(readUserWorkspace(db, other.id).store.ideas.length, 0);
  assert.equal(
    (await (await call("create_idea", { title: "atelier" })).json()).result
      .isError,
    true,
  );
  assert.equal(
    (
      await (
        await call("create_idea", { title: "Altceva", userId: other.id })
      ).json()
    ).error.code,
    -32602,
  );
  assert.equal(
    JSON.parse(
      (await (await call("get_idea", { id: created.id })).json()).result
        .content[0].text,
    ).title,
    "Atelier",
  );
  assert.equal(
    JSON.parse(
      (await (await call("list_ideas", { query: "ATELIER" })).json()).result
        .content[0].text,
    ).ideas.length,
    1,
  );
  const invoke = async (name: string, args: object) =>
    await (await call(name, args)).json();
  const added = await invoke("add_tasks", {
    ideaId: created.id,
    tasks: [{ title: "Task nou" }],
  });
  const [task] = JSON.parse(added.result.content[0].text).tasks;
  assert.equal(
    (
      await invoke("update_idea", {
        ideaId: created.id,
        changes: { notes: "Păstrate" },
      })
    ).result.isError,
    false,
  );
  assert.equal(
    (
      await invoke("update_task", {
        ideaId: created.id,
        taskId: task.id,
        changes: { done: true },
      })
    ).result.isError,
    false,
  );
  const target = { ideaId: created.id, taskId: task.id };
  assert.equal(
    (await invoke("schedule_item", { ...target, date: "2027-02-30" })).result
      .isError,
    true,
  );
  const scheduled = await invoke("schedule_item", {
    ...target,
    date: "2027-02-28",
    time: "10:00",
    endTime: "11:00",
  });
  const { slot } = JSON.parse(scheduled.result.content[0].text);
  assert.equal(
    (
      await invoke("schedule_item", {
        ...target,
        slotId: slot.id,
        date: "2027-03-01",
        time: "10:00",
        endTime: "11:00",
      })
    ).result.isError,
    false,
  );
  assert.equal(
    readUserWorkspace(db, account.id).store.ideas[0].tasks[1].schedule?.[0]
      .date,
    "2027-03-01",
  );
  assert.equal((await invoke("delete_task", target)).error.code, -32602);
  assert.equal(
    (await invoke("delete_task", { ...target, confirmed: true })).result
      .isError,
    false,
  );
  const updated = readUserWorkspace(db, account.id).store.ideas[0];
  assert.equal(updated.notes, "Păstrate");
  assert.equal(updated.tasks.length, 1);
  assert.equal(updated.tasks[0].title, "Pregătește materialele");
  db.prepare("DELETE FROM mcp_keys WHERE user_id=?").run(account.id);
  assert.equal((await request("tools/list")).status, 401);
});
