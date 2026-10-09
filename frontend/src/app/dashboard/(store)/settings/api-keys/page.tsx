"use client";

import { useEffect, useState } from "react";
import { Key, Plus, Trash2, Copy, Check, ShieldAlert, Loader2 } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

import { CardGridSkeleton } from "@/components/dashboard/Skeletons";
interface ApiKey {
  api_key_id: string;
  key_name: string;
  is_active: boolean;
  created_date: string;
  expires_on: string | null;
}

export default function ApiKeysSettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/v1/api-keys");
      if (res.ok) setKeys((await res.json()).data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    if (!keyName.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyName, expiresInDays: expiresInDays ? Number(expiresInDays) : undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setRevealedKey(data.data.key);
        setKeyName("");
        setExpiresInDays("");
        setShowForm(false);
        fetchKeys();
      } else {
        setError(data.error || "Failed to create API key");
      }
    } catch {
      setError("Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/v1/api-keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) setKeys((prev) => prev.map((k) => (k.api_key_id === id ? { ...k, is_active: !current } : k)));
  };

  const remove = async (id: string) => {
    if (!confirm("Revoke and permanently delete this API key? Any integration using it will stop working immediately.")) return;
    const res = await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) setKeys((prev) => prev.filter((k) => k.api_key_id !== id));
  };

  const copyKey = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary mb-1">API Keys</h2>
          <p className="text-secondary text-sm">Manage API keys to access your store data programmatically.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium shrink-0"
          >
            <Plus className="w-4 h-4" /> Generate API Key
          </button>
        )}
      </div>

      {revealedKey && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Copy this key now — you won&apos;t be able to see it again.</p>
              <p className="text-sm text-amber-700">Store it somewhere safe, like a password manager or secret vault.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-mono overflow-x-auto whitespace-nowrap">
              {revealedKey}
            </code>
            <button onClick={copyKey} className="px-3 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setRevealedKey(null)} className="text-xs font-medium text-amber-700 hover:text-amber-900">
            I&apos;ve saved it, dismiss this
          </button>
        </div>
      )}

      {showForm && (
        <div className="p-6 bg-white border border-black/10 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Key Name</label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. Zapier Integration"
              className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-primary mb-1.5">Expires</label>
            <CustomSelect
              name="expiresInDays"
              value={expiresInDays}
              onChange={setExpiresInDays}
              placeholder="Never"
              options={[
                { value: "", label: "Never" },
                { value: "30", label: "In 30 days" },
                { value: "90", label: "In 90 days" },
                { value: "365", label: "In 1 year" },
              ]}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={isCreating || !keyName.trim()}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isCreating ? "Generating..." : "Generate Key"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-secondary hover:text-primary transition-colors text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <CardGridSkeleton count={2} />
      ) : keys.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-black/10 rounded-xl bg-black/[0.02]">
          <Key className="w-8 h-8 text-black/20 mb-3" />
          <h3 className="text-lg font-medium text-primary mb-2">No API keys generated</h3>
          <p className="text-secondary text-sm max-w-sm">Create API keys to authenticate your custom integrations and external apps.</p>
        </div>
      ) : (
        <div className="border border-black/[0.08] rounded-xl overflow-hidden bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.02] border-b border-black/[0.08]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Name</th>
                <th className="px-6 py-4 font-medium text-primary">Created</th>
                <th className="px-6 py-4 font-medium text-primary">Expires</th>
                <th className="px-6 py-4 font-medium text-primary">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {keys.map((k) => (
                <tr key={k.api_key_id} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4 font-medium text-primary flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-secondary" /> {k.key_name}
                  </td>
                  <td className="px-6 py-4 text-secondary">{new Date(k.created_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-secondary">{k.expires_on ? new Date(k.expires_on).toLocaleDateString() : "Never"}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(k.api_key_id, k.is_active)}
                      className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${k.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      {k.is_active ? "Active" : "Revoked"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => remove(k.api_key_id)} className="p-1.5 text-secondary hover:bg-red-50 hover:text-red-600 rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
