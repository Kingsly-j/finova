# Finova demo banking workspace

Finova is a controlled demonstration environment. It has no connected bank rails, wallet settlement, payment processor, or live card network.

## User flow

- Firebase Authentication provides registration, sign-in, password reset, email verification, and sign-out.
- Registration calls the protected onboarding API, which creates one zero-balance, server-owned Finova demo account.
- Dashboard balances, account activity, cards, deposit requests, and transfer requests are read through authenticated server APIs.
- Users can update a profile, appearance, internal recipients, notifications, and support tickets.
- A user can create a pending deposit request from an administrator-configured payment method, upload one PDF/image proof, and wait for an admin decision.
- Only Finova-to-Finova internal transfers are available. The server calculates the fixed service charge and reserves the total until an admin approves or rejects it.
- A demo-card application snapshots the fixed card fee. Approval debits that fee once and issues a clearly labelled demo-only virtual card.

## Administrator flow

The console is deliberately absent from navigation. Enter `finova` anywhere outside an input, textarea, select, or editable element, or open the unlinked `/finova-control` route. Both lead to the gated `/admin?access=finova` screen.

This is only a discreet entry mechanism. Every admin API also verifies a Firebase `admin`/`finovaAdmin` custom claim (or a trusted `adminUsers` document) on the server.

Administrators can:

- configure or disable sandbox payment methods and crypto destinations;
- review/reject/approve submitted deposit proofs;
- review/reject/approve internal transfers;
- review/reject/approve demo-card applications;
- set the fixed card fee and internal-transfer charge;
- manually credit an active demo account with a mandatory reason and an auditable ledger entry.

## Data boundary

All monetary values are stored as integer minor units in server-only Firestore collections:

```text
accounts                 server-owned account balances
ledgerEntries            immutable approved balance activity
depositRequests          user requests and stored proof paths
transferRequests         reserved, then approved/rejected internal transfers
cardApplications/cards   request queue and demo-only issued cards
paymentMethods           administrator-managed sandbox destinations
appConfig/operations     fixed demo fees and controls
auditEvents/manualCredits server audit records
```

The browser has no direct Firestore access. [firestore.rules](firestore.rules) denies every client read/write. [storage.rules](storage.rules) permits only a signed-in user to create a bounded PDF/JPEG/PNG/WEBP proof below `deposit-proofs/{uid}/{depositId}/`; it cannot be overwritten, read, or deleted from the browser.

Deploy both before testing hosted uploads:

```text
firebase deploy --only firestore:rules,storage
```

## Server configuration and first administrator

Set **server-only** Firebase Admin credentials in the hosting environment. Use either `FIREBASE_SERVICE_ACCOUNT_JSON` or the three `FIREBASE_ADMIN_*` variables documented in [.env.local.example](.env.local.example). Do not put them in a `NEXT_PUBLIC_` variable.

Then provision the initial administrator without writing its password into the repository:

```powershell
$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_PASSWORD = 'a-unique-password-at-least-12-characters'
npm.cmd run provision:admin
```

The provisioning script creates/updates the Firebase Auth user, writes `admin: true` and `finovaAdmin: true` custom claims, and creates a trusted `adminUsers/{uid}` record. Sign out/in afterwards to refresh the claim.

## Verification

```text
npx tsc --noEmit
npm run lint
npm run build
```

Manual smoke sequence:

1. Provision an admin and add an enabled sandbox payment method.
2. Register two users; each should receive a zero-balance Finova account.
3. Have one user create a deposit request, upload proof, then approve it from the admin console.
4. Request/approve a demo card and verify the fixed fee is debited once.
5. Submit a Finova-to-Finova transfer; verify its server-calculated fee, then approve/reject it from admin.
6. Confirm that `/admin` stays hidden until the shortcut/URL is used and that a non-admin gets `403` from every `/api/admin/*` endpoint.
