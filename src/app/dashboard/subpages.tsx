"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification, updatePassword, updateProfile } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import {
  applyForCard,
  createDeposit,
  createTransfer,
  dateLabel,
  money,
  quoteTransfer,
  setTransactionPin,
  updateWorkspace,
  uploadDepositProof,
  useDashboardSession,
  useWorkspace,
  type Account,
  type Beneficiary,
  type Card,
  type Transaction,
  type Workspace,
} from "./workspace-store";
import s from "./subpages.module.css";
import countries from "./countries.json";
import ServicePages from "./service-pages";

const href = (path: string) => `/dashboard/${path}`;

function I({ name }: { name: string }) { return <i aria-hidden="true" className={`fa-solid fa-${name}`} />; }
function cleanPresentationCopy(value?: string) { return value?.replace(/\bdemo\b/gi, "").replace(/\bsandbox\b/gi, "").replace(/\s{2,}/g, " ").trim(); }
function Heading({ title, description, icon = "building-columns", children }: { title: string; description?: string; icon?: string; children?: ReactNode }) { return <div className={s.heading}><div><h1><span><I name={icon} /></span>{cleanPresentationCopy(title)}</h1>{description && <p>{cleanPresentationCopy(description)}</p>}</div>{children}</div>; }
function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) { return <section className={`${s.panel} ${className}`}>{title && <h2>{title}</h2>}{children}</section>; }
function Buttons({ children }: { children: ReactNode }) { return <div className={s.actions}>{children}</div>; }
function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "error" | "warning" }) { return <div className={`${s.note} ${tone === "info" ? "" : s[tone]}`} role="status"><I name={tone === "success" ? "circle-check" : tone === "error" ? "circle-exclamation" : tone === "warning" ? "triangle-exclamation" : "circle-info"} /><div>{children}</div></div>; }
function Empty({ title, text, icon = "inbox" }: { title: string; text?: string; icon?: string }) { return <div className={s.empty}><span><I name={icon} /></span><h3>{title}</h3>{text && <p>{text}</p>}</div>; }
function Field({ label, name, type = "text", required = true, options, defaultValue, placeholder, min, max, step, readOnly = false }: { label: string; name: string; type?: "text" | "email" | "password" | "number" | "tel" | "textarea"; required?: boolean; options?: string[]; defaultValue?: string; placeholder?: string; min?: number; max?: number; step?: number; readOnly?: boolean }) {
  return <label className={s.field}>{label}{required && !readOnly && <b> *</b>}{options ? <select name={name} defaultValue={defaultValue || ""} required={required} disabled={readOnly}>{!defaultValue && <option value="" disabled>Select {label.toLowerCase()}</option>}{options.map(option => <option value={option} key={option}>{option}</option>)}</select> : type === "textarea" ? <textarea name={name} defaultValue={defaultValue} required={required} placeholder={placeholder} readOnly={readOnly} /> : <input name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder || label} min={min} max={max} step={step} readOnly={readOnly} autoComplete={type === "password" ? "off" : undefined} />}</label>;
}
function values(form: HTMLFormElement) { return Object.fromEntries(new FormData(form).entries()) as Record<string, string>; }
function accountOf(workspace: Workspace) { return workspace.accounts[0]; }
function currencyOf(workspace: Workspace) { return accountOf(workspace)?.currency || workspace.settings.currency || "USD"; }
function apiMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
function DemoNotice() { return null; }

export default function Subpages({ section }: { section: string }) {
  const root = section.split("/")[0];
  return <div className={s.pages} key={section}>
    {root === "accounthistory" ? <Transactions /> :
      ["localtransfer", "internationaltransfer", "swap", "loan", "irs-refund", "grant-application"].includes(root) ? <ServicePages section={section} /> :
      root === "deposits" ? <Deposits /> :
      root === "cards" ? <Cards section={section} /> :
      root === "beneficiaries" ? <Beneficiaries /> :
      root === "notifications" ? <Notifications /> :
      ["account-settings", "editpass", "manage-account-security", "transaction-pin"].includes(root) ? <Settings section={root} /> :
      root === "support" ? <Support /> :
      <UnavailableService root={root} />}
  </div>;
}

