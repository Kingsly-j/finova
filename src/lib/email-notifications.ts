import "server-only";

import { createHash } from "node:crypto";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

type ActivityEmail = {
  uid: string;
  email?: string | null;
  name?: string;
  eventId: string;
  subject: string;
  text: string;
};

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function resendFromAddress() {
  const configuredFrom = requiredEnvironment("RESEND_FROM_EMAIL");
  return configuredFrom.includes("<") ? configuredFrom : `Setiia Verification <${configuredFrom}>`;
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  eventId?: string;
}) {
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requiredEnvironment("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
        ...(input.eventId ? { "Idempotency-Key": createHash("sha256").update(input.eventId).digest("hex") } : {}),
      },
      body: JSON.stringify({
        from: resendFromAddress(),
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: `<div style="font-family:Arial,sans-serif;white-space:pre-line">${escapeHtml(input.text)}</div>`,
      }),
    });
  } catch {
    console.error("Resend email delivery failed", { reason: "network_error" });
    throw new Error("Email delivery failed. Please try again later.");
  }
  if (!response.ok) {
    console.error("Resend email delivery failed", { reason: "provider_rejection", status: response.status });
    throw new Error("Email delivery failed. Please try again later.");
  }
}

export async function sendEmailVerificationCode(input: { to: string; code: string; eventId?: string }): Promise<"email" | "admin-dashboard"> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const text = `Your Finova one-time verification code is ${input.code}. It expires in 5 minutes. If you did not request this code, you can ignore this email.`;
  const testMode = process.env.EMAIL_OTP_TEST_MODE?.trim().toLowerCase() === "true";

  if (testMode) return "admin-dashboard";
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL, or enable EMAIL_OTP_TEST_MODE for admin-only testing.");
    }
    console.info("Email OTP delivery is not configured; no email was sent.");
    return "admin-dashboard";
  }

  await sendTransactionalEmail({
    to: input.to,
    subject: "Your Finova email verification code",
    text,
    eventId: input.eventId,
  });
  return "email";
}

export async function queueActivityEmail(activity: ActivityEmail) {
  const email = activity.email?.trim().toLowerCase();
  if (!email) return;
  try {
    const profile = await getFirebaseAdmin().db.collection("users").doc(activity.uid).get();
    if (profile.data()?.emailNotificationsEnabled === false) return;

    const name = activity.name?.trim() || "Finova member";
    await sendTransactionalEmail({
      to: email,
      subject: activity.subject,
      text: `Hello ${name},\n\n${activity.text}\n\nIf you did not initiate this activity, contact Finova support immediately.`,
      eventId: activity.eventId,
    });
  } catch (error) {
    console.error("Could not send Finova activity email", error);
  }
}
