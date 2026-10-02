"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye } from "lucide-react";
import Image from "next/image";

const templates = [
  { id: "starter-minimalist", name: "Minimalist", category: "Fashion", img: "/screenshots/starter_minimalist.png" },
  { id: "starter-essence", name: "Essence", category: "Clean Skincare", img: "/screenshots/starter_essence.png" },
  { id: "starter-origin", name: "Origin", category: "Soft Ceramics", img: "/screenshots/starter_origin.png" },
  { id: "starter-canvas", name: "Canvas", category: "Editorial Furniture", img: "/screenshots/starter_canvas.png" },
  { id: "growth-nexus-pro", name: "Nexus Pro", category: "Tech & Gadgets", img: "/screenshots/growth_nexus_pro.png" },
  { id: "growth-velocity", name: "Velocity", category: "Dark Cyberpunk", img: "/screenshots/growth_velocity.png" },
  { id: "growth-quantum", name: "Quantum", category: "Animated", img: "/screenshots/growth_quantum.png" },
  { id: "growth-horizon", name: "Horizon", category: "Digital", img: "/screenshots/growth_horizon.png" }
];

export default function TemplateSelectionPage() {
  const router = useRouter();

  const handleSelect = (templateId: string) => {
    router.push(`/onboarding/customize?template=${templateId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F5] font-body text-black flex flex-col items-center py-12 px-6">
      
      {/* Header */}
      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tighter mb-4 text-primary">
          Choose Your Foundation
        </h1>
        <p className="text-secondary/70 text-lg">
          Select a template to start customizing your store.
        </p>
        
        <div className="mt-8 flex justify-center">
          <Link href="/templates?mode=preview" className="flex items-center gap-2 px-6 py-3 bg-white border border-black/10 rounded-full font-medium hover:bg-black hover:text-white transition-all shadow-sm">
            <Eye className="w-4 h-4" />
            Preview Templates
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {templates.map((template, idx) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-white rounded-2xl overflow-hidden border border-black/5 hover:border-black/20 hover:shadow-lg transition-all cursor-pointer flex flex-col"
            onClick={() => handleSelect(template.id)}
          >
            {/* Image Thumbnail */}
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden w-full">
              <img 
                src={template.img} 
                alt={template.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <h3 className="font-bold text-lg text-primary">{template.name}</h3>
                <p className="text-sm text-secondary/60 mb-4">{template.category}</p>
              </div>
              <button className="flex items-center justify-center gap-2 w-full py-2 bg-black text-white rounded-lg font-medium text-sm group-hover:bg-[#FF4D00] transition-colors">
                Select <Check className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