function Transactions() {
  const workspace = useWorkspace();
  const currency = currencyOf(workspace);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const rows = workspace.transactions.filter(item => (!status || item.status === status) && (!search || `${item.id} ${item.description} ${item.type}`.toLowerCase().includes(search.toLowerCase()))).sort((left, right) => right.date.localeCompare(left.date));
  const exportRows = () => {
    const csv = ["Reference,Amount,Type,Status,Description,Date", ...rows.map(item => [item.id, item.amount, item.type, item.status, item.description, item.date].map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "finova-activity.csv"; link.click(); URL.revokeObjectURL(url);
  };
  return <><Heading title="Account Activity" description="Server-recorded demo requests and approved ledger activity" icon="chart-line"><Buttons><button className={s.secondary} onClick={exportRows}><I name="download" /> Export</button></Buttons></Heading><Panel><div className={s.toolbar}><input aria-label="Search activity" placeholder="Search reference or description" value={search} onChange={event => setSearch(event.target.value)} /><span>{rows.length} entries</span></div><div className={s.tabs}>{["", "Submitted", "Pending", "Completed", "Rejected"].map(option => <button key={option || "all"} className={status === option ? s.activeTab : ""} onClick={() => setStatus(option)}>{option || "All activity"}</button>)}</div>{rows.length ? <div className={s.tableWrap}><table><thead><tr><th>Amount</th><th>Type</th><th>Status</th><th>Reference</th><th>Description</th><th>Date</th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td><strong>{item.type === "Debit" ? "−" : "+"}{money(item.amount, currency)}</strong></td><td>{item.type}</td><td><span className={`${s.badge} ${item.status === "Completed" ? s.green : item.status === "Rejected" ? s.red : s.amber}`}>{item.status}</span></td><td>{item.id}</td><td>{item.description || "—"}</td><td>{dateLabel(item.date)}</td></tr>)}</tbody></table></div> : <Empty title="No activity yet" text="Approved credits and submitted demo requests appear here." icon="receipt" />}</Panel><DemoNotice /></>;
}

function accountOptions(accounts: Account[]) { return accounts.map(account => `${account.id}|${account.name} · ${account.number}`); }
function selectedAccount(workspace: Workspace, encoded: string) { return workspace.accounts.find(account => account.id === encoded.split("|")[0]) || accountOf(workspace); }

