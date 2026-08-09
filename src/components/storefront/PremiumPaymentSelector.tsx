"use client";

import { CreditCard, Wallet, Banknote } from "lucide-react";
import { motion } from "framer-motion";

export type PaymentMethod = "cod" | "upi" | "netbanking";

type PaymentSelectorProps = {
  theme?: "dark" | "light";
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
};

export function PremiumPaymentSelector({ theme = "dark", selected, onSelect }: PaymentSelectorProps) {
  const isLight = theme === "light";
  const bgClass = isLight ? "bg-black/5" : "bg-white/5";
  const activeBg = isLight ? "bg-[#111111] text-white shadow-xl" : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]";
  const inactiveText = isLight ? "text-black/60 hover:text-black hover:bg-black/10" : "text-white/60 hover:text-white hover:bg-white/10";
  const borderClass = isLight ? "border-black/10" : "border-white/10";

  const methods = [
    { id: "upi" as PaymentMethod, name: "UPI", icon: Wallet, desc: "GPay, PhonePe, Paytm" },
    { id: "netbanking" as PaymentMethod, name: "Netbanking", icon: CreditCard, desc: "All major banks" },
    { id: "cod" as PaymentMethod, name: "Cash on Delivery", icon: Banknote, desc: "Pay at doorstep" },
  ];

  return (
    <div className="w-full space-y-4">
      <h3 className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-[#111111]' : 'text-white'} border-b ${borderClass} pb-3`}>
        Select Payment Method
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {methods.map((method) => {
          const isActive = selected === method.id;
          const Icon = method.icon;
          
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-xl border border-transparent transition-all duration-300 ${isActive ? activeBg : `${bgClass} ${inactiveText}`}`}
            >
              <Icon className={`w-6 h-6 mb-2 ${isActive ? (isLight ? 'text-white' : 'text-black') : ''}`} />
              <span className="text-sm font-bold tracking-tight mb-1">{method.name}</span>
              <span className={`text-[10px] uppercase tracking-widest ${isActive ? 'opacity-70' : 'opacity-50'}`}>
                {method.desc}
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

      {selected === "upi" && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className={`mt-4 p-4 rounded-lg ${isLight ? 'bg-orange-50 text-orange-800 border border-orange-100' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'} text-sm`}>
          <p className="font-medium flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span>
            Awaiting UPI confirmation. Please approve the request on your UPI app after placing the order.
          </p>
        </motion.div>
      )}
    </div>
  );
}
