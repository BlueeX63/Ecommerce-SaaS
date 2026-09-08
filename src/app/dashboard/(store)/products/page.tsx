"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreVertical, Package, ExternalLink } from "lucide-react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";

type Product = {
  product_id: string;
  name: string;
  sku: string;
  base_price: number;
  status: string;
  created_date: string;
  categories: { category_name: string } | null;
  image_urls: string[];
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/v1/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch products");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/v1/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setProducts(products.map(p => p.product_id === id ? { ...p, status: newStatus } : p));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Products</h1>
          <p className="text-secondary text-sm">Manage your product catalog and inventory.</p>
        </div>
        <Link 
          href="/dashboard/products/new"
          className="group relative flex items-center gap-2 px-5 py-2.5 bg-[#050505] text-white rounded-[12px] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0 text-sm font-medium"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-[0.16,1,0.3,1] rounded-[12px]" />
          <div className="relative z-10 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </div>
        </Link>
      </div>

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Search products..." 
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
                <th className="px-6 py-4 font-medium text-primary">Product</th>
                <th className="px-6 py-4 font-medium text-primary">Category</th>
                <th className="px-6 py-4 font-medium text-primary">SKU</th>
                <th className="px-6 py-4 font-medium text-primary text-right">Price</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                    <Package className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    <p>No products found. Start by adding one!</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.product_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black/[0.04] overflow-hidden flex items-center justify-center shrink-0">
                          {p.image_urls?.[0] ? (
                            <img src={p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-black/20" />
                          )}
                        </div>
                        <span className="font-medium text-primary truncate max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-secondary">{p.categories?.category_name || '-'}</td>
                    <td className="px-6 py-4 text-secondary font-mono text-xs">{p.sku || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.base_price)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => toggleStatus(p.product_id, p.status)} className="p-1.5 text-secondary hover:bg-black/5 rounded-md transition-colors" title="Toggle Status">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-secondary hover:bg-black/5 rounded-md transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
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
