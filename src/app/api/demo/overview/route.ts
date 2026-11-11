import { apiError } from "@/lib/api-route";
import { DemoBankError, demoActor, getUserDashboard } from "@/lib/demo-bank";
import { requireApprovedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireApprovedUser(request);
    const actor = demoActor(user);
    const dashboard = await getUserDashboard(actor);
    if (!dashboard.workspace.accounts.length) throw new DemoBankError("Your Finova account is not ready. An administrator must approve your application first.", 403);
    return Response.json(dashboard);
  } catch (error) {
    return apiError(error);
  }
}
