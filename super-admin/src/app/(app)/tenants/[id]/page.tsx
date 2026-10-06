"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2, ArrowLeft, ExternalLink, LogIn, Ban, CheckCircle2, KeyRound, Trash2, X,
} from "lucide-react";
import { Skeleton, StatCardSkeleton, PanelSkeleton } from "@/components/Skeleton";

interface TenantDetail {
  tenant: {
    tenant_id: string;
    tenant_name: string;
    code: string;
    status: string;
    custom_domain: string | null;
    created_date: string;
  };
  owner: { user_id: string; first_name: string; last_name: string; email: string; last_login: string | null; created_date: string; status: string } | null;
  entitlements: { active: boolean; planTier: string | null; planName: string | null; maxStores: number; featureFlags: string[] } | null;
  subscriptionHistory: Array<{ subscription_id: string; status: string; created_date: string; current_period_end: string | null; decoded: { tier: string | null; featureFlags: string[] } }>;
  payments: Array<{ id: string; amount: number; currency: string; status: string; date: string; description: string | null }>;
  team: Array<{ user_id: string; first_name: string; last_name: string; email: string; status: string; last_login: string | null }>;
  stats: { productCount: number; customerCount: number; orderCount: number; revenue: number };
  auditLog: Array<{ action: string; actorEmail: string; timestamp: string; details?: Record<string, unknown> }>;
}

const PLAN_OPTIONS = [
  { id: "basic", name: "Basic" },
  { id: "intermediate", name: "Intermediate" },
  { id: "professional", name: "Professional" },
];
const ADDON_OPTIONS = ["advanced_analytics", "ai_tools", "custom_domain", "online_payments"];

const ACTION_LABELS: Record<string, string> = {
  SUSPEND_TENANT: "Suspended store",
  REACTIVATE_TENANT: "Reactivated store",
  CHANGE_PLAN: "Changed plan",
  REVOKE_SESSIONS: "Revoked sessions",
  UPDATE_TEAM_MEMBER_STATUS: "Updated team member",
  DELETE_TENANT: "Deleted store",
  IMPERSONATE_START: "Signed in as owner",
};

