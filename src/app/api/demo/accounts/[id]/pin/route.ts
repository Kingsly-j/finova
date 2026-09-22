import { apiError, requestBody } from "@/lib/api-route";
import { demoActor, setAccountTransactionPin } from "@/lib/demo-bank";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { id } = await params;
    return Response.json(await setAccountTransactionPin(demoActor(user), id, await requestBody(request)));
  } catch (error) {
    return apiError(error);
  }
}
