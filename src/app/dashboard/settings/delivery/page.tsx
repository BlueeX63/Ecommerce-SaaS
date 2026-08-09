"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";

export default function DeliverySettingsPage() {
  const [options, setOptions] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: '', price: 0, estimated_days: '' });
  const { formatCurrency, currencySymbol } = useCurrency();

  useEffect(() => {
    fetch('/api/v1/dashboard/delivery-options').then(r => r.json()).then(data => { if(Array.isArray(data)) setOptions(data); });
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/v1/dashboard/delivery-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setOptions([await res.json(), ...options]);
      setFormData({ name: '', price: 0, estimated_days: '' });
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/v1/dashboard/delivery-options/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current })
    });
    if (res.ok) setOptions(options.map(o => o.delivery_option_id === id ? { ...o, is_active: !current } : o));
  };

  const removeOption = async (id: string) => {
    const res = await fetch(`/api/v1/dashboard/delivery-options/${id}`, { method: 'DELETE' });
    if (res.ok) setOptions(options.filter(o => o.delivery_option_id !== id));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Delivery Options</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Method Name</label>
          <input required type="text" className="border rounded p-2 w-48" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Standard Shipping" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Price ({currencySymbol})</label>
          <input required type="number" step="0.01" className="border rounded p-2 w-24" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Estimated Days</label>
          <input required type="text" className="border rounded p-2 w-32" value={formData.estimated_days} onChange={e => setFormData({...formData, estimated_days: e.target.value})} placeholder="3-5 Business Days" />
        </div>
        <button type="submit" className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800">Add Option</button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
            <tr><th className="p-4">Name</th><th className="p-4">Price</th><th className="p-4">ETA</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {options.map(o => (
              <tr key={o.delivery_option_id}>
                <td className="p-4 font-medium">{o.name}</td>
                <td className="p-4">{formatCurrency(Number(o.price))}</td>
                <td className="p-4">{o.estimated_days}</td>
                <td className="p-4">
                  <button onClick={() => toggleActive(o.delivery_option_id, o.is_active)} className={`px-2 py-1 rounded-full text-xs font-bold ${o.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {o.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4">
                  <button onClick={() => removeOption(o.delivery_option_id)} className="text-red-500 text-sm hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
