import { writeFileSync, chmodSync } from "node:fs";
import { join, dirname } from "node:path";
import { openDatabase, databasePath } from "../src/server/database.ts";
import { createSetupToken } from "../src/server/accounts.ts";
const db = openDatabase();
try {
  const token = createSetupToken(db, Date.now());
  const file = join(dirname(databasePath()), "admin-setup-key.txt");
  writeFileSync(file, token + "\n", { mode: 0o600 });
  chmodSync(file, 0o600);
  console.log(
    `Cheia de configurare a fost salvată în ${file}. Valabilă 24 ore. Deschide /admin/setup pentru configurare.`,
  );
} finally {
  db.close();
}
