import { apiError, requestBody } from "@/lib/api-route";
import { createPaymentMethod, demoActor } from "@/lib/demo-bank";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    return Response.json(await createPaymentMethod(demoActor(admin), await requestBody(request)));
  } catch (error) {
    return apiError(error);
  }
}
