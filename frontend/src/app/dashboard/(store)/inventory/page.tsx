"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, MapPin, Box, X, Pencil, Power, Users, Route } from "lucide-react";
import { WarehouseEmployeesModal } from "@/components/dashboard/WarehouseEmployeesModal";
import { WarehouseRoutesModal } from "@/components/dashboard/WarehouseRoutesModal";
import { CustomSelect } from "@/components/CustomSelect";

import { TableSkeletonRows } from "@/components/dashboard/Skeletons";
type Warehouse = {
  warehouse_id: string;
  warehouse_name: string;
  address_line_1: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  dispatch_hours: number | null;
  daily_capacity: number | null;
  is_primary: boolean | null;
  warehouse_employees?: Array<{ count: number }>;
  is_active: boolean;
};

const EMPTY_LOCATION = { warehouseName: "", addressLine1: "", city: "", state: "", postalCode: "", country: "India", dispatchHours: "24", dailyCapacity: "50" };

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

export default function InventoryPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [locationForm, setLocationForm] = useState(EMPTY_LOCATION);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [busyWarehouseId, setBusyWarehouseId] = useState<string | null>(null);
  const [employeesFor, setEmployeesFor] = useState<Warehouse | null>(null);
  const [routesFor, setRoutesFor] = useState<Warehouse | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [adjustForm, setAdjustForm] = useState({ productId: "", warehouseId: "", quantityChange: "", reason: "" });
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
    setLocationForm(EMPTY_LOCATION);
    setLocationError(null);
    setIsLocationModalOpen(true);
  };

  const openEditLocation = (w: Warehouse) => {
    setEditingWarehouse(w);
    setLocationForm({
      warehouseName: w.warehouse_name,
      addressLine1: w.address_line_1 ?? "",
      city: w.city ?? "",
      state: w.state_province ?? "",
      postalCode: w.postal_code ?? "",
      country: w.country ?? "",
      dispatchHours: String(w.dispatch_hours ?? 24),
      dailyCapacity: String(w.daily_capacity ?? 50),
    });
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
          addressLine1: locationForm.addressLine1 || undefined,
          city: locationForm.city || undefined,
          state: locationForm.state || undefined,
          postalCode: locationForm.postalCode || undefined,
          country: locationForm.country || undefined,
          dispatchHours: locationForm.dispatchHours === "" ? undefined : Number(locationForm.dispatchHours),
          dailyCapacity: locationForm.dailyCapacity === "" ? undefined : Number(locationForm.dailyCapacity),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsLocationModalOpen(false);
        fetchWarehouses();
      } else {
        setLocationError(Array.isArray(data.details) ? data.details.join(" · ") : data.error || "Failed to save location");
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
    setAdjustForm({ productId: "", warehouseId: "", quantityChange: "", reason: "" });
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

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdjustment(true);
    setAdjustError(null);
    try {
      const res = await fetch("/api/v1/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustForm.productId,
          warehouseId: adjustForm.warehouseId,
          quantityChange: Number(adjustForm.quantityChange),
          reason: adjustForm.reason || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsAdjustModalOpen(false);
        fetchInventory();
      } else {
        setAdjustError(data.error || "Failed to adjust stock");
      }
    } catch {
      setAdjustError("Something went wrong. Please try again.");
    } finally {
      setIsSavingAdjustment(false);
    }
  };

  const productOptions = products.map((p) => ({ value: p.product_id, label: p.sku ? `${p.product_name} (${p.sku})` : p.product_name }));
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-heading font-semibold">{editingWarehouse ? "Edit Location" : "Add Location"}</h2>
              <button onClick={() => setIsLocationModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLocation} className="p-6 space-y-4 overflow-y-auto">
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Street address</label>
                <input
                  type="text"
                  value={locationForm.addressLine1}
                  onChange={(e) => setLocationForm({ ...locationForm, addressLine1: e.target.value })}
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">PIN / postal code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={locationForm.postalCode}
                    onChange={(e) => setLocationForm({ ...locationForm, postalCode: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">City</label>
                  <input
                    type="text"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">State</label>
                  <input
                    type="text"
                    value={locationForm.state}
                    onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">Country</label>
                  <input
                    type="text"
                    value={locationForm.country}
                    onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}
                    className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Dispatch time (hours)</label>
                <input
                  type="number"
                  min={0}
                  max={336}
                  value={locationForm.dispatchHours}
                  onChange={(e) => setLocationForm({ ...locationForm, dispatchHours: e.target.value })}
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
                <p className="text-xs text-secondary">
                  How long this warehouse needs to pack and hand over an order. We find its map position from the address / PIN code, then use it to estimate delivery time for shoppers near it.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Orders packed per day</label>
                <input
                  type="number"
                  min={1}
                  value={locationForm.dailyCapacity}
                  onChange={(e) => setLocationForm({ ...locationForm, dailyCapacity: e.target.value })}
                  className="w-full px-4 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
                <p className="text-xs text-secondary">When this warehouse has more open orders than it can pack in a day, delivery estimates add a day or more.</p>
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
                  onChange={(v) => setAdjustForm({ ...adjustForm, productId: v })}
                  options={productOptions}
                  placeholder={products.length === 0 ? "Loading products..." : "Select a product"}
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
                  disabled={isSavingAdjustment || !adjustForm.productId || !adjustForm.warehouseId || !adjustForm.quantityChange}
                  className="px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {isSavingAdjustment ? "Saving..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {employeesFor && (
        <WarehouseEmployeesModal warehouseId={employeesFor.warehouse_id} warehouseName={employeesFor.warehouse_name} onClose={() => setEmployeesFor(null)} onChanged={fetchWarehouses} />
      )}
      {routesFor && <WarehouseRoutesModal warehouseId={routesFor.warehouse_id} warehouseName={routesFor.warehouse_name} onClose={() => setRoutesFor(null)} />}

      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-black/[0.04] flex justify-between items-center bg-black/[0.01]">
          <h3 className="font-medium text-primary">Warehouse Locations</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/[0.04]">
              <tr>
                <th className="px-6 py-4 font-medium text-primary">Location Name</th>
                <th className="px-6 py-4 font-medium text-primary">Address</th>
                <th className="px-6 py-4 font-medium text-primary">Map position</th>
                <th className="px-6 py-4 font-medium text-primary text-center">Status</th>
                <th className="px-6 py-4 font-medium text-primary text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {isLoading ? (
                <TableSkeletonRows rows={6} cols={5} first="text" />
              ) : warehouses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-secondary">
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
                      {w.is_primary && <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-black text-white">Main</span>}
                    </td>
                    <td className="px-6 py-4 text-secondary">
                      {[w.city, w.state_province, w.postal_code].filter(Boolean).join(", ") || w.country || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {w.latitude !== null && w.longitude !== null ? (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Located</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800" title="Add a PIN code or city so delivery times can be estimated">
                          Add PIN code
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${w.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {w.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEmployeesFor(w)} className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors flex items-center gap-1 text-xs" title="Employees">
                          <Users className="w-4 h-4" />
                          <span className="tabular-nums">{w.warehouse_employees?.[0]?.count ?? 0}</span>
                        </button>
                        <button onClick={() => setRoutesFor(w)} className="p-1.5 text-secondary hover:bg-black/5 hover:text-primary rounded-md transition-colors" title="Shipping routes">
                          <Route className="w-4 h-4" />
                        </button>
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
                <TableSkeletonRows rows={6} cols={5} first="text" />
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
