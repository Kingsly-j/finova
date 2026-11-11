import { apiError, requestBody } from "@/lib/api-route";
import { queueActivityEmail } from "@/lib/email-notifications";
import { requireApprovedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireApprovedUser(request);
    const body = await requestBody(request);
    const event = body.event;
    if (event !== "login" && event !== "registration") {
      return Response.json({ error: "Unsupported account activity." }, { status: 400 });
    }
    const name = typeof user.token.name === "string" ? user.token.name : "Finova member";
    await queueActivityEmail({
      uid: user.uid,
      email: user.email,
      name,
      eventId: `${event}:${user.uid}:${Date.now()}`,
      subject: event === "login" ? "New sign in to your Finova account" : "Welcome to Finova Bank",
      text: event === "login"
        ? `A sign in to your Finova account was recorded at ${new Date().toUTCString()}.`
        : "Your Finova account was created successfully. A verification link has also been sent to this address.",
    });
    return Response.json({ sent: true });
  } catch (error) {
    return apiError(error);
  }
}
