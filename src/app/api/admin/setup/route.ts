import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loadLocalAdminSettings() {
  try {
    const contents = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*(ADMIN_EMAIL|ADMIN_PASSWORD)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  } catch {
    // Hosted deployments provide these values through their server environment.
  }
}

export async function POST() {
  loadLocalAdminSettings();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    return NextResponse.json({ error: "Admin setup is not configured on the server." }, { status: 503 });
  }

  let setupMarker: FirebaseFirestore.DocumentReference | undefined;
  try {
    const { auth, db } = getFirebaseAdmin();
    const marker = db.collection("system").doc("initialAdminSetup");
    setupMarker = marker;
    const result = await db.runTransaction(async transaction => {
      const [setup, admins] = await Promise.all([
        transaction.get(marker),
        transaction.get(db.collection("adminUsers").limit(1)),
      ]);
      if (setup.exists || !admins.empty) return false;
      transaction.create(marker, { startedAt: Timestamp.now(), email });
      return true;
    });

    if (!result) return NextResponse.json({ error: "Admin setup has already been completed." }, { status: 409 });

    let user;
    try {
      user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password, displayName: "Finova Administrator", disabled: false });
    } catch (error) {
      if ((error as { code?: string })?.code !== "auth/user-not-found") throw error;
      user = await auth.createUser({ email, password, displayName: "Finova Administrator", disabled: false });
    }
    await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true, finovaAdmin: true });
    await db.collection("adminUsers").doc(user.uid).set({
      active: true,
      email,
      displayName: "Finova Administrator",
      provisionedAt: Timestamp.now(),
      provisionedBy: "initial-admin-setup",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (setupMarker) await setupMarker.delete().catch(() => undefined);
    console.error("Initial admin setup failed", error);
    return NextResponse.json({ error: "Could not complete admin setup. Check the server Firebase Admin configuration." }, { status: 500 });
  }
}
