"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Users, Pencil, UserX, UserCheck, X } from "lucide-react";
import { Pagination } from "@/components/dashboard/Pagination";

import { TableSkeletonRows } from "@/components/dashboard/Skeletons";
const PAGE_LIMIT = 50;

type Customer = {
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  status: string;
  customer_groups: { group_name: string } | null;
  created_date: string;
};

type CustomerForm = { firstName: string; lastName: string; phoneNumber: string; email: string };

const EMPTY_FORM: CustomerForm = { firstName: "", lastName: "", phoneNumber: "", email: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState<CustomerForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<CustomerForm>(EMPTY_FORM);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/customers?page=${page}&limit=${PAGE_LIMIT}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || []);
        setMeta({ total: data.meta?.total ?? 0, totalPages: data.meta?.totalPages ?? 0 });
      }
    } catch {
      console.error("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone_number ?? "").toLowerCase().includes(q)
    );
  });

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditForm({ firstName: c.first_name, lastName: c.last_name, phoneNumber: c.phone_number ?? "", email: c.email ?? "" });
    setFormError(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewCustomer(EMPTY_FORM);
        fetchCustomers();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to add customer");
      }
    } catch {
      setFormError("Failed to add customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/v1/customers/${editingCustomer.customer_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingCustomer(null);
        fetchCustomers();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to update customer");
      }
    } catch {
      setFormError("Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (c: Customer) => {
    setBusyId(c.customer_id);
    try {
      const nextStatus = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/v1/customers/${c.customer_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) setCustomers((prev) => prev.map((x) => (x.customer_id === c.customer_id ? { ...x, status: nextStatus } : x)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Customers</h1>
          <p className="text-secondary text-sm">Manage your B2C customers and B2B clients.</p>
        </div>
        <button
          onClick={() => {
            setNewCustomer(EMPTY_FORM);
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-heading font-semibold">{editingCustomer ? "Edit Customer" : "Add New Customer"}</h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingCustomer ? handleEdit : handleAdd} className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">First Name</label>
                  <input
                    required
                    type="text"
                    value={editingCustomer ? editForm.firstName : newCustomer.firstName}
                    onChange={(e) =>
                      editingCustomer
                        ? setEditForm({ ...editForm, firstName: e.target.value })
                        : setNewCustomer({ ...newCustomer, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Last Name</label>
                  <input
                    required
                    type="text"
                    value={editingCustomer ? editForm.lastName : newCustomer.lastName}
                    onChange={(e) =>
                      editingCustomer
                        ? setEditForm({ ...editForm, lastName: e.target.value })
                        : setNewCustomer({ ...newCustomer, lastName: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Phone Number{editingCustomer ? "" : " (Primary)"}</label>
                <input
                  required={!editingCustomer}
                  type="tel"
                  placeholder="+1234567890"
                  value={editingCustomer ? editForm.phoneNumber : newCustomer.phoneNumber}
                  onChange={(e) =>
                    editingCustomer
                      ? setEditForm({ ...editForm, phoneNumber: e.target.value })
                      : setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={editingCustomer ? editForm.email : newCustomer.email}
                  onChange={(e) =>
                    editingCustomer
                      ? setEditForm({ ...editForm, email: e.target.value })
                      : setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingCustomer ? "Save Changes" : "Add Customer"}
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
              placeholder="Search customers by name, email, phone..."
              className="w-full pl-9 pr-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.01] border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Name</th>
                <th className="px-6 py-4 font-medium text-primary">Phone</th>
                <th className="px-6 py-4 font-medium text-primary">Email</th>
                <th className="px-6 py-4 font-medium text-primary">Group</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
                <th className="px-6 py-4 font-medium text-primary text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <TableSkeletonRows rows={6} cols={6} first="text" />
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                    <Users className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>{customers.length === 0 ? "No customers found." : "No customers match your search."}</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-medium text-primary">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="px-6 py-4 text-secondary">{c.phone_number || "-"}</td>
                    <td className="px-6 py-4 text-secondary">{c.email || "-"}</td>
                    <td className="px-6 py-4 text-secondary">{c.customer_groups?.group_name || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(c)}
                          disabled={busyId === c.customer_id}
                          className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors disabled:opacity-50"
                          title={c.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                        >
                          {c.status === "ACTIVE" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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
