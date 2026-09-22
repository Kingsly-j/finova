"use client";

import { useSyncExternalStore } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes } from "firebase/storage";
import { firebaseAuth, firebaseStorage } from "@/lib/firebase";

export type Transaction = {
  id: string;
  amount: number;
  type: "Debit" | "Credit";
  status: "Pending" | "Completed" | "Processed" | "Rejected" | "Submitted";
  description: string;
  date: string;
  accountId?: string;
  category?: "transfer" | "deposit" | "swap" | "card" | "credit" | "other";
};

export type Beneficiary = { id: string; name: string; account: string; bank: string; method: string; favorite: boolean };
export type Card = { id: string; number: string; holder: string; type: string; level: string; expiry: string; status: string; currency: string; limit: number; demo?: boolean; createdAt?: string };
export type Notice = { id: string; title: string; message: string; date: string; read: boolean };
export type Ticket = { id: string; subject: string; priority: string; message: string; date: string };
export type Account = {
  id: string;
  name: string;
  number: string;
  type: string;
  currency: string;
  balance: number;
  availableBalance: number;
  dailyLimit: number;
  status: "Active" | "Pending" | "Frozen";
  pinConfigured?: boolean;
  createdAt: string;
};
export type Profile = {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  photoURL: string;
  username: string;
};
export type PaymentMethod = { id: string; name: string; type: string; instructions: string; addressOrLink: string; enabled: boolean };
export type Deposit = { id: string; accountId: string; amount: number; currency: string; paymentMethodName: string; instructions: string; addressOrLink: string; reference: string; status: string; proofStoragePath: string; createdAt: string; reviewNote: string };
export type CardApplication = { id: string; accountId: string; cardType: string; level: string; currency: string; cardFee: number; status: string; createdAt: string; reviewNote: string };
export type Workspace = {
  version: 3;
  dark: boolean;
  profile: Profile;
  accounts: Account[];
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  cards: Card[];
  notices: Notice[];
  tickets: Ticket[];
  drafts: { id: string; kind: string; description: string; date: string }[];
  paymentMethods: PaymentMethod[];
  deposits: Deposit[];
  cardApplications: CardApplication[];
  settings: { currency: string; cardFee: number; internalTransferServiceCharge: number; demoMode: true };
};
export type RegistrationDetails = Partial<Profile> & { accountType?: string; currency?: string };
export type DashboardSession = { user: User | null; workspace: Workspace; ready: boolean; syncing: boolean; error: string };

export class FinovaApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "FinovaApiError";
  }
}

const emptyProfile: Profile = { displayName: "Finova member", firstName: "", lastName: "", email: "", phone: "", country: "", photoURL: "", username: "" };
const emptyWorkspace: Workspace = {
  version: 3,
  dark: false,
  profile: emptyProfile,
  accounts: [],
  transactions: [],
  beneficiaries: [],
  cards: [],
  notices: [],
  tickets: [],
  drafts: [],
  paymentMethods: [],
  deposits: [],
  cardApplications: [],
  settings: { currency: "USD", cardFee: 0, internalTransferServiceCharge: 0, demoMode: true },
};

let session: DashboardSession = { user: null, workspace: emptyWorkspace, ready: false, syncing: false, error: "" };
const initialServerSession: DashboardSession = { user: null, workspace: emptyWorkspace, ready: false, syncing: false, error: "" };
let authStarted = false;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let requestSequence = 0;
const listeners = new Set<() => void>();

function emit() { listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); startAuth(); return () => listeners.delete(listener); }
function snapshot() { return session; }
function serverSnapshot() { return initialServerSession; }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function strings<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }

