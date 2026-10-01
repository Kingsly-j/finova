import { apiError, requestBody } from "@/lib/api-route";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { sendTransactionalEmail } from "@/lib/email-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await requestBody(request);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    try {
      const { auth } = getFirebaseAdmin();
      const user = await auth.getUserByEmail(email);
      const link = await auth.generatePasswordResetLink(email);
      await sendTransactionalEmail({
        to: email,
        subject: "Reset your Finova password",
        text: `Hello ${user.displayName || "Finova member"},\n\nUse this secure link to reset your password:\n${link}\n\nIf you did not request a password reset, you can ignore this email.`,
        eventId: `password-reset:${user.uid}:${Date.now()}`,
      });
    } catch (error) {
      // Keep the response identical whether the address exists or delivery fails.
      console.error("Could not send password reset email", error);
    }

    return Response.json({ sent: true });
  } catch (error) {
    return apiError(error);
  }
}