function formatRupees(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function rootDomain() {
  if (typeof window === "undefined") return "localhost:3000";
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || (window.location.hostname.includes("localhost") ? "localhost:3000" : "your-saas.com");
}

export default function SuperAdminTenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [data, setData] = useState<TenantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ planTier: "basic", addons: new Set<string>(), status: "active" });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");

  const load = () => {
    fetch(`/api/v1/super-admin/tenants/${tenantId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const runAction = async (key: string, path: string, body?: unknown, successMessage?: string) => {
    setBusy(key);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/v1/super-admin/tenants/${tenantId}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(resData.error || "Action failed");
        return;
      }
      setActionMessage(successMessage || resData.message);
      load();
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  /**
   * This app runs on its own origin, so it can never set a cookie on the merchant dashboard's origin
   * directly. The backend instead returns a one-time redeem URL on the dashboard's own origin; redirecting
   * the browser there lets that app's own same-origin fetch exchange the ticket for a real session.
   */
  const handleImpersonate = async () => {
    setBusy("impersonate");
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/super-admin/tenants/${tenantId}/impersonate`, { method: "POST" });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok || !resData.redeemUrl) {
        setActionError(resData.error || "Could not sign in as this store's owner");
        setBusy(null);
        return;
      }
      window.location.href = resData.redeemUrl;
    } catch {
      setActionError("Something went wrong. Please try again.");
      setBusy(null);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAction("plan", "/plan", { planTier: planForm.planTier, addons: [...planForm.addons], status: planForm.status }, "Plan updated");
    setIsPlanModalOpen(false);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("delete");
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/super-admin/tenants/${tenantId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmCode }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(resData.error || "Could not delete this store");
        setBusy(null);
        return;
      }
      router.push("/tenants");
    } catch {
      setActionError("Something went wrong. Please try again.");
      setBusy(null);
    }
  };

  const toggleTeamMember = (userId: string, currentStatus: string) =>
    runAction(`team-${userId}`, `/team/${userId}`, { status: currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE" }, "Team member updated");

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PanelSkeleton lines={3} />
          <PanelSkeleton lines={2} />
          <PanelSkeleton lines={3} />
          <PanelSkeleton lines={3} />
        </div>
        <PanelSkeleton lines={4} />
      </div>
    );
  }

  const { tenant, owner, entitlements, subscriptionHistory, payments, team, stats, auditLog } = data;
  const storeUrl = `${typeof window !== "undefined" && window.location.hostname.includes("localhost") ? "http" : "https"}://${tenant.code}.${rootDomain()}`;

  return (
    <div className="space-y-6">
      <Link href="/tenants" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All stores
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl text-primary">{tenant.tenant_name}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${tenant.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {tenant.status}
            </span>
          </div>
          <a href={storeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors mt-1">
            {tenant.code} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <button
          onClick={handleImpersonate}
          disabled={busy === "impersonate"}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {busy === "impersonate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Sign in as owner
        </button>
      </div>

      {actionMessage && <div className="p-3 rounded-md text-sm bg-green-50 text-green-700 border border-green-200">{actionMessage}</div>}
      {actionError && <div className="p-3 rounded-md text-sm bg-red-50 text-red-600 border border-red-100">{actionError}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-black/10 rounded-lg p-4">
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">Products</p>
          <p className="font-heading text-xl text-primary">{stats.productCount}</p>
        </div>
        <div className="bg-surface border border-black/10 rounded-lg p-4">
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">Customers</p>
          <p className="font-heading text-xl text-primary">{stats.customerCount}</p>
        </div>
        <div className="bg-surface border border-black/10 rounded-lg p-4">
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">Orders</p>
          <p className="font-heading text-xl text-primary">{stats.orderCount}</p>
        </div>
        <div className="bg-surface border border-black/10 rounded-lg p-4">
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">Revenue</p>
          <p className="font-heading text-xl text-primary">{formatRupees(stats.revenue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owner */}
        <div className="bg-surface border border-black/10 rounded-lg p-5">
          <h2 className="text-sm font-medium text-primary mb-3">Owner</h2>
          {owner ? (
            <div className="space-y-1.5 text-sm">
              <p className="text-primary">{owner.first_name} {owner.last_name}</p>
              <p className="text-secondary">{owner.email}</p>
              <p className="text-secondary text-xs">Member since {new Date(owner.created_date).toLocaleDateString()}</p>
              <p className="text-secondary text-xs">Last active: {owner.last_login ? new Date(owner.last_login).toLocaleString() : "Never logged in"}</p>
            </div>
          ) : (
            <p className="text-sm text-secondary">No owner account on record.</p>
          )}
        </div>

        {/* Plan */}
        <div className="bg-surface border border-black/10 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-primary">Plan</h2>
            <button
              onClick={() => {
                setPlanForm({ planTier: entitlements?.planTier ?? "basic", addons: new Set(entitlements?.featureFlags ?? []), status: "active" });
                setIsPlanModalOpen(true);
              }}
              className="text-xs font-medium text-primary underline underline-offset-2"
            >
              Change plan
            </button>
          </div>
          {entitlements?.active ? (
            <div className="space-y-1.5 text-sm">
              <p className="text-primary font-medium">{entitlements.planName} &middot; up to {entitlements.maxStores} stores</p>
              {entitlements.featureFlags.length > 0 && (
                <p className="text-secondary text-xs">Add-ons: {entitlements.featureFlags.join(", ")}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-secondary">No active subscription.</p>
          )}
        </div>

        {/* Subscription history */}
        <div className="bg-surface border border-black/10 rounded-lg p-5">
          <h2 className="text-sm font-medium text-primary mb-3">Subscription history</h2>
          {subscriptionHistory.length === 0 ? (
            <p className="text-sm text-secondary">No subscriptions on record.</p>
          ) : (
            <div className="space-y-2.5">
              {subscriptionHistory.map((s) => (
                <div key={s.subscription_id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-primary">{s.decoded.tier ? PLAN_OPTIONS.find((p) => p.id === s.decoded.tier)?.name ?? s.decoded.tier : "Unknown"}</span>
                    <span className="text-secondary text-xs ml-2">{new Date(s.created_date).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments */}
        <div className="bg-surface border border-black/10 rounded-lg p-5">
          <h2 className="text-sm font-medium text-primary mb-3">Payments (Stripe)</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-secondary">No payment history available.</p>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-primary">{(p.currency || "inr").toUpperCase()} {p.amount.toLocaleString()}</span>
                    <span className="text-secondary text-xs ml-2">{p.date ? new Date(p.date).toLocaleDateString() : ""}</span>
                  </div>
                  <span className="text-xs text-secondary">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team */}
      <div className="bg-surface border border-black/10 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-black/10">
          <h2 className="text-sm font-medium text-primary">Team members</h2>
        </div>
        {team.length === 0 ? (
          <p className="text-sm text-secondary px-5 py-6">No team members beyond the owner.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-black/5">
              {team.map((u) => (
                <tr key={u.user_id}>
                  <td className="px-5 py-3">
                    <p className="text-primary">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-secondary">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleTeamMember(u.user_id, u.status)}
                      disabled={busy === `team-${u.user_id}`}
                      className="text-xs font-medium text-primary underline underline-offset-2 disabled:opacity-50"
                    >
                      {u.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Audit log */}
      <div className="bg-surface border border-black/10 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-black/10">
          <h2 className="text-sm font-medium text-primary">Audit log</h2>
        </div>
        {auditLog.length === 0 ? (
          <p className="text-sm text-secondary px-5 py-6">No super admin actions recorded for this store.</p>
        ) : (
          <div className="divide-y divide-black/5">
            {auditLog.map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <span className="text-primary">{ACTION_LABELS[entry.action] ?? entry.action} <span className="text-secondary">&middot; {entry.actorEmail}</span></span>
                <span className="text-xs text-secondary">{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-surface border border-red-200 rounded-lg p-5">
        <h2 className="text-sm font-medium text-red-600 mb-4">Danger zone</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary">{tenant.status === "ACTIVE" ? "Suspend this store" : "Reactivate this store"}</p>
              <p className="text-xs text-secondary">{tenant.status === "ACTIVE" ? "Takes the live storefront offline and signs the owner out." : "Brings the live storefront back online."}</p>
            </div>
            {tenant.status === "ACTIVE" ? (
              <button
                onClick={() => runAction("suspend", "/suspend")}
                disabled={busy === "suspend"}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50 shrink-0"
              >
                <Ban className="w-3.5 h-3.5" /> Suspend
              </button>
            ) : (
              <button
                onClick={() => runAction("reactivate", "/reactivate")}
                disabled={busy === "reactivate"}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Reactivate
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/5">
            <div>
              <p className="text-sm text-primary">Revoke all sessions</p>
              <p className="text-xs text-secondary">Signs the owner out everywhere immediately.</p>
            </div>
            <button
              onClick={() => runAction("revoke", "/revoke-sessions")}
              disabled={busy === "revoke"}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/10 text-primary rounded-md text-xs font-medium hover:bg-black/5 transition-colors disabled:opacity-50 shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5" /> Revoke
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/5">
            <div>
              <p className="text-sm text-primary">Delete this store permanently</p>
              <p className="text-xs text-secondary">Cannot be undone. All products, orders and customer data will be erased.</p>
            </div>
            <button
              onClick={() => {
                setConfirmCode("");
                setIsDeleteModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Change plan modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-black/10 rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
              <h3 className="font-heading text-lg text-primary">Change plan</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-secondary hover:text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePlan} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary uppercase tracking-wide">Tier</label>
                <select
                  value={planForm.planTier}
                  onChange={(e) => setPlanForm({ ...planForm, planTier: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-black/10 rounded-md text-sm"
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary uppercase tracking-wide">Add-ons</label>
                <div className="space-y-1.5">
                  {ADDON_OPTIONS.map((addon) => (
                    <label key={addon} className="flex items-center gap-2 text-sm text-primary">
                      <input
                        type="checkbox"
                        checked={planForm.addons.has(addon)}
                        onChange={() => {
                          const next = new Set(planForm.addons);
                          if (next.has(addon)) next.delete(addon);
                          else next.add(addon);
                          setPlanForm({ ...planForm, addons: next });
                        }}
                      />
                      {addon.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary uppercase tracking-wide">Subscription status</label>
                <select
                  value={planForm.status}
                  onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-black/10 rounded-md text-sm"
                >
                  <option value="active">Active</option>
                  <option value="past_due">Past due</option>
                  <option value="canceled">Canceled</option>
                  <option value="incomplete">Incomplete</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="px-3 py-2 text-sm text-secondary hover:text-primary">
                  Cancel
                </button>
                <button type="submit" disabled={busy === "plan"} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium disabled:opacity-50">
                  {busy === "plan" ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border border-black/10 rounded-lg w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
              <h3 className="font-heading text-lg text-red-600">Delete {tenant.tenant_name}</h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-secondary hover:text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDelete} className="p-5 space-y-4">
              <p className="text-sm text-secondary">
                This permanently deletes the store and all its data. To confirm, type <span className="font-mono font-medium text-primary">{tenant.tenant_id.slice(0, 8)}</span> below.
              </p>
              <input
                required
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-black/10 rounded-md text-sm font-mono"
                placeholder={tenant.tenant_id.slice(0, 8)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-3 py-2 text-sm text-secondary hover:text-primary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === "delete" || confirmCode !== tenant.tenant_id.slice(0, 8)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {busy === "delete" ? "Deleting..." : "Delete permanently"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
