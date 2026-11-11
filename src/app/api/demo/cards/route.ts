import { apiError, requestBody } from "@/lib/api-route";
import { createCardApplication, demoActor } from "@/lib/demo-bank";
import { requireApprovedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireApprovedUser(request);
    return Response.json(await createCardApplication(demoActor(user), await requestBody(request)));
  } catch (error) {
    return apiError(error);
  }
}
