"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);
  
  useEffect(() => {
    fetch('/api/v1/categories', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setCategories(data.data.map((c: any) => ({ value: c.category_id, label: c.category_name })));
        }
      })
      .catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    productName: "",
    slug: "",
    categoryId: "",
    sku: "",
    basePrice: "",
    currency: "INR",
    description: "",
    imageUrls: ["", "", "", ""] as string[], // 0 is primary, 1-3 are side images
    threeDModelUrl: "",
    status: "ACTIVE"
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'productName' ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') } : {})
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
        alert(err.error || "Failed to upload image");
      }
    } catch (error) {
      alert("An error occurred during upload");
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
          // Filter out empty slots, ensuring primary image stays at index 0 if it exists
          imageUrls: formData.imageUrls.filter(url => url !== "")
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
              <label className="block text-sm font-medium text-primary mb-1">Category</label>
              <CustomSelect
                name="categoryId"
                value={formData.categoryId}
                onChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                placeholder="Select a category"
                options={categories}
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
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-primary mb-3">Product Images (Up to 4)</label>
              
              <div className="flex flex-col gap-4">
                {/* Primary Image Slot */}
                <ImageUploadSlot 
                  url={formData.imageUrls[0]} 
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
              <label className="block text-sm font-medium text-primary mb-1">3D Model URL (Optional)</label>
              <input 
                name="threeDModelUrl"
                value={formData.threeDModelUrl}
                onChange={handleChange}
                placeholder="https://example.com/shoe.glb"
                className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 space-y-4 shadow-sm">
            <h3 className="font-medium text-primary mb-2">Pricing & Status</h3>
            
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Base Price *</label>
              <div className="flex gap-2">
                <CustomSelect
                  name="currency"
                  value={formData.currency}
                  onChange={(val) => setFormData(prev => ({ ...prev, currency: val }))}
                  className="w-28 shrink-0"
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "EUR", label: "EUR" },
                    { value: "GBP", label: "GBP" },
                    { value: "INR", label: "INR" }
                  ]}
                />
                <input 
                  required
                  type="number"
                  step="0.01"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Status</label>
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
            className="group relative w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#050505] text-white rounded-[16px] overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-[0.16,1,0.3,1] rounded-[16px]" />
            <div className="relative z-10 flex items-center gap-2">
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="font-medium">Save Product</span>
            </div>
          </button>
        </div>
      </form>
    </div>
  );
}

function ImageUploadSlot({ url, isUploading, isDisabled, onUpload, onRemove, label, isPrimary }: any) {
  return (
    <div className={`relative bg-black/[0.02] border-2 border-dashed border-black/[0.08] rounded-xl overflow-hidden group ${isPrimary ? 'aspect-video' : 'aspect-square'}`}>
      {url ? (
        <>
          <img src={url} alt={label} className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button 
                type="button" 
                onClick={onRemove}
                className="bg-white text-red-600 px-3 py-1.5 rounded-lg shadow-md text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
          </div>
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
               </>
             )}
          </div>
        </>
      )}
    </div>
  );
}
