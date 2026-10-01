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

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  eventId?: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredEnvironment("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      ...(input.eventId ? { "Idempotency-Key": createHash("sha256").update(input.eventId).digest("hex") } : {}),
    },
    body: JSON.stringify({
      from: requiredEnvironment("RESEND_FROM_EMAIL"),
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: `<div style="font-family:Arial,sans-serif;white-space:pre-line">${escapeHtml(input.text)}</div>`,
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Resend rejected the email (${response.status}): ${detail}`);
  }
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
