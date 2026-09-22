import { apiError } from "@/lib/api-route";
import { getAdminOverview } from "@/lib/demo-bank";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return Response.json(await getAdminOverview());
  } catch (error) {
    return apiError(error);
  }
}