function InternalTransfer() {
  const workspace = useWorkspace();
  const accounts = workspace.accounts;
  const currency = currencyOf(workspace);
  const [quote, setQuote] = useState<Awaited<ReturnType<typeof quoteTransfer>> | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [description, setDescription] = useState("");
  const requestQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(""); setQuote(null); setBusy(true);
    try {
      const next = await quoteTransfer({ accountId, recipientAccountNumber: recipient.trim().toUpperCase(), amount: Number(amount) });
      setQuote(next);
    } catch (error) { setMessage(apiMessage(error, "We could not calculate this transfer.")); }
    finally { setBusy(false); }
  };
  const submit = async () => {
    if (!quote) return;
    setBusy(true); setMessage("");
    try {
      await createTransfer({ accountId: quote.senderAccountId, recipientAccountNumber: quote.recipientAccountNumber, amount: quote.amount, description });
      setQuote(null); setAmount(""); setRecipient(""); setDescription(""); setMessage("Your Finova-to-Finova transfer is pending administrator approval. The service charge is reserved until a decision is made.");
    } catch (error) { setMessage(apiMessage(error, "We could not submit this transfer.")); }
    finally { setBusy(false); }
  };
  const saved = workspace.beneficiaries.filter(item => item.method === "Finova Transfer");
  return <><Heading title="Finova Transfer" description="Send only between Finova demo accounts" icon="paper-plane" /><section className={s.formCard}><div className={s.hero}><h2><I name="paper-plane" /> Internal demo transfer</h2><p>External bank and wallet transfers are not available. The server calculates the fixed service charge and reserves the total while an admin reviews it.</p><div className={s.heroStats}><span>Network<strong>Finova only</strong></span><span>Approval<strong>Manual review</strong></span><span>Settlement<strong>Demo ledger</strong></span></div></div><div className={s.formBody}><form onSubmit={requestQuote}><div className={s.formGrid}><label className={s.field}>From account <b>*</b><select value={accountId} onChange={event => setAccountId(event.target.value)} required>{accounts.map(account => <option key={account.id} value={account.id}>{account.name} · {account.number}</option>)}</select></label><label className={s.field}>Recipient Finova account number <b>*</b><input value={recipient} onChange={event => setRecipient(event.target.value)} required placeholder="FV1234567890" autoCapitalize="characters" /></label><label className={s.field}>Amount ({currency}) <b>*</b><input type="number" min="0.01" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" /></label><label className={s.field}>Reference / memo<input value={description} onChange={event => setDescription(event.target.value)} placeholder="Optional note" maxLength={300} /></label></div>{saved.length > 0 && <div className={s.recipients}>{saved.map(item => <button type="button" key={item.id} onClick={() => setRecipient(item.account)}><span>{item.name.slice(0, 2).toUpperCase()}</span>{item.name}</button>)}</div>}{message && <Note tone={message.startsWith("Your") ? "success" : "error"}>{message}</Note>}<Buttons><button className={s.primary} disabled={busy || !accounts.length}>{busy ? "Checking…" : "Review service charge"}</button><Link href={href("beneficiaries")} className={s.secondary}>Manage recipients</Link></Buttons></form></div></section>{quote && <Panel title="Transfer review" className={s.narrow}><Summary values={{ Recipient: `${quote.recipientName} · ${quote.recipientAccountNumber}`, Amount: money(quote.amount, quote.currency), "Service charge": money(quote.serviceCharge, quote.currency), "Total reserved": money(quote.total, quote.currency), "Available before": money(quote.availableBalance, quote.currency), Status: "Pending administrator approval" }} /><DemoNotice /><Buttons><button className={s.primary} disabled={busy} onClick={() => void submit()}>{busy ? "Submitting…" : "Submit internal transfer"}</button><button className={s.secondary} onClick={() => setQuote(null)}>Edit</button></Buttons></Panel>}</>;
}

