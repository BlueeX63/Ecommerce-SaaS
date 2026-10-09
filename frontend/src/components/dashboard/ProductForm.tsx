"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Image as ImageIcon, X, Plus, Bot, Lock, Loader2, Sparkles, Trash2 } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { Bone } from "@/components/dashboard/Skeletons";
import Link from "next/link";

/** Create (no `productId`) or edit (with `productId`) a product. */
export function ProductForm({ productId }: { productId?: string }) {
  const isEdit = !!productId;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Stock: a fixed number of units, or "rather not say" (unlimited: stock isn't tracked).
  type StockMode = "tracked" | "unlimited" | null;
  const [stockMode, setStockMode] = useState<StockMode>(null);
  const [stockQty, setStockQty] = useState("");
  const [stockWarehouseId, setStockWarehouseId] = useState("");
  const [warehouses, setWarehouses] = useState<{ value: string; label: string; primary: boolean }[]>([]);
  const [stockSummary, setStockSummary] = useState<{ tracked: boolean; perWarehouse: { warehouseId: string; name: string; quantity: number }[] } | null>(null);
  const [stockDirty, setStockDirty] = useState(false);

  useEffect(() => {
    fetch("/api/v1/warehouses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = (d?.data ?? []).filter((w: any) => w.is_active);
        setWarehouses(list.map((w: any) => ({ value: w.warehouse_id, label: w.warehouse_name, primary: !!w.is_primary })));
        setStockWarehouseId((cur) => cur || list.find((w: any) => w.is_primary)?.warehouse_id || list[0]?.warehouse_id || "");
      })
      .catch(() => undefined);
  }, []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);
  const [catalogs, setCatalogs] = useState<{value: string, label: string}[]>([]);
  const [hasAiTools, setHasAiTools] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiImageBusy, setAiImageBusy] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/context')
      .then(r => r.ok ? r.json() : null)
      .then(data => setHasAiTools(!!data?.featureFlags?.includes('ai_tools')))
      .catch(() => setHasAiTools(false));
  }, []);

  useEffect(() => {
    fetch('/api/v1/categories', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setCategories(data.data.map((c: any) => ({ value: c.category_id, label: c.category_name })));
        }
      })
      .catch(console.error);
      
    fetch('/api/v1/catalogs', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setCatalogs(
            data.data
              .filter((c: any) => c.catalog_type !== 'GENERAL')
              .map((c: any) => ({ value: c.catalog_id, label: c.catalog_name }))
          );
        }
      })
      .catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    productName: "",
    slug: "",
    categoryId: "",
    sku: "",
    currency: "USD",
    basePrice: "",
    description: "",
    imageUrls: ["", "", "", ""] as string[], // 0 is primary, 1-3 are side images
    threeDModelUrl: "",
    status: "ACTIVE",
    catalogs: [] as { catalogId: string; catalogPriceOverride: string }[]
  });

  useEffect(() => {
    fetch('/api/v1/dashboard/settings')
      .then(r => r.json())
      .then(data => {
        if (data.formData?.currency) {
          setFormData(prev => ({ ...prev, currency: data.formData.currency }));
        }
      })
      .catch(console.error);
  }, []);

  const [slugDirty, setSlugDirty] = useState(isEdit);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    fetch(`/api/v1/products/${productId}`, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Product not found");
        return body.data;
      })
      .then((p) => {
        if (cancelled) return;
        const images = [...(p.product_images ?? [])]
          .sort((a: any, b: any) => Number(!!b.is_primary) - Number(!!a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((i: any) => i.image_url as string);
        if (p.stock) {
          setStockSummary(p.stock);
          setStockMode(p.stock.tracked ? "tracked" : "unlimited");
          if (p.stock.tracked && p.stock.perWarehouse.length === 1) {
            setStockQty(String(p.stock.perWarehouse[0].quantity));
            setStockWarehouseId(p.stock.perWarehouse[0].warehouseId);
          }
        }
        setFormData((prev) => ({
          ...prev,
          productName: p.product_name ?? "",
          slug: p.slug ?? "",
          categoryId: p.category_id ?? "",
          sku: p.sku ?? "",
          basePrice: p.base_price !== null && p.base_price !== undefined ? String(p.base_price) : "",
          description: p.description ?? "",
          imageUrls: [0, 1, 2, 3].map((i) => images[i] ?? ""),
          threeDModelUrl: p.three_d_model_url ?? "",
          status: p.status ?? "ACTIVE",
        }));
      })
      .catch((e) => !cancelled && setLoadError(e.message))
      .finally(() => !cancelled && setIsFetching(false));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'slug') setSlugDirty(true);

    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'productName' && !slugDirty ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') } : {})
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: uploadData,
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => {
          const newUrls = [...prev.imageUrls];
          newUrls[index] = data.url;
          return { ...prev, imageUrls: newUrls };
        });
      } else {
        const err = await res.json();
        setFormError(err.error || "Failed to upload image");
      }
    } catch (error) {
      setFormError("An error occurred during upload");
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => {
      const newUrls = [...prev.imageUrls];
      newUrls[indexToRemove] = "";
      return { ...prev, imageUrls: newUrls };
    });
  };

  /** Gate for every AI action: without the add-on, send the merchant to billing instead. */
  const ensureAiTools = () => {
    if (hasAiTools) return true;
    router.push("/dashboard/settings/billing");
    return false;
  };

  const callAi = async (path: string, body: Record<string, unknown>) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "The AI request failed. Please try again.");
    return data;
  };

  const setImageUrl = (index: number, url: string) => {
    setFormData(prev => {
      const newUrls = [...prev.imageUrls];
      newUrls[index] = url;
      return { ...prev, imageUrls: newUrls };
    });
  };

  /** Fills description, SKU and category from the product name. An existing SKU or category is never overwritten. */
  const handleAiAssist = async () => {
    if (!ensureAiTools()) return;
    if (!formData.productName.trim()) {
      alert("Enter a product name first.");
      return;
    }
    setIsGeneratingAi(true);
    try {
      const listing = await callAi("/api/v1/ai/product-listing", {
        productName: formData.productName,
        description: formData.description || undefined,
      });
      setFormData(prev => ({
        ...prev,
        description: listing.description,
        sku: prev.sku || listing.sku || "",
        categoryId: prev.categoryId || listing.categoryId || "",
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate the listing");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  /** Creates a studio-style photo for an empty image slot from the product name. */
  const handleGenerateImage = async (index: number) => {
    if (!ensureAiTools()) return;
    if (!formData.productName.trim()) {
      alert("Enter a product name first.");
      return;
    }
    setAiImageBusy(index);
    try {
      const category = categories.find(c => c.value === formData.categoryId)?.label;
      const data = await callAi("/api/v1/ai/product-image/generate", {
        productName: formData.productName,
        category,
        description: formData.description || undefined,
      });
      setImageUrl(index, data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not generate an image");
    } finally {
      setAiImageBusy(null);
    }
  };

  /** Re-shoots an existing image on a clean white studio background. */
  const handleCleanImage = async (index: number) => {
    if (!ensureAiTools()) return;
    const current = formData.imageUrls[index];
    if (!current) return;
    setAiImageBusy(index);
    try {
      const data = await callAi("/api/v1/ai/product-image/clean", { imageUrl: current });
      setImageUrl(index, data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not clean up this image");
    } finally {
      setAiImageBusy(null);
    }
  };

  const multiWarehouseTracked = isEdit && !!stockSummary?.tracked && stockSummary.perWarehouse.length > 1;
  const qtyValid = /^\d+$/.test(stockQty.trim());
  const stockValid = isEdit ? !stockDirty || stockMode === "unlimited" || (stockMode === "tracked" && qtyValid) : stockMode === "unlimited" || (stockMode === "tracked" && qtyValid && !!stockWarehouseId);

  const stockPayload = () =>
    stockMode === "tracked" ? { mode: "tracked", quantity: Number(stockQty), warehouseId: stockWarehouseId || undefined } : { mode: "unlimited" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const images = formData.imageUrls.filter((url) => url !== "");
      const res = isEdit
        ? await fetch(`/api/v1/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productName: formData.productName,
              slug: formData.slug,
              categoryId: formData.categoryId || null,
              sku: formData.sku,
              description: formData.description,
              basePrice: formData.basePrice === "" ? undefined : formData.basePrice,
              threeDModelUrl: formData.threeDModelUrl,
              status: formData.status,
              imageUrls: images,
              ...(stockDirty ? { stock: stockPayload() } : {}),
            }),
          })
        : await fetch("/api/v1/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...formData,
              // Filter out empty slots, ensuring primary image stays at index 0 if it exists
              imageUrls: images,
              catalogs: formData.catalogs.filter((c) => c.catalogId !== ""),
              stock: stockPayload(),
            }),
          });

      if (res.ok) {
        router.push("/dashboard/products");
        router.refresh();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setFormError(errorData.error || (isEdit ? "Failed to save changes" : "Failed to create product"));
      }
    } catch (error) {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    if (!confirm(`Delete "${formData.productName || "this product"}" permanently? Past orders keep their line items, but the product disappears from your store. This can't be undone.`)) return;
    setIsDeleting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/v1/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/products");
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setFormError(d.error || "Failed to delete product");
      }
    } catch {
      setFormError("Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6" role="status" aria-busy="true">
        <span className="sr-only">Loading product…</span>
        <div className="md:col-span-2 space-y-6">
          <Bone className="h-12 w-72" />
          <Bone className="h-72 w-full rounded-[24px]" />
          <Bone className="h-64 w-full rounded-[24px]" />
        </div>
        <div className="space-y-6">
          <Bone className="h-56 w-full rounded-[24px]" />
          <Bone className="h-36 w-full rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <p className="text-secondary mb-4">{loadError}</p>
        <Link href="/dashboard/products" className="text-sm font-medium text-primary underline">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl text-primary mb-1">{isEdit ? "Edit Product" : "Add Product"}</h1>
            <p className="text-secondary text-sm">{isEdit ? "Update this product's details, images and price." : "Create a new product for your catalog."}</p>
          </div>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete product
          </button>
        )}
      </div>

      {formError && (
        <div role="alert" className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[24px] border border-black/[0.04] p-8 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500">
            <div>
              <label className="block text-[12px] font-bold tracking-widest uppercase text-black/50 mb-2">Product Name *</label>
              <input 
                required
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="e.g. Minimalist Ceramic Vase"
                className="w-full px-4 py-3 bg-[#F9F9F9] border border-black/[0.05] rounded-xl focus:outline-none focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5 text-sm transition-all duration-300 placeholder:text-black/30"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold tracking-widest uppercase text-black/50 mb-2">URL Slug *</label>
              <input 
                required
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="e.g. minimalist-ceramic-vase"
                className="w-full px-4 py-3 bg-[#F9F9F9] border border-black/[0.05] rounded-xl focus:outline-none focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5 text-sm transition-all duration-300 placeholder:text-black/30"
              />
              <p className="text-xs text-secondary mt-1">This will be the URL path for your product.</p>
            </div>

            <div>
              <label className="block text-[12px] font-bold tracking-widest uppercase text-black/50 mb-2">Category</label>
              <CustomSelect
                name="categoryId"
                value={formData.categoryId}
                onChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                placeholder="Select a category"
                options={categories}
              />
            </div>

            {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-primary">Catalog Assignments (Optional)</label>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, catalogs: [...prev.catalogs, { catalogId: "", catalogPriceOverride: "" }] }))}
                  className="text-xs font-medium text-[#FF4D00] hover:text-[#e64500] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Assignment
                </button>
              </div>
              
              {formData.catalogs.map((assignment, index) => (
                <div key={index} className="flex gap-3 mb-3 p-3 bg-black/[0.02] rounded-xl border border-black/[0.04]">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Catalog</label>
                    <CustomSelect
                      name={`catalog-${index}`}
                      value={assignment.catalogId}
                      onChange={(val) => {
                        const newCatalogs = [...formData.catalogs];
                        newCatalogs[index].catalogId = val;
                        setFormData({ ...formData, catalogs: newCatalogs });
                      }}
                      placeholder="Select catalog"
                      options={catalogs}
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-black/40 mb-1">Price Override</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={assignment.catalogPriceOverride}
                      onChange={(e) => {
                        const newCatalogs = [...formData.catalogs];
                        newCatalogs[index].catalogPriceOverride = e.target.value;
                        setFormData({ ...formData, catalogs: newCatalogs });
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <button 
                      type="button" 
                      onClick={() => {
                        const newCatalogs = formData.catalogs.filter((_, i) => i !== index);
                        setFormData({ ...formData, catalogs: newCatalogs });
                      }}
                      className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[12px] font-bold tracking-widest uppercase text-black/50">Description</label>
                <button
                  type="button"
                  onClick={handleAiAssist}
                  disabled={isGeneratingAi}
                  title={hasAiTools ? "Generate a description with AI Product Tools" : "AI Product Tools is a paid add-on"}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#FF4D00] hover:text-[#e64500] disabled:opacity-50"
                >
                  {isGeneratingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hasAiTools ? <Bot className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  AI Assist
                </button>
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-[#F9F9F9] border border-black/[0.05] rounded-xl focus:outline-none focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5 text-sm transition-all duration-300 placeholder:text-black/30"
              />
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-black/[0.04] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500">
            <h3 className="text-[12px] font-bold tracking-widest uppercase text-black/50 mb-6 border-b border-black/[0.04] pb-4">Media & 3D Assets</h3>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-primary mb-3">Product Images (Up to 4)</label>
              
              <div className="flex flex-col gap-4">
                {/* Primary Image Slot */}
                <ImageUploadSlot
                  url={formData.imageUrls[0]}
                  aiBusy={aiImageBusy === 0}
                  hasAiTools={hasAiTools}
                  onGenerate={() => handleGenerateImage(0)}
                  onClean={() => handleCleanImage(0)}
                  isUploading={uploadingIndex === 0} 
                  isDisabled={uploadingIndex !== null && uploadingIndex !== 0}
                  onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleImageUpload(e, 0)} 
                  onRemove={() => removeImage(0)} 
                  label="Primary Image" 
                  isPrimary={true}
                />
                
                {/* Side Images */}
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((index) => (
                    <ImageUploadSlot 
                      key={index}
                      url={formData.imageUrls[index]}
                      aiBusy={aiImageBusy === index}
                      hasAiTools={hasAiTools}
                      onGenerate={() => handleGenerateImage(index)}
                      onClean={() => handleCleanImage(index)}
                      isUploading={uploadingIndex === index} 
                      isDisabled={uploadingIndex !== null && uploadingIndex !== index}
                      onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleImageUpload(e, index)} 
                      onRemove={() => removeImage(index)} 
                      label={`Side Image ${index}`} 
                      isPrimary={false}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-[12px] font-bold tracking-widest uppercase text-black/50 mb-2">3D Model URL (Optional)</label>
              <input 
                name="threeDModelUrl"
                value={formData.threeDModelUrl}
                onChange={handleChange}
                placeholder="https://example.com/shoe.glb"
                className="w-full px-4 py-3 bg-[#F9F9F9] border border-black/[0.05] rounded-xl focus:outline-none focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5 text-sm transition-all duration-300 placeholder:text-black/30"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[24px] border border-black/[0.04] p-8 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500">
            <h3 className="text-[12px] font-bold tracking-widest uppercase text-black/50 mb-6 border-b border-black/[0.04] pb-4">Status & Pricing</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col justify-end">
                <label className="block text-[12px] font-bold tracking-widest uppercase text-black/50 mb-2">Base Price</label>
                <input 
                  type="number"
                  step="0.01"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-[#F9F9F9] border border-black/[0.05] rounded-xl focus:outline-none focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5 text-sm transition-all duration-300 placeholder:text-black/30"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="block text-[12px] font-bold tracking-widest uppercase text-black/50 mb-2">Currency</label>
                <CustomSelect
                  name="currency"
                  value={formData.currency}
                  onChange={(val) => {
                     setFormData(prev => ({ ...prev, currency: val }));
                     
                     // Optional: Attempt to save it to settings immediately, though it might overwrite other settings if not careful.
                     // A safer way is to fetch existing, update, then save.
                     fetch('/api/v1/dashboard/settings')
                       .then(r => r.json())
                       .then(data => {
                         const currentData = data.formData || {};
                         fetch('/api/v1/dashboard/settings', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ formData: { ...currentData, currency: val } })
                         });
                       });
                  }}
                  options={[
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'GBP', label: 'GBP (£)' },
                    { value: 'CAD', label: 'CAD (C$)' },
                    { value: 'AUD', label: 'AUD (A$)' },
                    { value: 'INR', label: 'INR (₹)' }
                  ]}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[12px] font-bold tracking-widest uppercase text-black/50 mb-2">Status</label>
              <CustomSelect
                name="status"
                value={formData.status}
                onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "DRAFT", label: "Draft" },
                  { value: "ARCHIVED", label: "Archived" }
                ]}
              />
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-black/[0.04] p-8 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-500">
            <h3 className="text-[12px] font-bold tracking-widest uppercase text-black/50 mb-6 border-b border-black/[0.04] pb-4">Inventory</h3>
            <div>
              <label className="block text-[12px] font-bold tracking-widest uppercase text-black/50 mb-2">SKU</label>
              <input 
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#F9F9F9] border border-black/[0.05] rounded-xl focus:outline-none focus:border-black/20 focus:bg-white focus:ring-4 focus:ring-black/5 text-sm transition-all duration-300 placeholder:text-black/30 font-mono uppercase"
              />
            </div>

            <div className="pt-2">
              <label className="block text-[12px] font-bold tracking-widest uppercase text-black/50 mb-3">Stock *</label>
              <div className="space-y-3" role="radiogroup" aria-label="Stock">
                <label className={`block cursor-pointer rounded-xl border p-4 transition-colors ${stockMode === "tracked" ? "border-black bg-black/[0.03]" : "border-black/10 hover:bg-black/[0.02]"} ${multiWarehouseTracked ? "opacity-70" : ""}`}>
                  <input
                    type="radio"
                    name="stockMode"
                    className="sr-only"
                    checked={stockMode === "tracked"}
                    disabled={multiWarehouseTracked}
                    onChange={() => {
                      setStockMode("tracked");
                      setStockDirty(true);
                    }}
                  />
                  <span className="block text-sm font-medium text-primary">I have a fixed number of units</span>
                  <span className="block text-xs text-secondary mt-0.5">Orders reduce this number, and you&apos;re alerted when it runs out.</span>
                  {stockMode === "tracked" && !multiWarehouseTracked && (
                    <div className="mt-3 grid grid-cols-2 gap-3" onClick={(e) => e.preventDefault()}>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="Units in stock"
                        aria-label="Units in stock"
                        value={stockQty}
                        onChange={(e) => {
                          setStockQty(e.target.value);
                          setStockDirty(true);
                        }}
                        className="w-full px-3 py-2 bg-white border border-black/[0.1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      />
                      {warehouses.length > 1 && !isEdit ? (
                        <CustomSelect value={stockWarehouseId} onChange={setStockWarehouseId} options={warehouses.map((w) => ({ value: w.value, label: w.primary ? `${w.label} (main)` : w.label }))} />
                      ) : (
                        <span className="self-center text-xs text-secondary truncate">{warehouses.find((w) => w.value === stockWarehouseId)?.label ?? "Your warehouse"}</span>
                      )}
                    </div>
                  )}
                </label>

                <label className={`block cursor-pointer rounded-xl border p-4 transition-colors ${stockMode === "unlimited" ? "border-black bg-black/[0.03]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                  <input
                    type="radio"
                    name="stockMode"
                    className="sr-only"
                    checked={stockMode === "unlimited"}
                    onChange={() => {
                      setStockMode("unlimited");
                      setStockDirty(true);
                    }}
                  />
                  <span className="block text-sm font-medium text-primary">Rather not say</span>
                  <span className="block text-xs text-secondary mt-0.5">Stock is unlimited: it can always be ordered and is never marked out of stock.</span>
                </label>
              </div>

              {multiWarehouseTracked && stockSummary && (
                <div className="mt-3 rounded-xl bg-black/[0.03] p-3 text-xs text-secondary space-y-1">
                  <p className="font-medium text-primary">Stock by warehouse</p>
                  {stockSummary.perWarehouse.map((w) => (
                    <p key={w.warehouseId} className="flex justify-between"><span>{w.name}</span><span className="tabular-nums">{w.quantity}</span></p>
                  ))}
                  <p>Adjust these from <a href="/dashboard/inventory" className="underline">Inventory</a>.</p>
                </div>
              )}
              {!isEdit && stockMode === null && <p className="mt-2 text-xs text-secondary">Choose one to continue.</p>}
              {warehouses.length === 0 && stockMode === "tracked" && <p className="mt-2 text-xs text-red-600">Add your warehouse first so we know where this stock is.</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.productName || !formData.slug || !formData.categoryId || !stockValid}
            className="group relative w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-white rounded-[20px] overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.2)] hover:-translate-y-1 active:translate-y-0 active:shadow-none"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-[0.16,1,0.3,1] rounded-[16px]" />
            <div className="relative z-10 flex items-center gap-2">
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="font-medium">{isEdit ? "Save Changes" : "Save Product"}</span>
            </div>
          </button>
        </div>
      </form>
    </div>
  );
}

function ImageUploadSlot({ url, isUploading, isDisabled, onUpload, onRemove, onGenerate, onClean, aiBusy, hasAiTools, label, isPrimary }: any) {
  return (
    <div className={`relative bg-black/[0.02] border-2 border-dashed border-black/[0.08] rounded-xl overflow-hidden group ${isPrimary ? 'aspect-video' : 'aspect-square'}`}>
      {url ? (
        <>
          <img src={url} alt={label} className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
            {onClean && (
              <button
                type="button"
                onClick={onClean}
                disabled={aiBusy}
                title={hasAiTools ? "Re-shoot on a clean white studio background" : "AI Product Tools is a paid add-on"}
                className="bg-white text-primary px-3 py-1.5 rounded-lg shadow-md text-xs font-bold hover:bg-black/5 transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {hasAiTools ? <Sparkles className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />} Clean up with AI
              </button>
            )}
             <button
                type="button" 
                onClick={onRemove}
                className="bg-white text-red-600 px-3 py-1.5 rounded-lg shadow-md text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
          </div>
          {aiBusy && (
            <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2 text-xs font-medium text-primary">
              <Loader2 className="w-5 h-5 animate-spin" /> Working on it…
            </div>
          )}
          {isPrimary && (
            <div className="absolute top-3 left-3 bg-[#FF4D00] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-[0.1em] shadow-sm">
              Primary
            </div>
          )}
        </>
      ) : (
        <>
          <input 
            type="file"
            accept="image/*"
            onChange={onUpload}
            disabled={isDisabled || isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center transition-colors ${isUploading || isDisabled ? 'opacity-50' : 'group-hover:bg-black/[0.04]'}`}>
             {isUploading ? (
               <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
             ) : (
               <>
                 <ImageIcon className={`text-black/30 mb-2 ${isPrimary ? 'w-8 h-8' : 'w-6 h-6'}`} />
                 <span className={`font-medium text-primary ${isPrimary ? 'text-sm' : 'text-xs'}`}>{label}</span>
                 {isPrimary && <span className="text-[10px] text-secondary mt-1">Recommended: 16:9 ratio</span>}
                 {onGenerate && (
                   <button
                     type="button"
                     onClick={onGenerate}
                     disabled={aiBusy || isDisabled}
                     className="relative z-20 mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#FF4D00] hover:text-[#e64500] disabled:opacity-50"
                   >
                     {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hasAiTools ? <Sparkles className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                     Generate with AI
                   </button>
                 )}
               </>
             )}
          </div>
        </>
      )}
    </div>
  );
}
