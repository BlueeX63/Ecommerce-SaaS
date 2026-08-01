"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, MapPin, Box } from "lucide-react";

type Warehouse = {
  warehouse_id: string;
  warehouse_name: string;
  city: string;
  country: string;
  is_active: boolean;
};

export default function InventoryPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const res = await fetch("/api/v1/warehouses");
        if (res.ok) {
          const data = await res.json();
          setWarehouses(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch warehouses");
      } finally {
        setIsLoading(false);
      }
    }
    fetchWarehouses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl text-primary mb-1">Inventory & Warehouses</h1>
          <p className="text-secondary text-sm">Manage stock levels across multiple locations.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 text-primary rounded-lg hover:bg-black/5 transition-colors text-sm font-medium">
            <Box className="w-4 h-4" />
            Stock Adjustment
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>
      </div>

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
                    <td className="px-6 py-4 text-secondary">
                      {w.city ? `${w.city}, ${w.country}` : w.country}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        w.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {w.is_active ? 'Active' : 'Inactive'}
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
      
      {/* Inventory Table Stub */}
      <div className="bg-surface rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden mt-8">
        <div className="p-4 border-b border-black/[0.04] flex gap-4 bg-black/[0.01]">
          <h3 className="font-medium text-primary py-1">Inventory Levels</h3>
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              placeholder="Search by SKU..." 
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-black/[0.08] rounded-md focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
        </div>
        <div className="p-12 text-center text-secondary">
          Select a warehouse to view its inventory, or search for a specific product SKU.
        </div>
      </div>
    </div>
  );
}
