"use client";

/* eslint-disable @next/next/no-img-element */
import "./banking.css";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { provisionWorkspace } from "@/app/dashboard/workspace-store";

type Mode = "login" | "register" | "reset";

export default function BankingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, user => {
    setReady(true);
    setSignedIn(Boolean(user));
    if (user) router.replace("/dashboard");
  }), [router]);

  if (!ready || signedIn) return <main className="loading">Loading your Finova account…</main>;
  return <AuthScreen />;
}

function AuthScreen() {
  const [mode, setMode] = useState<Mode>(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "register" ? "register" : "login");
  if (mode === "register") return <RegisterScreen onLogin={() => setMode("login")} />;
  return <ReferenceAuth mode={mode} onRegister={() => setMode("register")} onReset={() => setMode("reset")} />;
}

function ReferenceAuth({ mode, onRegister, onReset }: { mode: Exclude<Mode, "register">; onRegister: () => void; onReset: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const reset = mode === "reset";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    try {
      if (reset) {
        await sendPasswordResetEmail(firebaseAuth, email);
        setMessage("If an account exists, a reset link has been sent.");
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, String(data.get("password") || ""));
      }
    } catch (caught) {
      const code = (caught as { code?: string }).code;
      setError(code === "auth/invalid-credential" ? "Incorrect email or password." : "We could not complete that request. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="referenceAuth"><aside className="referenceIntro"><div className="referenceMark"><Brand /></div><div className="referenceWelcome"><h1>{reset ? "Account Recovery" : "Welcome Back"}</h1><h2>Finova Bank</h2><p>{reset ? "Restore access to your secure Finova account." : "Sign in to view your personal accounts, activity, and submitted service requests."}</p></div><div className="referenceFeatures">{[["◈", "Private profile", "Your account data stays scoped to you"], ["ϟ", "Secure requests", "Transfers and deposits require review"], ["◉", "Global reach", "International recipient support"], ["▯", "Mobile first", "Use Finova wherever you are"]].map(([icon, title, copy]) => <div key={title}><b>{icon}</b><span><strong>{title}</strong><small>{copy}</small></span></div>)}</div></aside><section className="referenceSign"><button className="referenceTheme" aria-label="Toggle appearance" type="button">◐</button><form className="referenceCard" onSubmit={submit}><header><h1>{reset ? "Reset Password" : "Sign In"}</h1><p>{reset ? "Enter your email to receive a secure reset link" : "Access your Finova account"}</p></header><label>Email Address<input required name="email" type="email" placeholder="Enter your email address" autoComplete="email" /></label>{!reset && <label>Password <button type="button" onClick={onReset}>Forgot Password?</button><input required name="password" type="password" placeholder="Enter your password" autoComplete="current-password" /></label>}{error && <p className="formError">{error}</p>}{message && <p className="formSuccess">{message}</p>}<button className="referenceSubmit" disabled={busy}>{busy ? "Please wait…" : reset ? "Send Reset Link" : "Sign In to Account"}</button>{!reset && <><div className="referenceDivider">New to Finova Bank?</div><button type="button" className="referenceCreate" onClick={onRegister}>Create New Account</button></>}<button type="button" className="back" onClick={() => window.location.assign("/")}>← Back to home</button></form><footer>◈ Security　◉ Support　▣ Terms<br /><span>By signing in, you agree to our Terms of Service and Privacy Policy.</span></footer></section></main>;
}

function RegisterScreen({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const steps = [["Personal Information", "Tell us about yourself"], ["Contact Details", "How can we reach you?"], ["Account Preferences", "Choose your account settings"], ["Security Setup", "Secure your account"]];

  const next = () => {
    const current = form.current?.querySelector<HTMLElement>(`[data-register-step="${step}"]`);
    const fields = current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[required], select[required]") || [];
    if ([...fields].some(field => !field.reportValidity())) return;
    setStep(value => Math.min(4, value + 1));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (password !== String(data.get("confirmPassword") || "")) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const email = String(data.get("email") || "").trim();
      const firstName = String(data.get("firstName") || "").trim();
      const lastName = String(data.get("lastName") || "").trim();
      const displayName = [firstName, lastName].filter(Boolean).join(" ");
      const accountType = String(data.get("accountType") || "Personal Account");
      const currency = String(data.get("currency") || "USD");
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await updateProfile(credential.user, { displayName });
      const profile = {
        displayName, firstName, lastName, middleName: String(data.get("middleName") || ""), username: String(data.get("username") || ""),
        email, phone: String(data.get("phone") || ""), country: String(data.get("country") || ""), accountType, currency, photoURL: "", createdAt: new Date().toISOString(),
      };
      await provisionWorkspace(credential.user, profile);
      void sendEmailVerification(credential.user).catch(() => undefined);
    } catch (caught) {
      const code = (caught as { code?: string }).code;
      setError(code === "auth/email-already-in-use" ? "An account already exists with this email." : code === "auth/weak-password" ? "Use a password with at least six characters." : "We could not create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="registerPage"><div className="registerGlow registerGlowOne" /><div className="registerGlow registerGlowTwo" /><section className="registerShell"><div className="registerBrand"><Brand /></div><div className="registerCard"><header className="registerHeader"><div className="registerIcon">{["◉", "✦", "▣", "⌁"][step - 1]}</div><h1>Create your Finova account</h1><p>Join Finova Bank in a few simple steps.</p></header><div className="registerProgress" aria-label={`Step ${step} of 4`}><div className="registerTrack"><span style={{ width: `${step * 25}%` }} /></div><div className="registerStepCount">Step {step} of 4</div><div className="registerSteps">{steps.map(([title], index) => <div key={title} className={index + 1 <= step ? "active" : ""}><b>{index + 1}</b><span>{title}</span></div>)}</div></div><form ref={form} onSubmit={submit}><section data-register-step="1" hidden={step !== 1} className="registerSection"><h2>Personal Information</h2><p>Tell us about yourself</p><label>First Name *<input required name="firstName" placeholder="John" autoComplete="given-name" /></label><label>Last Name *<input required name="lastName" placeholder="Smith" autoComplete="family-name" /></label><label>Middle Name<input name="middleName" placeholder="David" /></label><label>Username *<input required name="username" placeholder="johnsmith123" autoComplete="username" /></label></section><section data-register-step="2" hidden={step !== 2} className="registerSection"><h2>Contact Information</h2><p>How can we reach you?</p><label>Email Address *<input required name="email" type="email" placeholder="john@example.com" autoComplete="email" /></label><label>Phone Number *<input required name="phone" type="tel" placeholder="+1 (234) 567-8901" autoComplete="tel" /></label><label>Country *<select required name="country" defaultValue=""><option value="" disabled>Select Country</option><option>Nigeria</option><option>United Kingdom</option><option>United States of America</option><option>Canada</option><option>Ghana</option><option>Other</option></select></label></section><section data-register-step="3" hidden={step !== 3} className="registerSection"><h2>Account Setup</h2><p>Choose your account preferences</p><label>Currency *<select required name="currency" defaultValue=""><option value="" disabled>Select Currency</option><option value="NGN">NGN (₦)</option><option value="USD">USD ($)</option><option value="GBP">GBP (£)</option><option value="EUR">EUR (€)</option></select></label><label>Account Type *<select required name="accountType" defaultValue=""><option value="" disabled>Select Account Type</option><option>Checking Account</option><option>Savings Account</option><option>Fixed Deposit Account</option><option>Current Account</option><option>Business Account</option><option>Investment Account</option></select></label><p className="registerHint">Your first Finova account opens at a zero balance. Transaction approval is enabled only after secure account verification.</p></section><section data-register-step="4" hidden={step !== 4} className="registerSection"><h2>Security Setup</h2><p>Create a strong password to protect your account.</p><label>Password *<input required name="password" minLength={6} type="password" placeholder="Create strong password" autoComplete="new-password" /></label><label>Confirm password *<input required name="confirmPassword" minLength={6} type="password" placeholder="Confirm your password" autoComplete="new-password" /></label><label className="terms"><input required type="checkbox" /> <span>I agree to the Terms of Service and Privacy Policy.</span></label></section>{error && <p className="formError">{error}</p>}<div className="registerActions">{step > 1 && <button type="button" className="registerPrevious" onClick={() => setStep(value => value - 1)}>← Previous</button>}{step < 4 ? <button type="button" className="registerNext" onClick={next}>Next →</button> : <button className="registerCreate" disabled={busy}>{busy ? "Creating account…" : "Create Account"}</button>}</div></form><p className="registerLogin">Already have an account? <button type="button" onClick={onLogin}>Sign in</button></p></div><footer>© 2026 Finova Bank. All rights reserved.</footer></section></main>;
}

function Brand() { return <div className="brand"><img src="/finova-bank-logo.png" alt="Finova Bank — Banking a Brighter Tomorrow" /></div>; }
