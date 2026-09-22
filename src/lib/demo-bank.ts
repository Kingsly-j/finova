import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Timestamp, type DocumentData, type DocumentSnapshot, type Transaction } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

const SETTINGS_ID = "operations";
const MAX_AMOUNT_MINOR = 1_000_000_000_00;
const MAX_LIST_ITEMS = 60;
const DEFAULT_SETTINGS = {
  currency: "USD",
  cardFeeMinor: 1_500,
  internalTransferServiceChargeMinor: 250,
  requireTransferApproval: true,
  demoMode: true,
};

export class DemoBankError extends Error {
  constructor(message: string, readonly status: 400 | 403 | 404 | 409 = 400) {
    super(message);
    this.name = "DemoBankError";
  }
}

export type DemoActor = {
  uid: string;
  email: string | null;
  displayName?: string | null;
};

export function demoActor(user: { uid: string; email: string | null; token: Record<string, unknown> }): DemoActor {
  return {
    uid: user.uid,
    email: user.email,
    displayName: typeof user.token.name === "string" ? user.token.name : null,
  };
}

type DemoSettings = typeof DEFAULT_SETTINGS;
type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function text(value: unknown, maximum = 160) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maximum) : "";
}

function transactionPin(value: unknown, label = "Transaction PIN") {
  const pin = typeof value === "string" ? value.replace(/\s+/g, "") : "";
  if (!/^\d{4,6}$/.test(pin)) throw new DemoBankError(`${label} must be 4 to 6 digits.`);
  return pin;
}

function pinHash(pin: string, salt: string) {
  return scryptSync(pin, salt, 32).toString("hex");
}

function pinMatches(account: JsonRecord, pin: string) {
  const salt = text(account.transactionPinSalt, 128);
  const savedHash = text(account.transactionPinHash, 128);
  if (!salt || !/^[a-f0-9]{64}$/i.test(savedHash)) return false;
  const actual = Buffer.from(pinHash(pin, salt), "hex");
  const expected = Buffer.from(savedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function requireTransactionPin(account: JsonRecord, supplied: unknown) {
  if (!text(account.transactionPinHash, 128)) {
    throw new DemoBankError("Set a transaction PIN for this account before continuing.", 409);
  }
  const pin = transactionPin(supplied);
  if (!pinMatches(account, pin)) throw new DemoBankError("The transaction PIN is incorrect.", 403);
}

function currency(value: unknown, fallback = DEFAULT_SETTINGS.currency) {
  const code = text(value, 3).toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : fallback;
}

function safeBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function safeInteger(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : fallback;
}

function now() {
  return Timestamp.now();
}

function dateString(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return ((value as { toDate: () => Date }).toDate()).toISOString();
  }
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function amountFromMinor(value: unknown) {
  return safeInteger(value, 0) / 100;
}

export function amountToMinor(value: unknown, label = "Amount") {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new DemoBankError(`${label} must be greater than zero.`);
  }

  const minor = Math.round(numeric * 100);
  if (!Number.isSafeInteger(minor) || minor <= 0 || minor > MAX_AMOUNT_MINOR || Math.abs(numeric * 100 - minor) > 0.000001) {
    throw new DemoBankError(`${label} must use at most two decimal places and be within the demo limit.`);
  }
  return minor;
}

function optionalAmountToMinor(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return undefined;
  return amountToMinor(value, label);
}

function feeToMinor(value: unknown, label: string) {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(numeric) || numeric < 0) throw new DemoBankError(`${label} must be zero or greater.`);
  const minor = Math.round(numeric * 100);
  if (!Number.isSafeInteger(minor) || minor > MAX_AMOUNT_MINOR || Math.abs(numeric * 100 - minor) > 0.000001) {
    throw new DemoBankError(`${label} must use at most two decimal places and be within the demo limit.`);
  }
  return minor;
}

function requestKey(value: unknown, prefix: string) {
  const key = text(value, 96);
  if (!/^[A-Za-z0-9_-]{12,96}$/.test(key)) {
    throw new DemoBankError("A valid request key is required. Refresh and try again.");
  }
  return `${prefix}_${key}`;
}

function notificationId(prefix: string, id: string) {
  return `${prefix}-${id}`.slice(0, 150);
}

function profileName(profile: JsonRecord, fallback = "Finova member") {
  return text(profile.displayName, 80) || [text(profile.firstName, 60), text(profile.lastName, 60)].filter(Boolean).join(" ") || fallback;
}

function preferencesFromProfile(profile: JsonRecord) {
  const beneficiaries = Array.isArray(profile.beneficiaries)
    ? profile.beneficiaries.slice(0, MAX_LIST_ITEMS).map(item => {
      const value = record(item);
      return {
        id: text(value.id, 80) || crypto.randomUUID(),
        name: text(value.name, 80),
        account: text(value.account, 48),
        bank: text(value.bank, 80) || "Finova",
        method: "Finova Transfer",
        favorite: safeBoolean(value.favorite),
      };
    }).filter(item => item.name && item.account)
    : [];
  const tickets = Array.isArray(profile.tickets)
    ? profile.tickets.slice(0, MAX_LIST_ITEMS).map(item => {
      const value = record(item);
      return {
        id: text(value.id, 80) || crypto.randomUUID(),
        subject: text(value.subject, 120),
        priority: ["Low", "Medium", "High"].includes(text(value.priority, 12)) ? text(value.priority, 12) : "Low",
        message: text(value.message, 1_000),
        date: text(value.date, 48) || new Date().toISOString(),
      };
    }).filter(item => item.subject && item.message)
    : [];
  const notices = Array.isArray(profile.notices)
    ? profile.notices.slice(0, MAX_LIST_ITEMS).map(item => {
      const value = record(item);
      return {
        id: text(value.id, 120),
        title: text(value.title, 120),
        message: text(value.message, 500),
        date: text(value.date, 48) || new Date().toISOString(),
        read: safeBoolean(value.read),
      };
    }).filter(item => item.id && item.title)
    : [];
  const drafts = Array.isArray(profile.drafts)
    ? profile.drafts.slice(0, MAX_LIST_ITEMS).map(item => {
      const value = record(item);
      return {
        id: text(value.id, 80) || crypto.randomUUID(),
        kind: text(value.kind, 80),
        description: text(value.description, 500),
        date: text(value.date, 48) || new Date().toISOString(),
      };
    }).filter(item => item.kind && item.description)
    : [];
  return { beneficiaries, tickets, notices, drafts };
}

