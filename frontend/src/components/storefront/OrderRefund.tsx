"use client";

import { useState } from "react";
import { Banknote, Loader2, Landmark, ShieldCheck } from "lucide-react";
import type { AccountTheme } from "@/components/storefront/AccountCenter";

export interface RefundInfo {
  refundId: string;
  amount: number;
  method: "SOURCE" | "BANK_TRANSFER";
  sourcePaymentMethod: string | null;
  status: "REQUESTED" | "APPROVED" | "PROCESSED" | "REJECTED";
  reason: string | null;
  bankAccount: { name: string | null; number: string | null; ifsc: string | null } | null;
  reference: string | null;
  note: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export interface RefundEligibility {
  eligible: boolean;
  reason: string | null;
  method: "SOURCE" | "BANK_TRANSFER";
  needsBankDetails: boolean;
  amount: number;
}

const STATUS_COPY: Record<RefundInfo["status"], string> = {
  REQUESTED: "Refund requested — waiting for the store to review it.",
  APPROVED: "Refund approved — the store is processing the transfer.",
  PROCESSED: "Refund sent.",
  REJECTED: "Refund declined.",
};

const PAYMENT_LABEL: Record<string, string> = { upi: "UPI", netbanking: "bank account", cod: "Cash on Delivery" };

/** Read-only status banner for a refund that already exists. */
export function RefundStatus({ refund, symbol, theme }: { refund: RefundInfo; symbol: string; theme: AccountTheme }) {
  const t = theme;
  const destination =
    refund.method === "SOURCE"
      ? `your original ${PAYMENT_LABEL[refund.sourcePaymentMethod ?? ""] ?? "payment method"}`
      : refund.bankAccount
        ? `${refund.bankAccount.name ?? "your account"} (${refund.bankAccount.number ?? ""})`
        : "your bank account";
  return (
    <div className={`mt-5 border p-4 text-sm ${t.rounded} ${t.cardBorder}`} role="status">
      <div className="mb-1 flex items-center gap-2 font-semibold">
        <Banknote className="h-4 w-4" />
        {symbol}
        {Number(refund.amount).toFixed(2)} refund
      </div>
      <p>{STATUS_COPY[refund.status]}</p>
      <p className={`mt-1 text-xs ${t.textMuted}`}>
        {refund.status === "PROCESSED"
          ? `Sent to ${destination}${refund.reference ? ` · Ref: ${refund.reference}` : ""}. It can take a few working days to show in your account.`
          : refund.status === "REJECTED"
            ? refund.note || "Contact the store if you think this is a mistake."
            : `It will be sent to ${destination} once approved.`}
      </p>
    </div>
  );
}

/** Refund application. Cash on Delivery orders have no payment source to return to, so bank details are collected. */
export function RefundForm({
  orderId,
  eligibility,
  symbol,
  theme,
  onDone,
  onCancel,
}: {
  orderId: string;
  eligibility: RefundEligibility;
  symbol: string;
  theme: AccountTheme;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = theme;
  const [reason, setReason] = useState("");
  const [bank, setBank] = useState({ accountName: "", accountNumber: "", confirmNumber: "", ifsc: "", bankName: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsBank = eligibility.needsBankDetails;
  const mismatch = needsBank && bank.confirmNumber !== "" && bank.confirmNumber !== bank.accountNumber;
  const canSubmit =
    reason.trim().length >= 3 &&
    !busy &&
    (!needsBank || (bank.accountName.trim().length >= 2 && /^\d{6,20}$/.test(bank.accountNumber) && bank.accountNumber === bank.confirmNumber && /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(bank.ifsc.trim())));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/store/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          bank: needsBank
            ? { accountName: bank.accountName.trim(), accountNumber: bank.accountNumber.trim(), ifsc: bank.ifsc.trim().toUpperCase(), bankName: bank.bankName.trim() || undefined }
            : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(Array.isArray(data.details) && data.details.length ? data.details.join(" · ") : data.error || "Could not submit your refund request.");
        return;
      }
      onDone();
    } catch {
      setError("Could not submit your refund request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = `w-full border bg-transparent px-3 py-2.5 text-sm focus:outline-none ${t.rounded} ${t.cardBorder}`;
  const label = `mb-1 block text-xs font-medium ${t.textMuted}`;

  return (
    <form onSubmit={submit} className={`mt-5 space-y-4 border p-4 sm:p-5 ${t.rounded} ${t.cardBorder}`}>
      <div>
        <p className="text-sm font-semibold">
          Request a refund of {symbol}
          {eligibility.amount.toFixed(2)}
        </p>
        <p className={`mt-1 flex items-start gap-2 text-xs leading-relaxed ${t.textMuted}`}>
          {needsBank ? <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          {needsBank
            ? "This was a Cash on Delivery order, so we'll send your refund by bank transfer. Please enter the account to receive it."
            : "This order was paid online, so the refund goes back to the account or UPI you paid from — no bank details needed."}
        </p>
      </div>

      <div>
        <label htmlFor={`rf-reason-${orderId}`} className={label}>
          Reason for refund
        </label>
        <textarea id={`rf-reason-${orderId}`} rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className={`${field} resize-none`} placeholder="Tell us what went wrong…" />
      </div>

      {needsBank && (
        <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <legend className="sr-only">Bank details</legend>
          <div className="sm:col-span-2">
            <label htmlFor={`rf-name-${orderId}`} className={label}>
              Account holder name
            </label>
            <input id={`rf-name-${orderId}`} autoComplete="off" value={bank.accountName} onChange={(e) => setBank({ ...bank, accountName: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor={`rf-acc-${orderId}`} className={label}>
              Account number
            </label>
            <input id={`rf-acc-${orderId}`} inputMode="numeric" autoComplete="off" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, "") })} className={field} />
          </div>
          <div>
            <label htmlFor={`rf-acc2-${orderId}`} className={label}>
              Confirm account number
            </label>
            <input id={`rf-acc2-${orderId}`} inputMode="numeric" autoComplete="off" value={bank.confirmNumber} onChange={(e) => setBank({ ...bank, confirmNumber: e.target.value.replace(/\D/g, "") })} className={field} />
            {mismatch && <p className="mt-1 text-xs text-red-500">Account numbers don&apos;t match.</p>}
          </div>
          <div>
            <label htmlFor={`rf-ifsc-${orderId}`} className={label}>
              IFSC code
            </label>
            <input id={`rf-ifsc-${orderId}`} autoComplete="off" maxLength={11} value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} className={`${field} uppercase`} placeholder="SBIN0001234" />
          </div>
          <div>
            <label htmlFor={`rf-bank-${orderId}`} className={label}>
              Bank name <span className="opacity-60">(optional)</span>
            </label>
            <input id={`rf-bank-${orderId}`} value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} className={field} />
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={!canSubmit} className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold ${t.rounded} ${t.accentBg} ${t.accentText} disabled:opacity-50`}>
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Submit refund request
        </button>
        <button type="button" onClick={onCancel} className={`px-4 py-2.5 text-xs font-medium ${t.textMuted}`}>
          Cancel
        </button>
      </div>
    </form>
  );
}
