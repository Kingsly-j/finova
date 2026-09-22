"use client";

import { Suspense, type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import styles from "./admin.module.css";

type AdminTab = "overview" | "deposits" | "transfers" | "cards" | "credits" | "methods";
type RecordValue = Record<string, unknown>;
type Decision = "approve" | "reject";

type AdminOverview = {
  summary?: RecordValue;
  paymentMethods?: RecordValue[];
  deposits?: RecordValue[];
  transfers?: RecordValue[];
  cards?: RecordValue[];
  accounts?: RecordValue[];
  settings?: RecordValue;
};

type PaymentMethodDraft = {
  name: string;
  type: "crypto" | "bank" | "wallet" | "card";
  instructions: string;
  addressOrLink: string;
  enabled: boolean;
};

const tabs: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "deposits", label: "Deposit reviews", icon: "↓" },
  { id: "transfers", label: "Transfer reviews", icon: "⇄" },
  { id: "cards", label: "Card applications", icon: "▣" },
  { id: "credits", label: "Manual credits", icon: "+" },
  { id: "methods", label: "Payment methods", icon: "⌁" },
];

const blankMethod: PaymentMethodDraft = {
  name: "",
  type: "crypto",
  instructions: "",
  addressOrLink: "",
  enabled: true,
};

class AdminApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "AdminApiError";
  }
}

function asRecord(value: unknown): RecordValue {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
}

