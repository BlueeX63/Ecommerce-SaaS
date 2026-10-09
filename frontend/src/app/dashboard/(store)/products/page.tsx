"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";
import { Pagination } from "@/components/dashboard/Pagination";
import { TableSkeletonRows } from "@/components/dashboard/Skeletons";
import { CustomSelect } from "@/components/CustomSelect";

const PAGE_LIMIT = 20;

type Product = {
  product_id: string;
  product_name: string;
  slug: string;
  sku: string | null;
  base_price: number;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  created_date: string;
  categories: { category_name: string } | null;
  product_images: Array<{ image_url: string; is_primary: boolean }> | null;
  /** Units across active warehouses, or null when stock isn't tracked for this product. */
  stock_total: number | null;
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DRAFT: "bg-amber-100 text-amber-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

export default function ProductsPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const requestId = useRef(0);

  // Debounce typing so the list isn't re-fetched on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (status) params.set("status", status);
      const res = await fetch(`/api/v1/products?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (id !== requestId.current) return; // a newer request superseded this one
      if (!res.ok) throw new Error(data.error || "Failed to load products");
      setProducts(data.data || []);
      setMeta({ total: data.meta?.total ?? 0, totalPages: data.meta?.totalPages ?? 0 });
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleVisibility = async (p: Product) => {
    const next = p.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    setBusyId(p.product_id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/products/${p.product_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to update product");
      }
      setProducts((prev) => prev.map((x) => (x.product_id === p.product_id ? { ...x, status: next } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update product");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/products/${pendingDelete.product_id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to delete product");
      }
      setPendingDelete(null);
      // Stay on a valid page if that was the last row.
      if (products.length === 1 && page > 1) setPage(page - 1);
      else await fetchProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete product");
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const primaryImage = (p: Product) => p.product_images?.find((i) => i.is_primary)?.image_url ?? p.product_images?.[0]?.image_url;

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

      {error && (
        <div role="alert" className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU…"
              aria-label="Search products"
              className="w-full pl-9 pr-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
          <div className="w-full sm:w-44">
            <CustomSelect
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={[
                { value: "", label: "All statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "DRAFT", label: "Draft" },
                { value: "ARCHIVED", label: "Archived" },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/[0.01] border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Product</th>
                <th className="px-6 py-4 font-medium text-primary">Category</th>
                <th className="px-6 py-4 font-medium text-primary">SKU</th>
                <th className="px-6 py-4 font-medium text-primary text-right">Price</th>
                <th className="px-6 py-4 font-medium text-primary text-right">Stock</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
                <th className="px-6 py-4 font-medium text-primary text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading && products.length === 0 ? (
                <TableSkeletonRows rows={6} cols={7} />
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-secondary">
                    <Package className="w-12 h-12 text-black/10 mx-auto mb-3" />
                    {debouncedSearch || status ? (
                      <p>No products match your search.</p>
                    ) : (
                      <p>No products yet. Start by adding one!</p>
                    )}
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const image = primaryImage(p);
                  const busy = busyId === p.product_id;
                  return (
                    <tr
                      key={p.product_id}
                      onClick={() => router.push(`/dashboard/products/${p.product_id}/edit`)}
                      className={`cursor-pointer hover:bg-black/[0.015] transition-colors ${isLoading ? "opacity-60" : ""}`}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-12 h-12 rounded-lg bg-black/[0.04] overflow-hidden flex items-center justify-center shrink-0 border border-black/[0.04]">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={image} alt="" loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-black/20" aria-hidden />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-primary truncate max-w-[240px]">{p.product_name}</p>
                            <p className="text-xs text-secondary truncate max-w-[240px]">/{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-secondary">{p.categories?.category_name || "-"}</td>
                      <td className="px-6 py-3 text-secondary font-mono text-xs">{p.sku || "-"}</td>
                      <td className="px-6 py-3 text-right font-medium tabular-nums">{formatCurrency(Number(p.base_price))}</td>
                      <td className="px-6 py-3 text-right tabular-nums">
                        {p.stock_total === null ? (
                          <span className="text-secondary" title="Stock isn't tracked for this product">—</span>
                        ) : p.stock_total === 0 ? (
                          <span className="text-red-600 font-medium">Out of stock</span>
                        ) : (
                          p.stock_total
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLE[p.status] ?? "bg-gray-100 text-gray-700"}`}>{p.status}</span>
                      </td>
                      <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/products/${p.product_id}/edit`}
                            className="p-2 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors"
                            title="Edit product"
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="sr-only">Edit {p.product_name}</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleVisibility(p)}
                            disabled={busy}
                            className="p-2 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors disabled:opacity-50"
                            title={p.status === "ACTIVE" ? "Hide from store (archive)" : "Show in store (activate)"}
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : p.status === "ACTIVE" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            <span className="sr-only">{p.status === "ACTIVE" ? "Archive" : "Activate"} {p.product_name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(p)}
                            className="p-2 text-secondary hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">Delete {p.product_name}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={PAGE_LIMIT} onPageChange={setPage} />
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-start p-6">
              <div>
                <h2 id="delete-title" className="text-lg font-heading font-semibold text-primary">
                  Delete this product?
                </h2>
                <p className="mt-2 text-sm text-secondary">
                  <span className="font-medium text-primary">{pendingDelete.product_name}</span> will be removed from your store and catalogs. Past orders keep their line items. This can&apos;t be undone — to just hide it, archive it instead.
                </p>
              </div>
              <button onClick={() => setPendingDelete(null)} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setPendingDelete(null)} disabled={isDeleting} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
