"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Trash2, Ticket, CheckCircle2, XCircle } from "lucide-react";

type Coupon = {
  coupon_id: string;
  code: string;
  discount_type: string;
  discount_amount: number;
  max_uses: number | null;
  times_used: number;
  expiry_date: string | null;
  is_active: boolean;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/v1/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error("Failed to fetch coupons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await fetch(`/api/v1/coupons/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.coupon_id !== id));
      } else {
        alert("Failed to delete coupon");
      }
    } catch (err) {
      alert("An error occurred while deleting");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.coupon_id === id ? { ...c, is_active: !currentStatus } : c));
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Coupons</h1>
          <p className="text-secondary text-sm">Create and manage discount codes for your customers.</p>
        </div>
        <Link href="/dashboard/coupons/new" className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Add Coupon
        </Link>
      </div>

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Search coupons by code..." 
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
                <th className="px-6 py-4 font-medium text-primary">Code</th>
                <th className="px-6 py-4 font-medium text-primary">Discount</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Usage</th>
                <th className="px-6 py-4 font-medium text-primary">Expiry Date</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
                <th className="px-6 py-4 font-medium text-primary text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                    <Ticket className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>No coupons found.</p>
                    <Link href="/dashboard/coupons/new" className="text-black font-medium hover:underline mt-2 inline-block">Create your first coupon</Link>
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.coupon_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-mono font-medium text-primary">{c.code}</td>
                    <td className="px-6 py-4 text-secondary">
                      {c.discount_type === 'PERCENTAGE' ? `${c.discount_amount}%` : `$${c.discount_amount}`} off
                    </td>
                    <td className="px-6 py-4 text-center text-secondary">
                      {c.times_used} / {c.max_uses === null ? '∞' : c.max_uses}
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleStatus(c.coupon_id, c.is_active)} className="inline-flex items-center gap-1 hover:opacity-80">
                        {c.is_active ? (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(c.coupon_id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
