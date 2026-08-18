"use client";

import { useState, useEffect } from "react";
import { Save, Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GeneralSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    storeName: "My Awesome Store",
    supportEmail: "support@store.com",
    currency: "INR",
    customDomain: ""
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

  const handleDeleteStore = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete your store? This action cannot be undone and all your data will be permanently lost.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await fetch('/api/v1/tenant/me', {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete store");
      }
      
      // Successfully deleted, logout and redirect to login
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      alert("Failed to delete store. Please try again or contact support.");
      setIsDeleting(false);
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

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Custom Domain</label>
            <input 
              type="text" 
              name="customDomain"
              placeholder="e.g. www.mybrand.com"
              value={formData.customDomain}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            {formData.customDomain && (
              <p className="mt-2 text-sm text-secondary">
                To connect this domain, please add a <strong>CNAME</strong> record at your domain registrar pointing to <strong>your-saas.com</strong> (or an A record pointing to the server's IP).
              </p>
            )}
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

      {/* Danger Zone */}
      <div className="mt-12 pt-8 border-t border-red-100 max-w-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-600 mb-1">Danger Zone</h3>
            <p className="text-sm text-secondary mb-4">
              Permanently delete your store and all of its data. This action cannot be undone. 
              All products, orders, and customer data will be erased.
            </p>
            <button
              onClick={handleDeleteStore}
              disabled={isDeleting}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
            >
              {isDeleting ? (
                <span className="w-4 h-4 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isDeleting ? "Deleting Store..." : "Delete Store"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
