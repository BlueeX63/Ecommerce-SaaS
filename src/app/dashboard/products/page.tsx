"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreVertical, Package, Cuboid } from "lucide-react";

type Product = {
  product_id: string;
  product_name: string;
  sku: string;
  base_price: number;
  status: string;
  categories: { category_name: string };
  has_variants: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Products</h1>
          <p className="text-secondary text-sm">Manage your product catalog, pricing, and variants.</p>
        </div>
        <Link href="/dashboard/products/new" className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Search products by name, SKU..." 
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
                <th className="px-6 py-4 font-medium text-primary">SKU</th>
                <th className="px-6 py-4 font-medium text-primary">Category</th>
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
                    <p>No products found.</p>
                    <Link href="/dashboard/products/new" className="text-black font-medium hover:underline mt-2 inline-block">Create your first product</Link>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.product_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black/5 rounded-lg flex items-center justify-center text-secondary">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">{p.product_name}</p>
                          {p.has_variants && (
                            <p className="text-xs text-secondary flex items-center gap-1 mt-0.5">
                              <Cuboid className="w-3 h-3" /> Has variants
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-secondary font-mono text-xs">{p.sku || '-'}</td>
                    <td className="px-6 py-4 text-secondary">{p.categories?.category_name || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium">${p.base_price}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                        p.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {p.status}
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
