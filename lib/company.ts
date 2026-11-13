// Company details shown across the portal. Change them here and every page,
// message template and payment request picks up the new values.
export const COMPANY = {
  /** Name shown in the sidebar, footers and message templates. */
  name: "Company CRM",
  /** Registered name shown on employment details and payment requests. */
  legalName: "Company CRM Pvt. Ltd.",
  /** Shown when there is no logo. */
  initials: "CC",
  payments: {
    /** UPI ID that receives client payments. Replace with the company's own. */
    upiId: "companycrm@upi",
    /** Name the client sees in their UPI app when paying. */
    payeeName: "Company CRM Pvt. Ltd.",
    currency: "INR",
  },
} as const;

/** Builds a standard UPI payment link that any UPI app (GPay, PhonePe, Paytm, BHIM) can open. */
export function buildUpiLink({ amount, note, reference }: { amount: number; note?: string; reference?: string }) {
  const params = new URLSearchParams({
    pa: COMPANY.payments.upiId,
    pn: COMPANY.payments.payeeName,
    am: amount.toFixed(2),
    cu: COMPANY.payments.currency,
  });
  if (note) params.set("tn", note.slice(0, 80));
  if (reference) params.set("tr", reference);
  return `upi://pay?${params.toString()}`;
}
