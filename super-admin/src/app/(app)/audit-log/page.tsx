"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { TableSkeleton } from "@/components/Skeleton";
import { Pagination } from "@/components/Pagination";

const PAGE_LIMIT = 50;

interface AuditEntry {
  action: string;
  actorEmail: string;
  timestamp: string;
  tenantId: string;
  tenant: { tenant_id: string; tenant_name: string; code: string } | null;
  details?: Record<string, unknown>;
}

const ACTION_LABELS: Record<string, string> = {
  SUSPEND_TENANT: "Suspended store",
  REACTIVATE_TENANT: "Reactivated store",
  CHANGE_PLAN: "Changed plan",
  REVOKE_SESSIONS: "Revoked sessions",
  UPDATE_TEAM_MEMBER_STATUS: "Updated team member",
  DELETE_TENANT: "Deleted store",
  IMPERSONATE_START: "Signed in as owner",
};

const ACTION_STYLES: Record<string, string> = {
  SUSPEND_TENANT: "bg-red-100 text-red-700",
  REACTIVATE_TENANT: "bg-green-100 text-green-700",
  CHANGE_PLAN: "bg-blue-100 text-blue-700",
  REVOKE_SESSIONS: "bg-amber-100 text-amber-700",
  UPDATE_TEAM_MEMBER_STATUS: "bg-amber-100 text-amber-700",
  DELETE_TENANT: "bg-red-100 text-red-700",
  IMPERSONATE_START: "bg-purple-100 text-purple-700",
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/v1/super-admin/audit-log?page=${page}&limit=${PAGE_LIMIT}`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.data ?? []);
        setMeta({ total: d.meta?.total ?? 0, totalPages: d.meta?.totalPages ?? 0 });
      })
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-primary mb-1">Audit log</h1>
        <p className="text-sm text-secondary">Every action taken by every super admin, across every store.</p>
      </div>

      <div className="bg-surface border border-black/10 rounded-lg overflow-hidden">
        {isLoading ? (
          <TableSkeleton columns={4} />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-secondary">
            <ScrollText className="w-8 h-8 mb-2 text-black/15" />
            No super admin actions recorded yet.
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-black/[0.02] border-b border-black/10">
                <tr>
                  <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Action</th>
                  <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Store</th>
                  <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">By</th>
                  <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {entries.map((entry, i) => (
                  <tr key={i} className="hover:bg-black/[0.015]">
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_STYLES[entry.action] ?? "bg-gray-100 text-gray-600"}`}>
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {entry.tenant ? (
                        <Link href={`/tenants/${entry.tenant.tenant_id}`} className="text-primary hover:underline">
                          {entry.tenant.tenant_name}
                        </Link>
                      ) : (
                        <span className="text-secondary">Deleted store</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-secondary">{entry.actorEmail}</td>
                    <td className="px-5 py-3 text-secondary text-xs">{new Date(entry.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_LIMIT} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
