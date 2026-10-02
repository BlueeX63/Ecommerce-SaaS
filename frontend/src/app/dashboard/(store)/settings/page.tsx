"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Save, Trash2, AlertTriangle, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SettingsSkeleton } from "@/components/dashboard/SettingsSkeleton";

export default function GeneralSettingsPage() {
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasCustomDomainAddon, setHasCustomDomainAddon] = useState(false);
  const router = useRouter();

  const [tenantName, setTenantName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [customDomain, setCustomDomain] = useState("");
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [domainMessage, setDomainMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/tenant/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/v1/dashboard/settings").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/v1/auth/context").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([tenantData, settingsData, contextData]) => {
        if (tenantData?.tenant?.tenant_name) setTenantName(tenantData.tenant.tenant_name);
        if (settingsData?.formData?.currency) setCurrency(settingsData.formData.currency);
        if (settingsData?.formData?.customDomain) setCustomDomain(settingsData.formData.customDomain);
        setHasCustomDomainAddon(!!contextData?.featureFlags?.includes("custom_domain"));
      })
      .finally(() => setIsFetching(false));
  }, []);

  // An already-connected domain stays usable even if the add-on lapses (see backend/routes/dashboard.ts);
  // the lock only blocks connecting a NEW/different one.
  const customDomainLocked = !hasCustomDomainAddon && !customDomain;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      const [tenantRes, currencyRes] = await Promise.all([
        fetch("/api/v1/tenant/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantName }),
        }),
        fetch("/api/v1/dashboard/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData: { currency } }),
        }),
      ]);
      if (!tenantRes.ok) {
        const data = await tenantRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save store name");
      }
      if (!currencyRes.ok) {
        const data = await currencyRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save currency");
      }
      setProfileMessage({ type: "success", text: "Saved. Refresh the page to see currency updates reflected everywhere." });
    } catch (err) {
      setProfileMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save settings" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDomain(true);
    setDomainMessage(null);
    try {
      const res = await fetch("/api/v1/dashboard/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: { customDomain } }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to save domain");

      if (data?.customDomainVerification) {
        const v = data.customDomainVerification;
        setDomainMessage({
          type: "success",
          text: `To activate ${v.domain}, add a DNS TXT record for ${v.host} with the value ${v.value}, point the domain at this platform, then save again to verify.`,
        });
      } else {
        setDomainMessage({ type: "success", text: "Domain saved successfully." });
      }
    } catch (err) {
      setDomainMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save domain" });
    } finally {
      setIsSavingDomain(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete your store? This action cannot be undone and all your data will be permanently lost.")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/v1/store/delete", { method: "POST" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Failed to delete store");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete store. Please try again or contact support.");
      setIsDeleting(false);
    }
  };

  if (isFetching) {
    return <SettingsSkeleton fields={2} />;
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-1">General Settings</h2>
        <p className="text-secondary text-sm">Manage your store&apos;s identity and defaults.</p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Store Name</label>
            <input
              required
              type="text"
              maxLength={100}
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            <p className="mt-1.5 text-xs text-secondary">Shown in your dashboard and store switcher.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>

        {profileMessage && (
          <div className={`p-3 rounded-lg text-sm ${profileMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-100"}`}>
            {profileMessage.text}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
          >
            {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>

      {/* Custom Domain */}
      <form onSubmit={handleSaveDomain} className="space-y-4 max-w-2xl pt-6 border-t border-black/5">
        <div>
          <label className="block text-sm font-medium text-primary mb-1">Custom Domain</label>
          <input
            type="text"
            placeholder="e.g. www.mybrand.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            disabled={customDomainLocked}
            className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {customDomainLocked ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-secondary">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>
                Custom domains are a paid add-on.{" "}
                <Link href="/dashboard/settings/billing" className="text-primary underline font-medium">
                  Upgrade to unlock
                </Link>
                .
              </span>
            </div>
          ) : customDomain ? (
            <p className="mt-2 text-sm text-secondary">
              We&apos;ll ask you to verify ownership with a DNS TXT record after you save.
              {!hasCustomDomainAddon && " Changing to a different domain requires the Custom Domain add-on."}
            </p>
          ) : null}
        </div>

        {domainMessage && (
          <div className={`p-3 rounded-lg text-sm whitespace-pre-line ${domainMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-100"}`}>
            {domainMessage.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSavingDomain}
          className="flex items-center gap-2 px-6 py-2 bg-white border border-black/10 text-primary rounded-lg hover:bg-black/5 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {isSavingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Domain
        </button>
      </form>

      {/* Danger Zone */}
      <div className="pt-8 border-t border-red-100 max-w-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-600 mb-1">Danger Zone</h3>
            <p className="text-sm text-secondary mb-4">
              Permanently delete your store and all of its data. This action cannot be undone. All products, orders, and customer data will be erased.
            </p>
            {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
            <button
              onClick={handleDeleteStore}
              disabled={isDeleting}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? "Deleting Store..." : "Delete Store"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
