import "server-only";

import {
  FirebaseAdminConfigurationError,
  getFirebaseAdmin,
  type VerifiedFirebaseToken,
} from "@/lib/firebase-admin";

const MAX_BEARER_TOKEN_LENGTH = 8_192;

export class ServerAuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "ServerAuthError";
  }
}

export type AuthenticatedServerUser = {
  uid: string;
  email: string | null;
  token: VerifiedFirebaseToken;
};

export type AdminServerUser = AuthenticatedServerUser & {
  authorization: "custom-claim" | "adminUsers-document";
};

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) {
    throw new ServerAuthError("A bearer token is required.", 401);
  }

  const [scheme, token, ...rest] = authorization.split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0 || token.length > MAX_BEARER_TOKEN_LENGTH) {
    throw new ServerAuthError("A valid bearer token is required.", 401);
  }

  return token;
}

/**
 * Verifies a Firebase ID token on the server. Revoked tokens are rejected,
 * and no user identity is accepted from request bodies or query parameters.
 */
export async function requireAuthenticatedUser(request: Request): Promise<AuthenticatedServerUser> {
  const token = bearerToken(request);

  try {
    const verified = await getFirebaseAdmin().auth.verifyIdToken(token, true);
    if (!verified.uid) {
      throw new ServerAuthError("The supplied token is invalid.", 401);
    }

    return {
      uid: verified.uid,
      email: typeof verified.email === "string" ? verified.email : null,
      token: verified,
    };
  } catch (error) {
    if (error instanceof ServerAuthError || error instanceof FirebaseAdminConfigurationError) {
      throw error;
    }
    throw new ServerAuthError("The supplied token is invalid or expired.", 401);
  }
}

/**
 * Authorizes an administrative request through either a signed `admin: true`
 * custom claim or a trusted `adminUsers/{uid}` document. Firestore rules deny
 * browser writes to that collection, so the document must be provisioned by
 * a privileged server process.
 */
export async function requireAdmin(request: Request): Promise<AdminServerUser> {
  const user = await requireAuthenticatedUser(request);
  if (user.token.admin === true || user.token.finovaAdmin === true) {
    return { ...user, authorization: "custom-claim" };
  }

  const administrator = await getFirebaseAdmin()
    .db
    .collection("adminUsers")
    .doc(user.uid)
    .get();

  if (!administrator.exists) {
    throw new ServerAuthError("Administrative access is required.", 403);
  }

  const record = administrator.data();
  if (record?.active === false || record?.disabled === true) {
    throw new ServerAuthError("Administrative access is required.", 403);
  }

  return { ...user, authorization: "adminUsers-document" };
}