function Deposits() {
  const workspace = useWorkspace();
  const accounts = workspace.accounts;
  const currency = currencyOf(workspace);
  const [methodId, setMethodId] = useState(workspace.paymentMethods[0]?.id || "");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [proofs, setProofs] = useState<Record<string, File | undefined>>({});
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const deposit = await createDeposit({ accountId, paymentMethodId: methodId, amount: Number(amount), reference });
      setAmount(""); setReference(""); setMessage(`Deposit request ${deposit.id} created. Follow the shown instructions, then upload proof for administrator review.`);
    } catch (error) { setMessage(apiMessage(error, "We could not create this deposit request.")); }
    finally { setBusy(false); }
  };
  const submitProof = async (depositId: string) => {
    const file = proofs[depositId];
    if (!file) return setMessage("Choose a payment proof before submitting it.");
    setBusy(true); setMessage("");
    try { await uploadDepositProof(depositId, file); setMessage("Payment proof submitted. Your demo balance will not change until an administrator approves it."); }
    catch (error) { setMessage(apiMessage(error, "We could not upload that proof.")); }
    finally { setBusy(false); }
  };
  const awaitingProof = workspace.deposits.filter(item => item.status === "awaiting_proof");
  return <><Heading title="Fund your account" description="Create a payment request and submit proof for review" icon="circle-plus" /><Panel className={s.narrow}><div className={s.hero}><h2>Manual demo funding</h2><p>Methods below are configured by your administrator. Finova does not connect to a bank, crypto wallet, or card processor; no balance changes until manual approval.</p></div>{workspace.paymentMethods.length ? <form onSubmit={create}><div className={s.formGrid}><label className={s.field}>Deposit method <b>*</b><select value={methodId} onChange={event => setMethodId(event.target.value)}>{workspace.paymentMethods.map(method => <option value={method.id} key={method.id}>{method.name}</option>)}</select></label><label className={s.field}>Credit account <b>*</b><select value={accountId} onChange={event => setAccountId(event.target.value)}>{accounts.map(account => <option value={account.id} key={account.id}>{account.name} · {account.number}</option>)}</select></label><label className={s.field}>Amount ({currency}) <b>*</b><input type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} required placeholder="0.00" /></label><label className={s.field}>Reference / transaction ID<input value={reference} onChange={event => setReference(event.target.value)} maxLength={120} placeholder="Optional reference" /></label></div>{message && <Note tone={message.startsWith("Deposit request") || message.startsWith("Payment proof") ? "success" : "error"}>{message}</Note>}<Buttons><button className={s.primary} disabled={busy}>{busy ? "Saving…" : "Create deposit request"}</button></Buttons></form> : <Empty title="No funding method is available" text="Ask your Finova administrator to add a sandbox payment method." icon="wallet" />}</Panel>{awaitingProof.length > 0 && <Panel title="Awaiting your payment proof">{awaitingProof.map(deposit => <article key={deposit.id} className={s.noticeRow}><span className={s.roundIcon}><I name="receipt" /></span><div><h3>{deposit.paymentMethodName} · {money(deposit.amount, deposit.currency)}</h3><p>{deposit.instructions}</p>{deposit.addressOrLink && <p><strong>Payment details:</strong> {deposit.addressOrLink}</p>}<small>Created {dateLabel(deposit.createdAt)} · {deposit.id}</small><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={event => setProofs(current => ({ ...current, [deposit.id]: event.target.files?.[0] }))} /></div><Buttons><button className={s.primary} disabled={busy} onClick={() => void submitProof(deposit.id)}>Submit proof</button></Buttons></article>)}</Panel>}<DepositHistory /><DemoNotice /></>;
}

function DepositHistory() {
  const workspace = useWorkspace();
  const rows = workspace.deposits.filter(item => item.status !== "awaiting_proof");
  if (!rows.length) return null;
  return <Panel title="Deposit requests">{rows.map(item => <article key={item.id} className={s.noticeRow}><span className={s.roundIcon}><I name="arrow-down" /></span><div><h3>{item.paymentMethodName} · {money(item.amount, item.currency)}</h3><p>{item.status === "pending" ? "Proof submitted and awaiting administrator review." : item.reviewNote || `Request ${item.status}.`}</p><small>{dateLabel(item.createdAt)} · {item.id}</small></div><span className={`${s.badge} ${item.status === "approved" ? s.green : item.status === "rejected" ? s.red : s.amber}`}>{item.status.replaceAll("_", " ")}</span></article>)}</Panel>;
}