function settingsFrom(value: unknown): DemoSettings {
  const source = record(value);
  return {
    currency: currency(source.currency),
    cardFeeMinor: Math.max(0, safeInteger(source.cardFeeMinor, DEFAULT_SETTINGS.cardFeeMinor)),
    internalTransferServiceChargeMinor: Math.max(0, safeInteger(source.internalTransferServiceChargeMinor, DEFAULT_SETTINGS.internalTransferServiceChargeMinor)),
    requireTransferApproval: safeBoolean(source.requireTransferApproval, DEFAULT_SETTINGS.requireTransferApproval),
    demoMode: true,
  };
}

async function getSettings() {
  const { db } = getFirebaseAdmin();
  const snapshot = await db.collection("appConfig").doc(SETTINGS_ID).get();
  return settingsFrom(snapshot.data());
}

function accountView(snapshot: DocumentSnapshot<DocumentData>) {
  const value = record(snapshot.data());
  return {
    id: snapshot.id,
    name: text(value.name, 80) || "Finova Everyday",
    number: text(value.accountNumber, 32),
    type: text(value.accountType, 80) || "Personal Account",
    currency: currency(value.currency),
    balance: amountFromMinor(value.balanceMinor),
    availableBalance: amountFromMinor(value.availableMinor),
    dailyLimit: amountFromMinor(value.dailyLimitMinor),
    status: ["Active", "Pending", "Frozen"].includes(text(value.status, 20)) ? text(value.status, 20) : "Active",
    pinConfigured: Boolean(text(value.transactionPinHash, 128)),
    createdAt: dateString(value.createdAt),
  };
}

function accountNumber() {
  const random = crypto.randomUUID().replace(/\D/g, "").padEnd(12, "0");
  return `FV${`${Date.now()}${random}`.slice(-10)}`;
}

async function createAccountDocument(
  actor: DemoActor,
  input: { accountType?: unknown; currency?: unknown; name?: unknown; primary?: boolean },
) {
  const { db } = getFirebaseAdmin();
  const accountReference = input.primary ? db.collection("accounts").doc(`primary_${actor.uid}`) : db.collection("accounts").doc();
  const settings = await getSettings();
  const accountCurrency = currency(input.currency, settings.currency);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const number = accountNumber();
    const numberReference = db.collection("accountNumbers").doc(number);
    const created = await db.runTransaction(async transaction => {
      const existingAccount = await transaction.get(accountReference);
      if (existingAccount.exists) return accountView(existingAccount);
      const existingNumber = await transaction.get(numberReference);
      if (existingNumber.exists) return null;
      const createdAt = now();
      transaction.set(accountReference, {
        ownerUid: actor.uid,
        ownerName: actor.displayName?.trim() || "Finova member",
        ownerEmail: actor.email || "",
        accountNumber: number,
        name: text(input.name, 80) || (input.primary ? "Finova Everyday" : "Finova Account"),
        accountType: text(input.accountType, 80) || "Personal Account",
        currency: accountCurrency,
        balanceMinor: 0,
        availableMinor: 0,
        dailyLimitMinor: 500_000_00,
        outgoingTodayMinor: 0,
        outgoingDay: "",
        transactionPinHash: "",
        transactionPinSalt: "",
        status: "Active",
        createdAt,
        updatedAt: createdAt,
      });
      transaction.set(numberReference, { accountId: accountReference.id, ownerUid: actor.uid, createdAt });
      return {
        id: accountReference.id,
        name: text(input.name, 80) || (input.primary ? "Finova Everyday" : "Finova Account"),
        number,
        type: text(input.accountType, 80) || "Personal Account",
        currency: accountCurrency,
        balance: 0,
        availableBalance: 0,
        dailyLimit: 500_000,
        status: "Active",
        createdAt: createdAt.toDate().toISOString(),
      };
    });
    if (created) return created;
  }
  throw new DemoBankError("We could not reserve an account number. Please try again.", 409);
}

function profileFields(input: JsonRecord, actor: DemoActor) {
  const firstName = text(input.firstName, 60);
  const lastName = text(input.lastName, 60);
  const displayName = text(input.displayName, 100) || [firstName, lastName].filter(Boolean).join(" ") || actor.displayName?.trim() || "Finova member";
  return {
    displayName,
    firstName,
    lastName,
    username: text(input.username, 60),
    email: actor.email || text(input.email, 160),
    phone: text(input.phone, 32),
    country: text(input.country, 80),
    photoURL: text(input.photoURL, 1_200),
  };
}

export async function onboardDemoUser(actor: DemoActor, input: JsonRecord = {}) {
  const { db } = getFirebaseAdmin();
  const profileReference = db.collection("users").doc(actor.uid);
  const current = await profileReference.get();
  const createdAt = now();
  const currentProfile = record(current.data());
  const fields = profileFields({ ...currentProfile, ...input }, actor);
  if (!current.exists) {
    await profileReference.set({
      ...fields,
      dark: false,
      beneficiaries: [],
      tickets: [],
      notices: [{
        id: notificationId("welcome", actor.uid),
        title: "Welcome to Finova",
        message: "Your demo account is ready. Funding requests are credited only after an administrator approves them.",
        date: createdAt.toDate().toISOString(),
        read: false,
      }],
      drafts: [],
      createdAt,
      updatedAt: createdAt,
    });
  } else {
    await profileReference.set({ ...fields, updatedAt: createdAt }, { merge: true });
  }
  await createAccountDocument(actor, {
    accountType: input.accountType,
    currency: input.currency,
    name: "Finova Everyday",
    primary: true,
  });
  return getUserDashboard(actor);
}

async function ownedAccount(actor: DemoActor, accountId: unknown) {
  const id = text(accountId, 160);
  if (!id) throw new DemoBankError("Select a Finova account.");
  const { db } = getFirebaseAdmin();
  const snapshot = await db.collection("accounts").doc(id).get();
  if (!snapshot.exists || record(snapshot.data()).ownerUid !== actor.uid) {
    throw new DemoBankError("That Finova account is unavailable.", 404);
  }
  return snapshot;
}

