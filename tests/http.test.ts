import { test } from "node:test";
import assert from "node:assert/strict";
import { allowed, requestOrigin } from "../src/server/http.ts";
test("origine HTTPS explicita, CSRF si hosturi straine respinse", () => {
  const old = process.env.IDEE_APP_ORIGIN;
  try {
    process.env.IDEE_APP_ORIGIN = "https://example.tail-test.ts.net";
    const req = (host: string, origin?: string, method = "POST") =>
      new Request("http://localhost/api/auth/login", {
        method,
        headers: {
          host,
          ...(origin ? { origin } : {}),
          "content-type": "application/json",
          "x-forwarded-host": "example.tail-test.ts.net",
          "x-forwarded-proto": "https",
        },
      });
    assert.equal(
      allowed(
        req("example.tail-test.ts.net", "https://example.tail-test.ts.net"),
      ),
      true,
    );
    assert.equal(
      requestOrigin(req("example.tail-test.ts.net")),
      "https://example.tail-test.ts.net",
    );
    assert.equal(
      allowed(
        req("example.tail-test.ts.net", "http://example.tail-test.ts.net"),
      ),
      false,
    );
    assert.equal(
      allowed(req("evil.test", "https://example.tail-test.ts.net")),
      false,
    );
    assert.equal(allowed(req("example.tail-test.ts.net")), false);
    assert.equal(
      allowed(req("example.tail-test.ts.net", undefined, "GET")),
      true,
    );
    assert.equal(allowed(req("127.0.0.1:3000", "http://127.0.0.1:3000")), true);
    assert.equal(
      allowed(req("localhost:3000", "https://example.tail-test.ts.net")),
      false,
    );
    process.env.IDEE_APP_ORIGIN = "http://example.tail-test.ts.net";
    assert.equal(
      allowed(req("example.tail-test.ts.net", undefined, "GET")),
      false,
    );
    delete process.env.IDEE_APP_ORIGIN;
    assert.equal(
      allowed(req("example.tail-test.ts.net", undefined, "GET")),
      false,
    );
  } finally {
    if (old === undefined) delete process.env.IDEE_APP_ORIGIN;
    else process.env.IDEE_APP_ORIGIN = old;
  }
});
