import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  createAuthRecord,
  validatePassword,
  isSessionValid,
  isValidEmail,
  SESSION_DURATION,
  verifyCredentials,
  parseAuthRecord,
} from "../src/lib/auth.ts";
const now = 1700000000000;
test("PBKDF2-SHA256 este determinist cu același salt, 32 bytes", async () => {
  const salt = btoa(String.fromCharCode(...new Uint8Array(16)));
  const first = await hashPassword("parola-test-123", salt);
  assert.equal(first, await hashPassword("parola-test-123", salt));
  assert.equal(atob(first).length, 32);
  assert.notEqual(first, await hashPassword("parola-test-124", salt));
});
test("parola scurtă este respinsă inclusiv la creare și derivare", async () => {
  assert.throws(() => validatePassword("1234567"));
  await assert.rejects(() =>
    createAuthRecord("Test", "test@example.com", "scurt", now),
  );
  await assert.rejects(() => hashPassword("scurt", btoa("1234567890123456")));
});
test("sesiunile expiră exact la limita fixată; date invalide respinse", () => {
  const s = { email: "test@example.com", expiresAt: now + SESSION_DURATION };
  assert.equal(isSessionValid(s, s.email, now), true);
  assert.equal(isSessionValid(s, s.email, s.expiresAt - 1), true);
  assert.equal(isSessionValid(s, s.email, s.expiresAt), false);
  assert.equal(isSessionValid(s, "alt@example.com", now), false);
  assert.equal(
    isSessionValid({ ...s, expiresAt: Infinity }, s.email, now),
    false,
  );
  assert.equal(isSessionValid(null, s.email, now), false);
});
test("validarea emailului și normalizarea la creare", async () => {
  for (const email of ["test@example.com", "ana+idee@example.ro"])
    assert.equal(isValidEmail(email), true);
  for (const email of [
    "",
    "ana",
    "a@",
    "a@localhost",
    "a b@example.ro",
    "a@@example.ro",
  ])
    assert.equal(isValidEmail(email), false);
  const record = await createAuthRecord(
    " Ana ",
    " ANA@example.ro ",
    "parola-test-123",
    now,
  );
  assert.equal(record.email, "ana@example.ro");
  assert.equal(record.name, "Ana");
  assert.equal(record.iterations, 210000);
  assert.equal(atob(record.salt).length, 16);
  assert.equal(record.createdAt, new Date(now).toISOString());
  assert.deepEqual(parseAuthRecord(JSON.stringify(record)), record);
  assert.equal(
    await verifyCredentials(record, "ANA@example.ro", "parola-test-123"),
    true,
  );
  assert.equal(
    await verifyCredentials(record, "alt@example.ro", "parola-test-123"),
    false,
  );
  assert.equal(
    await verifyCredentials(record, record.email, "parola-gresita"),
    false,
  );
  assert.equal("password" in record, false);
});

test("derivarea corespunde PBKDF2-SHA256 independent din Node", async () => {
  const { pbkdf2Sync } = await import("node:crypto");
  const salt = new Uint8Array(16).fill(7);
  const expected = pbkdf2Sync(
    "parola-test-123",
    salt,
    210000,
    32,
    "sha256",
  ).toString("base64");
  assert.equal(
    await hashPassword("parola-test-123", btoa(String.fromCharCode(...salt))),
    expected,
  );
});

test("profilul vechi poate fi importat doar în format valid, fără parolă în clar", async () => {
  const record = await createAuthRecord(
    "Test",
    "legacy@example.com",
    "test-password-123",
    now,
  );
  assert.deepEqual(parseAuthRecord(JSON.stringify(record)), record);
  assert.throws(() =>
    parseAuthRecord(JSON.stringify({ ...record, iterations: 1 })),
  );
  assert.throws(() =>
    parseAuthRecord(JSON.stringify({ ...record, salt: btoa("short") })),
  );
  assert.throws(() =>
    parseAuthRecord(JSON.stringify({ ...record, hash: btoa("short") })),
  );
});
