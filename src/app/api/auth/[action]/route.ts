import { authRequest } from "@/server/auth-api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  return authRequest(request, (await context.params).action);
}
export const GET = handle;
export const POST = handle;
