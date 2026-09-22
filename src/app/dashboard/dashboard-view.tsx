"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import Subpages from "./subpages";
import { destinations } from "./routes";
import { createAccount, dateLabel, money, updateWorkspace, useDashboardSession, verifyTransactionPin, type Workspace } from "./workspace-store";
import s from "./dashboard.module.css";

const groups = [
  { title: "MAIN", items: [["house", "Dashboard"], ["chart-line", "Transactions"], ["credit-card", "Cards"]] },
  { title: "TRANSFERS & PAYMENTS", items: [["paper-plane", "Local Transfer"], ["globe", "International"], ["plus", "Deposit"], ["arrow-right-arrow-left", "Currency Swap"]] },
  { title: "SERVICES", items: [["hand-holding-dollar", "Loans"], ["receipt", "Tax Refund"], ["seedling", "Grants"]] },
  { title: "ACCOUNT", items: [["gear", "Settings"], ["headset", "Support"]] },
] as const;

function Icon({ name }: { name: string }) { return <i aria-hidden="true" className={`fa-solid fa-${name}`} />; }
function initials(name: string) { return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "F"; }
function maskedNumber(number?: string) { return number ? `•••••• ${number.slice(-4)}` : "Not assigned"; }
function Avatar({ name, photoURL, className = "" }: { name: string; photoURL?: string; className?: string }) {
  return <span className={`${s.avatar} ${className}`}>{photoURL && <img src={photoURL} alt="" onError={event => { event.currentTarget.style.display = "none"; }} />}<span>{initials(name)}</span></span>;
}

