"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { TableSkeleton } from "@/components/Skeleton";

const PAGE_LIMIT = 25;
const SEARCH_DEBOUNCE_MS = 250;

interface MerchantRow {
  user_id: string;
  name: string;
  email: string;
  status: string;
  email_verified: boolean;
  last_login: string | null;
  joined_at: string;
  store_count: number;
  plan: { id: string; name: string } | null;
  subscription_status: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });

  // Search runs on the server against the whole merchant list, debounced so typing does not fire a request per key.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setAppliedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (appliedSearch) params.set("search", appliedSearch);
    fetch(`/api/v1/super-admin/merchants?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setMerchants(d.data ?? []);
        setMeta({ total: d.meta?.total ?? 0, totalPages: d.meta?.totalPages ?? 0 });
      })
      .catch((err) => {
        if (err.name !== "AbortError") setMerchants([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [page, appliedSearch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-primary mb-1">Merchants</h1>
        <p className="text-sm text-secondary">
          Every merchant account on the platform: their stores, plan, and whether they can sign in.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          maxLength={100}
          className="w-full pl-9 pr-3 py-2 bg-surface border border-black/10 rounded-md text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="bg-surface border border-black/10 rounded-lg overflow-hidden">
        {isLoading ? (
          <TableSkeleton columns={6} />
        ) : merchants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-secondary">
            <Users className="w-8 h-8 mb-2 text-black/15" />
            {appliedSearch ? "No merchants match that search." : "No merchants yet."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/[0.02] border-b border-black/10">
                  <tr>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Merchant</th>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Stores</th>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Plan</th>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Account</th>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Last sign-in</th>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {merchants.map((m) => (
                    <tr key={m.user_id} className="hover:bg-black/[0.015]">
                      <td className="px-5 py-3">
                        <Link href={`/merchants/${m.user_id}`} className="text-primary font-medium hover:underline">
                          {m.name || "Unnamed"}
                        </Link>
                        <p className="text-xs text-secondary">{m.email}</p>
                      </td>
                      <td className="px-5 py-3 text-primary">{m.store_count}</td>
                      <td className="px-5 py-3">
                        {m.plan ? (
                          <span className="text-primary">{m.plan.name}</span>
                        ) : (
                          <span className="text-secondary">No plan</span>
                        )}
                        {m.subscription_status && m.subscription_status !== "active" && (
                          <span className="block text-xs text-amber-700">{m.subscription_status}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[m.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {m.status === "SUSPENDED" ? "Suspended" : "Active"}
                        </span>
                        {!m.email_verified && <span className="block text-xs text-secondary mt-1">Email unverified</span>}
                      </td>
                      <td className="px-5 py-3 text-secondary text-xs">
                        {m.last_login ? new Date(m.last_login).toLocaleString() : "Never"}
                      </td>
                      <td className="px-5 py-3 text-secondary text-xs">{new Date(m.joined_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_LIMIT} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
