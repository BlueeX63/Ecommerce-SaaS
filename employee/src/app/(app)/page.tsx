"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Package, PackageCheck, Truck } from "lucide-react";
import { Bone, LoadingRegion, PageHeader, StatusBadge } from "@/components/ui";

interface Overview {
  toPack: number;
  toDeliver: number;
  trackedProducts: number;
  outOfStock: number;
  stockAlerts: Array<{ productId: string; name: string; available: number; kind: "out" | "low" }>;
  oldestOrders: Array<{ order_id: string; order_number: string; status: string; payment_status: string; grand_total: number; created_date: string; shipping_name: string | null }>;
}

function Stat({ icon, label, value, tone = "text-primary", href }: { icon: React.ReactNode; label: string; value: number; tone?: string; href: string }) {
  return (
    <Link href={href} className="bg-surface rounded-2xl border border-black/[0.04] p-6 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-secondary">{label}</span>
        <span className="w-9 h-9 rounded-xl bg-black/[0.04] flex items-center justify-center text-primary">{icon}</span>
      </div>
      <p className={`font-heading text-4xl tabular-nums ${tone}`}>{value}</p>
    </Link>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/employee/overview", { cache: "no-store" })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error || "Failed to load");
        setData(body);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" subtitle="What needs doing at your warehouse right now." />

      {error && <p role="alert" className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</p>}

      {!data && !error ? (
        <LoadingRegion className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => <Bone key={i} className="h-32 rounded-2xl" />)}
          </div>
          <Bone className="h-64 rounded-2xl" />
        </LoadingRegion>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Stat href="/orders" icon={<PackageCheck className="w-5 h-5" />} label="Orders to pack" value={data.toPack} tone={data.toPack > 0 ? "text-accent" : "text-primary"} />
            <Stat href="/orders" icon={<Truck className="w-5 h-5" />} label="Out for delivery" value={data.toDeliver} />
            <Stat href="/products" icon={<AlertTriangle className="w-5 h-5" />} label="Out of stock here" value={data.outOfStock} tone={data.outOfStock > 0 ? "text-red-600" : "text-primary"} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-black/[0.04]">
                <h2 className="font-heading text-lg">Waiting longest</h2>
                <Link href="/orders" className="text-xs font-medium text-accent flex items-center gap-1 hover:underline">All orders <ArrowRight className="w-3 h-3" /></Link>
              </div>
              {data.oldestOrders.length === 0 ? (
                <p className="p-10 text-center text-sm text-secondary">No open orders. Nice work.</p>
              ) : (
                <ul className="divide-y divide-black/[0.04]">
                  {data.oldestOrders.map((o) => (
                    <li key={o.order_id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary">{o.order_number}</p>
                        <p className="text-xs text-secondary truncate">{o.shipping_name ?? "Customer"} · {new Date(o.created_date).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge value={o.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-black/[0.04]">
                <h2 className="font-heading text-lg">Stock alerts</h2>
                <Link href="/products" className="text-xs font-medium text-accent flex items-center gap-1 hover:underline">Manage stock <ArrowRight className="w-3 h-3" /></Link>
              </div>
              {data.stockAlerts.length === 0 ? (
                <div className="p-10 text-center text-sm text-secondary">
                  <Package className="w-10 h-10 text-black/10 mx-auto mb-3" />
                  {data.trackedProducts === 0 ? "No products are tracked at this warehouse yet." : "Everything is well stocked."}
                </div>
              ) : (
                <ul className="divide-y divide-black/[0.04]">
                  {data.stockAlerts.map((a, i) => (
                    <li key={`${a.productId}-${i}`} className="px-5 py-3.5 flex items-center justify-between gap-3">
                      <span className="text-sm text-primary truncate">{a.name}</span>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${a.kind === "out" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                        {a.kind === "out" ? "Out of stock" : `${a.available} left`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