export default function Dashboard({ section = "" }: { section?: string }) {
  const router = useRouter();
  const { user, workspace, ready, syncing, error } = useDashboardSession();
  const [menu, setMenu] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [modal, setModal] = useState("");
  const [opening, setOpening] = useState(false);
  const [verifiedAccountIds, setVerifiedAccountIds] = useState<string[]>([]);
  const [loginPin, setLoginPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [isAdministrator, setIsAdministrator] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pinDialog = useRef<HTMLDialogElement>(null);
  const primaryAccount = workspace.accounts[0];
  const needsSignInPin = Boolean(ready && user && primaryAccount && !verifiedAccountIds.includes(primaryAccount.id) && (primaryAccount.pinConfigured || section !== "transaction-pin"));

  useEffect(() => {
    if (ready && !user) router.replace("/banking?mode=login");
  }, [ready, router, user]);
  useEffect(() => { if (modal) dialog.current?.showModal(); else dialog.current?.close(); }, [modal]);
  useEffect(() => { if (needsSignInPin) pinDialog.current?.showModal(); else pinDialog.current?.close(); }, [needsSignInPin]);
  useEffect(() => {
    let active = true;
    if (!user) { setIsAdministrator(false); return () => { active = false; }; }
    void user.getIdToken().then(token => fetch("/api/demo/admin-access", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }))
      .then(response => { if (active) setIsAdministrator(response.ok); })
      .catch(() => { if (active) setIsAdministrator(false); });
    return () => { active = false; };
  }, [user]);

  if (!ready) return <main className={s.loading}>Loading your Finova account…</main>;
  if (!user) return <main className={s.loading}>Taking you to secure sign in…</main>;

  const profile = workspace.profile;
  const account = workspace.accounts[0];
  const currency = account?.currency || "USD";
  const activeTransactions = workspace.transactions.filter(transaction => transaction.status !== "Rejected");
  const now = new Date();
  const thisMonth = activeTransactions.filter(transaction => {
    const date = new Date(transaction.date);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const monthlyDeposits = thisMonth.filter(transaction => transaction.type === "Credit").reduce((total, transaction) => total + transaction.amount, 0);
  const monthlyExpenses = thisMonth.filter(transaction => transaction.type === "Debit").reduce((total, transaction) => total + transaction.amount, 0);
  const totalVolume = activeTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const pendingTransactions = activeTransactions.filter(transaction => ["Pending", "Submitted"].includes(transaction.status)).reduce((total, transaction) => total + transaction.amount, 0);
  const totalBalance = workspace.accounts.reduce((total, item) => total + item.balance, 0);
  const unread = workspace.notices.filter(notice => !notice.read).length;
  const dark = workspace.dark;
  const setDark = (value: boolean) => { void updateWorkspace(current => ({ ...current, dark: value })); };
  const open = (title: string) => {
    setMenu(false);
    const route = destinations[title];
    if (route !== undefined) { router.push("/dashboard" + (route ? `/${route}` : "")); return; }
    setModal(title);
  };
  const selected = (label: string) => label === "Dashboard" ? !section : label === "Settings" ? ["account-settings", "editpass", "manage-account-security", "transaction-pin"].includes(section) : section.split("/")[0] === destinations[label];
  const openAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpening(true);
    const data = new FormData(event.currentTarget);
    const saved = await createAccount(String(data.get("type") || "Savings Account"), String(data.get("currency") || currency));
    setOpening(false);
    if (saved) setModal("Account opening submitted");
  };
  const verifySignInPin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!primaryAccount) return;
    setPinError(""); setPinBusy(true);
    try {
      await verifyTransactionPin({ accountId: primaryAccount.id, pin: loginPin });
      setVerifiedAccountIds(current => [...current, primaryAccount.id]);
      setLoginPin("");
    } catch (caught) { setPinError(caught instanceof Error ? caught.message : "We could not verify your transaction PIN."); }
    finally { setPinBusy(false); }
  };

  return <div className={`${s.shell} ${dark ? s.dark : ""}`}>
    {menu && <button className={s.scrim} aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <aside className={`${s.sidebar} ${menu ? s.open : ""}`}>
      <Link href="/dashboard" className={s.logo}><img src="/finova-bank-logo-cropped.png" alt="Finova Bank" /></Link>
      <nav className={s.navigation} aria-label="Banking navigation">
        {groups.map(group => <section key={group.title}><h2>{group.title}</h2>{group.items.map(([icon, label]) => <button key={label} className={selected(label) ? s.selected : ""} onClick={() => open(label)}><span className={s.navIcon}><Icon name={icon} /></span><span>{label}</span>{selected(label) && <span className={s.selectedDot} />}</button>)}</section>)}
      </nav>
      <div className={s.profileDock}><div className={s.profileCard}><div className={s.onlineAvatar}><Avatar name={profile.displayName} photoURL={profile.photoURL} /><b /></div><div><strong>{profile.displayName}</strong><span>{profile.email}</span></div>{isAdministrator && <Link className={s.adminConsole} href="/admin?access=finova" aria-label="Open Admin Console"><Icon name="user-shield" /></Link>}<button aria-label="Sign out" onClick={() => { void signOut(firebaseAuth).then(() => router.replace("/banking?mode=login")).catch(() => setModal("Sign-out unavailable")); }}><Icon name="right-from-bracket" /></button></div></div>
    </aside>
    <div className={s.workspace}>
      <header className={s.header}><button className={s.mobileMenu} aria-label="Open navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon name="bars" /></button><div className={s.heading}><h1>Dashboard</h1><p>Welcome back, {profile.firstName || profile.displayName}</p></div><div className={s.headerActions}><button aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => setDark(!dark)}><Icon name={dark ? "sun" : "moon"} /></button><button aria-label="Notifications" onClick={() => open("Notifications")}><Icon name="bell" />{unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}</button><button className={s.userMenu} onClick={() => open("Account Information")}><Avatar name={profile.displayName} photoURL={profile.photoURL} /><span><strong>{profile.displayName}</strong><small>{profile.email}</small></span><Icon name="chevron-down" /></button></div></header>
      <main className={s.content}>
        {error && <div className={s.syncError} role="alert"><Icon name="circle-exclamation" /> {error}</div>}
        {syncing && <div className={s.syncStatus}><Icon name="arrows-rotate" /> Saving your changes…</div>}
        {!account?.pinConfigured && <div className={s.securityPrompt}><span><Icon name="shield-halved" /></span><div><strong>Secure your account</strong><p>Set a transaction PIN for {account?.name || "this account"} before making payments or transfers.</p></div><button onClick={() => router.push("/dashboard/transaction-pin")}>Set PIN <Icon name="arrow-right" /></button></div>}
        {section ? <Subpages section={section} /> : <>
          <div className={s.metrics}>{[
            ["credit-card", "blue", "Available", money(account?.availableBalance || 0, currency), "Available Balance"],
            ["arrow-down", "green", "This Month", money(monthlyDeposits, currency), "Deposits Submitted"],
            ["arrow-up", "red", "This Month", money(monthlyExpenses, currency), "Transfers Submitted"],
            ["chart-line", "pink", "All Time", money(totalVolume, currency), "Total Activity"],
          ].map(([icon, color, period, value, label]) => <section className={s.metric} key={label}><div><span className={`${s.iconTile} ${s[color]}`}><Icon name={icon} /></span><span>{period}</span></div><strong>{value}</strong><p>{label}</p></section>)}</div>
          <div className={s.columns}><div className={s.primaryColumn}>
            <section className={s.account}><div className={s.orbOne} /><div className={s.orbTwo} /><div className={s.accountTop}><div><h2><Icon name="building-columns" /> Finova Bank</h2><p>{account?.name || "Your Finova account"}</p></div><div className={s.accountNumber}>ACCOUNT NUMBER<strong>{maskedNumber(account?.number)}</strong></div></div>
              <div className={s.balances}><div className={s.holder}><p>Account Holder</p><strong>{profile.displayName}</strong><div><span><i /> {account?.status || "Pending"}</span><span><Icon name="shield-halved" /> Secure account</span></div></div><div className={s.fiat}><p>Available Balance</p><div><strong>{hidden ? "••••••••" : money(account?.availableBalance || 0, currency)}</strong><button aria-label={hidden ? "Show balance" : "Hide balance"} aria-pressed={hidden} onClick={() => setHidden(!hidden)}><Icon name={hidden ? "eye" : "eye-slash"} /></button></div><p>{currency} Balance</p></div><div className={s.bitcoin}><p>Account Type</p><strong>{account?.type || "No account"}</strong><p>{account?.status || "Open an account"}</p><p><b /> Daily limit {money(account?.dailyLimit || 0, currency)}</p></div></div>
              <div className={s.accountBottom}><div className={s.portfolio}><p>Total Balance</p><strong>{hidden ? "••••••••" : money(totalBalance, currency)}</strong></div><div className={s.accountButtons}><button onClick={() => open("Finova Transfer")}><Icon name="paper-plane" /> Send Money</button><button onClick={() => open("Deposit")}><Icon name="plus" /> Add Money</button></div></div>
            </section>
            <section className={s.panel}><h2>Quick Actions</h2><div className={s.quickActions}>{[["right-left", "blue", "Finova Transfer"], ["circle-plus", "green", "Deposit"], ["credit-card", "pink", "Cards"], ["building-columns", "cyan", "Open Account"]].map(([icon, color, label]) => <button key={label} onClick={() => open(label)}><span className={`${s.iconTile} ${s[color]}`}><Icon name={icon} /></span>{label === "Open Account" ? "New Account" : label}</button>)}</div></section>
            <section className={s.panel}><div className={s.sectionTitle}><h2>Quick Transfer</h2><button onClick={() => open("Beneficiaries")}>View All <Icon name="chevron-right" /></button></div><div className={s.beneficiaries}><button onClick={() => open("Add beneficiary")}><span><Icon name="plus" /></span>Add New</button>{workspace.beneficiaries.length ? workspace.beneficiaries.map(beneficiary => <button key={beneficiary.id} onClick={() => open("Finova Transfer")}><span>{initials(beneficiary.name)}</span>{beneficiary.name}</button>) : <div className={s.emptyBeneficiaries}><span><Icon name="users" /></span><p>No saved recipients</p><small>Add a Finova account to get started</small></div>}</div></section>
            <section className={`${s.panel} ${s.cardsPanel}`}><div className={s.sectionTitle}><h2><span className={s.titleIcon}><Icon name="credit-card" /></span>Your Active Cards</h2><button onClick={() => open("Cards")}>Manage Cards <Icon name="chevron-right" /></button></div>{workspace.cards.filter(card => card.status === "Active").length ? <><div className={s.cardGrid}>{workspace.cards.filter(card => card.status === "Active").slice().reverse().slice(0, 2).map(card => <article className={s.cardOuter} key={card.id}><div className={s.paymentCard}><Icon name="credit-card" /><strong>Finova Bank</strong><p>Virtual Banking</p><div className={s.cardNumber}>•••• •••• •••• {card.number}</div><footer><span>Card Holder<strong>{card.holder}</strong></span><span>Valid<strong>{card.expiry}</strong></span></footer></div><div className={s.cardMeta}><span>{card.type}<br />Card</span><b>• Active</b><span>{card.currency}<br />0.00</span></div><button onClick={() => router.push(`/dashboard/cards/${card.id}`)}>View Details</button></article>)}</div><button className={s.allCards} onClick={() => open("Cards")}>View all {workspace.cards.filter(card => card.status === "Active").length} active cards</button></> : <div className={s.noCards}>You have no active cards yet. <button onClick={() => router.push("/dashboard/cards/apply")}>Apply for a virtual card</button></div>}</section>
          </div><div className={s.secondaryColumn}>
            <section className={`${s.panel} ${s.transactions}`}><div className={s.sectionTitle}><h2>Recent Transactions</h2><button onClick={() => open("Transactions")}>View All</button></div><TransactionList workspace={workspace} currency={currency} /></section>
            <section className={`${s.panel} ${s.statistics}`}><h2><span className={s.titleIcon}><Icon name="chart-line" /></span>Account Statistics</h2><div>{[["gauge-high", "cyan", "DAILY LIMIT", money(account?.dailyLimit || 0, currency), "Available daily limit"], ["hourglass-half", "yellow", "PENDING REQUESTS", money(pendingTransactions, currency), "Awaiting processing"], ["chart-pie", "green", "TOTAL ACTIVITY", money(totalVolume, currency), "All-time activity"]].map(([icon, color, label, amount, text]) => <article key={label}><span className={`${s.iconTile} ${s[color]}`}><Icon name={icon} /></span><div><p>{label}</p><strong>{amount}</strong><small>{text}</small></div><i className={s.progress} /></article>)}</div><footer><Icon name="clock" /> Account data updates in real time</footer></section>
            <section className={s.support}><span className={`${s.iconTile} ${s.cyan}`}><Icon name="headset" /><b /></span><h2>Need Assistance?</h2><p>Our support team is available</p><strong className={s.live}>• Secure support</strong><div className={s.supportFeatures}><span><Icon name="clock" /><div><strong>Quick Response</strong><small>We reply in your ticket</small></div></span><span><Icon name="shield-halved" /><div><strong>Private</strong><small>Account-specific help</small></div></span></div><button onClick={() => open("Support")}><Icon name="comments" /> Contact Support <small>•</small></button><p><Icon name="phone" /> Use a support ticket for account help</p></section>
          </div></div>
        </>}
      </main>
    </div>
    <dialog ref={dialog} className={s.dialog} onCancel={() => setModal("")} onClick={event => { if (event.target === event.currentTarget) setModal(""); }}><div><button className={s.close} aria-label="Close dialog" onClick={() => setModal("")}><Icon name="xmark" /></button><h2>{modal}</h2>{modal === "Account Information" ? <dl><dt>Account holder</dt><dd>{profile.displayName}</dd><dt>Bank</dt><dd>Finova Bank</dd><dt>Account number</dt><dd>{maskedNumber(account?.number)}</dd><dt>Currency</dt><dd>{currency}</dd></dl> : modal === "Open Account" ? <form onSubmit={openAccount}><label>Account type<select name="type" defaultValue="Savings Account"><option>Checking Account</option><option>Savings Account</option><option>Business Account</option><option>Investment Account</option></select></label><label>Currency<select name="currency" defaultValue={currency}><option>USD</option><option>NGN</option><option>GBP</option><option>EUR</option></select></label><p>Submit an additional-account request. A secure onboarding service creates financial accounts after review.</p><button disabled={opening}>{opening ? "Submitting…" : "Submit request"}</button></form> : <p>{modal === "Account opening submitted" ? "Your additional-account request was saved. You will receive an account update after review." : modal === "Sign-out unavailable" ? "We could not sign you out. Please try again." : "This action is available from the selected Finova account page."}</p>}</div></dialog>
    <dialog ref={pinDialog} className={`${s.dialog} ${s.pinDialog}`} onCancel={event => event.preventDefault()}><div>{primaryAccount?.pinConfigured ? <><span className={s.pinDialogIcon}><Icon name="key" /></span><h2>Verify your transaction PIN</h2><p>Enter the PIN for {primaryAccount.name} to finish signing in. You’ll also use this PIN to authorize transactions.</p><form onSubmit={verifySignInPin}><label>Transaction PIN<input value={loginPin} onChange={event => setLoginPin(event.target.value.replace(/\D/g, "").slice(0, 6))} type="password" inputMode="numeric" autoComplete="off" placeholder="Enter 4–6 digits" required /></label>{pinError && <p className={s.pinError}>{pinError}</p>}<button disabled={pinBusy}>{pinBusy ? "Verifying…" : "Verify and continue"}</button></form></> : <><span className={s.pinDialogIcon}><Icon name="shield-halved" /></span><h2>Set your transaction PIN</h2><p>Each Finova account uses a unique PIN to protect payments and transfers after you sign in.</p><button onClick={() => router.push("/dashboard/transaction-pin")}>Set transaction PIN</button></>}<button className={s.pinSignOut} onClick={() => { void signOut(firebaseAuth).then(() => router.replace("/banking?mode=login")); }}>Sign out</button></div></dialog>
  </div>;
}

function TransactionList({ workspace, currency }: { workspace: Workspace; currency: string }) {
  const transactions = workspace.transactions.slice(0, 3);
  if (!transactions.length) return <div className={s.emptyTransactions}><Icon name="receipt" /><p>No transactions yet</p><small>Deposit funds or send money to see your account activity here.</small></div>;
  return <div className={s.transactionList}>{transactions.map(transaction => <div key={transaction.id} className={s.transaction}><span className={transaction.type === "Debit" ? s.debit : s.credit}><Icon name={transaction.type === "Debit" ? "arrow-trend-up" : "arrow-trend-down"} /></span><div><strong>{transaction.description || transaction.type}</strong><small>{dateLabel(transaction.date)} · {transaction.status}</small></div><b className={transaction.type === "Debit" ? s.negative : s.positive}>{transaction.type === "Debit" ? "-" : "+"}{money(transaction.amount, currency)}</b></div>)}</div>;
}
