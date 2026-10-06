"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { TableSkeleton } from "@/components/Skeleton";

const PAGE_LIMIT = 25;

interface OrderRow {
  order_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  grand_total: number;
  created_date: string;
  customers: { first_name: string; last_name: string; email: string } | null;
  tenant: { tenant_id: string; tenant_name: string; code: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-red-100 text-red-700",
  RETURN_REQUESTED: "bg-amber-100 text-amber-700",
};

function formatRupees(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

export default function SuperAdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    if (appliedSearch) params.set("search", appliedSearch);
    fetch(`/api/v1/super-admin/orders?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.data ?? []);
        setMeta({ total: d.meta?.total ?? 0, totalPages: d.meta?.totalPages ?? 0 });
      })
      .finally(() => setIsLoading(false));
  }, [page, appliedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-primary mb-1">Orders</h1>
        <p className="text-sm text-secondary">Look up any order across every store, by order number or customer email.</p>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Order number or customer email..."
          className="w-full pl-9 pr-3 py-2 bg-surface border border-black/10 rounded-md text-sm text-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </form>

      <div className="bg-surface border border-black/10 rounded-lg overflow-hidden">
        {isLoading ? (
          <TableSkeleton columns={6} />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-secondary">
            <ShoppingBag className="w-8 h-8 mb-2 text-black/15" />
            {appliedSearch ? "No orders match that search." : "No orders yet."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/[0.02] border-b border-black/10">
                  <tr>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Order</th>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Store</th>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Customer</th>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide text-right">Total</th>
                    <th className="px-5 py-3 font-medium text-secondary text-xs uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {orders.map((o) => (
                    <tr key={o.order_id} className="hover:bg-black/[0.015]">
                      <td className="px-5 py-3 font-medium text-primary">{o.order_number}</td>
                      <td className="px-5 py-3">
                        {o.tenant ? (
                          <Link href={`/tenants/${o.tenant.tenant_id}`} className="text-primary hover:underline">
                            {o.tenant.tenant_name}
                          </Link>
                        ) : (
                          <span className="text-secondary">&mdash;</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-secondary">
                        {o.customers ? `${o.customers.first_name} ${o.customers.last_name}` : "Guest"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-primary">{formatRupees(o.grand_total)}</td>
                      <td className="px-5 py-3 text-secondary text-xs">{new Date(o.created_date).toLocaleDateString()}</td>
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
