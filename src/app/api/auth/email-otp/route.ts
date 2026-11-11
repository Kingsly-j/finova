import { apiError } from "@/lib/api-route";
import { demoActor, sendAccountEmailOtp } from "@/lib/demo-bank";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    return Response.json(await sendAccountEmailOtp(demoActor(user)));
  } catch (error) {
    return apiError(error);
  }
}
