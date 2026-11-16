import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { backupDatabase, openDatabase } from "../src/server/database.ts";
const db = openDatabase();
try {
  const destination = resolve(
    "data/backups",
    `idee-shop-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}.sqlite`,
  );
  backupDatabase(db, destination);
  console.log(`Backup creat: ${destination}`);
} finally {
  db.close();
}
