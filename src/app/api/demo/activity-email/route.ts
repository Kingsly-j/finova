import { apiError, requestBody } from "@/lib/api-route";
import { queueActivityEmail } from "@/lib/email-notifications";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const allowedActivities = new Set(["Local transfer", "International transfer", "Currency exchange", "Loan application", "Tax refund", "Grant application"]);

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requestBody(request);
    const kind = typeof body.kind === "string" ? body.kind : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : "";
    const eventId = typeof body.eventId === "string" ? body.eventId.slice(0, 100) : "";
    if (!allowedActivities.has(kind) || !description || !/^[A-Za-z0-9_-]{8,100}$/.test(eventId)) {
      return Response.json({ error: "Activity details are invalid." }, { status: 400 });
    }
    const name = typeof user.token.name === "string" ? user.token.name : "Finova member";
    await queueActivityEmail({
      uid: user.uid,
      email: user.email,
      name,
      eventId: `activity:${user.uid}:${eventId}`,
      subject: `${kind} submitted`,
      text: `A ${kind.toLowerCase()} was submitted from your Finova account: ${description}.`,
    });
    return Response.json({ queued: true });
  } catch (error) {
    return apiError(error);
  }
}
