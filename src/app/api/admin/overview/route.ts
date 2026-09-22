import { apiError } from "@/lib/api-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const [{ requireAdmin }, { getAdminOverview }] = await Promise.all([
      import("@/lib/server-auth"),
      import("@/lib/demo-bank"),
    ]);
    await requireAdmin(request);
    return Response.json(await getAdminOverview());
  } catch (error) {
    return apiError(error);
  }
}
