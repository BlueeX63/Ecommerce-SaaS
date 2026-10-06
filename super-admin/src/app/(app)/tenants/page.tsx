"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Store } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { TableSkeleton } from "@/components/Skeleton";

const PAGE_LIMIT = 25;

interface TenantRow {
  tenant_id: string;
  tenant_name: string;
  code: string;
  status: string;
  custom_domain: string | null;
  created_date: string;
  owner: { user_id: string; name: string; email: string; last_login: string | null; status: string } | null;
  plan: { id: string; name: string } | null;
  subscriptionStatus: string | null;
}

const SUB_STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  past_due: "bg-amber-100 text-amber-700",
  canceled: "bg-gray-100 text-gray-600",
  incomplete: "bg-gray-100 text-gray-600",
};

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/v1/super-admin/tenants?page=${page}&limit=${PAGE_LIMIT}`)
      .then((r) => r.json())
      .then((d) => {
        setTenants(d.data ?? []);
        setMeta({ total: d.meta?.total ?? 0, totalPages: d.meta?.totalPages ?? 0 });
      })
      .finally(() => setIsLoading(false));
  }, [page]);

  const filtered = tenants.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.tenant_name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      (t.owner?.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-primary mb-1">Stores</h1>
        <p className="text-sm text-secondary">Every store on the platform, its owner, and its plan.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by store, subdomain, or owner email..."
          className="w-full pl-9 pr-3 py-2 bg-surface border border-black/10 rounded-md text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="bg-surface border border-black/10 rounded-lg overflow-hidden">
        {isLoading ? (
          <TableSkeleton columns={6} />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.02] border-b border-black/10">
              <tr>
                <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Store</th>
                <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Owner</th>
                <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Plan</th>
                <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Member since</th>
                <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-secondary">
                    <Store className="w-8 h-8 mx-auto mb-2 text-black/15" />
                    {tenants.length === 0 ? "No stores yet." : "No stores match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.tenant_id} className="hover:bg-black/[0.015]">
                    <td className="px-5 py-3.5">
                      <Link href={`/tenants/${t.tenant_id}`} className="block">
                        <p className="font-medium text-primary">{t.tenant_name}</p>
                        <p className="text-xs text-secondary font-mono">{t.code}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-secondary">
                      {t.owner ? (
                        <>
                          <p className="text-primary">{t.owner.name}</p>
                          <p className="text-xs">{t.owner.email}</p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-secondary">
                      {t.plan ? (
                        <span className="inline-flex items-center gap-1.5">
                          {t.plan.name}
                          {t.subscriptionStatus && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${SUB_STATUS_STYLES[t.subscriptionStatus] ?? "bg-gray-100 text-gray-600"}`}>
                              {t.subscriptionStatus.replace("_", " ")}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-secondary">No plan</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-secondary text-xs">{new Date(t.created_date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-secondary text-xs">
                      {t.owner?.last_login ? new Date(t.owner.last_login).toLocaleDateString() : "Never"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_LIMIT} onPageChange={setPage} />
      </div>
    </div>
  );
}