export async function setAccountTransactionPin(actor: DemoActor, accountId: string, input: JsonRecord) {
  const snapshot = await ownedAccount(actor, accountId);
  const account = record(snapshot.data());
  const nextPin = transactionPin(input.pin, "New transaction PIN");
  if (text(account.transactionPinHash, 128)) {
    const currentPin = transactionPin(input.currentPin, "Current transaction PIN");
    if (!pinMatches(account, currentPin)) throw new DemoBankError("The current transaction PIN is incorrect.", 403);
  }
  const salt = randomBytes(16).toString("hex");
  await snapshot.ref.update({
    transactionPinSalt: salt,
    transactionPinHash: pinHash(nextPin, salt),
    transactionPinUpdatedAt: now(),
    updatedAt: now(),
  });
  return getUserDashboard(actor);
}

export async function verifyAccountTransactionPin(actor: DemoActor, accountId: string, input: JsonRecord) {
  const snapshot = await ownedAccount(actor, accountId);
  requireTransactionPin(record(snapshot.data()), input.pin);
  return { verified: true };
}

function sortByDate<T extends { createdAt?: unknown; submittedAt?: unknown; date?: unknown }>(items: T[]) {
  return items.sort((left, right) => {
    const rightDate = Date.parse(String(right.createdAt || right.submittedAt || right.date || "")) || 0;
    const leftDate = Date.parse(String(left.createdAt || left.submittedAt || left.date || "")) || 0;
    return rightDate - leftDate;
  });
}

function ledgerView(snapshot: DocumentSnapshot<DocumentData>) {
  const value = record(snapshot.data());
  const signedMinor = safeInteger(value.amountMinorSigned);
  return {
    id: snapshot.id,
    amount: Math.abs(signedMinor) / 100,
    type: signedMinor < 0 ? "Debit" : "Credit",
    status: "Completed",
    description: text(value.description, 180) || "Finova demo activity",
    date: dateString(value.createdAt),
    accountId: text(value.accountId, 160),
    category: text(value.category, 40) || "other",
  };
}

function pendingDepositView(snapshot: DocumentSnapshot<DocumentData>) {
  const value = record(snapshot.data());
  return {
    id: snapshot.id,
    amount: amountFromMinor(value.amountMinor),
    type: "Credit",
    status: text(value.status, 32) === "approved" ? "Completed" : text(value.status, 32) === "rejected" ? "Rejected" : "Submitted",
    description: `Deposit request · ${text(value.paymentMethodName, 80) || "Funding method"}`,
    date: dateString(value.createdAt),
    accountId: text(value.accountId, 160),
    category: "deposit",
  };
}

function pendingTransferView(snapshot: DocumentSnapshot<DocumentData>) {
  const value = record(snapshot.data());
  const totalMinor = safeInteger(value.amountMinor) + safeInteger(value.feeMinor);
  return {
    id: snapshot.id,
    amount: Math.abs(totalMinor) / 100,
    type: "Debit",
    status: text(value.status, 32) === "approved" ? "Completed" : text(value.status, 32) === "rejected" ? "Rejected" : "Pending",
    description: `Internal transfer · ${text(value.recipientName, 100) || "Finova member"}`,
    date: dateString(value.createdAt),
    accountId: text(value.senderAccountId, 160),
    category: "transfer",
  };
}

function cardView(snapshot: DocumentSnapshot<DocumentData>) {
  const value = record(snapshot.data());
  return {
    id: snapshot.id,
    number: text(value.last4, 4),
    holder: text(value.holder, 100),
    type: text(value.cardType, 60) || "Finova Demo",
    level: text(value.level, 60) || "Standard",
    expiry: text(value.expiry, 16) || "DEMO",
    status: text(value.status, 30) || "Active",
    currency: currency(value.currency),
    limit: amountFromMinor(value.dailyLimitMinor),
    demo: true,
    createdAt: dateString(value.createdAt),
  };
}

function depositRequestView(snapshot: DocumentSnapshot<DocumentData>) {
  const value = record(snapshot.data());
  return {
    id: snapshot.id,
    accountId: text(value.accountId, 160),
    amount: amountFromMinor(value.amountMinor),
    currency: currency(value.currency),
    paymentMethodName: text(value.paymentMethodName, 100),
    instructions: text(value.instructions, 1_000),
    addressOrLink: text(value.addressOrLink, 1_000),
    reference: text(value.reference, 120),
    status: text(value.status, 32) || "awaiting_proof",
    proofStoragePath: text(value.proofStoragePath, 1_000),
    createdAt: dateString(value.createdAt),
    reviewNote: text(value.reviewNote, 500),
  };
}

function cardApplicationView(snapshot: DocumentSnapshot<DocumentData>) {
  const value = record(snapshot.data());
  return {
    id: snapshot.id,
    accountId: text(value.accountId, 160),
    cardType: text(value.cardType, 60),
    level: text(value.level, 60),
    currency: currency(value.currency),
    cardFee: amountFromMinor(value.cardFeeMinor),
    status: text(value.status, 32) || "pending",
    createdAt: dateString(value.createdAt),
    reviewNote: text(value.reviewNote, 500),
  };
}

function paymentMethodView(snapshot: DocumentSnapshot<DocumentData>) {
  const value = record(snapshot.data());
  return {
    id: snapshot.id,
    name: text(value.name, 100),
    type: text(value.type, 40) || "manual",
    instructions: text(value.instructions, 1_000),
    addressOrLink: text(value.addressOrLink, 1_000),
    enabled: safeBoolean(value.enabled),
    createdAt: dateString(value.createdAt),
    updatedAt: dateString(value.updatedAt),
  };
}

