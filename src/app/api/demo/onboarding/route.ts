import { apiError, requestBody } from "@/lib/api-route";
import { demoActor, submitAccountApplication } from "@/lib/demo-bank";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    return Response.json(await submitAccountApplication(demoActor(user), await requestBody(request)), { status: 202 });
  } catch (error) {
    return apiError(error);
  }
}
