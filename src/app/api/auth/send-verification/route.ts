import { apiError } from "@/lib/api-route";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { sendTransactionalEmail } from "@/lib/email-notifications";
import { requireApprovedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireApprovedUser(request);
    if (!user.email) return Response.json({ error: "This account has no email address." }, { status: 400 });
    const { auth } = getFirebaseAdmin();
    const record = await auth.getUser(user.uid);
    if (record.emailVerified) return Response.json({ sent: false, verified: true });
    const link = await auth.generateEmailVerificationLink(user.email);
    await sendTransactionalEmail({
      to: user.email,
      subject: "Verify your Finova email address",
      text: `Hello ${record.displayName || "Finova member"},\n\nVerify your email address by opening this secure link:\n${link}\n\nIf you did not create a Finova account, you can ignore this email.`,
      eventId: `email-verification:${user.uid}:${Math.floor(Date.now() / 60_000)}`,
    });
    return Response.json({ sent: true });
  } catch (error) {
    return apiError(error);
  }
}
