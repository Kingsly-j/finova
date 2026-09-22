import { apiError, requestBody } from "@/lib/api-route";
import { demoActor, disablePaymentMethod, updatePaymentMethod } from "@/lib/demo-bank";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    return Response.json(await updatePaymentMethod(demoActor(admin), id, await requestBody(request)));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    return Response.json(await disablePaymentMethod(demoActor(admin), id));
  } catch (error) {
    return apiError(error);
  }
}
