"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function GeneralSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    storeName: "My Awesome Store",
    supportEmail: "support@store.com",
    currency: "INR"
  });

  useEffect(() => {
    fetch('/api/v1/dashboard/settings')
      .then(r => r.json())
      .then(data => {
        if (data.formData) {
          setFormData(prev => ({
            ...prev,
            ...data.formData
          }));
        }
        setIsFetching(false);
      })
      .catch(() => setIsFetching(false));
  }, []);
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData })
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("Settings saved successfully! You may need to refresh the page to see currency updates everywhere.");
    } catch (err) {
      alert("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isFetching) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-1">General Settings</h2>
        <p className="text-secondary text-sm">Manage your store's general profile and defaults.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Store Name</label>
            <input 
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Support Email</label>
            <input 
              type="email" 
              name="supportEmail"
              value={formData.supportEmail}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Currency</label>
            <select 
              name="currency" 
              value={formData.currency} 
              onChange={handleChange} 
              className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-black/5">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