export async function getUserDashboard(actor: DemoActor) {
  const { db } = getFirebaseAdmin();
  const [profileSnapshot, accountsSnapshot, ledgersSnapshot, depositsSnapshot, transfersSnapshot, cardsSnapshot, cardAppsSnapshot, methodsSnapshot, settings] = await Promise.all([
    db.collection("users").doc(actor.uid).get(),
    db.collection("accounts").where("ownerUid", "==", actor.uid).get(),
    db.collection("ledgerEntries").where("ownerUid", "==", actor.uid).get(),
    db.collection("depositRequests").where("ownerUid", "==", actor.uid).get(),
    db.collection("transferRequests").where("ownerUid", "==", actor.uid).get(),
    db.collection("cards").where("ownerUid", "==", actor.uid).get(),
    db.collection("cardApplications").where("ownerUid", "==", actor.uid).get(),
    db.collection("paymentMethods").where("enabled", "==", true).get(),
    getSettings(),
  ]);

  const profile = record(profileSnapshot.data());
  const accounts = accountsSnapshot.docs.map(accountView).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const ledgerTransactions = ledgersSnapshot.docs.map(ledgerView);
  const requestTransactions = [
    ...depositsSnapshot.docs.map(pendingDepositView),
    ...transfersSnapshot.docs.map(pendingTransferView),
  ];
  const transactions = sortByDate([...ledgerTransactions, ...requestTransactions]).slice(0, 80);
  const preferences = preferencesFromProfile(profile);
  return {
    workspace: {
      version: 3,
      dark: safeBoolean(profile.dark),
      profile: {
        displayName: profileName(profile, actor.displayName || "Finova member"),
        firstName: text(profile.firstName, 60),
        lastName: text(profile.lastName, 60),
        email: text(profile.email, 160) || actor.email || "",
        phone: text(profile.phone, 32),
        country: text(profile.country, 80),
        photoURL: text(profile.photoURL, 1_200),
        username: text(profile.username, 60),
      },
      accounts,
      transactions,
      beneficiaries: preferences.beneficiaries,
      cards: cardsSnapshot.docs.map(cardView),
      notices: preferences.notices,
      tickets: preferences.tickets,
      drafts: preferences.drafts,
      paymentMethods: methodsSnapshot.docs.map(paymentMethodView),
      deposits: sortByDate(depositsSnapshot.docs.map(depositRequestView)),
      cardApplications: sortByDate(cardAppsSnapshot.docs.map(cardApplicationView)),
      settings: {
        currency: settings.currency,
        cardFee: amountFromMinor(settings.cardFeeMinor),
        internalTransferServiceCharge: amountFromMinor(settings.internalTransferServiceChargeMinor),
        demoMode: true,
      },
    },
  };
}

export async function updateDemoPreferences(actor: DemoActor, input: JsonRecord) {
  const { db } = getFirebaseAdmin();
  const profileReference = db.collection("users").doc(actor.uid);
  const existing = await profileReference.get();
  if (!existing.exists) await onboardDemoUser(actor, input);
  const profile = record(existing.data());
  const nextFields = profileFields({ ...profile, ...record(input.profile) }, actor);
  const preferences = preferencesFromProfile(input);
  await profileReference.set({
    ...nextFields,
    dark: safeBoolean(input.dark, safeBoolean(profile.dark)),
    beneficiaries: preferences.beneficiaries,
    tickets: preferences.tickets,
    notices: preferences.notices.length ? preferences.notices : preferencesFromProfile(profile).notices,
    drafts: preferences.drafts,
    updatedAt: now(),
  }, { merge: true });
  return getUserDashboard(actor);
}

export async function createDemoAccount(actor: DemoActor, input: JsonRecord) {
  const account = await createAccountDocument(actor, input);
  return { account };
}

export async function createDepositRequest(actor: DemoActor, input: JsonRecord) {
  const { db } = getFirebaseAdmin();
  const accountSnapshot = await ownedAccount(actor, input.accountId);
  const account = record(accountSnapshot.data());
  const amountMinor = amountToMinor(input.amount, "Deposit amount");
  const methodId = text(input.paymentMethodId, 160);
  if (!methodId) throw new DemoBankError("Select an available deposit method.");
  const methodSnapshot = await db.collection("paymentMethods").doc(methodId).get();
  if (!methodSnapshot.exists) throw new DemoBankError("That deposit method is unavailable.", 404);
  const method = record(methodSnapshot.data());
  if (!safeBoolean(method.enabled)) throw new DemoBankError("That deposit method is currently unavailable.", 409);
  const id = requestKey(input.requestKey, `deposit_${actor.uid}`);
  const reference = db.collection("depositRequests").doc(id);
  const exists = await reference.get();
  if (exists.exists) return { deposit: depositRequestView(exists) };
  const createdAt = now();
  const userProfile = await db.collection("users").doc(actor.uid).get();
  const profile = record(userProfile.data());
  await reference.create({
    ownerUid: actor.uid,
    ownerName: profileName(profile, actor.displayName || "Finova member"),
    ownerEmail: actor.email || text(profile.email, 160),
    accountId: accountSnapshot.id,
    accountNumber: text(account.accountNumber, 32),
    amountMinor,
    currency: currency(account.currency),
    paymentMethodId: methodSnapshot.id,
    paymentMethodName: text(method.name, 100),
    paymentMethodType: text(method.type, 40),
    instructions: text(method.instructions, 1_000),
    addressOrLink: text(method.addressOrLink, 1_000),
    reference: text(input.reference, 120),
    status: "awaiting_proof",
    createdAt,
    updatedAt: createdAt,
  });
  const saved = await reference.get();
  return { deposit: depositRequestView(saved) };
}

export async function submitDepositProof(actor: DemoActor, depositId: string, input: JsonRecord) {
  const { db, storage } = getFirebaseAdmin();
  const depositReference = db.collection("depositRequests").doc(text(depositId, 180));
  const snapshot = await depositReference.get();
  if (!snapshot.exists) throw new DemoBankError("That deposit request was not found.", 404);
  const deposit = record(snapshot.data());
  if (deposit.ownerUid !== actor.uid) throw new DemoBankError("That deposit request is unavailable.", 404);
  if (text(deposit.status, 32) !== "awaiting_proof") throw new DemoBankError("This deposit request is no longer waiting for proof.", 409);
  const storagePath = text(input.proofStoragePath, 1_000);
  const expectedPrefix = `deposit-proofs/${actor.uid}/${depositReference.id}/`;
  if (!storagePath.startsWith(expectedPrefix)) throw new DemoBankError("Upload the proof using this deposit request before submitting it.");
  const file = storage.bucket().file(storagePath);
  const [exists] = await file.exists();
  if (!exists) throw new DemoBankError("The uploaded proof could not be found. Please upload it again.", 404);
  const submittedAt = now();
  await depositReference.update({
    proofStoragePath: storagePath,
    status: "pending",
    submittedAt,
    updatedAt: submittedAt,
  });
  return { deposit: depositRequestView(await depositReference.get()) };
}