function readString(record: RecordValue | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function readNumber(record: RecordValue | undefined, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return 0;
}

function readBoolean(record: RecordValue | undefined, ...keys: string[]) {
  for (const key of keys) {
    if (typeof record?.[key] === "boolean") return Boolean(record[key]);
  }
  return false;
}

function list(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function formatMoney(value: unknown, currency = "USD") {
  const amount = typeof value === "number" ? value : Number(value || 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", minimumFractionDigits: 2 }).format(safeAmount);
  } catch {
    return `$${safeAmount.toFixed(2)}`;
  }
}

function formatDate(value: unknown) {
  if (!value) return "Not recorded";
  const record = asRecord(value);
  const seconds = readNumber(record, "seconds", "_seconds");
  const date = seconds ? new Date(seconds * 1000) : new Date(typeof value === "string" || typeof value === "number" ? value : "");
  return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getStatus(record: RecordValue) {
  return (readString(record, "status", "state") || "pending").toLowerCase();
}

function statusClass(status: string) {
  if (["approved", "complete", "completed", "active", "enabled"].includes(status)) return styles.statusApproved;
  if (["rejected", "failed", "declined", "disabled"].includes(status)) return styles.statusRejected;
  return styles.statusPending;
}

function Status({ value }: { value: string }) {
  const label = value ? value.replace(/[-_]/g, " ") : "pending";
  return <span className={`${styles.status} ${statusClass(value)}`}>{label}</span>;
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new AdminApiError("Your session has ended. Please sign in again.", 401);
  const token = await user.getIdToken();
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = readString(asRecord(payload), "error", "message") || "The request could not be completed.";
    throw new AdminApiError(message, response.status);
  }
  return payload as T;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`${styles.card} ${className}`}>{children}</section>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className={styles.empty}><span aria-hidden="true">✓</span><strong>{title}</strong><p>{copy}</p></div>;
}

export default function AdminPage() {
  return <Suspense fallback={<main className={styles.adminShell} aria-busy="true" />}><AdminContent /></Suspense>;
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [revealed, setRevealed] = useState(() => searchParams.get("access") === "finova");
  const typedKeyword = useRef("");
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (searchParams.get("access") === "finova") setRevealed(true);
  }, [searchParams]);

  useEffect(() => {
    const revealOnKeyword = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key.length !== 1) return;
      typedKeyword.current = `${typedKeyword.current}${event.key.toLowerCase()}`.slice(-6);
      if (typedKeyword.current !== "finova") return;
      setRevealed(true);
      router.replace("/admin?access=finova");
    };
    window.addEventListener("keydown", revealOnKeyword);
    return () => window.removeEventListener("keydown", revealOnKeyword);
  }, [router]);

  const refresh = useCallback(async () => {
    if (!firebaseAuth.currentUser) return;
    setLoading(true);
    setError("");
    try {
      const payload = await adminRequest<AdminOverview>("/api/admin/overview");
      setOverview({
        summary: asRecord(payload?.summary),
        paymentMethods: list(payload?.paymentMethods),
        deposits: list(payload?.deposits),
        transfers: list(payload?.transfers),
        cards: list(payload?.cards),
        accounts: list(payload?.accounts),
        settings: asRecord(payload?.settings),
      });
      setAccessDenied(false);
    } catch (caught) {
      const requestError = caught instanceof AdminApiError ? caught : new AdminApiError("We could not load the admin workspace.", 500);
      if (requestError.status === 401 || requestError.status === 403) setAccessDenied(true);
      else setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => onAuthStateChanged(firebaseAuth, currentUser => {
    setUser(currentUser);
    setAuthReady(true);
    if (!currentUser) {
      setOverview(null);
      setAccessDenied(false);
      setError("");
    }
  }), []);

  useEffect(() => {
    if (authReady && user) void refresh();
  }, [authReady, refresh, user]);

  const settings = overview?.settings ?? {};
  const summary = overview?.summary ?? {};
  const currency = readString(settings, "currency") || "USD";
  const deposits = overview?.deposits ?? [];
  const transfers = overview?.transfers ?? [];
  const cards = overview?.cards ?? [];
  const accounts = overview?.accounts ?? [];
  const methods = overview?.paymentMethods ?? [];
  const pendingCount = useMemo(() => deposits.filter(item => getStatus(item) === "pending").length + transfers.filter(item => getStatus(item) === "pending").length + cards.filter(item => getStatus(item) === "pending").length, [cards, deposits, transfers]);

  const decide = async (kind: "deposits" | "transfers" | "cards", item: RecordValue, action: Decision) => {
    const id = readString(item, "id", "requestId");
    if (!id) return setError("This request is missing its server identifier. Refresh and try again.");
    const key = `${kind}-${id}-${action}`;
    setActionKey(key);
    setError("");
    try {
      await adminRequest(`/api/admin/${kind}/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify({ action, note: notes[`${kind}-${id}`]?.trim() || undefined }),
      });
      setNotes(current => ({ ...current, [`${kind}-${id}`]: "" }));
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The review decision could not be saved.");
    } finally {
      setActionKey("");
    }
  };

  const signOutAdmin = async () => {
    await signOut(firebaseAuth).catch(() => undefined);
  };

  if (!revealed) return <HiddenAdminGate />;
  if (!authReady) return <AdminGate title="Opening the control center" copy="Checking your secure Finova session…" loading />;
  if (!user) return <AdminGate title="Admin sign-in required" copy="Sign in with an administrator account to access the Finova control center." />;
  if (accessDenied) return <AdminGate title="Administrator access required" copy="This signed-in account does not have permission to operate the Finova control center." signedIn onSignOut={() => void signOutAdmin()} />;

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="/dashboard" aria-label="Finova dashboard home"><img src="/finova-bank-logo-cropped.png" alt="Finova Bank" /></a>
        <div className={styles.workspaceLabel}><span /> Operations</div>
        <nav className={styles.nav} aria-label="Admin sections">
          {tabs.map(tab => <button key={tab.id} className={activeTab === tab.id ? styles.navActive : ""} onClick={() => setActiveTab(tab.id)}><i aria-hidden="true">{tab.icon}</i><span>{tab.label}</span>{["deposits", "transfers", "cards"].includes(tab.id) && pendingCount > 0 ? <em>{tab.id === "deposits" ? deposits.filter(item => getStatus(item) === "pending").length : tab.id === "transfers" ? transfers.filter(item => getStatus(item) === "pending").length : cards.filter(item => getStatus(item) === "pending").length}</em> : null}</button>)}
        </nav>
        <div className={styles.sidebarFoot}>
          <div className={styles.adminIdentity}><div>{(user.displayName || user.email || "A").slice(0, 1).toUpperCase()}</div><span><strong>{user.displayName || "Administrator"}</strong><small>{user.email}</small></span></div>
          <button className={styles.signOut} onClick={() => void signOutAdmin()}>Sign out <span aria-hidden="true">→</span></button>
        </div>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div><p className={styles.eyebrow}>Finova / Admin</p><h1>{tabs.find(tab => tab.id === activeTab)?.label}</h1></div>
          <div className={styles.topbarActions}><span className={styles.demoPill}><b /> SECURE SESSION</span><button className={styles.refresh} onClick={() => void refresh()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></div>
        </header>

        {error && <div className={styles.error} role="alert"><span>!</span><p>{error}</p><button onClick={() => setError("")} aria-label="Dismiss message">×</button></div>}

        {loading && !overview ? <LoadingPanel /> : <>
          {activeTab === "overview" && <OverviewSection summary={summary} settings={settings} currency={currency} pendingCount={pendingCount} onSettingsSaved={refresh} />}
          {activeTab === "deposits" && <ReviewSection kind="deposits" title="Pending deposit reviews" copy="Review submitted payment evidence before the server credits the selected account." items={deposits} currency={currency} actionKey={actionKey} notes={notes} setNotes={setNotes} onDecide={decide} />}
          {activeTab === "transfers" && <ReviewSection kind="transfers" title="Internal transfer reviews" copy="Review Finova-to-Finova transfer requests. Service charges are calculated by the server." items={transfers} currency={currency} actionKey={actionKey} notes={notes} setNotes={setNotes} onDecide={decide} />}
          {activeTab === "cards" && <ReviewSection kind="cards" title="Card application reviews" copy="Review card applications before they are issued." items={cards} currency={currency} actionKey={actionKey} notes={notes} setNotes={setNotes} onDecide={decide} />}
          {activeTab === "credits" && <ManualCredits accounts={accounts} currency={currency} onChanged={refresh} />}
          {activeTab === "methods" && <PaymentMethods methods={methods} onChanged={refresh} currency={currency} />}
        </>}
      </section>
    </main>
  );
}

function HiddenAdminGate() {
  return <main className={styles.gate}><section><a href="/" className={styles.gateBrand}><img src="/finova-bank-logo-cropped.png" alt="Finova Bank" /></a><span className={styles.gateIcon}>◆</span><p className={styles.eyebrow}>FINOVA</p><h1>Secure area</h1><p>This workspace is not available from the public navigation.</p></section></main>;
}

function AdminGate({ title, copy, loading, signedIn, onSignOut }: { title: string; copy: string; loading?: boolean; signedIn?: boolean; onSignOut?: () => void }) {
  return <main className={styles.gate}><section><a href="/" className={styles.gateBrand}><img src="/finova-bank-logo-cropped.png" alt="Finova Bank" /></a><span className={styles.gateIcon}>{loading ? "◌" : "◆"}</span><p className={styles.eyebrow}>FINOVA OPERATIONS</p><h1>{title}</h1><p>{copy}</p>{loading ? <div className={styles.loadingLine}><i /></div> : <div className={styles.gateActions}><a href="/banking?mode=login">Go to sign in</a>{signedIn && <button onClick={onSignOut}>Sign out</button>}</div>}</section></main>;
}

function LoadingPanel() {
  return <div className={styles.loadingPanel}><div className={styles.spinner} /><strong>Loading protected operations data</strong><p>Establishing a secure connection to Finova services.</p></div>;
}

function LegacyOverviewSection({ summary, settings, currency, pendingCount, onSettingsSaved }: { summary: RecordValue; settings: RecordValue; currency: string; pendingCount: number; onSettingsSaved: () => Promise<void> }) {
  const cards = [
    ["Registered users", readNumber(summary, "totalUsers"), "Accounts in the workspace", "users"],
    ["Deposit reviews", readNumber(summary, "pendingDeposits"), "Awaiting payment verification", "deposits"],
    ["Transfer reviews", readNumber(summary, "pendingTransfers"), "Awaiting an admin decision", "transfers"],
    ["Card applications", readNumber(summary, "pendingCards"), "Awaiting issuance review", "cards"],
  ];
  return <div className={styles.sectionStack}>
    <section className={styles.overviewHero}><div><span className={styles.liveDot} /><p>Control center</p><h2>{pendingCount ? `${pendingCount} review${pendingCount === 1 ? "" : "s"} need attention` : "Everything is up to date"}</h2><span>Use the review queues to verify deposits, internal transfers, and card requests. Server-side safeguards determine all account changes.</span></div><div className={styles.heroTotal}><small>Total account balance</small><strong>{formatMoney(readNumber(summary, "totalDemoBalance"), currency)}</strong><span>Across all approved accounts</span></div></section>
    <div className={styles.metricGrid}>{cards.map(([label, value, copy, tone]) => <Card key={String(label)} className={styles.metric}><div className={`${styles.metricIcon} ${styles[`metric${String(tone).charAt(0).toUpperCase()}${String(tone).slice(1)}`]}`} aria-hidden="true">{tone === "users" ? "◉" : tone === "deposits" ? "↓" : tone === "transfers" ? "⇄" : "▣"}</div><p>{label}</p><strong>{Number(value).toLocaleString()}</strong><span>{copy}</span></Card>)}</div>
    <div className={styles.twoColumn}>
      <Card className={styles.controlCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>Demo safeguards</p><h2>Operating boundaries</h2></div><span className={styles.safeBadge}>Server verified</span></div><ul className={styles.guardrails}><li><i>✓</i><span><strong>Manual review required</strong><small>Deposits, transfers, and card applications remain pending until an administrator decides.</small></span></li><li><i>✓</i><span><strong>No external banking rails</strong><small>All balances, cards, and payment methods operate only within this sandbox.</small></span></li><li><i>✓</i><span><strong>Audit-friendly workflow</strong><small>The client asks the server to perform a decision; it never calculates or changes balances itself.</small></span></li></ul></Card>
      <SettingsPanel settings={settings} currency={currency} onSaved={onSettingsSaved} />
    </div>
  </div>;
}

function LegacySettingsPanel({ settings, currency, onSaved }: { settings: RecordValue; currency: string; onSaved: () => Promise<void> }) {
  const [cardFee, setCardFee] = useState(String(readNumber(settings, "cardFee")));
  const [transferFee, setTransferFee] = useState(String(readNumber(settings, "internalTransferServiceCharge")));
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCardFee(String(readNumber(settings, "cardFee")));
    setTransferFee(String(readNumber(settings, "internalTransferServiceCharge")));
    setSelectedCurrency(currency);
  }, [currency, settings]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    const parsedCardFee = Number(cardFee);
    const parsedTransferFee = Number(transferFee);
    if (!Number.isFinite(parsedCardFee) || parsedCardFee < 0 || !Number.isFinite(parsedTransferFee) || parsedTransferFee < 0) return setMessage("Enter zero or a positive number for each fee.");
    setBusy(true);
    try {
      await adminRequest("/api/admin/settings", { method: "POST", body: JSON.stringify({ cardFee: parsedCardFee, internalTransferServiceCharge: parsedTransferFee, currency: selectedCurrency.toUpperCase() }) });
      setMessage("Controls saved.");
      await onSaved();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "The controls could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return <Card className={styles.settingsCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>Configuration</p><h2>Demo controls</h2></div><span className={styles.demoSmall}>SANDBOX</span></div><form onSubmit={submit} className={styles.settingsForm}><label>Demo card fee<div className={styles.inputWithPrefix}><span>{currency}</span><input value={cardFee} onChange={event => setCardFee(event.target.value)} type="number" min="0" step="0.01" /></div></label><label>Internal transfer service charge<div className={styles.inputWithPrefix}><span>{currency}</span><input value={transferFee} onChange={event => setTransferFee(event.target.value)} type="number" min="0" step="0.01" /></div></label><label>Display currency<select value={selectedCurrency} onChange={event => setSelectedCurrency(event.target.value)}><option value="USD">USD</option><option value="NGN">NGN</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></label><button className={styles.primaryButton} disabled={busy}>{busy ? "Saving…" : "Save controls"}</button>{message && <p className={styles.formMessage}>{message}</p>}</form></Card>;
}

function OverviewSection({ summary, settings, currency, pendingCount, onSettingsSaved }: { summary: RecordValue; settings: RecordValue; currency: string; pendingCount: number; onSettingsSaved: () => Promise<void> }) {
  const cards = [
    ["Registered users", readNumber(summary, "totalUsers"), "Accounts in the workspace"],
    ["Deposit reviews", readNumber(summary, "pendingDeposits"), "Awaiting payment verification"],
    ["Transfer reviews", readNumber(summary, "pendingTransfers"), "Awaiting an administrator decision"],
    ["Card applications", readNumber(summary, "pendingCards"), "Awaiting issuance review"],
  ];
  return <div className={styles.sectionStack}>
    <section className={styles.overviewHero}><div><span className={styles.liveDot} /><p>Control center</p><h2>{pendingCount ? `${pendingCount} review${pendingCount === 1 ? "" : "s"} need attention` : "Everything is up to date"}</h2><span>Use the review queues to verify deposits, internal transfers, and card requests. Server-side safeguards determine all account changes.</span></div><div className={styles.heroTotal}><small>Total account balance</small><strong>{formatMoney(readNumber(summary, "totalDemoBalance"), currency)}</strong><span>Across all approved accounts</span></div></section>
    <div className={styles.metricGrid}>{cards.map(([label, value, copy]) => <Card key={String(label)} className={styles.metric}><p>{label}</p><strong>{Number(value).toLocaleString()}</strong><span>{copy}</span></Card>)}</div>
    <div className={styles.twoColumn}><Card className={styles.controlCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>Control safeguards</p><h2>Operating controls</h2></div><span className={styles.safeBadge}>Server verified</span></div><ul className={styles.guardrails}><li><i>✓</i><span><strong>Manual review required</strong><small>Deposits, transfers, and card applications remain pending until an administrator decides.</small></span></li><li><i>✓</i><span><strong>Managed processing</strong><small>Account balances, cards, and payment methods are managed through this workspace.</small></span></li><li><i>✓</i><span><strong>Audit-friendly workflow</strong><small>The client asks the server to perform a decision; it never calculates or changes balances itself.</small></span></li></ul></Card><SettingsPanel settings={settings} currency={currency} onSaved={onSettingsSaved} /></div>
  </div>;
}

function SettingsPanel({ settings, currency, onSaved }: { settings: RecordValue; currency: string; onSaved: () => Promise<void> }) {
  const [cardFee, setCardFee] = useState(String(readNumber(settings, "cardFee")));
  const [transferFee, setTransferFee] = useState(String(readNumber(settings, "internalTransferServiceCharge")));
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { setCardFee(String(readNumber(settings, "cardFee"))); setTransferFee(String(readNumber(settings, "internalTransferServiceCharge"))); setSelectedCurrency(currency); }, [currency, settings]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    const nextCardFee = Number(cardFee); const nextTransferFee = Number(transferFee);
    if (!Number.isFinite(nextCardFee) || nextCardFee < 0 || !Number.isFinite(nextTransferFee) || nextTransferFee < 0) return setMessage("Enter zero or a positive number for each fee.");
    setBusy(true);
    try { await adminRequest("/api/admin/settings", { method: "POST", body: JSON.stringify({ cardFee: nextCardFee, internalTransferServiceCharge: nextTransferFee, currency: selectedCurrency.toUpperCase() }) }); setMessage("Controls saved."); await onSaved(); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : "The controls could not be saved."); }
    finally { setBusy(false); }
  };
  return <Card className={styles.settingsCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>Configuration</p><h2>Operational controls</h2></div><span className={styles.demoSmall}>MANAGED</span></div><form onSubmit={submit} className={styles.settingsForm}><label>Card fee<div className={styles.inputWithPrefix}><span>{currency}</span><input value={cardFee} onChange={event => setCardFee(event.target.value)} type="number" min="0" step="0.01" /></div></label><label>Internal transfer service charge<div className={styles.inputWithPrefix}><span>{currency}</span><input value={transferFee} onChange={event => setTransferFee(event.target.value)} type="number" min="0" step="0.01" /></div></label><label>Display currency<select value={selectedCurrency} onChange={event => setSelectedCurrency(event.target.value)}><option value="USD">USD</option><option value="NGN">NGN</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></label><button className={styles.primaryButton} disabled={busy}>{busy ? "Saving..." : "Save controls"}</button>{message && <p className={styles.formMessage}>{message}</p>}</form></Card>;
}

function LegacyReviewSection({ kind, title, copy, items, currency, actionKey, notes, setNotes, onDecide }: { kind: "deposits" | "transfers" | "cards"; title: string; copy: string; items: RecordValue[]; currency: string; actionKey: string; notes: Record<string, string>; setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>; onDecide: (kind: "deposits" | "transfers" | "cards", item: RecordValue, action: Decision) => Promise<void> }) {
  const pending = items.filter(item => getStatus(item) === "pending");
  const closed = items.filter(item => getStatus(item) !== "pending");
  return <div className={styles.sectionStack}><section className={styles.sectionHeading}><div><p className={styles.eyebrow}>Review queue</p><h2>{title}</h2><span>{copy}</span></div><div className={styles.queueNumber}><strong>{pending.length}</strong><span>open request{pending.length === 1 ? "" : "s"}</span></div></section><Card className={styles.reviewCard}>{pending.length ? <div className={styles.reviewList}>{pending.map(item => <ReviewItem key={readString(item, "id", "requestId") || JSON.stringify(item)} kind={kind} item={item} currency={currency} note={notes[`${kind}-${readString(item, "id", "requestId")}`] || ""} onNote={value => setNotes(current => ({ ...current, [`${kind}-${readString(item, "id", "requestId")}`]: value }))} actionKey={actionKey} onDecide={onDecide} />)}</div> : <EmptyState title="No pending reviews" copy="New sandbox requests will appear here once a user submits them." />}</Card>{closed.length > 0 && <Card className={styles.historyCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>Recent decisions</p><h2>Previously reviewed</h2></div><span>{closed.length} total</span></div><div className={styles.compactList}>{closed.slice(0, 8).map(item => <div key={readString(item, "id", "requestId") || JSON.stringify(item)}><span><strong>{reviewTitle(kind, item)}</strong><small>{formatDate(item.createdAt || item.updatedAt)}</small></span><b>{formatMoney(readNumber(item, "amount", "total", "fee"), readString(item, "currency") || currency)}</b><Status value={getStatus(item)} /></div>)}</div></Card>}</div>;
}

function ReviewSection({ kind, title, copy, items, currency, actionKey, notes, setNotes, onDecide }: { kind: "deposits" | "transfers" | "cards"; title: string; copy: string; items: RecordValue[]; currency: string; actionKey: string; notes: Record<string, string>; setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>; onDecide: (kind: "deposits" | "transfers" | "cards", item: RecordValue, action: Decision) => Promise<void> }) {
  const pending = items.filter(item => getStatus(item) === "pending");
  return <div className={styles.sectionStack}><section className={styles.sectionHeading}><div><p className={styles.eyebrow}>Review queue</p><h2>{title}</h2><span>{copy}</span></div><div className={styles.queueNumber}><strong>{pending.length}</strong><span>open request{pending.length === 1 ? "" : "s"}</span></div></section><Card className={styles.reviewCard}>{pending.length ? <div className={styles.reviewList}>{pending.map(item => <CleanReviewItem key={readString(item, "id", "requestId")} kind={kind} item={item} currency={currency} note={notes[`${kind}-${readString(item, "id", "requestId")}`] || ""} onNote={value => setNotes(current => ({ ...current, [`${kind}-${readString(item, "id", "requestId")}`]: value }))} actionKey={actionKey} onDecide={onDecide} />)}</div> : <EmptyState title="No pending reviews" copy="New requests will appear here once a user submits them." />}</Card></div>;
}

function CleanReviewItem({ kind, item, currency, note, onNote, actionKey, onDecide }: { kind: "deposits" | "transfers" | "cards"; item: RecordValue; currency: string; note: string; onNote: (value: string) => void; actionKey: string; onDecide: (kind: "deposits" | "transfers" | "cards", item: RecordValue, action: Decision) => Promise<void> }) {
  const id = readString(item, "id", "requestId");
  const title = readString(item, "userName", "accountName", "senderName", "applicantName", "displayName", "email") || "Finova account";
  const amount = formatMoney(readNumber(item, "amount", "total", "requestedAmount"), readString(item, "currency") || currency);
  return <article className={styles.reviewItem}><div className={styles.requestTop}><div><p>{title}</p><small>{readString(item, "email", "userEmail", "senderEmail") || "User account"}</small></div><div className={styles.requestAmount}><strong>{amount}</strong><Status value={getStatus(item)} /></div></div><div className={styles.decisionBox}><label>Review note <span>(optional)</span><textarea value={note} onChange={event => onNote(event.target.value)} placeholder="Add a short decision note" rows={2} /></label><div className={styles.decisionActions}><button className={styles.rejectButton} onClick={() => void onDecide(kind, item, "reject")} disabled={Boolean(actionKey)}>Reject</button><button className={styles.approveButton} onClick={() => void onDecide(kind, item, "approve")} disabled={Boolean(actionKey)}>{actionKey === `${kind}-${id}-approve` ? "Approving..." : "Approve request"}</button></div></div></article>;
}

function reviewTitle(kind: "deposits" | "transfers" | "cards", item: RecordValue) {
  const person = readString(item, "userName", "accountName", "senderName", "applicantName", "displayName", "email") || "Finova account";
  if (kind === "deposits") return `${person} · ${readString(item, "paymentMethodName", "paymentMethod", "method") || "Deposit"}`;
  if (kind === "transfers") return `${person} → ${readString(item, "recipientName", "toName", "recipientEmail") || "Finova account"}`;
  return `${person} · ${readString(item, "cardType", "type") || "Card request"}`;
}

function ReviewItem({ kind, item, currency, note, onNote, actionKey, onDecide }: { kind: "deposits" | "transfers" | "cards"; item: RecordValue; currency: string; note: string; onNote: (value: string) => void; actionKey: string; onDecide: (kind: "deposits" | "transfers" | "cards", item: RecordValue, action: Decision) => Promise<void> }) {
  const id = readString(item, "id", "requestId");
  const hasProof = readString(item, "proofUrl", "proofOfPaymentUrl", "receiptUrl", "proof");
  const amount = readNumber(item, "amount", "total", "requestedAmount");
  const itemCurrency = readString(item, "currency") || currency;
  const metadata = kind === "deposits" ? [["Payment method", readString(item, "paymentMethodName", "paymentMethod", "method") || "Not specified"], ["Reference", readString(item, "reference", "transactionReference", "txHash") || "Not provided"], ["Submitted", formatDate(item.createdAt || item.submittedAt)]] : kind === "transfers" ? [["Recipient", readString(item, "recipientName", "toName", "recipientEmail") || "Not specified"], ["Service charge", formatMoney(readNumber(item, "serviceCharge", "fee"), itemCurrency)], ["Submitted", formatDate(item.createdAt || item.submittedAt)]] : [["Card type", readString(item, "cardType", "type") || "Virtual demo card"], ["Application fee", formatMoney(readNumber(item, "cardFee", "fee"), itemCurrency)], ["Submitted", formatDate(item.createdAt || item.submittedAt)]];
  return <article className={styles.reviewItem}><div className={styles.requestTop}><div className={styles.requestIdentity}><span className={`${styles.requestIcon} ${styles[`request${kind.charAt(0).toUpperCase()}${kind.slice(1)}`]}`} aria-hidden="true">{kind === "deposits" ? "↓" : kind === "transfers" ? "⇄" : "▣"}</span><div><p>{reviewTitle(kind, item)}</p><small>{readString(item, "email", "userEmail", "senderEmail") || "User account"}</small></div></div><div className={styles.requestAmount}><strong>{formatMoney(amount, itemCurrency)}</strong><Status value={getStatus(item)} /></div></div><dl className={styles.requestMeta}>{metadata.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{hasProof && <a className={styles.proofLink} href={hasProof} target="_blank" rel="noreferrer">View submitted proof <span aria-hidden="true">↗</span></a>}<div className={styles.decisionBox}><label>Review note <span>(optional)</span><textarea value={note} onChange={event => onNote(event.target.value)} placeholder="Add a short decision note for this demo request…" rows={2} /></label><div className={styles.decisionActions}><button className={styles.rejectButton} onClick={() => void onDecide(kind, item, "reject")} disabled={Boolean(actionKey)}>Reject</button><button className={styles.approveButton} onClick={() => void onDecide(kind, item, "approve")} disabled={Boolean(actionKey)}>{actionKey === `${kind}-${id}-approve` ? "Approving…" : "Approve request"}</button></div></div></article>;
}

function ManualCredits({ accounts, currency, onChanged }: { accounts: RecordValue[]; currency: string; onChanged: () => Promise<void> }) {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const activeAccounts = accounts.filter(account => readString(account, "status") === "Active");

  useEffect(() => {
    if (!accountId && activeAccounts[0]) setAccountId(readString(activeAccounts[0], "id"));
  }, [accountId, activeAccounts]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!accountId || !Number.isFinite(numericAmount) || numericAmount <= 0 || !reason.trim()) {
      return setMessage("Choose an active account, a positive amount, and a clear credit reason.");
    }
    setBusy(true); setMessage("");
    try {
      await adminRequest("/api/admin/credits", {
        method: "POST",
        body: JSON.stringify({ accountId, amount: numericAmount, reason: reason.trim(), requestKey: crypto.randomUUID().replaceAll("-", "_") }),
      });
      setAmount(""); setReason(""); setMessage("Manual account credit recorded. The account balance and immutable ledger have been updated.");
      await onChanged();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "The manual credit could not be applied.");
    } finally {
      setBusy(false);
    }
  };

  return <div className={styles.sectionStack}><section className={styles.sectionHeading}><div><p className={styles.eyebrow}>Demo balance controls</p><h2>Manual account credit</h2><span>Use this only for the sandbox demonstration. Each server-approved credit writes an auditable ledger entry; it does not move real money.</span></div></section><div className={styles.methodsLayout}><Card className={styles.methodFormCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>Administrator action</p><h2>Credit a demo account</h2></div><span className={styles.demoSmall}>SANDBOX</span></div><form className={styles.methodForm} onSubmit={submit}><label>Account<select value={accountId} onChange={event => setAccountId(event.target.value)} required><option value="" disabled>Select an active account</option>{activeAccounts.map(account => { const id = readString(account, "id"); return <option value={id} key={id}>{readString(account, "name") || "Finova account"} · {readString(account, "number")} · {formatMoney(readNumber(account, "availableBalance"), readString(account, "currency") || currency)}</option>; })}</select></label><label>Credit amount<div className={styles.inputWithPrefix}><span>{currency}</span><input value={amount} onChange={event => setAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" /></div></label><label>Reason<textarea value={reason} onChange={event => setReason(event.target.value)} placeholder="e.g. Demo seed credit for walkthrough" rows={4} maxLength={300} /></label><button className={styles.primaryButton} disabled={busy || !activeAccounts.length}>{busy ? "Applying…" : "Apply demo credit"}</button>{message && <p className={styles.formMessage}>{message}</p>}</form></Card><Card className={styles.controlCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>Safeguard</p><h2>What this does</h2></div></div><ul className={styles.guardrails}><li><i>✓</i><span><strong>Server-only balance change</strong><small>The browser sends a request; the protected server validates and applies it atomically.</small></span></li><li><i>✓</i><span><strong>Reason required</strong><small>The selected amount and reason are written to the audit trail and the account ledger.</small></span></li><li><i>✓</i><span><strong>Demo only</strong><small>No connected bank, crypto, or card processor is involved in this credit.</small></span></li></ul></Card></div></div>;
}

function LegacyPaymentMethods({ methods, onChanged, currency }: { methods: RecordValue[]; onChanged: () => Promise<void>; currency: string }) {
  const [draft, setDraft] = useState<PaymentMethodDraft>(blankMethod);
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const update = <K extends keyof PaymentMethodDraft>(key: K, value: PaymentMethodDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const reset = () => { setEditingId(""); setDraft(blankMethod); setMessage(""); };
  const startEdit = (method: RecordValue) => {
    setEditingId(readString(method, "id"));
    setDraft({ name: readString(method, "name") || "", type: (readString(method, "type") || "crypto") as PaymentMethodDraft["type"], instructions: readString(method, "instructions") || "", addressOrLink: readString(method, "addressOrLink", "address", "link") || "", enabled: readBoolean(method, "enabled", "active") });
    setMessage("");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.instructions.trim() || !draft.addressOrLink.trim()) return setMessage("Name, instructions, and a wallet address or payment link are required.");
    setBusy("save"); setMessage("");
    try {
      const path = editingId ? `/api/admin/payment-methods/${encodeURIComponent(editingId)}` : "/api/admin/payment-methods";
      await adminRequest(path, { method: editingId ? "PATCH" : "POST", body: JSON.stringify({ ...draft, name: draft.name.trim(), instructions: draft.instructions.trim(), addressOrLink: draft.addressOrLink.trim() }) });
      setMessage(editingId ? "Payment method updated." : "Payment method added.");
      reset();
      await onChanged();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "The payment method could not be saved.");
    } finally {
      setBusy("");
    }
  };
  const remove = async (method: RecordValue) => {
    const id = readString(method, "id");
    if (!id) return setMessage("This payment method is missing its server identifier.");
    setBusy(`delete-${id}`); setMessage("");
    try {
      await adminRequest(`/api/admin/payment-methods/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (editingId === id) reset();
      await onChanged();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "The payment method could not be removed.");
    } finally { setBusy(""); }
  };

  return <div className={styles.sectionStack}><section className={styles.sectionHeading}><div><p className={styles.eyebrow}>Deposit destinations</p><h2>Payment methods</h2><span>Configure the demo payment details users see when they create a pending deposit. Never enter a live settlement destination in this sandbox.</span></div><div className={styles.queueNumber}><strong>{methods.filter(method => readBoolean(method, "enabled", "active")).length}</strong><span>enabled method{methods.filter(method => readBoolean(method, "enabled", "active")).length === 1 ? "" : "s"}</span></div></section><div className={styles.methodsLayout}><Card className={styles.methodFormCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>{editingId ? "Editing destination" : "New destination"}</p><h2>{editingId ? "Update payment method" : "Add payment method"}</h2></div>{editingId && <button className={styles.textButton} onClick={reset}>Cancel</button>}</div><form className={styles.methodForm} onSubmit={submit}><label>Method name<input value={draft.name} onChange={event => update("name", event.target.value)} placeholder="e.g. USDT (TRC20)" maxLength={80} /></label><label>Method type<select value={draft.type} onChange={event => update("type", event.target.value as PaymentMethodDraft["type"])}><option value="crypto">Crypto</option><option value="bank">Bank details</option><option value="wallet">Payment wallet</option><option value="card">Card payment</option></select></label><label>Wallet address or payment link<input value={draft.addressOrLink} onChange={event => update("addressOrLink", event.target.value)} placeholder="Destination shown to demo users" maxLength={300} /></label><label>Instructions<textarea value={draft.instructions} onChange={event => update("instructions", event.target.value)} placeholder="Give clear sandbox payment instructions…" rows={4} maxLength={600} /></label><label className={styles.checkLabel}><input type="checkbox" checked={draft.enabled} onChange={event => update("enabled", event.target.checked)} /><span><strong>Enable this method</strong><small>Visible to users making a demo deposit.</small></span></label><button className={styles.primaryButton} disabled={Boolean(busy)}>{busy === "save" ? "Saving…" : editingId ? "Save payment method" : "Add payment method"}</button>{message && <p className={styles.formMessage}>{message}</p>}</form></Card><Card className={styles.methodListCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>Available to users</p><h2>Configured methods</h2></div><span>{methods.length} total</span></div>{methods.length ? <div className={styles.methodsList}>{methods.map(method => { const id = readString(method, "id"); const enabled = readBoolean(method, "enabled", "active"); return <article key={id || JSON.stringify(method)}><div className={styles.methodIcon}>{readString(method, "type").slice(0, 1).toUpperCase() || "P"}</div><div className={styles.methodDetails}><div><strong>{readString(method, "name") || "Unnamed payment method"}</strong><Status value={enabled ? "enabled" : "disabled"} /></div><span>{readString(method, "type") || "payment method"} · {readString(method, "addressOrLink", "address", "link") || "No destination"}</span><small>{readString(method, "instructions") || "No instructions added."}</small></div><div className={styles.methodActions}><button onClick={() => startEdit(method)}>Edit</button><button className={styles.deleteButton} onClick={() => void remove(method)} disabled={busy === `delete-${id}`}>{busy === `delete-${id}` ? "…" : "Remove"}</button></div></article>; })}</div> : <EmptyState title="No payment methods configured" copy={`Add a ${currency} demo payment destination before users can submit a deposit request.`} />}</Card></div></div>;
}

function PaymentMethods({ methods, onChanged, currency }: { methods: RecordValue[]; onChanged: () => Promise<void>; currency: string }) {
  const [draft, setDraft] = useState<PaymentMethodDraft>(blankMethod);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const update = <K extends keyof PaymentMethodDraft>(key: K, value: PaymentMethodDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const updateDetail = (key: string, value: string) => setDetails(current => ({ ...current, [key]: value }));
  const field = (key: string, label: string, placeholder: string, type = "text") => <label>{label}<input required type={type} value={details[key] || ""} onChange={event => updateDetail(key, event.target.value)} placeholder={placeholder} /></label>;
  const fields = draft.type === "bank"
    ? <>{field("holder", "Account holder name", "Account holder name")}{field("bank", "Bank name", "Bank name")}{field("number", "Account number / IBAN", "Account number or IBAN")}{field("routing", "Routing number / SWIFT code", "Routing number or SWIFT code")}{field("country", "Bank country", "Country")}</>
    : draft.type === "crypto"
      ? <>{field("asset", "Asset", "e.g. USDT")}{field("network", "Network", "e.g. TRC20 or ERC20")}{field("address", "Wallet address", "Paste the receiving wallet address")}</>
      : draft.type === "wallet"
        ? <>{field("provider", "Wallet provider", "e.g. PayPal, Cash App, Skrill")}{field("holder", "Account holder name", "Account holder name")}{field("identifier", "Wallet email, phone, or ID", "Wallet account identifier")}</>
        : <>{field("provider", "Payment provider", "e.g. Stripe, Paystack, Flutterwave")}{field("merchant", "Merchant or account name", "Merchant name")}{field("link", "Secure payment link", "https://")}</>;
  const destination = () => {
    if (draft.type === "bank") return `${details.holder} | ${details.bank} | ${details.number} | ${details.routing} | ${details.country}`;
    if (draft.type === "crypto") return `${details.asset} on ${details.network}: ${details.address}`;
    if (draft.type === "wallet") return `${details.provider}: ${details.holder} | ${details.identifier}`;
    return `${details.provider}: ${details.merchant} | ${details.link}`;
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    if (!draft.name.trim() || !draft.instructions.trim() || Object.values(details).some(value => !value.trim())) return setMessage("Complete each required payment detail before saving.");
    setBusy(true);
    try { await adminRequest("/api/admin/payment-methods", { method: "POST", body: JSON.stringify({ ...draft, name: draft.name.trim(), instructions: draft.instructions.trim(), addressOrLink: destination() }) }); setDraft(blankMethod); setDetails({}); setMessage("Payment method added."); await onChanged(); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : "The payment method could not be saved."); }
    finally { setBusy(false); }
  };
  return <div className={styles.sectionStack}><section className={styles.sectionHeading}><div><p className={styles.eyebrow}>Deposit destinations</p><h2>Payment methods</h2><span>Add the destination information appropriate to each payment type.</span></div><div className={styles.queueNumber}><strong>{methods.filter(method => readBoolean(method, "enabled", "active")).length}</strong><span>enabled methods</span></div></section><div className={styles.methodsLayout}><Card className={styles.methodFormCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>New destination</p><h2>Add payment method</h2></div></div><form className={styles.methodForm} onSubmit={submit}><label>Method name<input required value={draft.name} onChange={event => update("name", event.target.value)} placeholder="e.g. USDT wallet" maxLength={80} /></label><label>Method type<select value={draft.type} onChange={event => { update("type", event.target.value as PaymentMethodDraft["type"]); setDetails({}); }}><option value="crypto">Crypto</option><option value="bank">Bank transfer</option><option value="wallet">Payment wallet</option><option value="card">Card payment link</option></select></label><div className={styles.methodDetailsFields}>{fields}</div><label>Customer instructions<textarea required value={draft.instructions} onChange={event => update("instructions", event.target.value)} placeholder="Explain how the customer should complete the payment." rows={4} maxLength={600} /></label><label className={styles.checkLabel}><input type="checkbox" checked={draft.enabled} onChange={event => update("enabled", event.target.checked)} /><span><strong>Enable this method</strong><small>Available for new deposit requests.</small></span></label><button className={styles.primaryButton} disabled={busy}>{busy ? "Saving..." : "Add payment method"}</button>{message && <p className={styles.formMessage}>{message}</p>}</form></Card><Card className={styles.methodListCard}><div className={styles.cardHeading}><div><p className={styles.eyebrow}>Available to customers</p><h2>Configured methods</h2></div><span>{methods.length} total</span></div>{methods.length ? <div className={styles.methodsList}>{methods.map(method => <article key={readString(method, "id") || JSON.stringify(method)}><div className={styles.methodIcon}>{readString(method, "type").slice(0, 1).toUpperCase() || "P"}</div><div className={styles.methodDetails}><div><strong>{readString(method, "name") || "Unnamed payment method"}</strong><Status value={readBoolean(method, "enabled", "active") ? "enabled" : "disabled"} /></div><span>{readString(method, "type") || "payment method"}</span><small>{readString(method, "instructions") || "No instructions added."}</small></div></article>)}</div> : <EmptyState title="No payment methods configured" copy={`Add a ${currency} payment destination to begin.`} />}</Card></div></div>;
}
