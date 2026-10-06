"use client";

import { useState } from "react";
import { CreditCard, Wallet, Banknote } from "lucide-react";
import { motion } from "framer-motion";

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
};

export function PremiumPaymentSelector({ theme = "dark", selected, onSelect, allowedMethods, details }: PaymentSelectorProps) {
  const isLight = theme === "light";
  const bgClass = isLight ? "bg-black/5" : "bg-white/5";
  const activeBg = isLight ? "bg-[#111111] text-white shadow-xl" : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]";
  const inactiveText = isLight ? "text-black/60 hover:text-black hover:bg-black/10" : "text-white/60 hover:text-white hover:bg-white/10";
  const borderClass = isLight ? "border-black/10" : "border-white/10";

  const allMethods = [
    { id: "upi" as PaymentMethod, name: "UPI", icon: Wallet, desc: "GPay, PhonePe, Paytm" },
    { id: "netbanking" as PaymentMethod, name: "Netbanking", icon: CreditCard, desc: "All major banks" },
    { id: "cod" as PaymentMethod, name: "Cash on Delivery", icon: Banknote, desc: "Pay at doorstep" },
  ];
  const methods = allowedMethods ? allMethods.filter((m) => allowedMethods.includes(m.id)) : allMethods;

  // Payment instructions (UPI ID, bank details) are revealed only after the shopper confirms the method with
  // "Continue to payment". Changing the method hides them again.
  const [confirmed, setConfirmed] = useState(false);
  const choose = (method: PaymentMethod) => {
    setConfirmed(false);
    onSelect(method);
  };
  const needsDetails = selected === "upi" || (selected === "netbanking" && !!details?.netbanking);

  return (
    <div className="w-full space-y-4">
      <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-[#111111]' : 'text-white'} border-b ${borderClass} pb-3`}>
        Select Payment Method
      </h3>
      
      <div className="flex flex-col gap-3">
        {methods.map((method) => {
          const isActive = selected === method.id;
          const Icon = method.icon;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => choose(method.id)}
              className={`relative flex items-center gap-4 p-4 sm:p-5 rounded-xl border border-transparent transition-all duration-300 text-left ${isActive ? activeBg : `${bgClass} ${inactiveText}`}`}
            >
              <span className={`flex items-center justify-center w-11 h-11 rounded-lg shrink-0 ${isActive ? (isLight ? 'bg-white/15' : 'bg-black/10') : (isLight ? 'bg-black/5' : 'bg-white/10')}`}>
                <Icon className={`w-5 h-5 ${isActive ? (isLight ? 'text-white' : 'text-black') : ''}`} />
              </span>

              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold tracking-tight">{method.name}</span>
                <span className={`block text-xs mt-0.5 ${isActive ? 'opacity-70' : 'opacity-50'}`}>
                  {method.desc}
                </span>
              </span>

              <span
                className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isActive
                    ? isLight ? 'border-white' : 'border-black'
                    : isLight ? 'border-black/20' : 'border-white/20'
                }`}
              >
                {isActive && <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-white' : 'bg-black'}`} />}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activePaymentBorder"
                  className={`absolute inset-0 border-2 rounded-xl pointer-events-none ${isLight ? 'border-[#111111]' : 'border-white'}`}
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {needsDetails && !confirmed && (
        <button
          type="button"
          onClick={() => setConfirmed(true)}
          className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-colors ${isLight ? "bg-[#111111] text-white hover:bg-black/85" : "bg-white text-black hover:bg-white/85"}`}
        >
          Continue to payment
        </button>
      )}

      {confirmed && selected === "upi" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-4 rounded-lg ${isLight ? 'bg-orange-50 text-orange-800 border border-orange-100' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'} text-sm space-y-2`}>
          {details?.upi?.upiId && (
            <p className="font-medium">
              Pay to UPI ID: <span className="font-mono">{details.upi.upiId}</span>
            </p>
          )}
          <p className="font-medium flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span>
            Awaiting UPI confirmation. Please approve the request on your UPI app after placing the order.
          </p>
        </motion.div>
      )}

      {confirmed && selected === "netbanking" && details?.netbanking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-4 rounded-lg text-sm space-y-1.5 ${isLight ? 'bg-blue-50 text-blue-800 border border-blue-100' : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'}`}
        >
          <p className="font-medium mb-1">Transfer to this account, then place your order:</p>
          {details.netbanking.accountName && <p>Account Name: <span className="font-mono">{details.netbanking.accountName}</span></p>}
          {details.netbanking.accountNumber && <p>Account Number: <span className="font-mono">{details.netbanking.accountNumber}</span></p>}
          {details.netbanking.ifscCode && <p>IFSC Code: <span className="font-mono">{details.netbanking.ifscCode}</span></p>}
          {details.netbanking.bankName && <p>Bank: <span className="font-mono">{details.netbanking.bankName}</span></p>}
        </motion.div>
      )}
    </div>
  );
}
