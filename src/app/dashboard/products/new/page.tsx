"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: "",
    slug: "",
    sku: "",
    basePrice: "",
    description: "",
    threeDModelUrl: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'productName' ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          basePrice: parseFloat(formData.basePrice),
          status: "DRAFT"
        })
      });

      if (res.ok) {
        router.push("/dashboard/products");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to create product");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl text-primary mb-1">Add Product</h1>
            <p className="text-secondary text-sm">Create a new product for your catalog.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 space-y-4 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Product Name *</label>
              <input 
                required
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                placeholder="e.g. Minimalist Ceramic Vase"
                className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Slug *</label>
              <input 
                required
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
              />
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 shadow-sm">
            <h3 className="font-medium text-primary mb-4">Media & 3D Assets</h3>
            <div className="border-2 border-dashed border-black/10 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <ImageIcon className="w-8 h-8 text-black/20 mb-3" />
              <p className="text-sm font-medium text-primary">Upload Images or GLTF Models</p>
              <p className="text-xs text-secondary mt-1">Drag and drop, or click to browse</p>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-secondary mb-1">3D Model URL (Optional)</label>
              <input 
                name="threeDModelUrl"
                value={formData.threeDModelUrl}
                onChange={handleChange}
                placeholder="https://example.com/shoe.glb"
                className="w-full px-3 py-1.5 bg-black/[0.02] border border-black/[0.08] rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 space-y-4 shadow-sm">
            <h3 className="font-medium text-primary mb-2">Pricing</h3>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Base Price ($) *</label>
              <input 
                required
                type="number"
                step="0.01"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
              />
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 space-y-4 shadow-sm">
            <h3 className="font-medium text-primary mb-2">Inventory</h3>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">SKU</label>
              <input 
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm font-mono uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-black/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}
