import "server-only";
import { readFileSync } from "node:fs";

import { cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Server-only Firebase Admin bootstrap.
 *
 * The web Firebase configuration is intentionally not a credential. Financial
 * demo operations use this module only, so a browser can never approve a
 * request or change a balance directly.
 */
export type VerifiedFirebaseToken = DecodedIdToken & {
  admin?: boolean;
  finovaAdmin?: boolean;
};

export type FirebaseAdminServices = {
  app: App;
  auth: Auth;
  db: Firestore;
  storage: Storage;
};

type FirebaseAdminGlobal = typeof globalThis & {
  __finovaFirebaseAdmin?: FirebaseAdminServices;
};

const globalForFirebaseAdmin = globalThis as FirebaseAdminGlobal;

export class FirebaseAdminConfigurationError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "FirebaseAdminConfigurationError";
  }
}

function environmentValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function serviceAccountFromEnvironment(): ServiceAccount {
  const credentialPath = environmentValue("GOOGLE_APPLICATION_CREDENTIALS");
  let encodedAccount = environmentValue("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!encodedAccount && credentialPath) {
    try {
      encodedAccount = readFileSync(credentialPath, "utf8");
    } catch {
      throw new FirebaseAdminConfigurationError("The configured Firebase credential file could not be read.");
    }
  }

  if (encodedAccount) {
    try {
      const parsed = JSON.parse(encodedAccount) as Partial<{
        project_id: string;
        client_email: string;
        private_key: string;
      }>;
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch (cause) {
      throw new FirebaseAdminConfigurationError(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.",
        cause,
      );
    }

    throw new FirebaseAdminConfigurationError(
      "FIREBASE_SERVICE_ACCOUNT_JSON must include project_id, client_email, and private_key.",
    );
  }

  const projectId = environmentValue("FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_PROJECT_ID");
  const clientEmail = environmentValue("FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_CLIENT_EMAIL");
  const privateKey = environmentValue("FIREBASE_ADMIN_PRIVATE_KEY", "FIREBASE_PRIVATE_KEY");

  if (!projectId || !clientEmail || !privateKey) {
    throw new FirebaseAdminConfigurationError(
      "Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY on the server.",
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

/**
 * Initializes lazily so static builds and public pages do not need server
 * secrets. Call only from a Node.js route handler or trusted server code.
 */
export function getFirebaseAdmin(): FirebaseAdminServices {
  if (globalForFirebaseAdmin.__finovaFirebaseAdmin) {
    return globalForFirebaseAdmin.__finovaFirebaseAdmin;
  }

  const account = serviceAccountFromEnvironment();
  const app = getApps().length
    ? getApp()
    : initializeApp({ credential: cert(account), projectId: account.projectId, storageBucket: environmentValue("FIREBASE_ADMIN_STORAGE_BUCKET") });
  const services: FirebaseAdminServices = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };

  globalForFirebaseAdmin.__finovaFirebaseAdmin = services;
  return services;
}
