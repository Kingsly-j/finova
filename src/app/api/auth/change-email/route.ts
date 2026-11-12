import { apiError, requestBody } from "@/lib/api-route";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { sendTransactionalEmail } from "@/lib/email-notifications";
import { requireApprovedUser } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireApprovedUser(request);
    const body = await requestBody(request);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid new email address." }, { status: 400 });
    }
    if (email === user.email?.toLowerCase()) return Response.json({ error: "Enter a different email address." }, { status: 400 });
    const { auth, db } = getFirebaseAdmin();
    const link = await auth.generateVerifyAndChangeEmailLink(user.email || "", email);
    await sendTransactionalEmail({
      to: email,
      subject: "Confirm your new Finova email address",
      text: `Confirm the email address change for your Finova account by opening this secure link:\n${link}\n\nThis link expires. If you did not request this change, contact Finova support.`,
      eventId: `change-email:${user.uid}:${email}:${Math.floor(Date.now() / 60_000)}`,
    });
    await db.collection("users").doc(user.uid).set({ pendingEmail: email, emailChangeRequestedAt: new Date() }, { merge: true });
    return Response.json({ sent: true, message: "A verification link was sent to your new email. Your sign-in email changes after you confirm it." });
  } catch (error) {
    return apiError(error);
  }
}
