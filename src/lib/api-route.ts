import "server-only";

import { DemoBankError } from "@/lib/demo-bank";
import { FirebaseAdminConfigurationError } from "@/lib/firebase-admin";
import { ServerAuthError } from "@/lib/server-auth";

const MAX_JSON_BYTES = 256_000;

export async function requestBody(request: Request): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > MAX_JSON_BYTES) {
    throw new DemoBankError("The request is too large.");
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new DemoBankError("Send a valid JSON request body.");
  }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new DemoBankError("Send a valid JSON request body.");
  }
  return payload as Record<string, unknown>;
}

export function apiError(error: unknown) {
  if (error instanceof ServerAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof DemoBankError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof FirebaseAdminConfigurationError) {
    return Response.json({ error: "The Finova demo service has not been configured on this server." }, { status: 503 });
  }
  console.error("Finova API request failed", error);
  const firebaseCode = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code || "") : "";
  const firebaseMessage = error instanceof Error ? error.message : "";
  if (firebaseCode === "7" || firebaseCode.includes("permission-denied") || firebaseCode.includes("PERMISSION_DENIED") || /permission.?denied/i.test(firebaseMessage)) {
    return Response.json({ error: "The server does not have permission to access Finova data. Check the Firebase Admin service-account configuration in Vercel." }, { status: 503 });
  }
  if (firebaseCode === "16" || firebaseCode.includes("unauthenticated") || firebaseCode.includes("UNAUTHENTICATED") || /unauthenticated|credentials?/i.test(firebaseMessage)) {
    return Response.json({ error: "The server could not authenticate with Firebase. Check the Firebase Admin service-account configuration in Vercel." }, { status: 503 });
  }
  if (firebaseCode === "5" || firebaseCode.includes("NOT_FOUND") || /database.*not found|not found.*database/i.test(firebaseMessage)) {
    return Response.json({ error: "The configured Firebase project does not have the required Firestore database. Confirm the service-account project and Firestore setup." }, { status: 503 });
  }
  if (firebaseCode === "14" || firebaseCode.includes("UNAVAILABLE") || /service unavailable|network/i.test(firebaseMessage)) {
    return Response.json({ error: "Firebase is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
  return Response.json({ error: "The Finova demo service could not complete that request." }, { status: 500 });
}
