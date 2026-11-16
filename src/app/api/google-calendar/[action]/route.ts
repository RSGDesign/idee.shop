import { calendarRequest } from "@/server/google-calendar";
export const runtime = "nodejs";
type Context = { params: Promise<{ action: string }> };
async function handle(request: Request, context: Context) {
  return calendarRequest(request, (await context.params).action);
}
export const GET = handle;
export const POST = handle;
