import { cookies } from "next/headers";
import { openDatabase } from "./database";
import { COOKIE, sessionUser } from "./accounts";
export async function currentUser() {
  const jar = await cookies();
  const db = openDatabase();
  try {
    return sessionUser(db, jar.get(COOKIE)?.value, Date.now());
  } finally {
    db.close();
  }
}
