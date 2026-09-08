"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Save, Layout, Type, Image as ImageIcon, Eye, Check, AlignLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TEMPLATE_SCHEMAS, FieldType, FieldDef, TabDef } from "../../onboarding/customize/schemas";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.1); border-radius: 10px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.2); }
  `;
  document.head.appendChild(style);
}

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

export default function CreateStorePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState("starter-minimalist");

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setStep(2);
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#F8F7F5] font-body text-black flex flex-col items-center py-12 px-6">
        {/* Navbar */}
        <div className="w-full max-w-6xl flex justify-start mb-8">
          <Link href="/dashboard" className="flex items-center text-black/50 hover:text-black transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="max-w-4xl w-full text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tighter mb-4 text-black">
            Choose Your Foundation
          </h1>
          <p className="text-black/70 text-lg">
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
              onClick={() => handleSelectTemplate(template.id)}
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
                  <h3 className="font-bold text-lg text-black">{template.name}</h3>
                  <p className="text-sm text-black/60 mb-4">{template.category}</p>
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

  return (
    <LiveEditorWizard 
      templateId={selectedTemplate} 
      onBack={() => setStep(1)} 
    />
  );
}

function LiveEditorWizard({ templateId, onBack }: { templateId: string, onBack: () => void }) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const schema = TEMPLATE_SCHEMAS[templateId] || TEMPLATE_SCHEMAS["starter-minimalist"];
  const STEPS = schema.tabs.map((t: TabDef) => t.label);
  
  const parts = templateId.split("-");
  const name = parts.slice(1).join("-");
  const previewUrl = `/templates/${name}`;

  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initialData: Record<string, any> = {};
    schema.tabs.forEach((tab: TabDef) => {
      tab.fields.forEach((field: FieldDef) => {
        initialData[field.name] = field.defaultValue;
      });
    });
    return initialData;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const pushState = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "MONOLITH_CUSTOMIZATION",
            data: { formData, step: STEPS[activeStep] }
          },
          "*"
        );
      }
    };
    pushState();

    const handleRequest = (event: MessageEvent) => {
      if (event.data?.type === "MONOLITH_REQUEST_STATE") {
        pushState();
      }
    };
    
    window.addEventListener("message", handleRequest);
    return () => window.removeEventListener("message", handleRequest);
  }, [formData, activeStep, STEPS]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      // 1. Generate slug
      const baseSlug = formData.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const storeSlug = `${baseSlug}-${randomSuffix}`;

      // 2. Call our new store creation API!
      const res = await fetch("/api/v1/store/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.brandName || "My Store",
          slug: storeSlug,
          template: templateId,
          customizationData: formData // Optional: API might ignore this for now, but we send it
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Instead of calling /dashboard, call /dashboard/overview
        setTimeout(() => {
          router.push("/dashboard/overview");
          router.refresh();
        }, 3000);
      } else {
        alert("Deployment failed: " + data.error);
        setIsDeploying(false);
      }
    } catch (e) {
      alert("Deployment failed");
      setIsDeploying(false);
    }
  };

  if (!mounted) return null;

  if (isDeploying) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[#FF4D00]/5 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#FF4D00] animate-spin mb-8 relative z-10" />
        <h2 className="font-heading text-4xl md:text-5xl uppercase tracking-tighter mb-4 relative z-10">
          Provisioning Empire
        </h2>
        <p className="font-body text-white/50 relative z-10 max-w-sm text-center">
          Building isolated database schemas, applying edge templates, and setting up routing.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#050505] text-white flex overflow-hidden selection:bg-accent selection:text-white">
      
      {/* Left Panel: Form Wizard */}
      <div className="w-full lg:w-[45%] h-full border-r border-white/5 relative z-10 bg-[#050505] shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-20 z-20 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 px-8 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-accent text-xs uppercase tracking-widest font-bold">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse" />
            <span className="font-accent text-xs uppercase tracking-widest text-[#FF4D00] font-bold">Live Editor</span>
          </div>
        </div>

        {/* Content */}
        <div data-lenis-prevent className="absolute top-0 left-0 right-0 bottom-0 overflow-y-auto overscroll-contain touch-pan-y custom-scroll pt-28 pb-32 px-8 lg:px-12 xl:px-16">
          
          {/* Title */}
          <div className="mb-12">
            <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tighter text-white mb-4">
              Shape Your <span className="text-[#FF4D00]">Vision</span>
            </h1>
            <p className="font-body text-white/40 leading-relaxed max-w-sm text-sm">
              Fine-tune every pixel for the <span className="text-white font-bold">{schema.name}</span> template. Use existing premium assets or inject your brand's unique identity.
            </p>
          </div>

          {/* Step Progress */}
          <div className="flex gap-2 mb-12">
            {STEPS.map((stepName, idx) => (
              <div key={stepName} className="flex-1 flex flex-col gap-2">
                <div 
                  className={cn(
                    "h-1 rounded-full w-full transition-all duration-500",
                    activeStep >= idx ? "bg-[#FF4D00]" : "bg-white/10"
                  )}
                />
                <span className={cn(
                  "font-accent text-[10px] uppercase tracking-widest transition-colors duration-500",
                  activeStep >= idx ? "text-white" : "text-white/30"
                )}>
                  {stepName}
                </span>
              </div>
            ))}
          </div>

          {/* Dynamic Form based on activeStep */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-8"
            >
              {schema.tabs[activeStep]?.fields.map((field: FieldDef) => {
                if (field.type === 'text' || field.type === 'textarea') {
                  return (
                    <Field 
                      key={field.name}
                      label={field.label} 
                      icon={field.type === 'textarea' ? <AlignLeft className="w-4 h-4" /> : <Type className="w-4 h-4" />} 
                      fieldKey={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleFieldChange}
                      placeholder={field.placeholder || field.defaultValue}
                      isTextArea={field.type === 'textarea'}
                    />
                  );
                }
                if (field.type === 'image') {
                  return (
                    <ImageUploadField 
                      key={field.name}
                      label={field.label} 
                      icon={<ImageIcon className="w-4 h-4" />} 
                      fieldKey={field.name}
                      value={formData[field.name]}
                      onChange={handleFieldChange}
                    />
                  );
                }
                return null;
              })}
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-[#050505]/80 backdrop-blur-xl border-t border-white/5 p-6 flex justify-between items-center gap-4">
          <button 
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="px-6 py-4 rounded-xl border border-white/10 font-accent text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            Previous
          </button>
          
          {activeStep < STEPS.length - 1 ? (
            <button 
              onClick={() => setActiveStep(prev => Math.min(STEPS.length - 1, prev + 1))}
              className="px-8 py-4 rounded-xl bg-white text-black font-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#FF4D00] hover:text-white transition-all hover:scale-105 active:scale-95 group"
            >
              Next Step
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button 
              onClick={handleDeploy}
              className="px-8 py-4 rounded-xl bg-[#FF4D00] text-white font-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:shadow-[0_0_40px_rgba(255,77,0,0.4)] transition-all hover:scale-105 active:scale-95 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
              <Save className="w-4 h-4 relative z-10 group-hover:text-black transition-colors" />
              <span className="relative z-10 font-accent font-bold uppercase tracking-widest text-xs group-hover:text-black transition-colors">Deploy Empire</span>
            </button>
          )}
        </div>

      </div>

      {/* Right Panel: Live Preview Iframe */}
      <div className="hidden lg:flex flex-1 h-screen flex-col bg-[#111111] p-4">
        
        {/* Mock Browser Header */}
        <div className="h-12 w-full bg-[#1A1A1A] rounded-t-2xl flex items-center px-4 border border-white/5 border-b-0 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-black/30 rounded-md px-6 py-1.5 flex items-center gap-2 text-white/30 text-xs font-mono">
              <Layout className="w-3 h-3" />
              preview.monolith.dev{previewUrl}
            </div>
          </div>
          <div className="w-16" /> {/* Spacer */}
        </div>
        
        {/* Iframe */}
        <div className="flex-1 w-full relative rounded-b-2xl overflow-hidden border border-white/5 bg-white">
          <iframe 
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-none"
            title="Live Preview"
            loading="lazy"
            onLoad={(e) => {
              try {
                const iframe = e.target as HTMLIFrameElement;
                if (iframe.contentWindow) {
                  iframe.contentWindow.postMessage(
                    {
                      type: "MONOLITH_CUSTOMIZATION",
                      data: { formData, step: STEPS[activeStep] }
                    },
                    "*"
                  );
                }
                if (iframe.contentDocument) {
                  const style = document.createElement('style');
                  style.innerHTML = '::-webkit-scrollbar { display: none !important; } * { -ms-overflow-style: none !important; scrollbar-width: none !important; }';
                  iframe.contentDocument.head.appendChild(style);
                }
              } catch(err) {}
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Field Component
function Field({ label, icon, fieldKey, value, onChange, placeholder, isTextArea }: any) {
  return (
    <div className="group flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-accent text-xs uppercase tracking-widest text-white/70">
          <span className="text-white/30 group-hover:text-[#FF4D00] transition-colors">{icon}</span>
          {label}
        </label>
      </div>
      
      <div className={`transition-all duration-500 overflow-hidden ${isTextArea ? 'h-24' : 'h-12'} opacity-100`}>
        {isTextArea ? (
          <textarea 
            value={value}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={placeholder}
            className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 font-body text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF4D00]/50 focus:ring-1 focus:ring-[#FF4D00]/50 transition-all resize-none custom-scroll text-sm"
          />
        ) : (
          <input 
            type="text"
            value={value}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            placeholder={placeholder}
            className="w-full h-full bg-black/40 border border-white/10 rounded-xl px-4 font-body text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF4D00]/50 focus:ring-1 focus:ring-[#FF4D00]/50 transition-all text-sm"
          />
        )}
      </div>
    </div>
  );
}

function ImageUploadField({ label, icon, fieldKey, value, onChange }: any) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(fieldKey, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="group flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2 font-accent text-xs uppercase tracking-widest text-white/70">
          <span className="text-white/30 group-hover:text-[#FF4D00] transition-colors">{icon}</span>
          {label}
        </label>
        {value && (
          <button 
            onClick={() => onChange(fieldKey, "")}
            className="flex items-center gap-1.5 text-white/30 hover:text-red-500 transition-colors z-20"
            title="Remove Image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="relative group/upload">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="w-full h-32 bg-black/40 border border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center font-body text-white/30 text-xs overflow-hidden relative transition-all group-hover/upload:border-[#FF4D00]/50 group-hover/upload:text-white/50 group-hover/upload:bg-[#FF4D00]/5">
          {value ? (
            <>
              <img src={value} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover/upload:opacity-100 group-hover/upload:mix-blend-normal transition-all" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="text-white font-bold tracking-widest uppercase">Replace Image</span>
              </div>
            </>
          ) : (
            <span>Click or drag image here</span>
          )}
        </div>
      </div>
    </div>
  );
}