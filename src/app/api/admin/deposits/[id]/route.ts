import { apiError, requestBody } from "@/lib/api-route";
import { decideDeposit, demoActor } from "@/lib/demo-bank";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const body = await requestBody(request);
    const { id } = await context.params;
    if (body.action !== "approve" && body.action !== "reject") return Response.json({ error: "Choose approve or reject." }, { status: 400 });
    return Response.json(await decideDeposit(demoActor(admin), id, body.action, body.note));
  } catch (error) {
    return apiError(error);
  }
}
