"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Save, Layout, Wand2, Type, Image as ImageIcon, MousePointerClick, Settings2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

const TEMPLATES: Record<string, string> = {
  "starter-minimalist": "/preview/starter/minimalist",
  "starter-essence": "/preview/starter/essence",
  "starter-origin": "/preview/starter/origin",
  "starter-canvas": "/preview/starter/canvas",
  "growth-nexus-pro": "/preview/growth/nexus-pro",
  "growth-velocity": "/preview/growth/velocity",
  "growth-quantum": "/preview/growth/quantum",
  "growth-horizon": "/preview/growth/horizon"
};

const STEPS = ["General", "Home", "Shop", "About", "Contact"];

export default function CustomizationWizard() {
  const params = useParams();
  const templateId = params.templateId as string;
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);

  const previewUrl = TEMPLATES[templateId] || "/";

  const [activeStep, setActiveStep] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    brandName: "ESSENTIALS.",
    countries: [] as string[],
    currency: "USD",
    heroTitle: "Simplicity is the ultimate sophistication.",
    tagline: "Curated everyday essentials built to last.",
    primaryCta: "Shop Collection",
    aboutTitle: "Built for everyday life.",
    aboutDescription: "We believe in buying less but better...",
    shopTitle: "The Collection",
    shopDescription: "Our full range of essentials.",
    shopCategories: "All, Tops, Bottoms, Accessories, Bags, Shoes",
    announcementText: "Free shipping on orders over 100",
    aboutPageTitle: "About Us",
    aboutPageContent: "We are a brand built on principles of minimalism. Everything we do is driven by a desire to create products that enhance your everyday life without unnecessary complication.",
    aboutImage: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2000&auto=format&fit=crop",
    aboutFeature1Title: "Uncompromising Quality",
    aboutFeature1Desc: "We partner with the world's most ethical factories to source premium materials. Every stitch is considered, every seam is tested. We don't believe in planned obsolescence.",
    aboutFeature2Title: "Radical Transparency",
    aboutFeature2Desc: "We believe you have the right to know what your clothes cost to make. We reveal the true costs behind all of our products—from materials to labor to transportation.",
    contactPageTitle: "Get in Touch",
    contactEmail: "hello@essentials.com"
  });

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
          "*"
        );
      }
    };

    // Push state immediately on change
    pushState();

    // Also listen for child frames requesting state (on client-side navigation)
    const handleRequest = (event: MessageEvent) => {
      if (event.data?.type === "MONOLITH_REQUEST_STATE") {
        pushState();
      }
    };
    
    window.addEventListener("message", handleRequest);
    return () => window.removeEventListener("message", handleRequest);
  }, [formData, activeStep]);

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!mounted) return null;

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
            <p className="font-body text-white/40 leading-relaxed max-w-sm">
              Fine-tune every pixel. Use existing premium assets or inject your brand's unique identity.
            </p>
          </div>

          {/* Step Progress */}
          <div className="flex gap-2 mb-12">
            {STEPS.map((step, idx) => (
              <div key={step} className="flex-1 flex flex-col gap-2">
                <div 
                  className={cn(
                    "h-1 rounded-full w-full transition-all duration-500",
                    activeStep >= idx ? "bg-accent" : "bg-white/10"
                  )}
                />
                <span className={cn(
                  "font-accent text-[10px] uppercase tracking-widest transition-colors duration-500",
                  activeStep >= idx ? "text-white" : "text-white/30"
                )}>
                  {step}
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
              {activeStep === 0 && (
                <>
                  <Field 
                    label="Brand Name" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="brandName"
                    value={formData.brandName}
                    onChange={handleFieldChange}
                    placeholder="ESSENTIALS."
                  />
                  <Field 
                    label="Announcement Bar Text" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="announcementText"
                    value={formData.announcementText}
                    onChange={handleFieldChange}
                    placeholder="Free shipping on orders over 100"
                  />
                  <MultiSelectField
                    label="Target Markets"
                    icon={<Settings2 className="w-4 h-4" />}
                    fieldKey="countries"
                    value={formData.countries}
                    onChange={handleFieldChange}
                    options={["United States", "United Kingdom", "Canada", "Australia", "European Union", "India", "Global"]}
                  />
                  <SelectField
                    label="Store Currency"
                    icon={<Settings2 className="w-4 h-4" />}
                    fieldKey="currency"
                    value={formData.currency}
                    onChange={handleFieldChange}
                    options={["USD", "EUR", "GBP", "CAD", "AUD", "INR"]}
                  />
                </>
              )}
              {activeStep === 1 && (
                <>
                  <Field 
                    label="Hero Title" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="heroTitle"
                    value={formData.heroTitle}
                    onChange={handleFieldChange}
                    placeholder="Simplicity is the ultimate sophistication."
                  />
                  <Field 
                    label="Hero Tagline" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="tagline"
                    value={formData.tagline}
                    onChange={handleFieldChange}
                    placeholder="Curated everyday essentials built to last."
                  />
                  <Field 
                    label="Primary CTA" 
                    icon={<MousePointerClick className="w-4 h-4" />} 
                    fieldKey="primaryCta"
                    value={formData.primaryCta}
                    onChange={handleFieldChange}
                    placeholder="Shop Collection"
                  />
                  <Field 
                    label="About Section Title" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="aboutTitle"
                    value={formData.aboutTitle}
                    onChange={handleFieldChange}
                    placeholder="Built for everyday life."
                  />
                  <Field 
                    label="About Section Description" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="aboutDescription"
                    value={formData.aboutDescription}
                    onChange={handleFieldChange}
                    placeholder="We believe in buying less but better..."
                  />
                </>
              )}
              {activeStep === 2 && (
                <>
                  <Field 
                    label="Shop Title" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="shopTitle"
                    value={formData.shopTitle}
                    onChange={handleFieldChange}
                    placeholder="The Collection"
                  />
                  <Field 
                    label="Shop Description" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="shopDescription"
                    value={formData.shopDescription}
                    onChange={handleFieldChange}
                    placeholder="Our full range of essentials."
                  />
                  <Field 
                    label="Filter Categories (Comma Separated)" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="shopCategories"
                    value={formData.shopCategories}
                    onChange={handleFieldChange}
                    placeholder="All, Tops, Bottoms, Accessories, Bags, Shoes"
                  />
                </>
              )}
              {activeStep === 3 && (
                <>
                  <Field 
                    label="About Page Title" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="aboutPageTitle"
                    value={formData.aboutPageTitle}
                    onChange={handleFieldChange}
                    placeholder="About Us"
                  />
                  <Field 
                    label="About Page Content" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="aboutPageContent"
                    value={formData.aboutPageContent}
                    onChange={handleFieldChange}
                    placeholder="We are a brand built on principles of minimalism..."
                  />
                  <ImageUploadField 
                    label="About Hero Image (Rec: 2000x1125 16:9)" 
                    icon={<ImageIcon className="w-4 h-4" />} 
                    fieldKey="aboutImage"
                    value={formData.aboutImage}
                    onChange={handleFieldChange}
                  />
                  <Field 
                    label="Feature 1 Title" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="aboutFeature1Title"
                    value={formData.aboutFeature1Title}
                    onChange={handleFieldChange}
                    placeholder="Uncompromising Quality"
                  />
                  <Field 
                    label="Feature 1 Description" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="aboutFeature1Desc"
                    value={formData.aboutFeature1Desc}
                    onChange={handleFieldChange}
                    placeholder="We partner with the world's most ethical factories..."
                  />
                  <Field 
                    label="Feature 2 Title" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="aboutFeature2Title"
                    value={formData.aboutFeature2Title}
                    onChange={handleFieldChange}
                    placeholder="Radical Transparency"
                  />
                  <Field 
                    label="Feature 2 Description" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="aboutFeature2Desc"
                    value={formData.aboutFeature2Desc}
                    onChange={handleFieldChange}
                    placeholder="We reveal the true costs behind all of our products..."
                  />
                </>
              )}
              {activeStep === 4 && (
                <>
                  <Field 
                    label="Contact Page Title" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="contactPageTitle"
                    value={formData.contactPageTitle}
                    onChange={handleFieldChange}
                    placeholder="Get in Touch"
                  />
                  <Field 
                    label="Contact Email" 
                    icon={<Type className="w-4 h-4" />} 
                    fieldKey="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleFieldChange}
                    placeholder="hello@essentials.com"
                  />
                </>
              )}
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
              className="px-8 py-4 rounded-xl bg-white text-black font-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-accent hover:text-white transition-all hover:scale-105 active:scale-95 group"
            >
              Next Step
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button 
              onClick={() => alert("Deployment sequence initiated!")}
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
function Field({ label, icon, fieldKey, value, onChange, placeholder }: any) {
  return (
    <div className="group flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-accent text-xs uppercase tracking-widest text-white/70">
          <span className="text-white/30 group-hover:text-accent transition-colors">{icon}</span>
          {label}
        </label>
      </div>
      
      <div className="transition-all duration-500 overflow-hidden h-12 opacity-100">
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          placeholder={placeholder}
          className="w-full h-full bg-black/40 border border-white/10 rounded-xl px-4 font-body text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
        />
      </div>
    </div>
  );
}

function MultiSelectField({ label, icon, fieldKey, value = [], onChange, options }: any) {
  const toggleOption = (opt: string) => {
    if (value.includes(opt)) {
      onChange(fieldKey, value.filter((v: string) => v !== opt));
    } else {
      onChange(fieldKey, [...value, opt]);
    }
  };

  return (
    <div className="group flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-accent text-xs uppercase tracking-widest text-white/70">
          <span className="text-white/30 group-hover:text-accent transition-colors">{icon}</span>
          {label}
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => {
          const isSelected = value.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggleOption(opt)}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-accent tracking-widest uppercase transition-all duration-300 border",
                isSelected 
                  ? "bg-accent/20 border-accent/50 text-accent shadow-[0_0_15px_rgba(255,77,0,0.2)]" 
                  : "bg-black/40 border-white/10 text-white/50 hover:text-white hover:border-white/30"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectField({ label, icon, fieldKey, value, onChange, options }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 font-accent text-xs uppercase tracking-widest text-white/70">
          <span className="text-white/30 group-hover:text-accent transition-colors">{icon}</span>
          {label}
        </label>
      </div>
      
      <div className="relative h-12">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full h-full bg-black/40 border rounded-xl px-4 font-body text-white flex items-center justify-between transition-all outline-none",
            isOpen ? "border-accent/50 ring-1 ring-accent/50" : "border-white/10 hover:border-white/20"
          )}
        >
          <span>{value || "Select..."}</span>
          <svg className={cn("w-4 h-4 text-white/30 transition-transform duration-300", isOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 bottom-[calc(100%+8px)] z-50 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl"
              >
                <div className="max-h-60 overflow-y-auto custom-scroll p-1">
                  {options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => {
                        onChange(fieldKey, opt);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-lg font-body text-sm transition-all flex items-center justify-between",
                        value === opt 
                          ? "bg-accent/10 text-accent" 
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {opt}
                      {value === opt && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
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
          <span className="text-white/30 group-hover:text-accent transition-colors">{icon}</span>
          {label}
        </label>
      </div>
      <div className="relative group/upload">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="w-full h-32 bg-black/40 border border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center font-body text-white/30 text-xs overflow-hidden relative transition-all group-hover/upload:border-accent/50 group-hover/upload:text-white/50 group-hover/upload:bg-accent/5">
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
