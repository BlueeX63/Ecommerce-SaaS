"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Truck, Loader2, X, Power } from "lucide-react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";

type DeliveryOption = {
  delivery_option_id: string;
  name: string;
  price: number;
  estimated_days: string | null;
  is_active: boolean;
};

type OptionForm = { name: string; price: string; estimatedDays: string };
const EMPTY_FORM: OptionForm = { name: "", price: "", estimatedDays: "" };

export default function DeliverySettingsPage() {
  const { formatCurrency, currencySymbol } = useCurrency();
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<DeliveryOption | null>(null);
  const [form, setForm] = useState<OptionForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchOptions = async () => {
    try {
      const res = await fetch("/api/v1/dashboard/delivery-options");
      const data = await res.json();
      if (Array.isArray(data)) setOptions(data);
    } catch {
      console.error("Failed to fetch delivery options");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const openAdd = () => {
    setEditingOption(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (option: DeliveryOption) => {
    setEditingOption(option);
    setForm({ name: option.name, price: String(option.price), estimatedDays: option.estimated_days || "" });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      const isEdit = !!editingOption;
      const res = await fetch(isEdit ? `/api/v1/dashboard/delivery-options/${editingOption!.delivery_option_id}` : "/api/v1/dashboard/delivery-options", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, price: Number(form.price), estimated_days: form.estimatedDays || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (isEdit) {
          setOptions((prev) => prev.map((o) => (o.delivery_option_id === data.delivery_option_id ? data : o)));
        } else {
          setOptions((prev) => [data, ...prev]);
        }
        setIsModalOpen(false);
      } else {
        setFormError(data.error || `Failed to ${isEdit ? "update" : "add"} delivery option`);
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (option: DeliveryOption) => {
    setBusyId(option.delivery_option_id);
    try {
      const res = await fetch(`/api/v1/dashboard/delivery-options/${option.delivery_option_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !option.is_active }),
      });
      if (res.ok) {
        setOptions((prev) => prev.map((o) => (o.delivery_option_id === option.delivery_option_id ? { ...o, is_active: !option.is_active } : o)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const removeOption = async (id: string) => {
    if (!confirm("Delete this delivery option? Shoppers will no longer be able to select it at checkout.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/v1/dashboard/delivery-options/${id}`, { method: "DELETE" });
      if (res.ok) setOptions((prev) => prev.filter((o) => o.delivery_option_id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary mb-1">Delivery Options</h2>
          <p className="text-secondary text-sm">Shipping methods shoppers can choose from at checkout.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Option
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-heading font-semibold">{editingOption ? "Edit Delivery Option" : "Add Delivery Option"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Method Name</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Standard Shipping"
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Price ({currencySymbol})</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Estimated Days</label>
                  <input
                    type="text"
                    value={form.estimatedDays}
                    onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                    placeholder="3-5 Business Days"
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingOption ? "Save Changes" : "Add Option"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border border-black/[0.08] rounded-xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.02] border-b border-black/[0.08]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Name</th>
                <th className="px-6 py-4 font-medium text-primary">Price</th>
                <th className="px-6 py-4 font-medium text-primary">ETA</th>
                <th className="px-6 py-4 font-medium text-primary">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary/40 mx-auto" />
                  </td>
                </tr>
              ) : options.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary">
                    <Truck className="w-10 h-10 text-black/10 mx-auto mb-3" />
                    <p>No delivery options yet. Add one so shoppers can check out.</p>
                  </td>
                </tr>
              ) : (
                options.map((o) => (
                  <tr key={o.delivery_option_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-medium text-primary">{o.name}</td>
                    <td className="px-6 py-4 text-secondary">{o.price > 0 ? formatCurrency(o.price) : "Free"}</td>
                    <td className="px-6 py-4 text-secondary">{o.estimated_days || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${o.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {o.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(o)} className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(o)}
                          disabled={busyId === o.delivery_option_id}
                          className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors disabled:opacity-50"
                          title={o.is_active ? "Deactivate" : "Activate"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeOption(o.delivery_option_id)}
                          disabled={busyId === o.delivery_option_id}
                          className="p-1.5 text-secondary hover:bg-red-50 hover:text-red-600 rounded-md transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
