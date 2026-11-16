export type AuthRecord = {
  version: 1;
  name: string;
  email: string;
  salt: string;
  hash: string;
  iterations: number;
  createdAt: string;
};
export type Session = { email: string; expiresAt: number };
export const AUTH_KEY = "idee.shop.auth.v1";
export const SESSION_KEY = "idee.shop.session.v1";
export const ITERATIONS = 210000;
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 254;
export function validatePassword(password: string): void {
  if (password.length < 8)
    throw new Error("Parola trebuie să aibă minimum 8 caractere.");
}
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
function decode(value: string, size: number): Uint8Array<ArrayBuffer> {
  const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  if (bytes.length !== size || encode(bytes) !== value)
    throw new Error("Format de acces invalid.");
  return bytes;
}
export async function hashPassword(
  password: string,
  salt: string,
  iterations = ITERATIONS,
): Promise<string> {
  validatePassword(password);
  if (iterations !== ITERATIONS)
    throw new Error("Parametri de acces incompatibili.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: decode(salt, 16), iterations, hash: "SHA-256" },
    key,
    256,
  );
  return encode(new Uint8Array(bits));
}
export async function createAuthRecord(
  name: string,
  email: string,
  password: string,
  now: number,
): Promise<AuthRecord> {
  if (!name.trim()) throw new Error("Completează numele.");
  if (!isValidEmail(email))
    throw new Error("Introdu o adresă de email validă.");
  validatePassword(password);
  const salt = encode(crypto.getRandomValues(new Uint8Array(16)));
  return {
    version: 1,
    name: name.trim(),
    email: normalizeEmail(email),
    salt,
    hash: await hashPassword(password, salt),
    iterations: ITERATIONS,
    createdAt: new Date(now).toISOString(),
  };
}
export function parseAuthRecord(raw: string): AuthRecord {
  const r: unknown = JSON.parse(raw);
  if (!r || typeof r !== "object") throw new Error("Acces invalid.");
  const a = r as Partial<AuthRecord>;
  if (
    a.version !== 1 ||
    typeof a.name !== "string" ||
    !a.name.trim() ||
    typeof a.email !== "string" ||
    !isValidEmail(a.email) ||
    a.email !== normalizeEmail(a.email) ||
    typeof a.salt !== "string" ||
    typeof a.hash !== "string" ||
    a.iterations !== ITERATIONS ||
    typeof a.createdAt !== "string" ||
    !Number.isFinite(Date.parse(a.createdAt))
  )
    throw new Error("Acces invalid.");
  decode(a.salt, 16);
  decode(a.hash, 32);
  return a as AuthRecord;
}
export async function verifyCredentials(
  record: AuthRecord,
  email: string,
  password: string,
): Promise<boolean> {
  const hash = await hashPassword(password, record.salt, record.iterations);
  return hash === record.hash && normalizeEmail(email) === record.email;
}
export function isSessionValid(
  session: unknown,
  email: string,
  now: number,
): session is Session {
  if (!session || typeof session !== "object") return false;
  const s = session as Partial<Session>;
  return (
    s.email === normalizeEmail(email) &&
    typeof s.expiresAt === "number" &&
    Number.isFinite(s.expiresAt) &&
    s.expiresAt > now &&
    s.expiresAt <= now + SESSION_DURATION
  );
}
// Legacy browser profile reader: used only for password-verified server migration.
export function readAuthRecord(): AuthRecord | null {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw === null ? null : parseAuthRecord(raw);
}
