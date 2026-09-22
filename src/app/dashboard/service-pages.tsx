"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  createTransfer,
  money,
  quoteTransfer,
  updateWorkspace,
  useWorkspace,
  verifyTransactionPin,
  type Account,
  type TransferQuote,
} from "./workspace-store";
import s from "./subpages.module.css";

const href = (path: string) => `/dashboard/${path}`;

function I({ name }: { name: string }) { return <i aria-hidden="true" className={`fa-solid fa-${name}`} />; }

function Heading({ title, description, icon, children }: { title: string; description: string; icon: string; children?: ReactNode }) {
  return <div className={s.heading}><div><h1><span><I name={icon} /></span>{title}</h1><p>{description}</p></div>{children}</div>;
}

function Panel({ children, className = "", title }: { children: ReactNode; className?: string; title?: string }) {
  return <section className={`${s.panel} ${className}`}>{title && <h2>{title}</h2>}{children}</section>;
}

function Actions({ children }: { children: ReactNode }) { return <div className={s.actions}>{children}</div>; }

function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "error" | "warning" }) {
  const icon = tone === "success" ? "circle-check" : tone === "error" ? "circle-exclamation" : tone === "warning" ? "triangle-exclamation" : "circle-info";
  return <div className={`${s.note} ${tone === "info" ? "" : s[tone]}`}><I name={icon} /><div>{children}</div></div>;
}

function accountById(accounts: Account[], id: string) { return accounts.find(account => account.id === id) || accounts[0]; }

function PinField({ value, onChange, account }: { value: string; onChange: (value: string) => void; account?: Account }) {
  if (!account?.pinConfigured) {
    return <Notice tone="warning"><strong>Set a transaction PIN first.</strong> Each Finova account uses its own PIN to approve transfers and payment requests. <Link href={href("transaction-pin")}>Set your PIN</Link></Notice>;
  }
  return <label className={s.field}>Transaction PIN <b>*</b><input aria-label="Transaction PIN" value={value} onChange={event => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))} type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{4,6}" placeholder="Enter 4–6 digit PIN" required /></label>;
}

async function saveDraft(kind: string, description: string) {
  const saved = await updateWorkspace(current => ({
    ...current,
    drafts: [{ id: crypto.randomUUID(), kind, description, date: new Date().toISOString() }, ...current.drafts].slice(0, 60),
  }));
  if (!saved) throw new Error("We could not save your request. Please try again.");
}

function AccountChoices({ accounts, value, onChange }: { accounts: Account[]; value: string; onChange: (value: string) => void }) {
  return <label className={s.field}>Pay from <b>*</b><select value={value} onChange={event => onChange(event.target.value)}>{accounts.map(account => <option value={account.id} key={account.id}>{account.name} · {account.number} · {money(account.availableBalance, account.currency)}</option>)}</select></label>;
}

type LocalReview = {
  account: Account;
  amount: number;
  recipient: string;
  accountNumber: string;
  bank: string;
  reference: string;
  quote?: TransferQuote;
};

