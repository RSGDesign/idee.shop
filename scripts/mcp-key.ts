import { randomBytes } from "node:crypto";
import { openDatabase } from "../src/server/database.ts";
import { digest } from "../src/server/accounts.ts";

const [action, email] = process.argv.slice(2);
if (!email || !["issue", "revoke"].includes(action)) {
  process.stderr.write("Utilizare: npm run mcp:key -- issue|revoke email\n");
  process.exit(1);
}
const db = openDatabase();
try {
  const account = db
    .prepare("SELECT id FROM users WHERE email=?")
    .get(email.trim().toLowerCase());
  if (!account) {
    process.stderr.write("Cont inexistent.\n");
    process.exitCode = 1;
  } else if (action === "revoke") {
    db.prepare("DELETE FROM mcp_keys WHERE user_id=?").run(account.id);
    process.stdout.write("Cheia MCP a fost revocată.\n");
  } else {
    const key = "idee_" + randomBytes(32).toString("base64url");
    db.prepare(
      "INSERT INTO mcp_keys VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET token_hash=excluded.token_hash",
    ).run(account.id, digest(key));
    process.stdout.write(key + "\n");
  }
} finally {
  db.close();
}
