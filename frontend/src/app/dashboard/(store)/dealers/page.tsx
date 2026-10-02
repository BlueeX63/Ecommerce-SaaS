"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Briefcase, Pencil, UserX, UserCheck, X } from "lucide-react";
import { Pagination } from "@/components/dashboard/Pagination";

const PAGE_LIMIT = 50;

type Dealer = {
  dealer_id: string;
  company_name: string;
  tax_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  payment_terms: string | null;
  credit_limit: number;
  dealer_branches: { branch_name: string; city: string }[];
};

type DealerForm = {
  companyName: string;
  taxId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  paymentTerms: string;
  creditLimit: string;
};

const EMPTY_FORM: DealerForm = {
  companyName: "",
  taxId: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  paymentTerms: "",
  creditLimit: "",
};

function toFormValues(d: Dealer): DealerForm {
  return {
    companyName: d.company_name,
    taxId: d.tax_id ?? "",
    contactName: d.contact_name ?? "",
    contactEmail: d.contact_email ?? "",
    contactPhone: d.contact_phone ?? "",
    paymentTerms: d.payment_terms ?? "",
    creditLimit: d.credit_limit ? String(d.credit_limit) : "",
  };
}

function toPayload(form: DealerForm) {
  return {
    companyName: form.companyName,
    taxId: form.taxId || undefined,
    contactName: form.contactName || undefined,
    contactEmail: form.contactEmail || undefined,
    contactPhone: form.contactPhone || undefined,
    paymentTerms: form.paymentTerms || undefined,
    creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
  };
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [form, setForm] = useState<DealerForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchDealers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/dealers?page=${page}&limit=${PAGE_LIMIT}`);
      if (res.ok) {
        const data = await res.json();
        setDealers(data.data || []);
        setMeta({ total: data.meta?.total ?? 0, totalPages: data.meta?.totalPages ?? 0 });
      }
    } catch {
      console.error("Failed to fetch dealers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, [page]);

  const filteredDealers = dealers.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      d.company_name.toLowerCase().includes(q) ||
      (d.contact_name ?? "").toLowerCase().includes(q) ||
      (d.contact_email ?? "").toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEdit = (d: Dealer) => {
    setEditingDealer(d);
    setForm(toFormValues(d));
    setFormError(null);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingDealer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const isEdit = !!editingDealer;
      const res = await fetch(isEdit ? `/api/v1/dealers/${editingDealer!.dealer_id}` : "/api/v1/dealers", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      if (res.ok) {
        closeModal();
        fetchDealers();
      } else {
        const data = await res.json();
        setFormError(data.error || `Failed to ${isEdit ? "update" : "add"} dealer`);
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (d: Dealer) => {
    setBusyId(d.dealer_id);
    try {
      const nextStatus = d.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/v1/dealers/${d.dealer_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) setDealers((prev) => prev.map((x) => (x.dealer_id === d.dealer_id ? { ...x, status: nextStatus } : x)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Wholesale & Dealers</h1>
          <p className="text-secondary text-sm">Manage B2B partners, credit limits, and branches.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Dealer
        </button>
      </div>

      {(isAddModalOpen || editingDealer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-heading font-semibold">{editingDealer ? "Edit Dealer" : "Add New Dealer"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Company Name</label>
                <input
                  required
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Contact Name</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Tax ID</label>
                  <input
                    type="text"
                    value={form.taxId}
                    onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Contact Email</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Contact Phone</label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Payment Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. Net 30"
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Credit Limit</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.creditLimit}
                    onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingDealer ? "Save Changes" : "Add Dealer"}
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
              placeholder="Search by company name or contact..."
              className="w-full pl-9 pr-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.01] border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Company</th>
                <th className="px-6 py-4 font-medium text-primary">Contact</th>
                <th className="px-6 py-4 font-medium text-primary">Terms</th>
                <th className="px-6 py-4 font-medium text-primary">Branches</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
                <th className="px-6 py-4 font-medium text-primary text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : filteredDealers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                    <Briefcase className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>{dealers.length === 0 ? "No dealers found." : "No dealers match your search."}</p>
                  </td>
                </tr>
              ) : (
                filteredDealers.map((d) => (
                  <tr key={d.dealer_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-medium text-primary">{d.company_name}</td>
                    <td className="px-6 py-4">
                      <p className="text-primary">{d.contact_name || "-"}</p>
                      <p className="text-xs text-secondary">{d.contact_email}</p>
                    </td>
                    <td className="px-6 py-4 text-secondary">{d.payment_terms || "-"}</td>
                    <td className="px-6 py-4 text-secondary">{d.dealer_branches?.length || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          d.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(d)}
                          className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(d)}
                          disabled={busyId === d.dealer_id}
                          className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors disabled:opacity-50"
                          title={d.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                        >
                          {d.status === "ACTIVE" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
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
