import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { readFileSync } from "node:fs";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

function env(...keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function accountFromEnvironment() {
  const credentialPath = env("GOOGLE_APPLICATION_CREDENTIALS");
  const encoded = env("FIREBASE_SERVICE_ACCOUNT_JSON") || (credentialPath ? readFileSync(credentialPath, "utf8") : undefined);
  if (encoded) {
    const parsed = JSON.parse(encoded);
    if (parsed.project_id && parsed.client_email && parsed.private_key) {
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key.replace(/\\n/g, "\n"),
      };
    }
  }
  const projectId = env("FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_PROJECT_ID");
  const clientEmail = env("FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_CLIENT_EMAIL");
  const privateKey = env("FIREBASE_ADMIN_PRIVATE_KEY", "FIREBASE_PRIVATE_KEY");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Set FIREBASE_SERVICE_ACCOUNT_JSON or the three FIREBASE_ADMIN_* values before provisioning an administrator.");
  }
  return { projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, "\n") };
}

const email = env("ADMIN_EMAIL");
const password = process.env.ADMIN_PASSWORD;
const name = env("ADMIN_NAME") || "Finova Administrator";

if (!email || !password || password.length < 12) {
  throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters. The password is never written to this repository.");
}

const account = accountFromEnvironment();
const app = getApps().length ? getApp() : initializeApp({ credential: cert(account), projectId: account.projectId });
const auth = getAuth(app);
const db = getFirestore(app);

let user;
try {
  user = await auth.getUserByEmail(email);
  await auth.updateUser(user.uid, { password, displayName: name, disabled: false });
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({ email, password, displayName: name, disabled: false });
}

await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true, finovaAdmin: true });
await db.collection("adminUsers").doc(user.uid).set({
  active: true,
  email,
  displayName: name,
  provisionedAt: Timestamp.now(),
  provisionedBy: "provision-admin-script",
}, { merge: true });

console.log(`Finova administrator provisioned for ${email}. Sign out and back in to refresh the administrator claim.`);
