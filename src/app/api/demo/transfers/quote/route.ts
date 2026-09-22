import { apiError, requestBody } from "@/lib/api-route";
import { demoActor, quoteInternalTransfer } from "@/lib/demo-bank";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    return Response.json(await quoteInternalTransfer(demoActor(user), await requestBody(request)));
  } catch (error) {
    return apiError(error);
  }
}
