import "server-only";

const MAX_JSON_BYTES = 256_000;

class RequestBodyError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "DemoBankError";
  }
}

export async function requestBody(request: Request): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > MAX_JSON_BYTES) {
    throw new RequestBodyError("The request is too large.");
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new RequestBodyError("Send a valid JSON request body.");
  }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new RequestBodyError("Send a valid JSON request body.");
  }
  return payload as Record<string, unknown>;
}

export function apiError(error: unknown) {
  const namedError = error && typeof error === "object" ? error as { name?: unknown; message?: unknown; status?: unknown } : null;
  const errorName = String(namedError?.name || "");
  const errorMessage = typeof namedError?.message === "string" ? namedError.message : "";
  const errorStatus = typeof namedError?.status === "number" ? namedError.status : 500;
  if (errorName === "ServerAuthError") {
    return Response.json({ error: errorMessage || "Authentication is required." }, { status: errorStatus === 403 ? 403 : 401 });
  }
  if (errorName === "DemoBankError") {
    return Response.json({ error: errorMessage || "The request could not be completed." }, { status: [400, 403, 404, 409].includes(errorStatus) ? errorStatus : 400 });
  }
  if (errorName === "FirebaseAdminConfigurationError") {
    return Response.json({ error: "The Finova demo service has not been configured on this server." }, { status: 503 });
  }
  console.error("Finova API request failed", error);
  const firebaseCode = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code || "") : "";
  const firebaseMessage = errorMessage;
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
  const diagnostic = firebaseMessage
    .replace(/-----BEGIN[\s\S]*?-----END[^\s]*/g, "[redacted credential]")
    .replace(/\b(?:AIza|sb_publishable_)[A-Za-z0-9_\-]+/g, "[redacted key]")
    .slice(0, 300);
  return Response.json({ error: diagnostic ? `The server could not complete this request: ${diagnostic}` : "The Finova service could not complete that request." }, { status: 500 });
}
