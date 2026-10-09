"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Printer, Plus, User, Building2, Loader2 } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";

import { DetailSkeleton, LoadingRegion } from "@/components/dashboard/Skeletons";
interface Payment {
  payment_id: string;
  payment_method: string;
  transaction_id: string | null;
  amount: number;
  status: string;
  payment_date: string;
}

interface InvoiceDetail {
  invoice_id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  grand_total: number;
  amount_paid: number;
  amount_due: number;
  notes: string | null;
  customers: { customer_id: string; first_name: string; last_name: string; email: string | null; phone_number: string | null } | null;
  dealers: { dealer_id: string; company_name: string; contact_email: string | null; contact_phone: string | null } | null;
  orders: { order_id: string; order_number: string } | null;
  payments: Payment[];
}

const STATUS_OPTIONS = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"];
const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  DRAFT: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-red-100 text-red-700",
  SENT: "bg-blue-100 text-blue-700",
};
const PAYMENT_METHODS = ["CREDIT_CARD", "PAYPAL", "BANK_TRANSFER", "CASH", "STORE_CREDIT"];

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-primary">
        {icon}
        <h3 className="font-heading text-sm uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { formatCurrency } = useCurrency();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", paymentMethod: "CASH", transactionId: "" });
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/v1/invoices/${invoiceId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data.data);
      } else {
        setError("Invoice not found");
      }
    } catch {
      setError("Failed to load invoice");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const updateStatus = async (status: string) => {
    if (!invoice) return;
    setIsSavingStatus(true);
    try {
      const res = await fetch(`/api/v1/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) setInvoice({ ...invoice, status });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayment(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId || undefined,
          invoiceId,
        }),
      });
      if (res.ok) {
        setShowPaymentForm(false);
        setPaymentForm({ amount: "", paymentMethod: "CASH", transactionId: "" });
        fetchInvoice();
      } else {
        const data = await res.json();
        setPaymentError(data.error || "Failed to record payment");
      }
    } catch {
      setPaymentError("Something went wrong. Please try again.");
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingRegion label="Loading">
        <DetailSkeleton />
      </LoadingRegion>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <FileText className="w-12 h-12 text-black/10 mx-auto mb-3" />
        <p className="text-secondary">{error || "Invoice not found"}</p>
        <Link href="/dashboard/invoices" className="text-sm text-primary underline mt-4 inline-block">
          Back to Invoices
        </Link>
      </div>
    );
  }

  const client = invoice.dealers
    ? { name: invoice.dealers.company_name, email: invoice.dealers.contact_email, phone: invoice.dealers.contact_phone, isDealer: true }
    : invoice.customers
      ? { name: `${invoice.customers.first_name} ${invoice.customers.last_name}`, email: invoice.customers.email, phone: invoice.customers.phone_number, isDealer: false }
      : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 print:max-w-full">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard/invoices" className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 text-primary rounded-lg hover:bg-black/5 transition-colors text-sm font-medium"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">{invoice.invoice_number}</h1>
          <p className="text-secondary text-sm">
            Issued {new Date(invoice.issue_date).toLocaleDateString()}
            {invoice.due_date && ` · Due ${new Date(invoice.due_date).toLocaleDateString()}`}
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${STATUS_STYLES[invoice.status] || "bg-gray-100 text-gray-700"}`}>{invoice.status}</span>
          <div className="w-44">
            <CustomSelect
              value={invoice.status}
              onChange={updateStatus}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
          </div>
          {isSavingStatus && <Loader2 className="w-4 h-4 animate-spin text-secondary" />}
        </div>
        <span className={`hidden print:inline-block px-3 py-1.5 text-xs font-medium rounded-full ${STATUS_STYLES[invoice.status] || "bg-gray-100 text-gray-700"}`}>
          {invoice.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 shadow-sm">
            <h3 className="font-heading text-sm uppercase tracking-widest text-primary mb-4">Amount Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-secondary">Subtotal</span><span className="text-primary">{formatCurrency(invoice.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-secondary">Tax</span><span className="text-primary">{formatCurrency(invoice.tax_total)}</span></div>
              <div className="flex justify-between"><span className="text-secondary">Shipping</span><span className="text-primary">{formatCurrency(invoice.shipping_total)}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t border-black/[0.06]"><span className="text-primary">Grand Total</span><span className="text-primary">{formatCurrency(invoice.grand_total)}</span></div>
              <div className="flex justify-between text-green-700"><span>Amount Paid</span><span>{formatCurrency(invoice.amount_paid)}</span></div>
              <div className="flex justify-between font-semibold"><span className="text-primary">Amount Due</span><span className="text-primary">{formatCurrency(invoice.amount_due)}</span></div>
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm uppercase tracking-widest text-primary">Payment History</h3>
              {invoice.amount_due > 0 && (
                <button
                  onClick={() => setShowPaymentForm((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline print:hidden"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Record Payment
                </button>
              )}
            </div>

            {showPaymentForm && (
              <form onSubmit={recordPayment} className="mb-4 p-4 bg-black/[0.02] rounded-xl space-y-3 print:hidden">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-secondary">Amount</label>
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={invoice.amount_due}
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-secondary">Method</label>
                    <CustomSelect
                      value={paymentForm.paymentMethod}
                      onChange={(v) => setPaymentForm({ ...paymentForm, paymentMethod: v })}
                      options={PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace(/_/g, " ") }))}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-secondary">Transaction ID (Optional)</label>
                  <input
                    type="text"
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowPaymentForm(false)} className="px-3 py-1.5 text-sm text-secondary hover:text-primary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSavingPayment} className="px-4 py-1.5 bg-black text-white text-sm rounded-lg hover:bg-black/90 disabled:opacity-50">
                    {isSavingPayment ? "Saving..." : "Record Payment"}
                  </button>
                </div>
              </form>
            )}

            {invoice.payments.length === 0 ? (
              <p className="text-sm text-secondary py-4 text-center">No payments recorded yet.</p>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {invoice.payments.map((p) => (
                  <div key={p.payment_id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="text-primary font-medium">{p.payment_method.replace(/_/g, " ")}</p>
                      <p className="text-xs text-secondary">{new Date(p.payment_date).toLocaleString()}{p.transaction_id ? ` · ${p.transaction_id}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-medium">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-secondary">{p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {invoice.notes && (
            <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 shadow-sm">
              <h3 className="font-heading text-sm uppercase tracking-widest text-primary mb-3">Notes</h3>
              <p className="text-sm text-secondary whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <InfoCard icon={client?.isDealer ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />} title="Billed To">
            {client ? (
              <div className="text-sm space-y-1">
                <p className="text-primary font-medium">{client.name}</p>
                {client.email && <p className="text-secondary">{client.email}</p>}
                {client.phone && <p className="text-secondary">{client.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-secondary">No customer or dealer linked.</p>
            )}
          </InfoCard>

          {invoice.orders && (
            <InfoCard icon={<FileText className="w-4 h-4" />} title="Related Order">
              <Link href={`/dashboard/orders/${invoice.orders.order_id}`} className="text-sm text-primary hover:underline">
                {invoice.orders.order_number}
              </Link>
            </InfoCard>
          )}
        </div>
      </div>
    </div>
  );
}