function Cards({ section }: { section: string }) {
  const workspace = useWorkspace();
  const { user } = useDashboardSession();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const id = section.split("/")[1];
  const detail = workspace.cards.find(card => card.id === id);
  const apply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage(""); setBusy(true);
    const data = values(event.currentTarget);
    try {
      await applyForCard({ accountId: data.accountId, cardType: data.cardType, level: data.level, holder: data.holder, dailyLimit: Number(data.dailyLimit) });
      setMessage("Your demo-card application is now pending administrator approval. The fixed fee is charged only if the request is approved.");
      event.currentTarget.reset();
    } catch (error) { setMessage(apiMessage(error, "We could not submit the card application.")); }
    finally { setBusy(false); }
  };
  if (detail) return <><Heading title="Demo Card Details" description="This virtual card is a visual demonstration only" icon="credit-card"><Link href={href("cards")}>Back to cards</Link></Heading><Panel><div className={s.cardDetail}><Plastic card={detail} /><div><h2>Card information</h2><Summary values={{ Type: detail.type, Level: detail.level, Currency: detail.currency, "Daily limit": money(detail.limit, detail.currency), Status: detail.status, Network: "Demo only — no external payment rail" }} /><DemoNotice /></div></div></Panel></>;
  if (section === "cards/apply") return <><Heading title="Request a demo card" description="An administrator reviews and issues non-network demo cards" icon="credit-card"><Link href={href("cards")}>Back to cards</Link></Heading><Panel className={s.narrow}><form onSubmit={apply}><div className={s.formGrid}><label className={s.field}>Debit account <b>*</b><select name="accountId" required>{workspace.accounts.map(account => <option key={account.id} value={account.id}>{account.name} · {account.number}</option>)}</select></label><Field label="Card type" name="cardType" options={["Visa", "Mastercard", "American Express"]} defaultValue="Visa" /><Field label="Card level" name="level" options={["Standard", "Gold", "Platinum", "Black"]} defaultValue="Standard" /><Field label="Daily demo limit" name="dailyLimit" type="number" min={1} max={1000000} step={0.01} defaultValue="1000" /><Field label="Cardholder name" name="holder" defaultValue={user?.displayName || workspace.profile.displayName} /></div><Note>The fixed demo-card fee is <strong>{money(workspace.settings.cardFee, currencyOf(workspace))}</strong>. It is calculated by the server and charged only if an administrator approves this request. Issued cards cannot make external payments.</Note>{message && <Note tone={message.startsWith("Your") ? "success" : "error"}>{message}</Note>}<Buttons><button className={s.primary} disabled={busy}>{busy ? "Submitting…" : "Submit application"}</button></Buttons></form></Panel></>;
  return <><Heading title="Demo Cards" description="Admin-approved virtual cards for the sandbox" icon="credit-card"><Link className={s.primary} href={href("cards/apply")}>Request a card</Link></Heading><Panel>{workspace.cards.length ? <div className={s.cardGrid}>{workspace.cards.map(card => <article className={s.cardListing} key={card.id}><div className={s.sectionHeader}><span className={s.badge}>Demo only</span><small>{card.level}</small></div><Plastic card={card} /><Summary values={{ Currency: card.currency, "Daily limit": money(card.limit, card.currency), Status: card.status }} /><Link className={s.secondary} href={href(`cards/${card.id}`)}>View details</Link></article>)}</div> : <Empty title="No issued demo cards" text="Request a card, then wait for an administrator to approve it and charge the fixed demo fee." icon="credit-card" />}</Panel>{workspace.cardApplications.length > 0 && <Panel title="Card applications">{workspace.cardApplications.map(item => <article className={s.noticeRow} key={item.id}><span className={s.roundIcon}><I name="credit-card" /></span><div><h3>{item.cardType} · {item.level}</h3><p>Fixed fee: {money(item.cardFee, item.currency)}. {item.reviewNote || "Awaiting administrator review."}</p><small>{dateLabel(item.createdAt)}</small></div><span className={`${s.badge} ${item.status === "approved" ? s.green : item.status === "rejected" ? s.red : s.amber}`}>{item.status}</span></article>)}</Panel>}<DemoNotice /></>;
}

