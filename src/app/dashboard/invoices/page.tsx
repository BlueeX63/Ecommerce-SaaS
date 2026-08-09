"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, FileText, Download } from "lucide-react";

type Invoice = {
  invoice_id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  grand_total: number;
  amount_due: number;
  customers: { first_name: string; last_name: string; email: string } | null;
  dealers: { company_name: string } | null;
  orders: { order_number: string } | null;
};

import { useCurrency } from "@/components/dashboard/CurrencyProvider";
import { useRouter, useSearchParams } from "next/navigation";

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatCurrency } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch("/api/v1/invoices");
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch invoices");
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Invoices</h1>
          <p className="text-secondary text-sm">Manage billing, payments, and overdue invoices.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Search by invoice number or client..." 
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
                <th className="px-6 py-4 font-medium text-primary">Invoice Number</th>
                <th className="px-6 py-4 font-medium text-primary">Client</th>
                <th className="px-6 py-4 font-medium text-primary">Issue Date</th>
                <th className="px-6 py-4 font-medium text-primary">Due Date</th>
                <th className="px-6 py-4 font-medium text-primary text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
                <th className="px-6 py-4 font-medium text-primary text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-secondary">
                    <FileText className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>No invoices found.</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.invoice_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-medium text-primary">
                      {inv.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {inv.dealers ? inv.dealers.company_name : inv.customers ? `${inv.customers.first_name} ${inv.customers.last_name}` : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {new Date(inv.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-medium text-primary">{formatCurrency(inv.grand_total)}</p>
                      {inv.amount_due > 0 && <p className="text-xs text-secondary mt-0.5">{formatCurrency(inv.amount_due)} due</p>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                        inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 
                        inv.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-1">
                      <button className="p-1.5 text-secondary hover:bg-black/5 rounded-md transition-colors" title="Download PDF">
                        <Download className="w-4 h-4" />
                      </button>
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