function normalize(raw: unknown, user?: User | null): Workspace {
  const value = isRecord(raw) ? raw : {};
  const profile = isRecord(value.profile) ? value.profile : {};
  const fallbackName = user?.displayName || user?.email?.split("@")[0] || "Finova member";
  return {
    ...emptyWorkspace,
    ...value,
    version: 3,
    dark: value.dark === true,
    profile: {
      ...emptyProfile,
      displayName: typeof profile.displayName === "string" && profile.displayName ? profile.displayName : fallbackName,
      firstName: typeof profile.firstName === "string" ? profile.firstName : "",
      lastName: typeof profile.lastName === "string" ? profile.lastName : "",
      email: typeof profile.email === "string" && profile.email ? profile.email : user?.email || "",
      phone: typeof profile.phone === "string" ? profile.phone : "",
      country: typeof profile.country === "string" ? profile.country : "",
      photoURL: typeof profile.photoURL === "string" ? profile.photoURL : "",
      username: typeof profile.username === "string" ? profile.username : "",
    },
    accounts: strings<Account>(value.accounts),
    transactions: strings<Transaction>(value.transactions),
    beneficiaries: strings<Beneficiary>(value.beneficiaries),
    cards: strings<Card>(value.cards),
    notices: strings<Notice>(value.notices),
    tickets: strings<Ticket>(value.tickets),
    drafts: strings<{ id: string; kind: string; description: string; date: string }>(value.drafts),
    paymentMethods: strings<PaymentMethod>(value.paymentMethods),
    deposits: strings<Deposit>(value.deposits),
    cardApplications: strings<CardApplication>(value.cardApplications),
    settings: isRecord(value.settings) ? {
      currency: typeof value.settings.currency === "string" ? value.settings.currency : "USD",
      cardFee: Number(value.settings.cardFee) || 0,
      internalTransferServiceCharge: Number(value.settings.internalTransferServiceCharge) || 0,
      demoMode: true,
    } : emptyWorkspace.settings,
  };
}

function payloadMessage(payload: unknown) {
  if (!isRecord(payload)) return "";
  return typeof payload.error === "string" ? payload.error : typeof payload.message === "string" ? payload.message : "";
}

async function apiRequest<T>(path: string, init: RequestInit = {}, user = firebaseAuth.currentUser): Promise<T> {
  if (!user) throw new FinovaApiError("Your session has ended. Please sign in again.", 401);
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new FinovaApiError(payloadMessage(payload) || "The secure Finova service could not complete that request.", response.status);
  return payload as T;
}

function workspaceFrom(payload: unknown, user?: User | null) {
  return normalize(isRecord(payload) ? payload.workspace : undefined, user);
}

async function reload(user = firebaseAuth.currentUser, silent = false) {
  if (!user) return false;
  const sequence = ++requestSequence;
  if (!silent) {
    session = { ...session, user, ready: true, syncing: true, error: "" };
    emit();
  }
  try {
    const data = await apiRequest<{ workspace: unknown }>("/api/demo/overview", {}, user);
    if (sequence !== requestSequence) return false;
    session = { user, workspace: workspaceFrom(data, user), ready: true, syncing: false, error: "" };
    emit();
    return true;
  } catch (error) {
    if (sequence !== requestSequence) return false;
    session = {
      ...session,
      user,
      ready: true,
      syncing: false,
      error: error instanceof Error ? error.message : "Your Finova demo data could not be loaded.",
    };
    emit();
    return false;
  }
}

function startAuth() {
  if (authStarted || typeof window === "undefined") return;
  authStarted = true;
  onAuthStateChanged(firebaseAuth, user => {
    requestSequence += 1;
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
    if (!user) {
      session = { user: null, workspace: emptyWorkspace, ready: true, syncing: false, error: "" };
      emit();
      return;
    }
    session = { user, workspace: normalize(emptyWorkspace, user), ready: true, syncing: true, error: "" };
    emit();
    void reload(user);
    refreshTimer = setInterval(() => { void reload(firebaseAuth.currentUser, true); }, 25_000);
  });
}

/** A per-user snapshot from the server-owned Finova demo ledger. */
export function useDashboardSession() { return useSyncExternalStore(subscribe, snapshot, serverSnapshot); }
export function useWorkspace() { return useDashboardSession().workspace; }
export async function refreshWorkspace() { return reload(); }

/** Creates the authenticated user's zero-balance demo account on the server. */
export async function provisionWorkspace(user: User, details: RegistrationDetails = {}) {
  const data = await apiRequest<{ workspace: unknown }>("/api/demo/onboarding", { method: "POST", body: JSON.stringify(details) }, user);
  const workspace = workspaceFrom(data, user);
  if (firebaseAuth.currentUser?.uid === user.uid) {
    session = { user, workspace, ready: true, syncing: false, error: "" };
    emit();
  }
  return workspace;
}

/** Saves only user profile/preferences. Financial fields are never sent to this endpoint. */
export async function updateWorkspace(update: (current: Workspace) => Workspace) {
  const user = session.user;
  if (!user) return false;
  const current = session.workspace;
  const updated = normalize(update(current), user);
  session = { ...session, workspace: updated, syncing: true, error: "" };
  emit();
  try {
    const data = await apiRequest<{ workspace: unknown }>("/api/demo/preferences", {
      method: "POST",
      body: JSON.stringify({
        dark: updated.dark,
        profile: updated.profile,
        beneficiaries: updated.beneficiaries,
        tickets: updated.tickets,
        notices: updated.notices,
        drafts: updated.drafts,
      }),
    }, user);
    session = { user, workspace: workspaceFrom(data, user), ready: true, syncing: false, error: "" };
    emit();
    return true;
  } catch (error) {
    session = { ...session, workspace: current, syncing: false, error: error instanceof Error ? error.message : "We could not save that preference." };
    emit();
    return false;
  }
}

