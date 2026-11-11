"use client";

/* eslint-disable @next/next/no-img-element */
import "./banking.css";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

type Mode = "login" | "register" | "reset";

function passwordStrength(value: string) {
  return [value.length >= 8, /[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
}

function strengthName(score: number) {
  return score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Good" : "Strong";
}

export default function BankingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, user => {
    setReady(true);
    setSignedIn(Boolean(user));
    const params = new URLSearchParams(window.location.search);
    const registering = params.get("mode") === "register";
    const otpFlow = params.get("mode") === "register" && params.get("step") === "verify";
    if (user && otpFlow) {
      setSignedIn(false);
      return;
    }
    if (user && !registering) router.replace("/dashboard");
  }), [router]);

  const registering = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "register";
  if (!ready || (signedIn && !registering)) return <main className="loading">Loading your Finova account…</main>;
  return <AuthScreen />;
}

function AuthScreen() {
  const [mode, setMode] = useState<Mode>(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "register" ? "register" : "login");
  if (mode === "register") return <RegisterScreen onLogin={() => setMode("login")} />;
  return <ReferenceAuth mode={mode} onLogin={() => setMode("login")} onRegister={() => setMode("register")} onReset={() => setMode("reset")} />;
}

function ReferenceAuth({ mode, onLogin, onRegister, onReset }: { mode: Exclude<Mode, "register">; onLogin: () => void; onRegister: () => void; onReset: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reviewRequired, setReviewRequired] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const reset = mode === "reset";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    try {
      if (reset) {
        const response = await fetch("/api/auth/password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) throw new Error("Password reset request failed.");
        setMessage("If an account exists, a reset link has been sent.");
      } else {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, String(data.get("password") || ""));
        const token = await credential.user.getIdToken();
        void fetch("/api/demo/auth-event", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ event: "login" }),
        }).catch(() => undefined);
      }
    } catch (caught) {
      const code = (caught as { code?: string }).code;
      if (code === "auth/user-disabled") {
        setReviewRequired(true);
        return;
      }
      setError(code === "auth/invalid-credential" ? "Incorrect email or password." : "We could not complete that request. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (reviewRequired) return <ReviewScreen onBack={onLogin} />;
  return <main className="referenceAuth"><aside className="referenceIntro"><div className="referenceMark"><Brand /></div><div className="referenceWelcome"><h1>{reset ? "Account Recovery" : "Welcome Back"}</h1><h2>Finova Bank</h2><p>{reset ? "Restore access to your secure Finova account." : "Sign in to view your personal accounts, activity, and submitted service requests."}</p></div><div className="referenceFeatures">{[["◈", "Private profile", "Your account data stays scoped to you"], ["ϟ", "Secure requests", "Transfers and deposits require review"], ["◉", "Global reach", "International recipient support"], ["▯", "Mobile first", "Use Finova wherever you are"]].map(([icon, title, copy]) => <div key={title}><b>{icon}</b><span><strong>{title}</strong><small>{copy}</small></span></div>)}</div></aside><section className="referenceSign"><button className="referenceTheme" aria-label="Toggle appearance" type="button">◐</button><form className="referenceCard" onSubmit={submit}><header><h1>{reset ? "Reset Password" : "Sign In"}</h1><p>{reset ? "Enter your email to receive a secure reset link" : "Access your Finova account"}</p></header><label>Email Address<input required name="email" type="email" placeholder="Enter your email address" autoComplete="email" /></label>{!reset && <label>Password <button type="button" onClick={onReset}>Forgot Password?</button><span className="passwordField"><input required name="password" type={showLoginPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" /><button type="button" className="passwordEye" aria-label={showLoginPassword ? "Hide password" : "Show password"} onClick={() => setShowLoginPassword(value => !value)}><EyeIcon hidden={!showLoginPassword} /></button></span></label>}{error && <p className="formError">{error}</p>}{message && <p className="formSuccess">{message}</p>}<button className="referenceSubmit" disabled={busy}>{busy ? "Please wait…" : reset ? "Send Reset Link" : "Sign In to Account"}</button>{!reset && <><div className="referenceDivider">New to Finova Bank?</div><button type="button" className="referenceCreate" onClick={onRegister}>Create New Account</button></>}<button type="button" className="back" onClick={() => window.location.assign("/")}>← Back to home</button></form><footer>◈ Security　◉ Support　▣ Terms<br /><span>By signing in, you agree to our Terms of Service and Privacy Policy.</span></footer></section></main>;
}

function RegisterScreen({ onLogin }: { onLogin: () => void }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [otpPending, setOtpPending] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [pendingProfile, setPendingProfile] = useState<Record<string, string>>({});
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const steps = [["Personal Information", "Tell us about yourself"], ["Contact Details", "How can we reach you?"], ["Account Preferences", "Choose your account settings"], ["Security Setup", "Secure your account"]];

  useEffect(() => {
    if (typeof window === "undefined" || new URLSearchParams(window.location.search).get("step") !== "verify") return;
    const user = firebaseAuth.currentUser;
    const stored = sessionStorage.getItem("finova.pending-application");
    if (!user || !stored) return;
    try {
      const profile = JSON.parse(stored) as Record<string, string>;
      setPendingProfile(profile);
      setOtpPending(true);
    } catch {
      sessionStorage.removeItem("finova.pending-application");
      window.history.replaceState(null, "", "/banking?mode=register");
    }
  }, []);

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
    if (passwordStrength(password) < 3) return setError("Use at least 8 characters and include a mix of letters and numbers or symbols.");
    if (password !== String(data.get("confirmPassword") || "")) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const email = String(data.get("email") || "").trim();
      const firstName = String(data.get("firstName") || "").trim();
      const lastName = String(data.get("lastName") || "").trim();
      const displayName = [firstName, lastName].filter(Boolean).join(" ");
      const accountType = String(data.get("accountType") || "Personal Account");
      const currency = String(data.get("currency") || "USD");
      const profile = {
        displayName, firstName, lastName, middleName: String(data.get("middleName") || ""), username: String(data.get("username") || ""),
        email, phone: String(data.get("phone") || ""), country: String(data.get("country") || ""), accountType, currency, photoURL: "", createdAt: new Date().toISOString(),
      };
      let user = firebaseAuth.currentUser;
      if (user?.email?.toLowerCase() !== email.toLowerCase()) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        user = credential.user;
        await updateProfile(user, { displayName });
      }
      if (!user) throw new Error("Your signup session could not be created. Please try again.");
      if (user.displayName !== displayName) await updateProfile(user, { displayName });
      const token = await user.getIdToken();
      const response = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "We could not send an email verification code.");
      sessionStorage.setItem("finova.pending-application", JSON.stringify(profile));
      setMessage("");
      window.history.replaceState(null, "", "/banking?mode=register&step=verify");
      setPendingProfile(profile);
      setOtpPending(true);
    } catch (caught) {
      const code = (caught as { code?: string }).code;
      const savedApplication = sessionStorage.getItem("finova.pending-application");
      if (savedApplication && firebaseAuth.currentUser?.email?.toLowerCase() === String(new FormData(event.currentTarget).get("email") || "").trim().toLowerCase()) {
        try {
          setPendingProfile(JSON.parse(savedApplication) as Record<string, string>);
          setOtpPending(true);
        } catch { sessionStorage.removeItem("finova.pending-application"); }
      }
      setError(code === "auth/email-already-in-use" ? "An account already exists with this email." : code === "auth/weak-password" ? "Use a password with at least eight characters." : caught instanceof Error && caught.message ? caught.message : "We could not submit your account for review. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("Your signup session expired. Start registration again.");
      const token = await user.getIdToken();
      const verifyResponse = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpValue }),
      });
      const verifyResult = await verifyResponse.json().catch(() => null);
      if (!verifyResponse.ok) throw new Error(typeof verifyResult?.error === "string" ? verifyResult.error : "The email code could not be verified.");
      const applicationResponse = await fetch("/api/demo/onboarding", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(pendingProfile),
      });
      const applicationResult = await applicationResponse.json().catch(() => null);
      if (!applicationResponse.ok) throw new Error(typeof applicationResult?.error === "string" ? applicationResult.error : "Your application could not be submitted.");
      sessionStorage.removeItem("finova.pending-application");
      await signOut(firebaseAuth).catch(() => undefined);
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not verify that code.");
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("Your signup session expired. Start registration again.");
      const response = await fetch("/api/auth/email-otp", { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : "We could not resend the code.");
      setMessage("A new code has been sent to your email.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not resend the code.");
    }
  };

  if (submitted) return <ReviewScreen onBack={onLogin} />;
  if (otpPending) return <EmailOtpScreen email={pendingProfile.email || "your email"} value={otpValue} onChange={value => setOtpValue(value.replace(/\D/g, "").slice(0, 6))} onSubmit={verifyOtp} onResend={() => void resendOtp()} busy={busy} error={error} message={message} />;

  return <main className="registerPage"><div className="registerGlow registerGlowOne" /><div className="registerGlow registerGlowTwo" /><section className="registerShell"><div className="registerBrand"><Brand /></div><div className="registerCard"><header className="registerHeader"><div className="registerIcon">{["◉", "✦", "▣", "⌁"][step - 1]}</div><h1>Create your Finova account</h1><p>Join Finova Bank in a few simple steps.</p></header><div className="registerProgress" aria-label={`Step ${step} of 4`}><div className="registerTrack"><span style={{ width: `${step * 25}%` }} /></div><div className="registerStepCount">Step {step} of 4</div><div className="registerSteps">{steps.map(([title], index) => <div key={title} className={index + 1 <= step ? "active" : ""}><b>{index + 1}</b><span>{title}</span></div>)}</div></div><form ref={form} onSubmit={submit}><section data-register-step="1" hidden={step !== 1} className="registerSection"><h2>Personal Information</h2><p>Tell us about yourself</p><label>First Name *<input required name="firstName" placeholder="John" autoComplete="given-name" /></label><label>Last Name *<input required name="lastName" placeholder="Smith" autoComplete="family-name" /></label><label>Middle Name<input name="middleName" placeholder="David" /></label><label>Username *<input required name="username" placeholder="johnsmith123" autoComplete="username" /></label></section><section data-register-step="2" hidden={step !== 2} className="registerSection"><h2>Contact Information</h2><p>How can we reach you?</p><label>Email Address *<input required name="email" type="email" placeholder="john@example.com" autoComplete="email" /></label><label>Phone Number *<input required name="phone" type="tel" placeholder="+1 (234) 567-8901" autoComplete="tel" /></label><label>Country *<select required name="country" defaultValue=""><option value="" disabled>Select Country</option><option>Nigeria</option><option>United Kingdom</option><option>United States of America</option><option>Canada</option><option>Ghana</option><option>Other</option></select></label></section><section data-register-step="3" hidden={step !== 3} className="registerSection"><h2>Account Setup</h2><p>Choose your account preferences</p><label>Currency *<select required name="currency" defaultValue=""><option value="" disabled>Select Currency</option><option value="NGN">NGN (₦)</option><option value="USD">USD ($)</option><option value="GBP">GBP (£)</option><option value="EUR">EUR (€)</option></select></label><label>Account Type *<select required name="accountType" defaultValue=""><option value="" disabled>Select Account Type</option><option>Checking Account</option><option>Savings Account</option><option>Fixed Deposit Account</option><option>Current Account</option><option>Business Account</option><option>Investment Account</option></select></label><p className="registerHint">If approved, your Finova account opens at a zero balance. You will verify your email, then wait for administrator review.</p></section><section data-register-step="4" hidden={step !== 4} className="registerSection"><h2>Security Setup</h2><p>Create a strong password to protect your account.</p><label>Password *<span className="passwordField"><input required name="password" minLength={8} type={showPassword ? "text" : "password"} value={passwordValue} onChange={event => setPasswordValue(event.target.value)} placeholder="Create strong password" autoComplete="new-password" /><button type="button" className="passwordEye" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)}><EyeIcon hidden={!showPassword} /></button></span><PasswordStrength value={passwordValue} /></label><label>Confirm password *<span className="passwordField"><input required name="confirmPassword" minLength={8} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" autoComplete="new-password" /><button type="button" className="passwordEye" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword(value => !value)}><EyeIcon hidden={!showConfirmPassword} /></button></span></label><label className="terms"><input required type="checkbox" /> <span>I agree to the Terms of Service and Privacy Policy.</span></label></section>{error && <p className="formError">{error}</p>}<div className="registerActions">{step > 1 && <button type="button" className="registerPrevious" onClick={() => setStep(value => value - 1)}>← Previous</button>}{step < 4 ? <button type="button" className="registerNext" onClick={next}>Next →</button> : <button className="registerCreate" disabled={busy}>{busy ? "Sending verification code…" : "Continue to email verification"}</button>}</div></form><p className="registerLogin">Already have an account? <button type="button" onClick={onLogin}>Sign in</button></p></div><footer>© 2026 Finova Bank. All rights reserved.</footer></section></main>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{hidden && <path d="m4 4 16 16" />}</svg>;
}

