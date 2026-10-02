"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, FileText, X } from "lucide-react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";
import { CustomSelect } from "@/components/CustomSelect";
import { Pagination } from "@/components/dashboard/Pagination";

const PAGE_LIMIT = 50;

type Invoice = {
  invoice_id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  grand_total: number;
  amount_due: number;
  customers: { first_name: string; last_name: string; email: string } | null;
  dealers: { company_name: string } | null;
  orders: { order_number: string } | null;
};

type PartyOption = { id: string; label: string };

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  DRAFT: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-red-100 text-red-700",
  SENT: "bg-blue-100 text-blue-700",
};

export default function InvoicesPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<PartyOption[]>([]);
  const [dealers, setDealers] = useState<PartyOption[]>([]);
  const [partyType, setPartyType] = useState<"customer" | "dealer">("customer");
  const [form, setForm] = useState({
    invoiceNumber: "",
    partyId: "",
    grandTotal: "",
    subtotal: "",
    taxTotal: "",
    shippingTotal: "",
    issueDate: "",
    dueDate: "",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/invoices?page=${page}&limit=${PAGE_LIMIT}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.data || []);
        setMeta({ total: data.meta?.total ?? 0, totalPages: data.meta?.totalPages ?? 0 });
      }
    } catch {
      console.error("Failed to fetch invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page]);

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const client = inv.dealers ? inv.dealers.company_name : inv.customers ? `${inv.customers.first_name} ${inv.customers.last_name}` : "";
    return inv.invoice_number.toLowerCase().includes(q) || client.toLowerCase().includes(q);
  });

  const openCreateModal = async () => {
    setForm({
      invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
      partyId: "",
      grandTotal: "",
      subtotal: "",
      taxTotal: "",
      shippingTotal: "",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      notes: "",
    });
    setFormError(null);
    setPartyType("customer");
    setIsModalOpen(true);
    if (customers.length === 0) {
      const res = await fetch("/api/v1/customers?limit=100");
      if (res.ok) {
        const data = await res.json();
        setCustomers((data.data || []).map((c: { customer_id: string; first_name: string; last_name: string }) => ({ id: c.customer_id, label: `${c.first_name} ${c.last_name}` })));
      }
    }
    if (dealers.length === 0) {
      const res = await fetch("/api/v1/dealers?limit=100");
      if (res.ok) {
        const data = await res.json();
        setDealers((data.data || []).map((d: { dealer_id: string; company_name: string }) => ({ id: d.dealer_id, label: d.company_name })));
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/v1/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: form.invoiceNumber,
          [partyType === "customer" ? "customerId" : "dealerId"]: form.partyId || undefined,
          grandTotal: Number(form.grandTotal),
          subtotal: form.subtotal ? Number(form.subtotal) : undefined,
          taxTotal: form.taxTotal ? Number(form.taxTotal) : undefined,
          shippingTotal: form.shippingTotal ? Number(form.shippingTotal) : undefined,
          issueDate: form.issueDate || undefined,
          dueDate: form.dueDate || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchInvoices();
        router.push(`/dashboard/invoices/${data.data.invoice_id}`);
      } else {
        setFormError(data.error || "Failed to create invoice");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const partyOptions = (partyType === "customer" ? customers : dealers).map((p) => ({ value: p.id, label: p.label }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Invoices</h1>
          <p className="text-secondary text-sm">Manage billing, payments, and overdue invoices.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-heading font-semibold">Create Invoice</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Invoice Number</label>
                <input
                  required
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPartyType("customer")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${partyType === "customer" ? "bg-black text-white border-black" : "border-black/10 text-secondary hover:bg-black/5"}`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setPartyType("dealer")}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${partyType === "dealer" ? "bg-black text-white border-black" : "border-black/10 text-secondary hover:bg-black/5"}`}
                >
                  Dealer
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">{partyType === "customer" ? "Customer" : "Dealer"} (Optional)</label>
                <CustomSelect
                  value={form.partyId}
                  onChange={(v) => setForm({ ...form, partyId: v })}
                  options={partyOptions}
                  placeholder={`Select a ${partyType}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Grand Total</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.grandTotal}
                  onChange={(e) => setForm({ ...form, grandTotal: e.target.value })}
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-secondary">Subtotal</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.subtotal}
                    onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
                    className="w-full px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-secondary">Tax</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.taxTotal}
                    onChange={(e) => setForm({ ...form, taxTotal: e.target.value })}
                    className="w-full px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-secondary">Shipping</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.shippingTotal}
                    onChange={(e) => setForm({ ...form, shippingTotal: e.target.value })}
                    className="w-full px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Issue Date</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number or client..."
              className="w-full pl-9 pr-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.01] border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Invoice Number</th>
                <th className="px-6 py-4 font-medium text-primary">Client</th>
                <th className="px-6 py-4 font-medium text-primary">Issue Date</th>
                <th className="px-6 py-4 font-medium text-primary">Due Date</th>
                <th className="px-6 py-4 font-medium text-primary text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                    <FileText className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>{invoices.length === 0 ? "No invoices found." : "No invoices match your search."}</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.invoice_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-medium text-primary">
                      <Link href={`/dashboard/invoices/${inv.invoice_id}`} className="hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {inv.dealers ? inv.dealers.company_name : inv.customers ? `${inv.customers.first_name} ${inv.customers.last_name}` : "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-secondary">{new Date(inv.issue_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-secondary">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-medium text-primary">{formatCurrency(inv.grand_total)}</p>
                      {inv.amount_due > 0 && <p className="text-xs text-secondary mt-0.5">{formatCurrency(inv.amount_due)} due</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[inv.status] || "bg-gray-100 text-gray-700"}`}>{inv.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_LIMIT} onPageChange={setPage} />
      </div>
    </div>
  );
}
