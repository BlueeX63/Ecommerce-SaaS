"use client";

import { motion } from "framer-motion";
import { Store, ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface StoreItem {
  tenant_id: string;
  tenant_name: string;
  code: string;
  custom_domain: string | null;
}

export function StoreSelector({ stores }: { stores: StoreItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const selectStore = async (tenantId: string) => {
    setLoadingId(tenantId);
    try {
      const res = await fetch("/api/v1/auth/switch-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId })
      });
      if (res.ok) {
        // Redirect to the overview page for the newly selected store
        router.push('/dashboard/overview');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store, i) => (
          <motion.div
            key={store.tenant_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => selectStore(store.tenant_id)}
            className="group relative bg-white/5 border border-white/10 p-6 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FF4D00]/20 text-[#FF4D00] flex items-center justify-center mb-6">
              <Store className="w-6 h-6" />
            </div>
            
            <h3 className="text-xl font-heading text-white mb-2 group-hover:text-[#FF4D00] transition-colors">{store.tenant_name}</h3>
            <p className="text-sm font-mono text-zinc-500 mb-6">{store.custom_domain || `${store.code}.your-saas.com`}</p>
            
            <div className="flex items-center text-sm font-medium text-white/50 group-hover:text-white transition-colors">
              {loadingId === store.tenant_id ? "Switching..." : "Manage Store"}
              <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stores.length * 0.1 }}
          onClick={() => router.push('/dashboard/create')}
          className="group flex flex-col items-center justify-center text-center relative bg-transparent border-2 border-dashed border-white/10 p-6 rounded-2xl cursor-pointer hover:border-[#FF4D00]/50 hover:bg-[#FF4D00]/5 transition-all min-h-[220px]"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 text-white/50 flex items-center justify-center mb-4 group-hover:bg-[#FF4D00] group-hover:text-white transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-heading text-white/70 group-hover:text-white transition-colors">Create New Store</h3>
        </motion.div>
      </div>
    </div>
  );
}
