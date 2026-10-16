"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Save, Layout, Type, Image as ImageIcon, AlignLeft, Monitor, Smartphone, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TEMPLATE_SCHEMAS, FieldType, FieldDef, TabDef } from "./schemas";
import { blobToDataUrl, formatBytes, isLogoField, prepareImage } from "@/lib/image-prep";

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

import { Suspense } from "react";

export function CustomizationWizardContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("template") || "starter-minimalist";
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const schema = TEMPLATE_SCHEMAS[templateId] || TEMPLATE_SCHEMAS["starter-minimalist"];
  const STEPS = schema.tabs.map(t => t.label);
  
  // Calculate preview URL from ID (e.g. "growth-nexus-pro" -> "/templates/nexus-pro")
  const parts = templateId.split("-");
  const name = parts.slice(1).join("-");
  const previewUrl = `/templates/${name}`;

  const [activeStep, setActiveStep] = useState(0);
  const [pathname, setPathname] = useState("/");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [frameLoading, setFrameLoading] = useState(true);
  const [deployError, setDeployError] = useState<string | null>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const post = useCallback((message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  // Initialize FormData from Schema Default Values
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initialData: Record<string, any> = {};
    schema.tabs.forEach((tab: TabDef) => {
      tab.fields.forEach((field: FieldDef) => {
        initialData[field.name] = field.defaultValue;
      });
    });
    return initialData;
  });

  // Handle template change
  useEffect(() => {
    const newSchema = TEMPLATE_SCHEMAS[templateId] || TEMPLATE_SCHEMAS["starter-minimalist"];
    const newData: Record<string, any> = {};
    newSchema.tabs.forEach((tab: TabDef) => {
      tab.fields.forEach((field: FieldDef) => {
        newData[field.name] = field.defaultValue;
      });
    });
    setFormData(newData);
    setActiveStep(0);
  }, [templateId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // PostMessage to Iframe whenever customization changes or when requested
  useEffect(() => {
    const pushState = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "MONOLITH_CUSTOMIZATION",
            data: { formData, step: STEPS[activeStep] }
          },
          window.location.origin
        );
      }
    };

    // Push state immediately on change
    pushState();

    // Also listen for child frames requesting state (on client-side navigation)
    const handleRequest = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "MONOLITH_REQUEST_STATE") {
        pushState();
      }
      if (event.data?.type === "MONOLITH_LOCATION" && typeof event.data.pathname === "string") {
        const m = event.data.pathname.match(/^\/templates\/[^/]+(\/.*)?$/);
        setPathname(m?.[1] || "/");
      }
    };
    
    window.addEventListener("message", handleRequest);
    return () => window.removeEventListener("message", handleRequest);
  }, [formData, activeStep, STEPS]);

  // Follow the merchant: show the page/section of the tab they are editing.
  useEffect(() => {
    const target = schema.tabs[activeStep]?.preview;
    if (target) post({ type: "MONOLITH_NAVIGATE", path: target.path, scroll: target.scroll });
  }, [activeStep, schema, post]);

  // ...and scroll to + highlight the exact element for the field being edited.
  const focusField = useCallback(
    (field: FieldDef, value: any) => {
      const current = value ?? field.defaultValue;
      if (field.type === "image") post({ type: "MONOLITH_FOCUS", image: typeof current === "string" ? current : undefined });
      else post({ type: "MONOLITH_FOCUS", text: typeof current === "string" ? current : undefined });
    },
    [post],
  );

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const def = schema.tabs[activeStep]?.fields.find((f: FieldDef) => f.name === field);
    if (def) {
      clearTimeout(focusTimer.current);
      focusTimer.current = setTimeout(() => focusField(def, value), 450);
    }
  };

  const handleDeploy = async () => {
    setDeployError(null);
    setIsDeploying(true);
    try {
      const res = await fetch("/api/v1/tenant/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, formData })
      });
      const data = await res.json();
      if (res.ok) {
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setDeployError(data.error || "Deployment failed. Please try again.");
        setIsDeploying(false);
      }
    } catch (e) {
      setDeployError("Deployment failed. Check your connection and try again.");
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
          <button onClick={() => router.push('/templates')} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-accent text-xs uppercase tracking-widest font-bold">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-accent text-xs uppercase tracking-widest text-accent font-bold">Live Editor</span>
          </div>
        </div>

        {/* Content */}
        <div data-lenis-prevent className="absolute top-0 left-0 right-0 bottom-0 overflow-y-auto overscroll-contain touch-pan-y custom-scroll pt-28 pb-32 px-8 lg:px-12 xl:px-16">
          
          {/* Title */}
          <div className="mb-12">
            <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tighter text-white mb-4">
              Shape Your <span className="text-accent">Vision</span>
            </h1>
            <p className="font-body text-white/40 leading-relaxed max-w-sm text-sm">
              Fine-tune every pixel for the <span className="text-white font-bold">{schema.name}</span> template. Use existing premium assets or inject your brand's unique identity.
            </p>
          </div>

          {/* Step Progress */}
          <div className="flex gap-2 mb-12 overflow-x-auto pb-1">
            {STEPS.map((step, idx) => (
              <button
                type="button"
                key={step}
                onClick={() => setActiveStep(idx)}
                aria-current={activeStep === idx ? "step" : undefined}
                className="flex-1 min-w-0 flex flex-col gap-2 text-left group/step"
              >
                <div
                  className={cn(
                    "h-1 rounded-full w-full transition-all duration-500",
                    activeStep >= idx ? "bg-accent" : "bg-white/10 group-hover/step:bg-white/25"
                  )}
                />
                <span className={cn(
                  "font-accent text-[10px] uppercase tracking-widest transition-colors duration-500 truncate",
                  activeStep === idx ? "text-white" : activeStep > idx ? "text-white/60" : "text-white/30 group-hover/step:text-white/60"
                )}>
                  {step}
                </span>
              </button>
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
                      value={formData[field.name] ?? ""}
                      onChange={handleFieldChange}
                      onFocus={() => focusField(field, formData[field.name])}
                      placeholder={field.placeholder || field.defaultValue}
                      isTextArea={field.type === 'textarea'}
                      description={field.description}
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
                      onFocus={() => focusField(field, formData[field.name])}
                      isLogo={isLogoField(field)}
                    />
                  );
                }
                return null;
              })}
            </motion.div>
          </AnimatePresence>

        </div>

        {deployError && (
          <div role="alert" className="absolute bottom-24 left-6 right-6 z-30 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-xl">
            {deployError}
          </div>
        )}

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
              className="px-8 py-4 rounded-xl bg-white text-black font-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-accent hover:text-white transition-all hover:scale-105 active:scale-95 group"
            >
              Next Step
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button 
              onClick={handleDeploy}
              className="px-8 py-4 rounded-xl bg-accent text-white font-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:shadow-[0_0_40px_rgba(255,77,0,0.4)] transition-all hover:scale-105 active:scale-95 group overflow-hidden relative"
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
          <div className="flex-1 flex justify-center min-w-0">
            <div className="bg-black/30 rounded-md px-6 py-1.5 flex items-center gap-2 text-white/40 text-xs font-mono max-w-full truncate">
              <Layout className="w-3 h-3 shrink-0" />
              <span className="truncate">yourstore.com{pathname === "/" ? "" : pathname}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-black/30 p-1" role="group" aria-label="Preview size">
            <button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"} className={cn("rounded-md p-1.5 transition-colors", device === "desktop" ? "bg-white/15 text-white" : "text-white/40 hover:text-white")}>
              <Monitor className="w-3.5 h-3.5" />
              <span className="sr-only">Desktop</span>
            </button>
            <button type="button" onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"} className={cn("rounded-md p-1.5 transition-colors", device === "mobile" ? "bg-white/15 text-white" : "text-white/40 hover:text-white")}>
              <Smartphone className="w-3.5 h-3.5" />
              <span className="sr-only">Mobile</span>
            </button>
          </div>
        </div>

        {/* Iframe */}
        <div className="flex-1 w-full relative rounded-b-2xl overflow-hidden border border-white/5 bg-[#1A1A1A] flex justify-center">
          {frameLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111111]">
              <Loader2 className="w-6 h-6 animate-spin text-white/40" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className={cn("h-full border-none bg-white transition-all duration-300", device === "mobile" ? "w-[390px] max-w-full" : "w-full")}
            title="Live Preview"
            style={{ pointerEvents: "auto" }}
            onLoad={() => {
              setFrameLoading(false);
              post({ type: "MONOLITH_CUSTOMIZATION", data: { formData, step: STEPS[activeStep] } });
              const target = schema.tabs[activeStep]?.preview;
              if (target && (target.path !== "/" || target.scroll)) post({ type: "MONOLITH_NAVIGATE", path: target.path, scroll: target.scroll });
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function CustomizationWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading Customization...</div>}>
      <CustomizationWizardContent />
    </Suspense>
  );
}

