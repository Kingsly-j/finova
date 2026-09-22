export const destinations: Record<string, string> = {
  Dashboard: "", Transactions: "accounthistory", Cards: "cards",
  "Local Transfer": "localtransfer", "Finova Transfer": "localtransfer", Transfer: "localtransfer",
  International: "internationaltransfer", Deposit: "deposits",
  "Currency Swap": "swap", Loans: "loan", "Tax Refund": "irs-refund",
  Grants: "grant-application", Settings: "account-settings", Support: "support",
  Notifications: "notifications", Beneficiaries: "beneficiaries",
  "Add beneficiary": "beneficiaries", "Account Information": "account-settings",
  "Card ending 1734": "cards/16", "Card ending 7105": "cards/15",
  "Card ending 9866": "cards/14",
  "Pay Bills": "pay-bills", Request: "request",
};
export const validRoutes = [...new Set([...Object.values(destinations).filter(Boolean),
  "cards/14", "cards/apply", "cards/14/transactions", "cards/15/transactions", "cards/16/transactions",
  "irs-refund/track", "irs-refund/filing-id", "grant-application/my-applications", "grant-application/20",
  "editpass", "manage-account-security", "transaction-pin",
])];
