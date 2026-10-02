"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, MapPin, Box, X, Pencil, Power } from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";

type Warehouse = {
  warehouse_id: string;
  warehouse_name: string;
  city: string | null;
  country: string | null;
  is_active: boolean;
};

type InventoryRow = {
  inventory_id: string;
  variant_id: string;
  warehouse_id: string;
  quantity_available: number;
  quantity_reserved: number;
  product_variants: { sku: string | null; products: { product_name: string; sku: string | null } | null } | null;
  warehouses: { warehouse_name: string } | null;
};

type ProductOption = { product_id: string; product_name: string; sku: string | null };
type VariantOption = { variant_id: string; sku: string | null };

export default function InventoryPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [locationForm, setLocationForm] = useState({ warehouseName: "", city: "", country: "" });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [busyWarehouseId, setBusyWarehouseId] = useState<string | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: "", variantId: "", warehouseId: "", quantityChange: "", reason: "" });
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);

  const fetchWarehouses = async () => {
    const res = await fetch("/api/v1/warehouses");
    if (res.ok) setWarehouses((await res.json()).data || []);
  };

  const fetchInventory = async () => {
    const res = await fetch("/api/v1/inventory");
    if (res.ok) setInventory((await res.json()).data || []);
  };

  useEffect(() => {
    Promise.all([fetchWarehouses(), fetchInventory()]).finally(() => setIsLoading(false));
  }, []);

  const filteredInventory = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((row) => {
      const name = row.product_variants?.products?.product_name ?? "";
      const sku = row.product_variants?.sku ?? row.product_variants?.products?.sku ?? "";
      return name.toLowerCase().includes(q) || sku.toLowerCase().includes(q);
    });
  }, [inventory, search]);

  // Locations
  const openAddLocation = () => {
    setEditingWarehouse(null);
    setLocationForm({ warehouseName: "", city: "", country: "" });
    setLocationError(null);
    setIsLocationModalOpen(true);
  };

  const openEditLocation = (w: Warehouse) => {
    setEditingWarehouse(w);
    setLocationForm({ warehouseName: w.warehouse_name, city: w.city ?? "", country: w.country ?? "" });
    setLocationError(null);
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLocation(true);
    setLocationError(null);
    try {
      const isEdit = !!editingWarehouse;
      const res = await fetch(isEdit ? `/api/v1/warehouses/${editingWarehouse!.warehouse_id}` : "/api/v1/warehouses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseName: locationForm.warehouseName,
          city: locationForm.city || undefined,
          country: locationForm.country || undefined,
        }),
      });
      if (res.ok) {
        setIsLocationModalOpen(false);
        fetchWarehouses();
      } else {
        const data = await res.json();
        setLocationError(data.error || "Failed to save location");
      }
    } catch {
      setLocationError("Something went wrong. Please try again.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  const toggleWarehouseActive = async (w: Warehouse) => {
    setBusyWarehouseId(w.warehouse_id);
    try {
      const res = await fetch(`/api/v1/warehouses/${w.warehouse_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !w.is_active }),
      });
      if (res.ok) setWarehouses((prev) => prev.map((x) => (x.warehouse_id === w.warehouse_id ? { ...x, is_active: !w.is_active } : x)));
    } finally {
      setBusyWarehouseId(null);
    }
  };

  // Stock adjustment
  const openAdjustModal = async () => {
    setAdjustForm({ productId: "", variantId: "", warehouseId: "", quantityChange: "", reason: "" });
    setVariants([]);
    setAdjustError(null);
    setIsAdjustModalOpen(true);
    if (products.length === 0) {
      const res = await fetch("/api/v1/products?limit=100");
      if (res.ok) {
        const data: { data: ProductOption[] } = await res.json();
        setProducts((data.data || []).map((p) => ({ product_id: p.product_id, product_name: p.product_name, sku: p.sku })));
      }
    }
  };

  const handleProductChange = async (productId: string) => {
    setAdjustForm((prev) => ({ ...prev, productId, variantId: "" }));
    setVariants([]);
    if (!productId) return;
    setIsLoadingVariants(true);
    try {
      const res = await fetch(`/api/v1/products/${productId}`);
      if (res.ok) {
        const data: { data: { product_variants: VariantOption[] } } = await res.json();
        setVariants((data.data?.product_variants || []).map((v) => ({ variant_id: v.variant_id, sku: v.sku })));
      }
    } finally {
      setIsLoadingVariants(false);
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdjustment(true);
    setAdjustError(null);
    try {
      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: adjustForm.variantId,
          warehouseId: adjustForm.warehouseId,
          quantityChange: Number(adjustForm.quantityChange),
          reason: adjustForm.reason || undefined,
        }),
      });
      if (res.ok) {
        setIsAdjustModalOpen(false);
        fetchInventory();
      } else {
        const data = await res.json();
        setAdjustError(data.error || "Failed to adjust stock");
      }
    } catch {
      setAdjustError("Something went wrong. Please try again.");
    } finally {
      setIsSavingAdjustment(false);
    }
  };

  const productOptions = products.map((p) => ({ value: p.product_id, label: p.sku ? `${p.product_name} (${p.sku})` : p.product_name }));
  const variantOptions = variants.map((v) => ({ value: v.variant_id, label: v.sku || "Default variant" }));
  const warehouseOptions = warehouses.filter((w) => w.is_active).map((w) => ({ value: w.warehouse_id, label: w.warehouse_name }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Inventory & Warehouses</h1>
          <p className="text-secondary text-sm">Manage stock levels across multiple locations.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAdjustModal}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 text-primary rounded-lg hover:bg-black/5 transition-colors text-sm font-medium"
          >
            <Box className="w-4 h-4" />
            Stock Adjustment
          </button>
          <button
            onClick={openAddLocation}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>
      </div>

      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-heading font-semibold">{editingWarehouse ? "Edit Location" : "Add Location"}</h2>
              <button onClick={() => setIsLocationModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLocation} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Location Name</label>
                <input
                  required
                  type="text"
                  value={locationForm.warehouseName}
                  onChange={(e) => setLocationForm({ ...locationForm, warehouseName: e.target.value })}
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">City</label>
                  <input
                    type="text"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-primary">Country</label>
                  <input
                    type="text"
                    value={locationForm.country}
                    onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
              {locationError && <p className="text-sm text-red-600">{locationError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsLocationModalOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLocation}
                  className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {isSavingLocation ? "Saving..." : editingWarehouse ? "Save Changes" : "Add Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-heading font-semibold">Stock Adjustment</h2>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Product</label>
                <CustomSelect
                  value={adjustForm.productId}
                  onChange={handleProductChange}
                  options={productOptions}
                  placeholder={products.length === 0 ? "Loading products..." : "Select a product"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Variant</label>
                <CustomSelect
                  value={adjustForm.variantId}
                  onChange={(v) => setAdjustForm({ ...adjustForm, variantId: v })}
                  options={variantOptions}
                  placeholder={!adjustForm.productId ? "Select a product first" : isLoadingVariants ? "Loading..." : "Select a variant"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Warehouse</label>
                <CustomSelect
                  value={adjustForm.warehouseId}
                  onChange={(v) => setAdjustForm({ ...adjustForm, warehouseId: v })}
                  options={warehouseOptions}
                  placeholder="Select a warehouse"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Quantity Change</label>
                <input
                  required
                  type="number"
                  placeholder="e.g. 50 or -10"
                  value={adjustForm.quantityChange}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantityChange: e.target.value })}
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
                <p className="text-xs text-secondary">Positive to add stock, negative to remove it.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. New shipment received"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              {adjustError && <p className="text-sm text-red-600">{adjustError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdjustment || !adjustForm.variantId || !adjustForm.warehouseId || !adjustForm.quantityChange}
                  className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {isSavingAdjustment ? "Saving..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex justify-between items-center bg-black/[0.01]">
          <h3 className="font-medium text-primary">Warehouse Locations</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Location Name</th>
                <th className="px-6 py-4 font-medium text-primary">City, Country</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
                <th className="px-6 py-4 font-medium text-primary text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : warehouses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-secondary">
                    <MapPin className="w-8 h-8 text-black/10 mx-auto mb-2" />
                    <p>No warehouses found.</p>
                  </td>
                </tr>
              ) : (
                warehouses.map((w) => (
                  <tr key={w.warehouse_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-medium text-primary flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-secondary" />
                      {w.warehouse_name}
                    </td>
                    <td className="px-6 py-4 text-secondary">{w.city ? `${w.city}, ${w.country ?? ""}` : w.country || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${w.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {w.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditLocation(w)} className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleWarehouseActive(w)}
                          disabled={busyWarehouseId === w.warehouse_id}
                          className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors disabled:opacity-50"
                          title={w.is_active ? "Deactivate" : "Reactivate"}
                        >
                          <Power className="w-4 h-4" />
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

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden mt-8">
        <div className="p-4 border-b border-black/[0.04] flex gap-4 bg-black/[0.01]">
          <h3 className="font-medium text-primary py-1">Inventory Levels</h3>
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name or SKU..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-black/[0.08] rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Product</th>
                <th className="px-6 py-4 font-medium text-primary">SKU</th>
                <th className="px-6 py-4 font-medium text-primary">Warehouse</th>
                <th className="px-6 py-4 font-medium text-primary text-right">Available</th>
                <th className="px-6 py-4 font-medium text-primary text-right">Reserved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-secondary">
                    {inventory.length === 0
                      ? "No inventory records yet. Use Stock Adjustment to add your first stock entry."
                      : "No inventory matches your search."}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((row) => (
                  <tr key={row.inventory_id} className="hover:bg-black/[0.01]">
                    <td className="px-6 py-4 font-medium text-primary">{row.product_variants?.products?.product_name || "Unknown product"}</td>
                    <td className="px-6 py-4 text-secondary">{row.product_variants?.sku || row.product_variants?.products?.sku || "-"}</td>
                    <td className="px-6 py-4 text-secondary">{row.warehouses?.warehouse_name || "-"}</td>
                    <td className="px-6 py-4 text-right font-medium text-primary">{row.quantity_available}</td>
                    <td className="px-6 py-4 text-right text-secondary">{row.quantity_reserved ?? 0}</td>
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
