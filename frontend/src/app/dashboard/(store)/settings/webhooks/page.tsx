"use client";

import { useEffect, useState } from "react";
import { Webhook, Plus, Trash2, Copy, Check, ShieldAlert, Loader2, Send } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

interface WebhookItem {
  webhook_id: string;
  webhook_url: string;
  event_type: string;
  is_active: boolean;
  created_date: string;
}

const EVENT_TYPES = [
  { value: "order.created", label: "Order created" },
  { value: "order.updated", label: "Order updated" },
  { value: "product.created", label: "Product created" },
];

export default function WebhooksSettingsPage() {
  const [hooks, setHooks] = useState<WebhookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [eventType, setEventType] = useState("order.created");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const fetchHooks = async () => {
    try {
      const res = await fetch("/api/v1/webhooks");
      if (res.ok) setHooks((await res.json()).data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHooks();
  }, []);

  const handleCreate = async () => {
    if (!url.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, eventType }),
      });
      const data = await res.json();
      if (res.ok) {
        setRevealedSecret(data.data.secret);
        setUrl("");
        setEventType("order.created");
        setShowForm(false);
        fetchHooks();
      } else {
        setError(data.error || "Failed to create webhook");
      }
    } catch {
      setError("Failed to create webhook");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/v1/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    if (res.ok) setHooks((prev) => prev.map((h) => (h.webhook_id === id ? { ...h, is_active: !current } : h)));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this webhook? Deliveries to this URL will stop immediately.")) return;
    const res = await fetch(`/api/v1/webhooks/${id}`, { method: "DELETE" });
    if (res.ok) setHooks((prev) => prev.filter((h) => h.webhook_id !== id));
  };

  const sendTest = async (id: string) => {
    setTestingId(id);
    setTestMessage(null);
    try {
      const res = await fetch(`/api/v1/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTestMessage(res.ok ? data.message : data.error || "Failed to queue test event");
    } finally {
      setTestingId(null);
      setTimeout(() => setTestMessage(null), 4000);
    }
  };

  const copySecret = () => {
    if (!revealedSecret) return;
    navigator.clipboard.writeText(revealedSecret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary mb-1">Webhooks</h2>
          <p className="text-secondary text-sm">Get notified at a URL of your choice when events happen in your store.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Webhook
          </button>
        )}
      </div>

      {revealedSecret && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Copy this signing secret now — you won&apos;t be able to see it again.</p>
              <p className="text-sm text-amber-700">
                Use it to verify the <code className="bg-white/60 px-1 rounded">X-Monolith-Signature</code> header (HMAC-SHA256) on incoming requests.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm font-mono overflow-x-auto whitespace-nowrap">
              {revealedSecret}
            </code>
            <button onClick={copySecret} className="px-3 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setRevealedSecret(null)} className="text-xs font-medium text-amber-700 hover:text-amber-900">
            I&apos;ve saved it, dismiss this
          </button>
        </div>
      )}

      {showForm && (
        <div className="p-6 bg-white border border-black/10 rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Endpoint URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhooks/monolith"
              className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
            <p className="text-xs text-secondary mt-1.5">Must be a public https:// URL. Local and private addresses are rejected.</p>
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-primary mb-1.5">Event</label>
            <CustomSelect name="eventType" value={eventType} onChange={setEventType} options={EVENT_TYPES} />
            {eventType !== "order.created" && (
              <p className="text-xs text-amber-600 mt-1.5">This event type isn&apos;t triggered by the store yet — it will be reserved for now.</p>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={isCreating || !url.trim()}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isCreating ? "Adding..." : "Add Webhook"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-secondary hover:text-primary transition-colors text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {testMessage && (
        <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{testMessage}</div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary/40" /></div>
      ) : hooks.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-black/10 rounded-xl bg-black/[0.02]">
          <Webhook className="w-8 h-8 text-black/20 mb-3" />
          <h3 className="text-lg font-medium text-primary mb-2">No webhooks configured</h3>
          <p className="text-secondary text-sm max-w-sm">Add a webhook to receive real-time notifications when orders come in.</p>
        </div>
      ) : (
        <div className="border border-black/[0.08] rounded-xl overflow-hidden bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.02] border-b border-black/[0.08]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Endpoint</th>
                <th className="px-6 py-4 font-medium text-primary">Event</th>
                <th className="px-6 py-4 font-medium text-primary">Created</th>
                <th className="px-6 py-4 font-medium text-primary">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {hooks.map((h) => (
                <tr key={h.webhook_id} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4 font-medium text-primary max-w-xs truncate" title={h.webhook_url}>
                    {h.webhook_url}
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-black/[0.04] px-2 py-1 rounded">{h.event_type}</code>
                  </td>
                  <td className="px-6 py-4 text-secondary">{new Date(h.created_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(h.webhook_id, h.is_active)}
                      className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${h.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      {h.is_active ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => sendTest(h.webhook_id)}
                        disabled={testingId === h.webhook_id}
                        className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors disabled:opacity-50"
                        title="Send test event"
                      >
                        {testingId === h.webhook_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                      <button onClick={() => remove(h.webhook_id)} className="p-1.5 text-secondary hover:bg-red-50 hover:text-red-600 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