function Plastic({ card }: { card: Card }) { return <div className={`${s.plastic} ${card.level === "Gold" ? s.gold : card.level === "Black" ? s.black : ""}`}><div><strong>Finova</strong><b>VIRTUAL</b></div><small>Virtual card</small><span className={s.chip}><I name="microchip" /></span><strong className={s.cardDigits}>•••• •••• •••• {card.number || "0000"}</strong><footer><span>CARD HOLDER<strong>{card.holder}</strong></span><span>VALID<strong>{card.expiry || "12/29"}</strong></span></footer></div>; }
function Summary({ values }: { values: Record<string, string> }) { return <dl className={s.summary}>{Object.entries(values).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>; }

function Beneficiaries() {
  const workspace = useWorkspace();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = values(event.currentTarget);
    const saved = await updateWorkspace(current => ({ ...current, beneficiaries: [{ id: crypto.randomUUID(), name: data.name.trim(), account: data.account.trim().toUpperCase(), bank: "Finova", method: "Finova Transfer", favorite: data.favorite === "on" }, ...current.beneficiaries] }));
    if (saved) { setAdding(false); setMessage("Recipient saved for internal Finova transfers."); } else setMessage("We could not save that recipient.");
  };
  const remove = async (recipient: Beneficiary) => { await updateWorkspace(current => ({ ...current, beneficiaries: current.beneficiaries.filter(item => item.id !== recipient.id) })); };
  return <><Heading title="Internal recipients" description="Saved Finova-to-Finova transfer recipients" icon="users"><button className={s.primary} onClick={() => setAdding(true)}>Add recipient</button></Heading><Panel>{message && <Note tone={message.startsWith("Recipient") ? "success" : "error"}>{message}</Note>}{workspace.beneficiaries.length ? <div className={s.cardGrid}>{workspace.beneficiaries.map(item => <article className={s.beneficiaryCard} key={item.id}><span className={s.roundIcon}>{item.name.slice(0, 2).toUpperCase()}</span><h3>{item.name}</h3><p>Finova account: {item.account}</p><small>{item.favorite ? "Favourite recipient" : "Internal recipient"}</small><Buttons><Link className={s.primary} href={href("localtransfer")}>Transfer</Link><button className={s.danger} onClick={() => void remove(item)}>Delete</button></Buttons></article>)}</div> : <Empty title="No saved recipients" text="Add a Finova account number to send an internal demo transfer more quickly." icon="users" />}</Panel>{adding && <Panel title="Add internal recipient" className={s.narrow}><form onSubmit={save}><Field label="Recipient name" name="name" /><Field label="Finova account number" name="account" placeholder="FV1234567890" /><label className={s.check}><input type="checkbox" name="favorite" /> Add to favourites</label><Buttons><button className={s.primary}>Save recipient</button><button type="button" className={s.secondary} onClick={() => setAdding(false)}>Cancel</button></Buttons></form></Panel>}</>;
}

function Notifications() {
  const workspace = useWorkspace();
  const mutate = (change: (items: Workspace["notices"]) => Workspace["notices"]) => { void updateWorkspace(current => ({ ...current, notices: change(current.notices) })); };
  return <><Heading title="Notifications" description="Your saved Finova updates" icon="bell"><Buttons><button className={s.secondary} onClick={() => mutate(items => items.map(item => ({ ...item, read: true })))}>Mark all read</button></Buttons></Heading><Panel>{workspace.notices.length ? workspace.notices.map(item => <article className={`${s.noticeRow} ${!item.read ? s.unread : ""}`} key={item.id}><span className={s.roundIcon}><I name="bell" /></span><div><h3>{item.title}</h3><p>{item.message}</p><small>{dateLabel(item.date)}</small></div>{!item.read && <button className={s.textButton} onClick={() => mutate(items => items.map(row => row.id === item.id ? { ...row, read: true } : row))}>Mark read</button>}</article>) : <Empty title="You are all caught up" text="Approved request updates will appear in account activity." icon="bell" />}</Panel></>;
}