function PasswordStrength({ value }: { value: string }) {
  const score = passwordStrength(value);
  const checks = [
    [value.length >= 8, "8+ characters"],
    [/[a-z]/.test(value) && /[A-Z]/.test(value), "Upper and lowercase letters"],
    [/\d/.test(value), "A number"],
    [/[^A-Za-z0-9]/.test(value), "A symbol"],
  ] as const;
  return <div className="passwordStrength" data-score={score} aria-live="polite"><div className="passwordStrengthTrack"><span style={{ width: `${score * 20}%` }} /></div><small>Password strength: <strong>{value ? strengthName(score) : "Enter a password"}</strong></small><ul>{checks.map(([passed, label]) => <li key={label} data-passed={passed}>{passed ? "✓" : "○"} {label}</li>)}</ul></div>;
}

function EmailOtpScreen({ email, value, onChange, onSubmit, onResend, busy, error, message }: { email: string; value: string; onChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onResend: () => void; busy: boolean; error: string; message: string }) {
  return <main className="registerPage"><div className="registerGlow registerGlowOne" /><div className="registerGlow registerGlowTwo" /><section className="registerShell"><div className="registerBrand"><Brand /></div><div className="registerCard"><header className="registerHeader"><div className="registerIcon">✉</div><h1>Verify your email</h1><p>Enter the six-digit code sent to {email}.</p></header><form onSubmit={onSubmit}><label className="otpLabel">Email verification code<input value={value} onChange={event => onChange(event.target.value)} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required placeholder="000000" /></label>{error && <p className="formError">{error}</p>}{message && <p className="formSuccess">{message}</p>}<button className="registerCreate otpSubmit" disabled={busy || value.length !== 6}>{busy ? "Verifying…" : "Verify and submit for review"}</button><button className="otpResend" type="button" onClick={onResend} disabled={busy}>Resend code</button></form><p className="otpExpiry">The code expires after 10 minutes. You’ll see an account review screen after verification.</p></div></section></main>;
}

function ReviewScreen({ onBack }: { onBack: () => void }) {
  return <main className="registerPage"><div className="registerGlow registerGlowOne" /><div className="registerGlow registerGlowTwo" /><section className="registerShell"><div className="registerBrand"><Brand /></div><div className="registerCard"><header className="registerHeader"><div className="registerIcon">◷</div><h1>Your information is under review</h1><p>Finova has received your account application.</p></header><div className="registerHint"><strong>What happens next?</strong><br />An administrator will review your details. Your Finova account will be created after approval, and you can sign in once that review is complete.</div><p className="registerLogin"><button type="button" onClick={onBack}>Back to sign in</button></p></div></section></main>;
}
function Brand() { return <div className="brand"><img src="/finova-bank-logo.png" alt="Finova Bank — Banking a Brighter Tomorrow" /></div>; }
