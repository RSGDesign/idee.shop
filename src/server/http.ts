/** Explicit HTTPS origin for a private reverse proxy; forwarded headers are not trusted. */
export function configuredOrigin(): URL | null {
  const value = process.env.IDEE_APP_ORIGIN;
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
      ? url
      : null;
  } catch {
    return null;
  }
}
export function requestOrigin(request: Request): string | null {
  const host = request.headers.get("host");
  if (!host) return null;
  const configured = configuredOrigin();
  if (configured && host.toLowerCase() === configured.host)
    return configured.origin;
  try {
    const url = new URL(`http://${host}`);
    if (
      url.host !== host.toLowerCase() ||
      url.pathname !== "/" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    return ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
      ? url.origin
      : null;
  } catch {
    return null;
  }
}
export function allowed(request: Request): boolean {
  const expected = requestOrigin(request);
  if (!expected) return false;
  const origin = request.headers.get("origin");
  return request.method === "GET"
    ? !origin || origin === expected
    : origin === expected &&
        request.headers.get("content-type")?.split(";")[0] ===
          "application/json";
}
export function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}
export async function readBody(
  request: Request,
  max = 16384,
): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Cerere goală.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw new Error("Cerere prea mare.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const data: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("Cerere invalidă.");
  return data as Record<string, unknown>;
}