function Settings({ section }: { section: string }) {
  const { user, workspace } = useDashboardSession();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const profile = workspace.profile;
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = values(event.currentTarget); const displayName = [data.firstName, data.lastName].filter(Boolean).join(" ") || profile.displayName;
    const saved = await updateWorkspace(current => ({ ...current, profile: { ...current.profile, displayName, firstName: data.firstName, lastName: data.lastName, username: data.username, phone: data.phone, country: data.country } }));
    if (!saved) return setError("We could not save your profile.");
    if (user) await updateProfile(user, { displayName }).catch(() => undefined);
    setError(""); setMessage("Your Finova profile has been saved.");
  };
  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!user?.email) return setError("Sign in again before changing your password."); const data = values(event.currentTarget);
    if (data.newPassword !== data.confirmPassword) return setError("New passwords do not match.");
    try { await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, data.currentPassword)); await updatePassword(user, data.newPassword); setError(""); setMessage("Your password has been changed."); event.currentTarget.reset(); }
    catch { setError("We could not change your password. Confirm your current password and try again."); }
  };
  if (section === "editpass") return <><Heading title="Password" description="Update your Firebase sign-in password" icon="lock" /><Panel className={s.narrow}><form onSubmit={changePassword}><Field label="Current password" name="currentPassword" type="password" /><Field label="New password" name="newPassword" type="password" /><Field label="Confirm new password" name="confirmPassword" type="password" />{error && <Note tone="error">{error}</Note>}{message && <Note tone="success">{message}</Note>}<Buttons><button className={s.primary}>Change password</button></Buttons></form></Panel></>;
  if (section === "manage-account-security") return <><Heading title="Email security" description="Verify your contact email" icon="shield-halved" /><Panel className={s.narrow}><h2>{user?.emailVerified ? "Email verified" : "Email verification"}</h2><p>{user?.emailVerified ? "Your sign-in email is verified." : `Verify ${profile.email} to improve account recovery.`}</p>{!user?.emailVerified && <Buttons><button className={s.primary} onClick={() => void sendEmailVerification(user!).then(() => setMessage("A verification email has been sent.")).catch(() => setError("We could not send a verification email."))}>Send verification email</button></Buttons>}{error && <Note tone="error">{error}</Note>}{message && <Note tone="success">{message}</Note>}</Panel></>;
  if (section === "transaction-pin") return <TransactionPinSettings />;
  return <><Heading title="Profile settings" description="Manage your Finova account profile" icon="gear" /><Panel className={s.narrow}><form onSubmit={saveProfile}><div className={s.formGrid}><Field label="First name" name="firstName" defaultValue={profile.firstName} /><Field label="Last name" name="lastName" defaultValue={profile.lastName} /><Field label="Username" name="username" required={false} defaultValue={profile.username} /><Field label="Email address" name="email" defaultValue={profile.email} readOnly /><Field label="Phone number" name="phone" required={false} defaultValue={profile.phone} /><Field label="Country" name="country" required={false} options={countries as string[]} defaultValue={profile.country} /></div>{error && <Note tone="error">{error}</Note>}{message && <Note tone="success">{message}</Note>}<Buttons><button className={s.primary}>Save profile</button><Link className={s.secondary} href={href("editpass")}>Password</Link></Buttons></form></Panel></>;
}

function TransactionPinSettings() {
  const workspace = useWorkspace();
  const accounts = workspace.accounts;
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const account = accounts.find(item => item.id === accountId) || accounts[0];
  const digits = (value: string) => value.replace(/\D/g, "").slice(0, 6);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    if (!account) return;
    if (!/^\d{4,6}$/.test(nextPin)) return setMessage("Your new PIN must contain 4 to 6 digits.");
    if (nextPin !== confirmPin) return setMessage("The new PIN entries do not match.");
    setBusy(true);
    try {
      await setTransactionPin({ accountId: account.id, pin: nextPin, currentPin: account.pinConfigured ? currentPin : undefined });
      setCurrentPin(""); setNextPin(""); setConfirmPin(""); setMessage(account.pinConfigured ? "Your transaction PIN has been updated." : "Your transaction PIN is ready to use.");
    } catch (error) { setMessage(apiMessage(error, "We could not save your transaction PIN.")); }
    finally { setBusy(false); }
  };
  return <><Heading title="Transaction PIN" description="Set a unique PIN for each Finova account" icon="key" /><Panel className={s.narrow}><div className={s.securityIcon}><I name="shield-halved" /></div><h2>{account?.pinConfigured ? "Update your transaction PIN" : "Secure your account with a transaction PIN"}</h2><p>Enter this PIN whenever you authorize a transfer or payment request. It is separate from your sign-in password.</p>{accounts.length > 1 && <label className={s.field}>Account<select value={accountId} onChange={event => { setAccountId(event.target.value); setCurrentPin(""); setNextPin(""); setConfirmPin(""); setMessage(""); }}>{accounts.map(item => <option value={item.id} key={item.id}>{item.name} · {item.number}</option>)}</select></label>}<form onSubmit={submit}>{account?.pinConfigured && <label className={s.field}>Current PIN <b>*</b><input value={currentPin} onChange={event => setCurrentPin(digits(event.target.value))} type="password" inputMode="numeric" autoComplete="off" placeholder="Enter current PIN" required /></label>}<label className={s.field}>New PIN <b>*</b><input value={nextPin} onChange={event => setNextPin(digits(event.target.value))} type="password" inputMode="numeric" autoComplete="new-password" placeholder="Choose 4–6 digits" required /></label><label className={s.field}>Confirm new PIN <b>*</b><input value={confirmPin} onChange={event => setConfirmPin(digits(event.target.value))} type="password" inputMode="numeric" autoComplete="new-password" placeholder="Re-enter new PIN" required /></label>{message && <Note tone={message.startsWith("Your") ? "success" : "error"}>{message}</Note>}<Buttons><button className={s.primary} disabled={busy}>{busy ? "Saving…" : account?.pinConfigured ? "Update PIN" : "Set transaction PIN"}</button><Link className={s.secondary} href={href("localtransfer")}>Make a transfer</Link></Buttons></form></Panel></>;
}