// Field Component
function Field({ label, icon, fieldKey, value, onChange, onFocus, placeholder, isTextArea, description }: any) {
  return (
    <div className="group flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-accent text-xs uppercase tracking-widest text-white/70">
          <span className="text-white/30 group-hover:text-accent transition-colors">{icon}</span>
          {label}
        </label>
      </div>
      
      {description && <p className="-mt-1 text-xs text-white/35">{description}</p>}
      <div className={`transition-all duration-500 overflow-hidden ${isTextArea ? 'h-24' : 'h-12'} opacity-100`}>
        {isTextArea ? (
          <textarea 
            value={value}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            onFocus={onFocus}
            placeholder={placeholder}
            className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 font-body text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all resize-none custom-scroll text-sm"
          />
        ) : (
          <input 
            type="text"
            value={value}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            onFocus={onFocus}
            placeholder={placeholder}
            className="w-full h-full bg-black/40 border border-white/10 rounded-xl px-4 font-body text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-sm"
          />
        )}
      </div>
    </div>
  );
}

function ImageUploadField({ label, icon, fieldKey, value, onChange, onFocus, isLogo }: any) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pictures are resized and compressed here: a raw photo is several MB, which made the whole store too large to deploy.
  const handleFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { blob, width, height } = await prepareImage(file, isLogo ? "logo" : "photo");
      onChange(fieldKey, await blobToDataUrl(blob));
      setInfo(`${width} × ${height} px · ${formatBytes(blob.size)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That image could not be used.");
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    onChange(fieldKey, "");
    setInfo(null);
    setError(null);
  };

  return (
    <div className="group flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-accent text-xs uppercase tracking-widest text-white/70">
          <span className="text-white/30 group-hover:text-accent transition-colors">{icon}</span>
          {label}
        </label>
      </div>
      {isLogo && (
        <p className="-mt-1 text-xs text-white/35">
          Shown about 32 px tall in your header. A wide PNG or SVG with a transparent background (around 480 × 160 px) looks best. Bigger images are resized for you.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onMouseEnter={onFocus}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        disabled={busy}
        aria-label={value ? `Replace ${label}` : `Upload ${label}`}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-dashed font-body text-xs transition-all flex items-center justify-center",
          isLogo ? "h-28" : "h-32",
          dragging ? "border-accent bg-accent/10 text-white" : "border-white/10 bg-black/40 text-white/30 hover:border-accent/50 hover:text-white/60",
        )}
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin text-white/60" />
        ) : value ? (
          isLogo ? (
            // A logo is never cropped: it sits whole on a light tile, the way it will look on most headers.
            <span className="absolute inset-2 rounded-lg bg-[linear-gradient(45deg,#e8e8e8_25%,transparent_25%,transparent_75%,#e8e8e8_75%),linear-gradient(45deg,#e8e8e8_25%,#fff_25%,#fff_75%,#e8e8e8_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] flex items-center justify-center p-2">
              <img src={value} alt="" className="max-h-full max-w-full object-contain" />
            </span>
          ) : (
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )
        ) : (
          <span>{isLogo ? "Click or drop your logo here" : "Click or drag image here"}</span>
        )}
      </button>

      <div className="flex items-center justify-between gap-3 min-h-[1.5rem]">
        <span className="text-[11px] text-white/35 truncate">{error ? <span className="text-red-400">{error}</span> : info}</span>
        {value && !busy && (
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => inputRef.current?.click()} className="px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-accent uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              Replace
            </button>
            <button type="button" onClick={remove} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-[11px] font-accent uppercase tracking-widest text-red-300 hover:bg-red-500/10 transition-colors">
              {isLogo ? "Remove logo" : "Use default"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