async function accountForNumber(number: string) {
  const { db } = getFirebaseAdmin();
  const snapshot = await db.collection("accounts").where("accountNumber", "==", number).limit(1).get();
  return snapshot.docs[0] || null;
}

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function quoteInternalTransfer(actor: DemoActor, input: JsonRecord) {
  const senderSnapshot = await ownedAccount(actor, input.accountId);
  const sender = record(senderSnapshot.data());
  const recipientNumber = text(input.recipientAccountNumber, 32).toUpperCase();
  const recipientSnapshot = await accountForNumber(recipientNumber);
  if (!recipientSnapshot) throw new DemoBankError("No Finova account matches that account number.", 404);
  if (recipientSnapshot.id === senderSnapshot.id) throw new DemoBankError("Choose another Finova account as the recipient.");
  const recipient = record(recipientSnapshot.data());
  if (text(recipient.status, 20) !== "Active") throw new DemoBankError("The recipient account is not available.", 409);
  if (currency(recipient.currency) !== currency(sender.currency)) throw new DemoBankError("Both Finova accounts must use the same currency.");
  const amountMinor = amountToMinor(input.amount, "Transfer amount");
  const settings = await getSettings();
  const feeMinor = settings.internalTransferServiceChargeMinor;
  return {
    senderAccountId: senderSnapshot.id,
    recipientAccountId: recipientSnapshot.id,
    recipientName: text(recipient.ownerName, 100) || "Finova member",
    recipientAccountNumber: recipientNumber,
    amount: amountFromMinor(amountMinor),
    serviceCharge: amountFromMinor(feeMinor),
    total: amountFromMinor(amountMinor + feeMinor),
    currency: currency(sender.currency),
    availableBalance: amountFromMinor(sender.availableMinor),
  };
}

export async function createInternalTransfer(actor: DemoActor, input: JsonRecord) {
  const quote = await quoteInternalTransfer(actor, input);
  const { db } = getFirebaseAdmin();
  const id = requestKey(input.requestKey, `transfer_${actor.uid}`);
  const transferReference = db.collection("transferRequests").doc(id);
  const senderReference = db.collection("accounts").doc(quote.senderAccountId);
  const recipientReference = db.collection("accounts").doc(quote.recipientAccountId);
  await db.runTransaction(async transaction => {
    const existing = await transaction.get(transferReference);
    if (existing.exists) return;
    const [senderSnapshot, recipientSnapshot] = await Promise.all([transaction.get(senderReference), transaction.get(recipientReference)]);
    if (!senderSnapshot.exists || !recipientSnapshot.exists) throw new DemoBankError("A selected Finova account is unavailable.", 404);
    const sender = record(senderSnapshot.data());
    const recipient = record(recipientSnapshot.data());
    const amountMinor = Math.round(quote.amount * 100);
    const feeMinor = Math.round(quote.serviceCharge * 100);
    const totalMinor = amountMinor + feeMinor;
    if (sender.ownerUid !== actor.uid || text(sender.status, 20) !== "Active") throw new DemoBankError("Your sending account is not available.", 409);
    requireTransactionPin(sender, input.transactionPin ?? input.pin);
    if (text(recipient.status, 20) !== "Active") throw new DemoBankError("The recipient account is not available.", 409);
    if (safeInteger(sender.availableMinor) < totalMinor) throw new DemoBankError("Your available demo balance does not cover this transfer and service charge.", 409);
    const today = dayKey();
    const existingOutgoing = sender.outgoingDay === today ? safeInteger(sender.outgoingTodayMinor) : 0;
    if (existingOutgoing + totalMinor > safeInteger(sender.dailyLimitMinor, 500_000_00)) {
      throw new DemoBankError("This transfer would exceed your daily Finova demo limit.", 409);
    }
    const createdAt = now();
    transaction.update(senderReference, {
      availableMinor: safeInteger(sender.availableMinor) - totalMinor,
      outgoingTodayMinor: existingOutgoing + totalMinor,
      outgoingDay: today,
      updatedAt: createdAt,
    });
    transaction.create(transferReference, {
      ownerUid: actor.uid,
      ownerName: text(sender.ownerName, 100) || actor.displayName || "Finova member",
      ownerEmail: actor.email || "",
      senderAccountId: senderReference.id,
      senderAccountNumber: text(sender.accountNumber, 32),
      recipientAccountId: recipientReference.id,
      recipientAccountNumber: text(recipient.accountNumber, 32),
      recipientName: text(recipient.ownerName, 100) || "Finova member",
      recipientUid: text(recipient.ownerUid, 160),
      amountMinor,
      feeMinor,
      currency: currency(sender.currency),
      description: text(input.description, 300),
      status: "pending",
      createdAt,
      updatedAt: createdAt,
    });
    return;
  });
  return { transfer: { id, status: "pending", ...quote } };
}

export async function createCardApplication(actor: DemoActor, input: JsonRecord) {
  const { db } = getFirebaseAdmin();
  const accountSnapshot = await ownedAccount(actor, input.accountId);
  const account = record(accountSnapshot.data());
  if (text(account.status, 20) !== "Active") throw new DemoBankError("Choose an active Finova account for this card.", 409);
  const id = requestKey(input.requestKey, `card_${actor.uid}`);
  const reference = db.collection("cardApplications").doc(id);
  const existing = await reference.get();
  if (existing.exists) return { application: cardApplicationView(existing) };
  const settings = await getSettings();
  const profileSnapshot = await db.collection("users").doc(actor.uid).get();
  const profile = record(profileSnapshot.data());
  const createdAt = now();
  await reference.create({
    ownerUid: actor.uid,
    ownerName: profileName(profile, actor.displayName || "Finova member"),
    ownerEmail: actor.email || text(profile.email, 160),
    accountId: accountSnapshot.id,
    accountNumber: text(account.accountNumber, 32),
    cardType: ["Visa", "Mastercard", "American Express"].includes(text(input.cardType, 40)) ? text(input.cardType, 40) : "Visa",
    level: ["Standard", "Gold", "Platinum", "Black"].includes(text(input.level, 40)) ? text(input.level, 40) : "Standard",
    holder: text(input.holder, 100) || profileName(profile, actor.displayName || "Finova member"),
    currency: currency(account.currency),
    dailyLimitMinor: optionalAmountToMinor(input.dailyLimit, "Daily limit") || 100_000,
    cardFeeMinor: settings.cardFeeMinor,
    status: "pending",
    createdAt,
    updatedAt: createdAt,
  });
  return { application: cardApplicationView(await reference.get()) };
}

function audit(transaction: Transaction, input: { actorUid: string; action: string; resourceType: string; resourceId: string; detail?: JsonRecord }) {
  const { db } = getFirebaseAdmin();
  transaction.create(db.collection("auditEvents").doc(), {
    actorUid: input.actorUid,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    detail: input.detail || {},
    createdAt: now(),
  });
}

