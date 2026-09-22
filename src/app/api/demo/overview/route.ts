import { apiError } from "@/lib/api-route";
import { demoActor, getUserDashboard, onboardDemoUser } from "@/lib/demo-bank";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const actor = demoActor(user);
    const dashboard = await getUserDashboard(actor);
    // A signed-in user created before server onboarding gets a single
    // zero-balance demo account. No browser balance/history is migrated.
    if (!dashboard.workspace.accounts.length) return Response.json(await onboardDemoUser(actor));
    return Response.json(dashboard);
  } catch (error) {
    return apiError(error);
  }
}
