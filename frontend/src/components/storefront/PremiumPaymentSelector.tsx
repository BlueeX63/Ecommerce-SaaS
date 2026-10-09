"use client";

import { useState } from "react";
import { Banknote, Check, Copy, Landmark, Smartphone } from "lucide-react";

export type PaymentMethod = "cod" | "upi" | "netbanking";

export interface PaymentMethodDetails {
  upi?: { enabled: boolean; upiId?: string };
  netbanking?: { enabled: boolean; bankName?: string; accountName?: string; accountNumber?: string; ifscCode?: string };
  cod?: { enabled: boolean };
}

/**
 * Merges the Online Payment Integration add-on gate with the merchant's own per-method toggles.
 * `onlinePaymentsEnabled === false` forces COD-only regardless of what's configured (the add-on gate
 * always wins); otherwise only methods the merchant explicitly enabled (or left unconfigured) show up.
 */
export function resolveAllowedMethods(
  onlinePaymentsEnabled: boolean | undefined,
  configured: PaymentMethodDetails | undefined,
): PaymentMethod[] | undefined {
  if (onlinePaymentsEnabled === false) return ["cod"];
  if (!configured) return undefined;
  const all: PaymentMethod[] = ["upi", "netbanking", "cod"];
  const enabled = all.filter((m) => configured[m]?.enabled !== false);
  return enabled.length ? enabled : undefined;
}

type PaymentSelectorProps = {
  theme?: "dark" | "light";
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  /** Defaults to all three. Pass ["cod"] for stores that haven't purchased Online Payment Integration. */
  allowedMethods?: PaymentMethod[];
  /** Merchant-provided UPI ID / bank details to show the shopper once a method is selected. */
  details?: PaymentMethodDetails;
  /** Optional accent colour class for the selected state's ring/dot, e.g. "ring-[#00ffaa]". Defaults to the theme's ink colour. */
  accentRing?: string;
  accentDot?: string;
};

const METHODS = [
  { id: "upi" as const, name: "UPI", desc: "Pay with GPay, PhonePe, Paytm or any UPI app", icon: Smartphone },
  { id: "netbanking" as const, name: "Netbanking", desc: "Bank transfer from any major bank", icon: Landmark },
  { id: "cod" as const, name: "Cash on Delivery", desc: "Pay in cash when your order arrives", icon: Banknote },
];

function CopyValue({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable (insecure context) - the value is still selectable on screen
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className={`text-[10px] uppercase tracking-widest ${dark ? "text-white/40" : "text-black/40"}`}>{label}</p>
        <p className="font-mono text-sm break-all select-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className={`shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          dark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-black"
        }`}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function PremiumPaymentSelector({ theme = "dark", selected, onSelect, allowedMethods, details, accentRing, accentDot }: PaymentSelectorProps) {
  const dark = theme === "dark";
  const methods = allowedMethods ? METHODS.filter((m) => allowedMethods.includes(m.id)) : METHODS;

  const idle = dark ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20" : "border-black/10 bg-white hover:bg-black/[0.02] hover:border-black/20";
  const active = dark ? `border-transparent bg-white/[0.08] ring-2 ${accentRing ?? "ring-white"}` : `border-transparent bg-black/[0.03] ring-2 ${accentRing ?? "ring-[#111111]"}`;
  const tile = dark ? "bg-white/10 text-white" : "bg-black/5 text-black";
  const sub = dark ? "text-white/50" : "text-black/50";
  const panel = dark ? "border-white/10 bg-white/[0.04] text-white" : "border-black/10 bg-black/[0.03] text-black";

  return (
    <fieldset className="w-full min-w-0">
      <legend className="sr-only">Payment method</legend>

      <div role="radiogroup" className="flex flex-col gap-3">
        {methods.map((method) => {
          const isActive = selected === method.id;
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(method.id)}
              className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isActive ? active : idle
              }`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tile}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-tight">{method.name}</span>
                <span className={`mt-0.5 block text-xs leading-snug ${sub}`}>{method.desc}</span>
              </span>
              <span
                aria-hidden
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  isActive ? (dark ? "border-white" : "border-[#111111]") : dark ? "border-white/25" : "border-black/25"
                }`}
              >
                {isActive && <span className={`h-2.5 w-2.5 rounded-full ${accentDot ?? (dark ? "bg-white" : "bg-[#111111]")}`} />}
              </span>
            </button>
          );
        })}
      </div>

      {selected === "upi" && (
        <div className={`mt-4 rounded-xl border p-4 text-sm ${panel}`}>
          {details?.upi?.upiId ? (
            <>
              <CopyValue label="Pay to UPI ID" value={details.upi.upiId} dark={dark} />
              <p className={`mt-2 text-xs leading-relaxed ${sub}`}>
                Send the total amount to this UPI ID from any UPI app, then place your order. The store confirms your payment before shipping.
              </p>
            </>
          ) : (
            <p className={`text-xs leading-relaxed ${sub}`}>The store will share UPI payment details after you place your order.</p>
          )}
        </div>
      )}

      {selected === "netbanking" && (
        <div className={`mt-4 rounded-xl border p-4 text-sm ${panel}`}>
          {details?.netbanking && (details.netbanking.accountNumber || details.netbanking.accountName) ? (
            <>
              <p className={`mb-1 text-xs ${sub}`}>Transfer the total to this account, then place your order:</p>
              <div className={`divide-y ${dark ? "divide-white/10" : "divide-black/10"}`}>
                {details.netbanking.accountName && <CopyValue label="Account name" value={details.netbanking.accountName} dark={dark} />}
                {details.netbanking.accountNumber && <CopyValue label="Account number" value={details.netbanking.accountNumber} dark={dark} />}
                {details.netbanking.ifscCode && <CopyValue label="IFSC code" value={details.netbanking.ifscCode} dark={dark} />}
                {details.netbanking.bankName && <CopyValue label="Bank" value={details.netbanking.bankName} dark={dark} />}
              </div>
            </>
          ) : (
            <p className={`text-xs leading-relaxed ${sub}`}>The store will share bank transfer details after you place your order.</p>
          )}
        </div>
      )}

      {selected === "cod" && (
        <div className={`mt-4 rounded-xl border p-4 text-xs leading-relaxed ${panel} ${sub}`}>
          Keep the exact amount ready when your order arrives. If you ever need a refund on a Cash on Delivery order, we&apos;ll ask for your bank details so we can send it to you.
        </div>
      )}
    </fieldset>
  );
}