function ledger(transaction: Transaction, input: { ownerUid: string; accountId: string; amountMinorSigned: number; currency: string; description: string; category: string; operationId: string; actorUid: string }) {
  const { db } = getFirebaseAdmin();
  transaction.create(db.collection("ledgerEntries").doc(), {
    ...input,
    createdAt: now(),
  });
}

function ensurePending(value: JsonRecord, label: string) {
  if (text(value.status, 32) !== "pending") throw new DemoBankError(`This ${label} has already been reviewed.`, 409);
}

export async function decideDeposit(admin: DemoActor, id: string, action: "approve" | "reject", note?: unknown) {
  const { db, storage } = getFirebaseAdmin();
  const reference = db.collection("depositRequests").doc(text(id, 180));
  const current = await reference.get();
  if (!current.exists) throw new DemoBankError("That deposit request was not found.", 404);
  const initial = record(current.data());
  if (action === "approve") {
    const storagePath = text(initial.proofStoragePath, 1_000);
    if (!storagePath) throw new DemoBankError("A payment proof is required before approving a deposit.", 409);
    const [proofExists] = await storage.bucket().file(storagePath).exists();
    if (!proofExists) throw new DemoBankError("The submitted proof is no longer available.", 409);
  }
  await db.runTransaction(async transaction => {
    const requestSnapshot = await transaction.get(reference);
    if (!requestSnapshot.exists) throw new DemoBankError("That deposit request was not found.", 404);
    const request = record(requestSnapshot.data());
    ensurePending(request, "deposit request");
    const reviewedAt = now();
    if (action === "reject") {
      transaction.update(reference, { status: "rejected", reviewNote: text(note, 500), reviewedAt, reviewedBy: admin.uid, updatedAt: reviewedAt });
      audit(transaction, { actorUid: admin.uid, action: "deposit.rejected", resourceType: "depositRequest", resourceId: reference.id });
      return;
    }
    const accountReference = db.collection("accounts").doc(text(request.accountId, 160));
    const accountSnapshot = await transaction.get(accountReference);
    if (!accountSnapshot.exists) throw new DemoBankError("The requested Finova account is unavailable.", 409);
    const account = record(accountSnapshot.data());
    if (text(account.status, 20) !== "Active") throw new DemoBankError("The requested Finova account is not active.", 409);
    const amountMinor = safeInteger(request.amountMinor);
    if (amountMinor <= 0) throw new DemoBankError("This deposit has an invalid amount.", 409);
    transaction.update(accountReference, {
      balanceMinor: safeInteger(account.balanceMinor) + amountMinor,
      availableMinor: safeInteger(account.availableMinor) + amountMinor,
      updatedAt: reviewedAt,
    });
    transaction.update(reference, { status: "approved", approvedAmountMinor: amountMinor, reviewNote: text(note, 500), reviewedAt, reviewedBy: admin.uid, updatedAt: reviewedAt });
    ledger(transaction, {
      ownerUid: text(request.ownerUid, 160), accountId: accountReference.id, amountMinorSigned: amountMinor,
      currency: currency(request.currency), description: `Approved demo deposit · ${text(request.paymentMethodName, 80) || "Funding"}`,
      category: "deposit", operationId: reference.id, actorUid: admin.uid,
    });
    audit(transaction, { actorUid: admin.uid, action: "deposit.approved", resourceType: "depositRequest", resourceId: reference.id, detail: { amountMinor } });
  });
  return { ok: true };
}

export async function decideTransfer(admin: DemoActor, id: string, action: "approve" | "reject", note?: unknown) {
  const { db } = getFirebaseAdmin();
  const reference = db.collection("transferRequests").doc(text(id, 180));
  await db.runTransaction(async transaction => {
    const transferSnapshot = await transaction.get(reference);
    if (!transferSnapshot.exists) throw new DemoBankError("That transfer request was not found.", 404);
    const transfer = record(transferSnapshot.data());
    ensurePending(transfer, "transfer request");
    const senderReference = db.collection("accounts").doc(text(transfer.senderAccountId, 160));
    const recipientReference = db.collection("accounts").doc(text(transfer.recipientAccountId, 160));
    const [senderSnapshot, recipientSnapshot] = await Promise.all([transaction.get(senderReference), transaction.get(recipientReference)]);
    if (!senderSnapshot.exists || !recipientSnapshot.exists) throw new DemoBankError("One of the Finova accounts is unavailable.", 409);
    const sender = record(senderSnapshot.data());
    const recipient = record(recipientSnapshot.data());
    const amountMinor = safeInteger(transfer.amountMinor);
    const feeMinor = safeInteger(transfer.feeMinor);
    const totalMinor = amountMinor + feeMinor;
    const reviewedAt = now();
    if (action === "reject") {
      transaction.update(senderReference, {
        availableMinor: safeInteger(sender.availableMinor) + totalMinor,
        outgoingTodayMinor: Math.max(0, safeInteger(sender.outgoingTodayMinor) - totalMinor),
        updatedAt: reviewedAt,
      });
      transaction.update(reference, { status: "rejected", reviewNote: text(note, 500), reviewedAt, reviewedBy: admin.uid, updatedAt: reviewedAt });
      audit(transaction, { actorUid: admin.uid, action: "transfer.rejected", resourceType: "transferRequest", resourceId: reference.id });
      return;
    }
    if (text(sender.status, 20) !== "Active" || text(recipient.status, 20) !== "Active") throw new DemoBankError("Both Finova accounts must be active before approval.", 409);
    if (safeInteger(sender.balanceMinor) < totalMinor) throw new DemoBankError("The sender no longer has sufficient demo balance.", 409);
    transaction.update(senderReference, { balanceMinor: safeInteger(sender.balanceMinor) - totalMinor, updatedAt: reviewedAt });
    transaction.update(recipientReference, {
      balanceMinor: safeInteger(recipient.balanceMinor) + amountMinor,
      availableMinor: safeInteger(recipient.availableMinor) + amountMinor,
      updatedAt: reviewedAt,
    });
    transaction.update(reference, { status: "approved", reviewNote: text(note, 500), reviewedAt, reviewedBy: admin.uid, updatedAt: reviewedAt });
    ledger(transaction, {
      ownerUid: text(transfer.ownerUid, 160), accountId: senderReference.id, amountMinorSigned: -totalMinor,
      currency: currency(transfer.currency), description: `Approved internal transfer · ${text(transfer.recipientName, 100) || "Finova member"}`,
      category: "transfer", operationId: reference.id, actorUid: admin.uid,
    });
    ledger(transaction, {
      ownerUid: text(transfer.recipientUid, 160), accountId: recipientReference.id, amountMinorSigned: amountMinor,
      currency: currency(transfer.currency), description: `Received internal transfer · ${text(sender.ownerName, 100) || "Finova member"}`,
      category: "transfer", operationId: reference.id, actorUid: admin.uid,
    });
    audit(transaction, { actorUid: admin.uid, action: "transfer.approved", resourceType: "transferRequest", resourceId: reference.id, detail: { amountMinor, feeMinor } });
  });
  return { ok: true };
}