function LocalTransfer() {
  const workspace = useWorkspace();
  const accounts = workspace.accounts;
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [bank, setBank] = useState("Finova Bank");
  const [recipient, setRecipient] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [pin, setPin] = useState("");
  const [review, setReview] = useState<LocalReview | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const account = accountById(accounts, accountId);
  const saved = workspace.beneficiaries.slice(0, 5);

  const reviewTransfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    if (!account) return setMessage("Select an account to continue.");
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setMessage("Enter a valid transfer amount.");
    if (parsedAmount > account.availableBalance) return setMessage("The amount is above your available balance.");
    setBusy(true);
    try {
      const normalizedNumber = accountNumber.trim().toUpperCase();
      const quote = bank === "Finova Bank" ? await quoteTransfer({ accountId: account.id, recipientAccountNumber: normalizedNumber, amount: parsedAmount }) : undefined;
      setReview({ account, amount: parsedAmount, recipient: recipient.trim() || (quote?.recipientName || "Recipient"), accountNumber: normalizedNumber, bank, reference: reference.trim(), quote });
    } catch (error) { setMessage(error instanceof Error ? error.message : "We could not review that transfer."); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    if (!review || !account?.pinConfigured) return;
    setMessage(""); setBusy(true);
    try {
      if (review.quote) {
        await createTransfer({ accountId: review.account.id, recipientAccountNumber: review.accountNumber, amount: review.amount, description: review.reference, transactionPin: pin });
      } else {
        await verifyTransactionPin({ accountId: review.account.id, pin });
        await saveDraft("Local transfer", `${money(review.amount, review.account.currency)} to ${review.recipient} at ${review.bank} · ${review.accountNumber}`);
      }
      setMessage("Your transfer request has been submitted securely.");
      setReview(null); setAmount(""); setRecipient(""); setAccountNumber(""); setReference(""); setPin("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "We could not submit the transfer."); }
    finally { setBusy(false); }
  };

  if (!accounts.length) return <><Heading title="Local Transfer" description="Send money to a local account" icon="paper-plane" /><Panel><Notice tone="warning">Open an account before creating a transfer.</Notice></Panel></>;

  return <><Heading title="Local Transfer" description="Send money to any local account securely" icon="paper-plane" /><section className={s.formCard}><div className={`${s.hero} ${s.serviceHero}`}><h2><I name="paper-plane" /> Local Transfer</h2><p>Review your recipient details and authorize each transfer with your account PIN.</p><div className={s.heroStats}><span>Time<strong>Instant</strong></span><span>Fee<strong>{money(workspace.settings.internalTransferServiceCharge, account?.currency || "USD")}</strong></span><span>Network<strong>All Local</strong></span></div></div><div className={s.formBody}>
    {!review ? <form onSubmit={reviewTransfer}><div className={s.sectionHeader}><h3>Quick transfer</h3><Link href={href("beneficiaries")}>Manage beneficiaries</Link></div>{saved.length > 0 && <div className={s.recipients}>{saved.map(item => <button type="button" key={item.id} onClick={() => { setRecipient(item.name); setAccountNumber(item.account); setBank(item.bank || "Finova Bank"); }}><span>{item.name.slice(0, 2).toUpperCase()}</span>{item.name}</button>)}</div>}<AccountChoices accounts={accounts} value={accountId} onChange={setAccountId} /><div className={s.balanceBox}><span><I name="building-columns" /> Available balance</span><strong>{money(account?.availableBalance || 0, account?.currency)}</strong><small><I name="circle" /> Ready for transfer</small></div><div className={s.formGrid}><label className={s.field}>Recipient name <b>*</b><input value={recipient} onChange={event => setRecipient(event.target.value)} required placeholder="Full name" /></label><label className={s.field}>Bank <b>*</b><select value={bank} onChange={event => setBank(event.target.value)}><option>Finova Bank</option><option>Access Bank</option><option>GTBank</option><option>FirstBank</option><option>Zenith Bank</option><option>Other local bank</option></select></label><label className={s.field}>Account number <b>*</b><input value={accountNumber} onChange={event => setAccountNumber(event.target.value)} required placeholder={bank === "Finova Bank" ? "FV1234567890" : "Account number"} /></label><label className={s.field}>Reference <input value={reference} onChange={event => setReference(event.target.value)} placeholder="Optional note" maxLength={120} /></label></div><label className={s.field}>Transfer amount ({account?.currency}) <b>*</b><div className={s.amount}><span>{account?.currency}</span><input value={amount} onChange={event => setAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" required /></div></label><div className={s.chips}>{[50, 100, 250, 500].map(value => <button key={value} type="button" onClick={() => setAmount(String(value))}>{money(value, account?.currency)}</button>)}</div>{message && <Notice tone="error">{message}</Notice>}<Actions><button className={s.primary} disabled={busy || !account?.pinConfigured}>{busy ? "Reviewing…" : "Review transfer"}</button><Link className={s.secondary} href={href("transaction-pin")}>Manage PIN</Link></Actions></form> : <div className={s.reviewCard}><h3>Confirm transfer</h3><dl className={s.summary}><div><dt>Recipient</dt><dd>{review.recipient}</dd></div><div><dt>Bank</dt><dd>{review.bank}</dd></div><div><dt>Account number</dt><dd>{review.accountNumber}</dd></div><div><dt>Amount</dt><dd>{money(review.amount, review.account.currency)}</dd></div><div><dt>Service charge</dt><dd>{money(review.quote?.serviceCharge || 0, review.account.currency)}</dd></div><div><dt>Total</dt><dd>{money(review.quote?.total || review.amount, review.account.currency)}</dd></div></dl><PinField account={review.account} value={pin} onChange={setPin} />{message && <Notice tone={message.startsWith("Your") ? "success" : "error"}>{message}</Notice>}<Actions><button className={s.primary} onClick={() => void submit()} disabled={busy || !pin || !review.account.pinConfigured}>{busy ? "Authorizing…" : "Confirm with PIN"}</button><button className={s.secondary} onClick={() => { setReview(null); setPin(""); }}>Edit details</button></Actions></div>}</div></section></>;
}

const internationalMethods = [
  ["building-columns", "Wire Transfer", "Transfer to an international bank account."],
  ["coins", "Cryptocurrency", "Send funds to a cryptocurrency wallet."],
  ["wallet", "PayPal", "Transfer to your PayPal account."],
  ["globe", "Wise Transfer", "Transfer internationally with transparent fees."],
  ["dollar-sign", "Cash App", "Quick transfers to your Cash App account."],
  ["ellipsis", "More Options", "Zelle, Venmo, Revolut, and more."],
] as const;

function InternationalTransfer() {
  const workspace = useWorkspace();
  const accounts = workspace.accounts;
  const [method, setMethod] = useState<(typeof internationalMethods)[number] | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [recipient, setRecipient] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const account = accountById(accounts, accountId);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    const parsedAmount = Number(amount);
    if (!method || !account || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return setMessage("Complete the transfer details to continue.");
    if (parsedAmount > account.availableBalance) return setMessage("The amount is above your available balance.");
    setBusy(true);
    try {
      await verifyTransactionPin({ accountId: account.id, pin });
      await saveDraft("International transfer", `${method[1]} · ${money(parsedAmount, account.currency)} to ${recipient.trim()} · ${destination.trim()}${reference.trim() ? ` · ${reference.trim()}` : ""}`);
      setMessage("Your international transfer request has been submitted securely."); setRecipient(""); setDestination(""); setAmount(""); setReference(""); setPin("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "We could not submit your transfer request."); }
    finally { setBusy(false); }
  };
  if (!method) return <><Heading title="International Transfer" description="Send money worldwide with multiple payment methods" icon="globe" /><Panel><h2>Select Transfer Method</h2><div className={s.methodGrid}>{internationalMethods.map(item => <button key={item[1]} onClick={() => setMethod(item)}><span><I name={item[0]} /></span><strong>{item[1]}</strong><p>{item[2]}</p><I name="chevron-right" /></button>)}</div></Panel><Notice><strong>Secure transaction.</strong> Check recipient details carefully and never share your transaction PIN with anyone.</Notice></>;
  return <><Heading title={method[1]} description="Complete the details for your international transfer" icon={method[0]}><button className={s.secondary} onClick={() => setMethod(null)}>Change method</button></Heading><section className={s.formCard}><div className={`${s.hero} ${s.serviceHero}`}><h2><I name={method[0]} /> {method[1]}</h2><p>{method[2]} Every request is protected by the PIN for the selected account.</p><div className={s.heroStats}><span>Protection<strong>PIN verified</strong></span><span>Tracking<strong>In account activity</strong></span><span>Support<strong>Always available</strong></span></div></div><div className={s.formBody}><form onSubmit={submit}><AccountChoices accounts={accounts} value={accountId} onChange={setAccountId} /><div className={s.formGrid}><label className={s.field}>Recipient name <b>*</b><input value={recipient} onChange={event => setRecipient(event.target.value)} placeholder="Full legal name" required /></label><label className={s.field}>{method[1] === "Cryptocurrency" ? "Wallet address" : "Destination details"} <b>*</b><input value={destination} onChange={event => setDestination(event.target.value)} placeholder={method[1] === "Cryptocurrency" ? "Wallet address" : "Account, email, or payment ID"} required /></label><label className={s.field}>Amount ({account?.currency}) <b>*</b><input value={amount} onChange={event => setAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" required /></label><label className={s.field}>Reference <input value={reference} onChange={event => setReference(event.target.value)} placeholder="Optional reference" /></label></div><PinField account={account} value={pin} onChange={setPin} />{message && <Notice tone={message.startsWith("Your") ? "success" : "error"}>{message}</Notice>}<Actions><button className={s.primary} disabled={busy || !account?.pinConfigured}>{busy ? "Authorizing…" : "Submit transfer request"}</button><button type="button" className={s.secondary} onClick={() => setMethod(null)}>Back</button></Actions></form></div></section></>;
}

const rates: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1530 };

function CurrencySwap() {
  const workspace = useWorkspace();
  const accounts = workspace.accounts;
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const account = accountById(accounts, accountId);
  const [from, setFrom] = useState(account?.currency || "USD");
  const [to, setTo] = useState(from === "USD" ? "EUR" : "USD");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const parsedAmount = Number(amount) || 0;
  const converted = parsedAmount ? parsedAmount / rates[from] * rates[to] : 0;
  const swap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    if (!account || !parsedAmount || from === to) return setMessage("Choose different currencies and enter an amount.");
    if (parsedAmount > account.availableBalance) return setMessage("The amount is above your available balance.");
    setBusy(true);
    try {
      await verifyTransactionPin({ accountId: account.id, pin });
      await saveDraft("Currency exchange", `${money(parsedAmount, from)} → ${money(converted, to)} · rate 1 ${from} = ${(rates[to] / rates[from]).toFixed(4)} ${to}`);
      setMessage("Your exchange request has been submitted securely."); setAmount(""); setPin("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "We could not submit the exchange request."); }
    finally { setBusy(false); }
  };
  return <><Heading title="Currency Swap" description="Exchange currencies at a transparent rate" icon="arrow-right-arrow-left" /><Panel className={s.narrow}><div className={s.hero}><h2><I name="arrow-right-arrow-left" /> Currency exchange</h2><p>Review the conversion before authorizing your exchange with the selected account PIN.</p></div><form onSubmit={swap}><AccountChoices accounts={accounts} value={accountId} onChange={id => { setAccountId(id); const next = accountById(accounts, id); setFrom(next?.currency || "USD"); }} /><div className={s.swapRow}><label className={s.field}>You send<select value={from} onChange={event => setFrom(event.target.value)}>{Object.keys(rates).map(code => <option key={code}>{code}</option>)}</select></label><button type="button" className={s.exchangeArrow} aria-label="Swap currencies" onClick={() => { const previous = from; setFrom(to); setTo(previous); }}><I name="arrow-right-arrow-left" /></button><label className={s.field}>You receive<select value={to} onChange={event => setTo(event.target.value)}>{Object.keys(rates).map(code => <option key={code}>{code}</option>)}</select></label></div><label className={s.field}>Amount <b>*</b><div className={s.amount}><span>{from}</span><input value={amount} onChange={event => setAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" required /></div></label><div className={s.rateCard}><span>Indicative exchange rate</span><strong>1 {from} = {(rates[to] / rates[from]).toFixed(4)} {to}</strong><p>You will receive <b>{money(converted, to)}</b></p></div><PinField account={account} value={pin} onChange={setPin} />{message && <Notice tone={message.startsWith("Your") ? "success" : "error"}>{message}</Notice>}<Actions><button className={s.primary} disabled={busy || from === to || !account?.pinConfigured}>{busy ? "Authorizing…" : "Confirm exchange"}</button></Actions></form></Panel></>;
}

const loanOptions = [
  ["Personal loan", "Flexible borrowing for your plans", "Up to $25,000", "From 8.9% APR"],
  ["Auto loan", "Finance your next vehicle", "Up to $75,000", "From 6.4% APR"],
  ["Home improvement", "Make your space work harder", "Up to $50,000", "From 7.2% APR"],
] as const;

function Loans() {
  const [selected, setSelected] = useState<(typeof loanOptions)[number] | null>(null);
  const [message, setMessage] = useState("");
  const apply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected) return; const form = new FormData(event.currentTarget);
    try { await saveDraft("Loan application", `${selected[0]} · ${form.get("amount")} requested over ${form.get("term")} months`); setMessage("Your loan application has been received. We will update you after review."); event.currentTarget.reset(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "We could not save your application."); }
  };
  return <><Heading title="Loans" description="Find flexible financing built around your goals" icon="hand-holding-dollar" /><div className={s.productGrid}>{loanOptions.map(option => <article className={`${s.productCard} ${selected?.[0] === option[0] ? s.selectedProduct : ""}`} key={option[0]}><span><I name="landmark" /></span><h2>{option[0]}</h2><p>{option[1]}</p><div><strong>{option[2]}</strong><small>{option[3]}</small></div><button className={s.secondary} onClick={() => { setSelected(option); setMessage(""); }}>View options</button></article>)}</div>{selected && <Panel className={s.narrow} title={`Apply for a ${selected[0]}`}><form onSubmit={apply}><div className={s.formGrid}><label className={s.field}>Requested amount <b>*</b><input name="amount" type="number" min="100" step="100" placeholder="0.00" required /></label><label className={s.field}>Repayment term <b>*</b><select name="term" defaultValue="36"><option value="12">12 months</option><option value="24">24 months</option><option value="36">36 months</option><option value="48">48 months</option><option value="60">60 months</option></select></label><label className={s.field}>Employment status <b>*</b><select name="employment" defaultValue="Employed"><option>Employed</option><option>Self-employed</option><option>Retired</option><option>Student</option></select></label><label className={s.field}>Monthly income <b>*</b><input name="income" type="number" min="0" step="100" placeholder="0.00" required /></label></div><Notice>Submitting an application does not affect your credit score. A lending specialist will review your information and follow up securely.</Notice>{message && <Notice tone={message.startsWith("Your") ? "success" : "error"}>{message}</Notice>}<Actions><button className={s.primary}>Submit application</button><button type="button" className={s.secondary} onClick={() => setSelected(null)}>Cancel</button></Actions></form></Panel>}</>;
}

function TaxRefund({ section }: { section: string }) {
  const [message, setMessage] = useState("");
  const [tracking, setTracking] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try { await saveDraft("Tax refund", `Refund filing for ${data.get("year")} · ${data.get("amount") || "amount to be confirmed"}`); setMessage("Your refund request has been received. A confirmation will appear in your account activity."); event.currentTarget.reset(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "We could not save your request."); }
  };
  if (section.endsWith("track")) return <><Heading title="Track Tax Refund" description="Check the latest status of your refund request" icon="magnifying-glass" /><Panel className={s.narrow}><label className={s.field}>Confirmation or filing ID<input value={tracking} onChange={event => setTracking(event.target.value)} placeholder="Enter your confirmation ID" /></label>{tracking && <div className={s.statusCard}><span><I name="clock" /></span><div><small>Current status</small><h2>Processing</h2><p>Your refund request is in review. We will notify you when there is an update.</p></div></div>}<Actions><Link className={s.secondary} href={href("irs-refund")}>Back to tax refunds</Link></Actions></Panel></>;
  return <><Heading title="Tax Refund" description="Submit and track your refund request in one place" icon="receipt" /><div className={s.two}><Panel><h2>File a refund request</h2><form onSubmit={submit}><div className={s.formGrid}><label className={s.field}>Tax year <b>*</b><select name="year" defaultValue="2025"><option>2025</option><option>2024</option><option>2023</option></select></label><label className={s.field}>Expected refund <input name="amount" type="number" min="0" step="0.01" placeholder="0.00" /></label></div><label className={s.field}>Filing reference <b>*</b><input name="reference" placeholder="Filing or tax ID" required /></label><label className={s.check}><input type="checkbox" required /> I confirm these details are accurate.</label>{message && <Notice tone={message.startsWith("Your") ? "success" : "error"}>{message}</Notice>}<Actions><button className={s.primary}>Submit refund request</button></Actions></form></Panel><Panel><h2>Refund timeline</h2><ol className={s.timeline}><li><span><I name="circle-check" /></span><div><strong>Request submitted</strong><small>We securely receive your filing details.</small></div></li><li><span><I name="file-circle-check" /></span><div><strong>Review in progress</strong><small>Your information is reviewed for completeness.</small></div></li><li><span><I name="building-columns" /></span><div><strong>Refund issued</strong><small>We notify you when your request is complete.</small></div></li></ol><Actions><Link className={s.secondary} href={href("irs-refund/track")}>Track a request</Link></Actions></Panel></div></>;
}

const grantOptions = [
  ["Small business growth", "Funding support for qualifying business expansion", "$5,000 – $50,000"],
  ["Education opportunity", "Support for training and professional development", "$1,000 – $15,000"],
  ["Community impact", "Funding for local projects with measurable outcomes", "$2,500 – $30,000"],
] as const;

function Grants({ section }: { section: string }) {
  const [selected, setSelected] = useState<(typeof grantOptions)[number] | null>(null);
  const [message, setMessage] = useState("");
  const apply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected) return; const form = new FormData(event.currentTarget);
    try { await saveDraft("Grant application", `${selected[0]} · ${form.get("amount")} requested · ${String(form.get("purpose") || "").slice(0, 120)}`); setMessage("Your grant application has been submitted. We will notify you when its status changes."); event.currentTarget.reset(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "We could not submit your application."); }
  };
  const applications = useWorkspace().drafts.filter(item => item.kind === "Grant application");
  if (section.endsWith("my-applications")) return <><Heading title="My Grant Applications" description="Review the applications you have submitted" icon="file-lines" /><Panel>{applications.length ? <div className={s.requestList}>{applications.map(item => <article key={item.id}><span><I name="file-circle-check" /></span><div><strong>{item.kind}</strong><p>{item.description}</p><small>{new Date(item.date).toLocaleDateString()}</small></div><b className={s.badge}>Submitted</b></article>)}</div> : <div className={s.empty}><span><I name="file-lines" /></span><h3>No applications yet</h3><p>Choose a grant opportunity to begin an application.</p></div>}<Actions><Link className={s.primary} href={href("grant-application")}>Explore grants</Link></Actions></Panel></>;
  return <><Heading title="Grants" description="Explore funding opportunities designed for your next step" icon="seedling"><Link className={s.secondary} href={href("grant-application/my-applications")}>My applications</Link></Heading><div className={s.productGrid}>{grantOptions.map(option => <article className={`${s.productCard} ${selected?.[0] === option[0] ? s.selectedProduct : ""}`} key={option[0]}><span><I name="handshake" /></span><h2>{option[0]}</h2><p>{option[1]}</p><div><strong>{option[2]}</strong><small>Funding range</small></div><button className={s.secondary} onClick={() => { setSelected(option); setMessage(""); }}>Apply now</button></article>)}</div>{selected && <Panel className={s.narrow} title={`Apply: ${selected[0]}`}><form onSubmit={apply}><div className={s.formGrid}><label className={s.field}>Applicant name <b>*</b><input name="name" required placeholder="Full name or organization" /></label><label className={s.field}>Requested funding <b>*</b><input name="amount" required type="number" min="100" step="100" placeholder="0.00" /></label></div><label className={s.field}>How will you use this funding? <b>*</b><textarea name="purpose" required maxLength={1000} placeholder="Tell us about the outcome you plan to achieve." /></label><label className={s.check}><input type="checkbox" required /> I confirm that the information in this application is complete and accurate.</label>{message && <Notice tone={message.startsWith("Your") ? "success" : "error"}>{message}</Notice>}<Actions><button className={s.primary}>Submit application</button><button type="button" className={s.secondary} onClick={() => setSelected(null)}>Cancel</button></Actions></form></Panel>}</>;
}

export default function ServicePages({ section }: { section: string }) {
  const root = section.split("/")[0];
  if (root === "localtransfer") return <LocalTransfer />;
  if (root === "internationaltransfer") return <InternationalTransfer />;
  if (root === "swap") return <CurrencySwap />;
  if (root === "loan") return <Loans />;
  if (root === "irs-refund") return <TaxRefund section={section} />;
  if (root === "grant-application") return <Grants section={section} />;
  return null;
}
