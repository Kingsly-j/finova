import { apiError, requestBody } from "@/lib/api-route";
import { demoActor, updateDemoPreferences } from "@/lib/demo-bank";
import { requireApprovedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireApprovedUser(request);
    return Response.json(await updateDemoPreferences(demoActor(user), await requestBody(request)));
  } catch (error) {
    return apiError(error);
  }
}
