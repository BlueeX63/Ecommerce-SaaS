"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Filter, ShoppingCart, Download, ExternalLink } from "lucide-react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";
import { Pagination } from "@/components/dashboard/Pagination";

import { TableSkeletonRows } from "@/components/dashboard/Skeletons";
const PAGE_LIMIT = 50;

type Order = {
  order_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  grand_total: number;
  created_date: string;
  customers: { first_name: string; last_name: string; email: string } | null;
  dealers: { company_name: string } | null;
};

export default function OrdersPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });

  const filteredOrders = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const customerName = o.customers ? `${o.customers.first_name} ${o.customers.last_name}` : o.dealers?.company_name || "";
    return o.order_number.toLowerCase().includes(q) || customerName.toLowerCase().includes(q);
  });

  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/orders?page=${page}&limit=${PAGE_LIMIT}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.data || []);
          setMeta({ total: data.meta?.total ?? 0, totalPages: data.meta?.totalPages ?? 0 });
        }
      } catch {
        console.error("Failed to fetch orders");
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Orders</h1>
          <p className="text-secondary text-sm">View and manage all B2C and wholesale orders.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 text-primary rounded-lg hover:bg-black/5 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number or customer..."
              className="w-full pl-9 pr-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-lg hover:bg-black/5 transition-colors text-sm font-medium text-primary">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.01] border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Order</th>
                <th className="px-6 py-4 font-medium text-primary">Date</th>
                <th className="px-6 py-4 font-medium text-primary">Customer/Dealer</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Payment</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Fulfillment</th>
                <th className="px-6 py-4 font-medium text-primary text-right">Total</th>
                <th className="px-6 py-4 font-medium text-primary text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <TableSkeletonRows rows={6} cols={7} first="text" />
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-secondary">
                    <ShoppingCart className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>{orders.length === 0 ? "No orders yet." : "No orders match your search."}</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr
                    key={o.order_id}
                    onClick={() => router.push(`/dashboard/orders/${o.order_id}`)}
                    className="hover:bg-black/[0.01] cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-primary">
                      {o.order_number}
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {new Date(o.created_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {o.customers ? `${o.customers.first_name} ${o.customers.last_name}` : o.dealers ? o.dealers.company_name : 'Guest'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        o.payment_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        o.fulfillment_status === 'FULFILLED' ? 'bg-green-100 text-green-700' :
                        o.fulfillment_status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {o.fulfillment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(o.grand_total)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${o.order_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_LIMIT} onPageChange={setPage} />
      </div>
    </div>
  );
}
