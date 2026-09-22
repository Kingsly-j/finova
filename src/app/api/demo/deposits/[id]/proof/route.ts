import { apiError, requestBody } from "@/lib/api-route";
import { demoActor, submitDepositProof } from "@/lib/demo-bank";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { id } = await context.params;
    return Response.json(await submitDepositProof(demoActor(user), id, await requestBody(request)));
  } catch (error) {
    return apiError(error);
  }
}
