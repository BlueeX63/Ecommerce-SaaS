"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, Briefcase } from "lucide-react";

type Dealer = {
  dealer_id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  status: string;
  payment_terms: string;
  dealer_branches: { branch_name: string; city: string }[];
};

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDealers() {
      try {
        const res = await fetch("/api/v1/dealers");
        if (res.ok) {
          const data = await res.json();
          setDealers(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch dealers");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDealers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Wholesale & Dealers</h1>
          <p className="text-secondary text-sm">Manage B2B partners, credit limits, and branches.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Add Dealer
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Search by company name..." 
              className="w-full pl-9 pr-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.01] border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Company</th>
                <th className="px-6 py-4 font-medium text-primary">Contact</th>
                <th className="px-6 py-4 font-medium text-primary">Terms</th>
                <th className="px-6 py-4 font-medium text-primary">Branches</th>
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
              ) : dealers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                    <Briefcase className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>No dealers found.</p>
                  </td>
                </tr>
              ) : (
                dealers.map((d) => (
                  <tr key={d.dealer_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-medium text-primary">
                      {d.company_name}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-primary">{d.contact_name}</p>
                      <p className="text-xs text-secondary">{d.contact_email}</p>
                    </td>
                    <td className="px-6 py-4 text-secondary">{d.payment_terms || '-'}</td>
                    <td className="px-6 py-4 text-secondary">{d.dealer_branches?.length || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        d.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-secondary hover:bg-black/5 rounded-md transition-colors">
                        <MoreVertical className="w-4 h-4" />
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