function demoLastFour() {
  return String(Math.floor(1_000 + Math.random() * 9_000));
}

export async function decideCardApplication(admin: DemoActor, id: string, action: "approve" | "reject", note?: unknown) {
  const { db } = getFirebaseAdmin();
  const reference = db.collection("cardApplications").doc(text(id, 180));
  const cardReference = db.collection("cards").doc();
  const last4 = demoLastFour();
  await db.runTransaction(async transaction => {
    const appSnapshot = await transaction.get(reference);
    if (!appSnapshot.exists) throw new DemoBankError("That card application was not found.", 404);
    const application = record(appSnapshot.data());
    ensurePending(application, "card application");
    const accountReference = db.collection("accounts").doc(text(application.accountId, 160));
    const accountSnapshot = await transaction.get(accountReference);
    if (!accountSnapshot.exists) throw new DemoBankError("The requested Finova account is unavailable.", 409);
    const account = record(accountSnapshot.data());
    const reviewedAt = now();
    if (action === "reject") {
      transaction.update(reference, { status: "rejected", reviewNote: text(note, 500), reviewedAt, reviewedBy: admin.uid, updatedAt: reviewedAt });
      audit(transaction, { actorUid: admin.uid, action: "card.rejected", resourceType: "cardApplication", resourceId: reference.id });
      return;
    }
    const feeMinor = safeInteger(application.cardFeeMinor);
    if (text(account.status, 20) !== "Active" || safeInteger(account.availableMinor) < feeMinor || safeInteger(account.balanceMinor) < feeMinor) {
      throw new DemoBankError("The selected account does not have enough available demo balance for the fixed card fee.", 409);
    }
    transaction.update(accountReference, {
      balanceMinor: safeInteger(account.balanceMinor) - feeMinor,
      availableMinor: safeInteger(account.availableMinor) - feeMinor,
      updatedAt: reviewedAt,
    });
    transaction.create(cardReference, {
      ownerUid: text(application.ownerUid, 160),
      accountId: accountReference.id,
      applicationId: reference.id,
      holder: text(application.holder, 100),
      cardType: text(application.cardType, 60),
      level: text(application.level, 60),
      currency: currency(application.currency),
      dailyLimitMinor: safeInteger(application.dailyLimitMinor, 100_000),
      last4,
      expiry: "DEMO",
      status: "Active",
      demoOnly: true,
      createdAt: reviewedAt,
    });
    transaction.update(reference, { status: "approved", cardId: cardReference.id, reviewNote: text(note, 500), reviewedAt, reviewedBy: admin.uid, updatedAt: reviewedAt });
    ledger(transaction, {
      ownerUid: text(application.ownerUid, 160), accountId: accountReference.id, amountMinorSigned: -feeMinor,
      currency: currency(application.currency), description: "Demo virtual card issue fee", category: "card", operationId: reference.id, actorUid: admin.uid,
    });
    audit(transaction, { actorUid: admin.uid, action: "card.approved", resourceType: "cardApplication", resourceId: reference.id, detail: { feeMinor } });
  });
  return { ok: true };
}

export async function manualCredit(admin: DemoActor, input: JsonRecord) {
  const { db } = getFirebaseAdmin();
  const accountId = text(input.accountId, 160);
  if (!accountId) throw new DemoBankError("Select an account to credit.");
  const reason = text(input.reason, 300);
  if (!reason) throw new DemoBankError("Provide a reason for this manual demo credit.");
  const amountMinor = amountToMinor(input.amount, "Credit amount");
  const operationId = requestKey(input.requestKey, "manual_credit");
  const accountReference = db.collection("accounts").doc(accountId);
  const creditReference = db.collection("manualCredits").doc(operationId);
  await db.runTransaction(async transaction => {
    const priorCredit = await transaction.get(creditReference);
    if (priorCredit.exists) return;
    const snapshot = await transaction.get(accountReference);
    if (!snapshot.exists) throw new DemoBankError("That account was not found.", 404);
    const account = record(snapshot.data());
    if (text(account.status, 20) !== "Active") throw new DemoBankError("Only active demo accounts can be credited.", 409);
    const creditedAt = now();
    transaction.update(accountReference, {
      balanceMinor: safeInteger(account.balanceMinor) + amountMinor,
      availableMinor: safeInteger(account.availableMinor) + amountMinor,
      updatedAt: creditedAt,
    });
    transaction.create(creditReference, {
      accountId,
      ownerUid: text(account.ownerUid, 160),
      amountMinor,
      reason,
      actorUid: admin.uid,
      createdAt: creditedAt,
    });
    ledger(transaction, {
      ownerUid: text(account.ownerUid, 160), accountId, amountMinorSigned: amountMinor,
      currency: currency(account.currency), description: `Manual demo credit · ${reason}`, category: "credit", operationId, actorUid: admin.uid,
    });
    audit(transaction, { actorUid: admin.uid, action: "account.manual_credit", resourceType: "account", resourceId: accountId, detail: { amountMinor, reason } });
  });
  return { ok: true };
}

const allowedMethodTypes = new Set(["crypto", "wallet", "card", "bank", "manual"]);

function paymentMethodInput(input: JsonRecord) {
  const name = text(input.name, 100);
  const instructions = text(input.instructions, 1_000);
  const addressOrLink = text(input.addressOrLink, 1_000);
  if (!name || !instructions) throw new DemoBankError("A payment method needs a name and payment instructions.");
  const type = text(input.type, 40).toLowerCase();
  return {
    name,
    type: allowedMethodTypes.has(type) ? type : "manual",
    instructions,
    addressOrLink,
    enabled: safeBoolean(input.enabled, true),
  };
}

