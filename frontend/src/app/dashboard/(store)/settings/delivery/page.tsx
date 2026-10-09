"use client";

import { useState, useEffect } from "react";
import { Loader2, Wallet, Banknote, Landmark, Save } from "lucide-react";

type PaymentMethods = {
  cod: { enabled: boolean };
  upi: { enabled: boolean; upiId: string };
  netbanking: { enabled: boolean; bankName: string; accountName: string; accountNumber: string; ifscCode: string };
};

const EMPTY_PAYMENT_METHODS: PaymentMethods = {
  cod: { enabled: true },
  upi: { enabled: true, upiId: "" },
  netbanking: { enabled: true, bankName: "", accountName: "", accountNumber: "", ifscCode: "" },
};

export default function DeliverySettingsPage() {
  const [isLoading, setIsLoading] = useState(true);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>(EMPTY_PAYMENT_METHODS);
  const [isSavingPayments, setIsSavingPayments] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/v1/dashboard/payment-methods");
      if (res.ok) {
        const { data } = await res.json();
        if (data) setPaymentMethods(data);
      }
    } catch {
      console.error("Failed to fetch payment methods");
    }
  };

  useEffect(() => {
    fetchPaymentMethods().finally(() => setIsLoading(false));
  }, []);

  const handleSavePaymentMethods = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayments(true);
    setPaymentMessage(null);
    try {
      const res = await fetch("/api/v1/dashboard/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentMethods),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPaymentMethods(data.data);
        setPaymentMessage({ type: "success", text: "Payment methods updated. Changes are live now." });
      } else {
        setPaymentMessage({ type: "error", text: data.error || "Failed to save payment methods" });
      }
    } catch {
      setPaymentMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setIsSavingPayments(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-primary mb-1">Payment Methods</h2>
          <p className="text-secondary text-sm">
            Choose which payment methods shoppers see at checkout, and where they should actually send the money. This is
            a manual, display-only flow &mdash; there is no payment gateway, so you confirm payment yourself once it arrives.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary/40" />
          </div>
        ) : (
          <form onSubmit={handleSavePaymentMethods} className="space-y-4 max-w-2xl">
            {/* Cash on Delivery */}
            <div className="border border-black/[0.08] rounded-xl p-5 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/[0.04] text-primary shrink-0">
                    <Banknote className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <p className="font-medium text-primary">Cash on Delivery</p>
                    <p className="text-xs text-secondary">Shopper pays in person when the order arrives.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={paymentMethods.cod.enabled}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, cod: { enabled: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-black/10 rounded-full peer-checked:bg-black transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
              </div>
            </div>

            {/* UPI */}
            <div className="border border-black/[0.08] rounded-xl p-5 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/[0.04] text-primary shrink-0">
                    <Wallet className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <p className="font-medium text-primary">UPI</p>
                    <p className="text-xs text-secondary">GPay, PhonePe, Paytm and other UPI apps.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={paymentMethods.upi.enabled}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, upi: { ...paymentMethods.upi, enabled: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-black/10 rounded-full peer-checked:bg-black transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Your UPI ID</label>
                <input
                  type="text"
                  value={paymentMethods.upi.upiId}
                  onChange={(e) => setPaymentMethods({ ...paymentMethods, upi: { ...paymentMethods.upi, upiId: e.target.value } })}
                  placeholder="yourname@upi"
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                />
                <p className="text-xs text-secondary">Shown to shoppers at checkout so they can pay you directly.</p>
              </div>
            </div>

            {/* Netbanking */}
            <div className="border border-black/[0.08] rounded-xl p-5 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/[0.04] text-primary shrink-0">
                    <Landmark className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <p className="font-medium text-primary">Netbanking</p>
                    <p className="text-xs text-secondary">Direct bank transfer to your account.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={paymentMethods.netbanking.enabled}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, netbanking: { ...paymentMethods.netbanking, enabled: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-black/10 rounded-full peer-checked:bg-black transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Account Holder Name</label>
                  <input
                    type="text"
                    value={paymentMethods.netbanking.accountName}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, netbanking: { ...paymentMethods.netbanking, accountName: e.target.value } })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Bank Name</label>
                  <input
                    type="text"
                    value={paymentMethods.netbanking.bankName}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, netbanking: { ...paymentMethods.netbanking, bankName: e.target.value } })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Account Number</label>
                  <input
                    type="text"
                    value={paymentMethods.netbanking.accountNumber}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, netbanking: { ...paymentMethods.netbanking, accountNumber: e.target.value } })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">IFSC Code</label>
                  <input
                    type="text"
                    value={paymentMethods.netbanking.ifscCode}
                    onChange={(e) => setPaymentMethods({ ...paymentMethods, netbanking: { ...paymentMethods.netbanking, ifscCode: e.target.value.toUpperCase() } })}
                    placeholder="SBIN0001234"
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                  />
                </div>
              </div>
            </div>

            {paymentMessage && (
              <div className={`p-3 rounded-lg text-sm ${paymentMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-100"}`}>
                {paymentMessage.text}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPayments}
                className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {isSavingPayments ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Payment Methods
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
