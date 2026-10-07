"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PanelSkeleton, Skeleton } from "@/components/Skeleton";

interface MerchantDetail {
  user: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    status: string;
    email_verified: boolean;
    last_login: string | null;
    created_date: string;
  };
  stores: { tenant_id: string; tenant_name: string; code: string; status: string; custom_domain: string | null; created_date: string }[];
  subscriptions: {
    plan: { id: string; name: string } | null;
    add_ons: string[];
    status: string;
    current_period_end: string | null;
    started_at: string;
    updated_at: string;
  }[];
  active_sessions: number;
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

export default function MerchantDetailPage() {
  const params = useParams();
  const merchantId = params.id as string;

  const [data, setData] = useState<MerchantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/super-admin/merchants/${encodeURIComponent(merchantId)}`);
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoadError(body.error || "Could not load this merchant.");
      return;
    }
    setData((await res.json()).data);
  }, [merchantId]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const act = async (action: "suspend" | "reactivate" | "revoke-sessions", question: string) => {
    if (!window.confirm(question)) return;
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/super-admin/merchants/${encodeURIComponent(merchantId)}/${action}`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ tone: "error", text: body.error || "The action failed. Please try again." });
      } else {
        setMessage({ tone: "ok", text: body.message || "Done." });
        await load();
      }
    } catch {
      setMessage({ tone: "error", text: "The action failed. Please try again." });
    } finally {
      setBusy(null);
    }
  };

  if (notFound) {
    return (
      <div className="space-y-4">
        <Link href="/merchants" className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary">
          <ChevronLeft className="w-4 h-4" /> Merchants
        </Link>
        <p className="text-sm text-secondary">This merchant account does not exist.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link href="/merchants" className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary">
          <ChevronLeft className="w-4 h-4" /> Merchants
        </Link>
        <p className="text-sm text-red-700">{loadError}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-3.5 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PanelSkeleton lines={5} />
          </div>
          <PanelSkeleton lines={3} />
        </div>
      </div>
    );
  }

  const { user, stores, subscriptions, active_sessions: sessions } = data;
  const suspended = user.status === "SUSPENDED";
  const name = `${user.first_name} ${user.last_name}`.trim() || "Unnamed merchant";

  return (
    <div className="space-y-6">
      <Link href="/merchants" className="inline-flex items-center gap-1 text-sm text-secondary hover:text-primary">
        <ChevronLeft className="w-4 h-4" /> Merchants
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-primary mb-1">{name}</h1>
          <p className="text-sm text-secondary">
            {user.email}
            {user.phone_number ? ` · ${user.phone_number}` : ""}
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded text-xs font-medium ${suspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {suspended ? "Suspended" : "Active"}
        </span>
      </div>

      {message && (
        <p className={`text-sm ${message.tone === "ok" ? "text-green-700" : "text-red-700"}`} role="status">
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-surface border border-black/10 rounded-lg p-5">
            <h2 className="text-sm font-medium text-primary mb-4">Stores ({stores.length})</h2>
            {stores.length === 0 ? (
              <p className="text-sm text-secondary">This merchant has not created a store yet.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {stores.map((s) => (
                  <li key={s.tenant_id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <Link href={`/tenants/${s.tenant_id}`} className="text-primary font-medium hover:underline">
                        {s.tenant_name}
                      </Link>
                      <p className="text-xs text-secondary">
                        {s.code}
                        {s.custom_domain ? ` · ${s.custom_domain}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-secondary">{s.status}</span>
                      <p className="text-xs text-secondary">{new Date(s.created_date).toLocaleDateString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-surface border border-black/10 rounded-lg p-5">
            <h2 className="text-sm font-medium text-primary mb-4">Subscription history</h2>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-secondary">No subscriptions yet.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {subscriptions.map((s, i) => (
                  <li key={i} className="py-2.5 text-sm flex items-center justify-between gap-4">
                    <div>
                      <span className="text-primary font-medium">{s.plan?.name ?? "Unknown plan"}</span>
                      {s.add_ons.length > 0 && <p className="text-xs text-secondary">+ {s.add_ons.join(", ")}</p>}
                    </div>
                    <div className="text-right text-xs text-secondary">
                      <p>{s.status}</p>
                      <p>Updated {fmt(s.updated_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-surface border border-black/10 rounded-lg p-5 space-y-3 text-sm">
            <h2 className="text-sm font-medium text-primary mb-1">Account</h2>
            <Row label="Joined" value={fmt(user.created_date)} />
            <Row label="Last sign-in" value={fmt(user.last_login)} />
            <Row label="Email verified" value={user.email_verified ? "Yes" : "No"} />
            <Row label="Active sessions" value={String(sessions)} />
          </section>

          <section className="bg-surface border border-black/10 rounded-lg p-5 space-y-2">
            <h2 className="text-sm font-medium text-primary mb-3">Actions</h2>
            {suspended ? (
              <ActionButton
                label="Reactivate account"
                busy={busy === "reactivate"}
                onClick={() => act("reactivate", `Reactivate ${user.email}? They will be able to sign in again.`)}
              />
            ) : (
              <ActionButton
                label="Suspend account"
                danger
                busy={busy === "suspend"}
                onClick={() =>
                  act(
                    "suspend",
                    `Suspend ${user.email}? They will be signed out everywhere and cannot sign in until reactivated. Their stores are not changed.`,
                  )
                }
              />
            )}
            <ActionButton
              label="Sign out everywhere"
              busy={busy === "revoke-sessions"}
              onClick={() => act("revoke-sessions", `Sign ${user.email} out of every active session?`)}
            />
            <p className="text-xs text-secondary pt-2">
              To sign into a store as its owner, open the store from the Stores page. Every action is recorded in the audit log.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-secondary">{label}</span>
      <span className="text-primary text-right">{value}</span>
    </div>
  );
}

function ActionButton({ label, onClick, busy, danger }: { label: string; onClick: () => void; busy: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`w-full px-3 py-2 rounded-md text-sm font-medium border transition-colors disabled:opacity-50 ${
        danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-black/10 text-primary hover:bg-black/[0.03]"
      }`}
    >
      {busy ? "Working…" : label}
    </button>
  );
}