export async function createPaymentMethod(admin: DemoActor, input: JsonRecord) {
  const { db } = getFirebaseAdmin();
  const reference = db.collection("paymentMethods").doc();
  const saved = paymentMethodInput(input);
  const createdAt = now();
  await reference.create({ ...saved, createdAt, updatedAt: createdAt, updatedBy: admin.uid });
  return { method: paymentMethodView(await reference.get()) };
}

export async function updatePaymentMethod(admin: DemoActor, id: string, input: JsonRecord) {
  const { db } = getFirebaseAdmin();
  const reference = db.collection("paymentMethods").doc(text(id, 160));
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new DemoBankError("That payment method was not found.", 404);
  await reference.update({ ...paymentMethodInput(input), updatedAt: now(), updatedBy: admin.uid });
  return { method: paymentMethodView(await reference.get()) };
}

export async function disablePaymentMethod(admin: DemoActor, id: string) {
  const { db } = getFirebaseAdmin();
  const reference = db.collection("paymentMethods").doc(text(id, 160));
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new DemoBankError("That payment method was not found.", 404);
  await reference.update({ enabled: false, updatedAt: now(), updatedBy: admin.uid });
  return { ok: true };
}

export async function updateDemoSettings(admin: DemoActor, input: JsonRecord) {
  const { db } = getFirebaseAdmin();
  const cardFeeMinor = input.cardFee === undefined ? undefined : feeToMinor(input.cardFee, "Card fee");
  const transferFeeMinor = input.internalTransferServiceCharge === undefined ? undefined : feeToMinor(input.internalTransferServiceCharge, "Internal transfer service charge");
  const existing = await getSettings();
  const saved: DemoSettings = {
    ...existing,
    currency: currency(input.currency, existing.currency),
    cardFeeMinor: cardFeeMinor ?? existing.cardFeeMinor,
    internalTransferServiceChargeMinor: transferFeeMinor ?? existing.internalTransferServiceChargeMinor,
    demoMode: true,
  };
  await db.collection("appConfig").doc(SETTINGS_ID).set({ ...saved, updatedAt: now(), updatedBy: admin.uid }, { merge: true });
  return { settings: settingsPublic(saved) };
}

function settingsPublic(settings: DemoSettings) {
  return {
    currency: settings.currency,
    cardFee: amountFromMinor(settings.cardFeeMinor),
    internalTransferServiceCharge: amountFromMinor(settings.internalTransferServiceChargeMinor),
    requireTransferApproval: settings.requireTransferApproval,
    demoMode: true,
  };
}

async function proofUrl(storagePath: string) {
  if (!storagePath) return "";
  try {
    const { storage } = getFirebaseAdmin();
    const [url] = await storage.bucket().file(storagePath).getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
    return url;
  } catch {
    return "";
  }
}

function adminDepositView(snapshot: DocumentSnapshot<DocumentData>, url: string) {
  const value = record(snapshot.data());
  return {
    id: snapshot.id,
    status: text(value.status, 32),
    amount: amountFromMinor(value.amountMinor),
    currency: currency(value.currency),
    userName: text(value.ownerName, 100),
    email: text(value.ownerEmail, 160),
    paymentMethodName: text(value.paymentMethodName, 100),
    reference: text(value.reference, 120),
    proofUrl: url,
    proofStoragePath: text(value.proofStoragePath, 1_000),
    createdAt: dateString(value.createdAt),
  };
}

function adminTransferView(snapshot: DocumentSnapshot<DocumentData>) {
  const value = record(snapshot.data());
  return {
    id: snapshot.id,
    status: text(value.status, 32),
    amount: amountFromMinor(value.amountMinor),
    serviceCharge: amountFromMinor(value.feeMinor),
    currency: currency(value.currency),
    userName: text(value.ownerName, 100),
    email: text(value.ownerEmail, 160),
    recipientName: text(value.recipientName, 100),
    recipientAccountNumber: text(value.recipientAccountNumber, 32),
    createdAt: dateString(value.createdAt),
  };
}

function adminCardView(snapshot: DocumentSnapshot<DocumentData>) {
  const value = record(snapshot.data());
  return {
    id: snapshot.id,
    status: text(value.status, 32),
    cardType: text(value.cardType, 60),
    level: text(value.level, 60),
    cardFee: amountFromMinor(value.cardFeeMinor),
    currency: currency(value.currency),
    userName: text(value.ownerName, 100),
    email: text(value.ownerEmail, 160),
    createdAt: dateString(value.createdAt),
  };
}

export async function getAdminOverview() {
  const { db } = getFirebaseAdmin();
  const [usersSnapshot, accountsSnapshot, methodsSnapshot, depositsSnapshot, transfersSnapshot, appsSnapshot, settings] = await Promise.all([
    db.collection("users").get(),
    db.collection("accounts").get(),
    db.collection("paymentMethods").get(),
    db.collection("depositRequests").get(),
    db.collection("transferRequests").get(),
    db.collection("cardApplications").get(),
    getSettings(),
  ]);
  const deposits = await Promise.all(depositsSnapshot.docs.map(async snapshot => {
    const value = record(snapshot.data());
    return adminDepositView(snapshot, await proofUrl(text(value.proofStoragePath, 1_000)));
  }));
  const totalDemoBalance = accountsSnapshot.docs.reduce((total, snapshot) => total + amountFromMinor(record(snapshot.data()).balanceMinor), 0);
  return {
    summary: {
      totalUsers: usersSnapshot.size,
      totalAccounts: accountsSnapshot.size,
      totalDemoBalance,
      pendingDeposits: deposits.filter(item => item.status === "pending").length,
      pendingTransfers: transfersSnapshot.docs.filter(snapshot => text(record(snapshot.data()).status, 32) === "pending").length,
      pendingCards: appsSnapshot.docs.filter(snapshot => text(record(snapshot.data()).status, 32) === "pending").length,
    },
    settings: settingsPublic(settings),
    paymentMethods: methodsSnapshot.docs.map(paymentMethodView),
    deposits: sortByDate(deposits),
    transfers: sortByDate(transfersSnapshot.docs.map(adminTransferView)),
    cards: sortByDate(appsSnapshot.docs.map(adminCardView)),
    accounts: accountsSnapshot.docs.map(accountView).map(account => ({ ...account, ownerUid: text(record(accountsSnapshot.docs.find(snapshot => snapshot.id === account.id)?.data()).ownerUid, 160) })),
  };
}