function Support() {
  const workspace = useWorkspace();
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = values(event.currentTarget);
    const saved = await updateWorkspace(current => ({ ...current, tickets: [{ id: crypto.randomUUID(), subject: data.subject.trim().slice(0, 120), priority: data.priority, message: data.message.trim().slice(0, 1000), date: new Date().toISOString() }, ...current.tickets] }));
    if (saved) { event.currentTarget.reset(); setMessage("Your support ticket was saved to your Finova profile."); } else setMessage("We could not save that ticket.");
  };
  return <><Heading title="Support" description="Send an account support request" icon="headset" /><div className={s.supportGrid}><Panel title="Submit a ticket"><form onSubmit={submit}><Field label="Subject" name="subject" /><Field label="Priority" name="priority" options={["Low", "Medium", "High"]} defaultValue="Low" /><Field label="How can we help?" name="message" type="textarea" />{message && <Note tone={message.startsWith("Your") ? "success" : "error"}>{message}</Note>}<Buttons><button className={s.primary}>Submit ticket</button></Buttons></form></Panel><Panel title="Demo support"><DemoNotice /><p>For payment or transfer requests, include the request reference from your account activity. Support cannot settle external bank transactions.</p></Panel></div>{workspace.tickets.length > 0 && <Panel title="Your tickets">{workspace.tickets.map(ticket => <article className={s.noticeRow} key={ticket.id}><span className={s.roundIcon}><I name="headset" /></span><div><h3>{ticket.subject}</h3><p>{ticket.message}</p><small>{ticket.priority} priority · {dateLabel(ticket.date)}</small></div><span className={s.badge}>Open</span></article>)}</Panel>}</>;
}

function ExternalTransfersUnavailable() { return <><Heading title="External transfers" description="Bank, wallet, and international transfers are disabled" icon="globe" /><Panel className={s.narrow}><Empty title="External banking is not connected" text="Finova currently supports only administrator-reviewed transfers between Finova demo accounts. No bank, international, crypto-wallet, or card settlement is available." icon="ban" /><Buttons><Link className={s.primary} href={href("localtransfer")}>Make a Finova transfer</Link></Buttons></Panel><DemoNotice /></>;
}

function UnavailableService({ root }: { root: string }) {
  const title = root === "swap" ? "Currency swap" : root === "pay-bills" ? "Bill payment" : root === "request" ? "Request money" : "Service";
  return <><Heading title={title} description="This service is not enabled in the Finova demo" icon="ban" /><Panel className={s.narrow}><Empty title="Not available yet" text="This sandbox does not connect to external providers or banking rails. Use internal Finova transfers, funding requests, and demo-card applications instead." icon="ban" /><Buttons><Link className={s.primary} href="/dashboard">Return to dashboard</Link></Buttons></Panel><DemoNotice /></>;
}