export async function createAccount(type: string, accountCurrency: string) {
  try {
    await apiRequest("/api/demo/accounts", { method: "POST", body: JSON.stringify({ accountType: type, currency: accountCurrency, name: "Finova Account" }) });
    await reload(firebaseAuth.currentUser, true);
    return true;
  } catch (error) {
    session = { ...session, error: error instanceof Error ? error.message : "We could not create that account." };
    emit();
    return false;
  }
}

function newRequestKey() {
  return crypto.randomUUID().replace(/-/g, "_");
}

export async function createDeposit(input: { accountId: string; paymentMethodId: string; amount: number; reference?: string }) {
  const data = await apiRequest<{ deposit: Deposit }>("/api/demo/deposits", {
    method: "POST",
    body: JSON.stringify({ ...input, requestKey: newRequestKey() }),
  });
  await reload(firebaseAuth.currentUser, true);
  return data.deposit;
}

export async function uploadDepositProof(depositId: string, file: File) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new FinovaApiError("Your session has ended. Please sign in again.", 401);
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new FinovaApiError("Upload a PDF, JPG, PNG, or WEBP proof no larger than 5 MB.", 400);
  }
  const extension = (file.name.split(".").pop() || "proof").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "proof";
  const storagePath = `deposit-proofs/${user.uid}/${depositId}/${crypto.randomUUID()}.${extension}`;
  await uploadBytes(ref(firebaseStorage, storagePath), file, { contentType: file.type });
  const data = await apiRequest<{ deposit: Deposit }>(`/api/demo/deposits/${encodeURIComponent(depositId)}/proof`, {
    method: "POST",
    body: JSON.stringify({ proofStoragePath: storagePath }),
  }, user);
  await reload(user, true);
  return data.deposit;
}

export type TransferQuote = { senderAccountId: string; recipientAccountId: string; recipientName: string; recipientAccountNumber: string; amount: number; serviceCharge: number; total: number; currency: string; availableBalance: number };

export async function quoteTransfer(input: { accountId: string; recipientAccountNumber: string; amount: number }) {
  return apiRequest<TransferQuote>("/api/demo/transfers/quote", { method: "POST", body: JSON.stringify(input) });
}

export async function createTransfer(input: { accountId: string; recipientAccountNumber: string; amount: number; description?: string; transactionPin?: string }) {
  const data = await apiRequest<{ transfer: TransferQuote & { id: string; status: string } }>("/api/demo/transfers", {
    method: "POST",
    body: JSON.stringify({ ...input, requestKey: newRequestKey() }),
  });
  await reload(firebaseAuth.currentUser, true);
  return data.transfer;
}

export async function setTransactionPin(input: { accountId: string; pin: string; currentPin?: string }) {
  const data = await apiRequest<{ workspace: unknown }>(`/api/demo/accounts/${encodeURIComponent(input.accountId)}/pin`, {
    method: "POST",
    body: JSON.stringify({ pin: input.pin, currentPin: input.currentPin }),
  });
  const user = firebaseAuth.currentUser;
  if (user) {
    session = { user, workspace: workspaceFrom(data, user), ready: true, syncing: false, error: "" };
    emit();
  }
  return true;
}

export async function verifyTransactionPin(input: { accountId: string; pin: string }) {
  return apiRequest<{ verified: boolean }>(`/api/demo/accounts/${encodeURIComponent(input.accountId)}/pin/verify`, {
    method: "POST",
    body: JSON.stringify({ pin: input.pin }),
  });
}

export async function applyForCard(input: { accountId: string; cardType: string; level: string; holder: string; dailyLimit: number }) {
  const data = await apiRequest<{ application: CardApplication }>("/api/demo/cards", {
    method: "POST",
    body: JSON.stringify({ ...input, requestKey: newRequestKey() }),
  });
  await reload(firebaseAuth.currentUser, true);
  return data.application;
}

export function money(value: number, accountCurrency = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: accountCurrency, minimumFractionDigits: 2 }).format(Number(value) || 0); }
  catch { return `${accountCurrency} ${(Number(value) || 0).toFixed(2)}`; }
}

export function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
