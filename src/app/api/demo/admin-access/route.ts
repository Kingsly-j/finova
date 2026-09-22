import { apiError } from "@/lib/api-route";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return Response.json({ administrator: true });
  } catch (error) {
    return apiError(error);
  }
}
