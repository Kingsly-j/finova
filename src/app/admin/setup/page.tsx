"use client";

import { useState } from "react";

export default function AdminSetupPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  async function setup() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/setup", { method: "POST", cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Admin setup could not be completed.");
      setDone(true);
      setMessage("The initial administrator is ready. Sign in with the credentials configured on the server.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin setup could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f8fc", fontFamily: "Arial, sans-serif", color: "#18263c" }}>
    <section style={{ width: "min(100%, 480px)", padding: 32, borderRadius: 20, background: "white", boxShadow: "0 18px 55px #18263c18" }}>
      <p style={{ color: "#64748b", fontSize: 12, fontWeight: 700, letterSpacing: ".12em" }}>FINOVA ADMINISTRATION</p>
      <h1 style={{ margin: "12px 0", fontSize: 28 }}>Initial admin setup</h1>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>Create the configured administrator using the server’s Firebase Admin credentials and local admin environment settings. This setup can only succeed once.</p>
      {message && <p role="status" style={{ padding: 12, borderRadius: 10, background: done ? "#ecfdf5" : "#fff7ed", color: done ? "#047857" : "#c2410c" }}>{message}</p>}
      {!done && <button onClick={() => void setup()} disabled={busy} style={{ width: "100%", marginTop: 12, padding: 14, border: 0, borderRadius: 10, color: "white", background: "#075985", fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>{busy ? "Setting up…" : "Set up initial administrator"}</button>}
      {done && <a href="/banking?mode=login" style={{ display: "inline-block", marginTop: 12, color: "#075985", fontWeight: 700 }}>Go to sign in</a>}
    </section>
  </main>;
}
