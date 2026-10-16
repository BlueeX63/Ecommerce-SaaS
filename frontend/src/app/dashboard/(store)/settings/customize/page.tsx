"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Save, Type, AlignLeft, Image as ImageIcon, Loader2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { TEMPLATE_SCHEMAS, FieldDef, TabDef } from "@/app/onboarding/customize/schemas";
import { SettingsSkeleton } from "@/components/dashboard/SettingsSkeleton";
import { StorefrontPreview, type FocusRequest } from "@/components/dashboard/StorefrontPreview";
import { formatBytes, isLogoField, prepareImage } from "@/lib/image-prep";

const DEFAULT_TEMPLATE_ID = "starter-minimalist";

/** True from the width where the preview fits beside the form instead of covering it. */
function useIsWide() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(min-width: 1280px)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(min-width: 1280px)").matches,
    () => false,
  );
}

function ImageControl({
  field,
  value,
  busy,
  note,
  onPick,
  onRemove,
  onHover,
}: {
  field: FieldDef;
  value: string;
  busy: boolean;
  note: string | null;
  onPick: (file: File) => void;
  onRemove: () => void;
  onHover: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const logo = isLogoField(field);

  return (
    <div className="md:col-span-2 space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-primary">
        <ImageIcon className="w-3.5 h-3.5 text-secondary" />
        {field.label}
      </label>
      {logo && (
        <p className="text-xs text-secondary -mt-1">
          Shown about 32 px tall in your header. A wide PNG or SVG with a transparent background (around 480 × 160 px) looks best. Bigger images are resized for you.
        </p>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onMouseEnter={onHover}
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label={value ? `Replace ${field.label}` : `Upload ${field.label}`}
        className={`w-full ${logo ? "h-28" : "h-36"} border border-dashed border-black/15 rounded-xl flex flex-col items-center justify-center text-secondary text-xs overflow-hidden relative hover:border-black/30 transition-colors disabled:opacity-60 ${logo ? "bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%),linear-gradient(45deg,#f0f0f0_25%,#fff_25%,#fff_75%,#f0f0f0_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]" : "bg-black/[0.02]"}`}
      >
        {busy ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : value ? (
          // A logo is shown whole (never cropped); photos fill the box the way the storefront crops them.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={field.label} className={logo ? "max-h-[80%] max-w-[85%] object-contain" : "absolute inset-0 w-full h-full object-cover"} />
        ) : (
          <span>{logo ? "Click to upload your logo" : "Click to upload an image"}</span>
        )}
      </button>
      <div className="flex items-center justify-between gap-3 min-h-[2rem]">
        <span className="text-xs text-secondary truncate">{note}</span>
        {value && !busy && (
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => input.current?.click()} className="px-3 py-1.5 rounded-lg border border-black/10 text-xs font-medium text-primary hover:bg-black/5">
              Replace
            </button>
            <button type="button" onClick={onRemove} className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50">
              {logo ? "Remove logo" : "Use default"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoreCustomizePage() {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [imageNotes, setImageNotes] = useState<Record<string, string | null>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Live preview: docked beside the form on wide screens (open by default), an overlay on small ones.
  const wide = useIsWide();
  const [previewPref, setPreviewPref] = useState<boolean | null>(null);
  const previewOpen = previewPref ?? wide;
  const [storeCode, setStoreCode] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    fetch("/api/v1/dashboard/settings")
      .then((r) => r.json())
      .then((data) => {
        setTemplateId(data.templateId || DEFAULT_TEMPLATE_ID);
        setFormData(data.formData || {});
      })
      .catch(() => setTemplateId(DEFAULT_TEMPLATE_ID))
      .finally(() => setIsFetching(false));
  }, []);

  const schema = TEMPLATE_SCHEMAS[templateId || DEFAULT_TEMPLATE_ID] || TEMPLATE_SCHEMAS[DEFAULT_TEMPLATE_ID];

  useEffect(() => {
    fetch("/api/v1/auth/context")
      .then((r) => (r.ok ? r.json() : null))
      .then((ctx) => setStoreCode(ctx?.activeStore?.code ?? null))
      .catch(() => setStoreCode(null));
  }, []);

  const valueFor = (field: FieldDef) => (formData[field.name] !== undefined ? formData[field.name] : field.defaultValue);

  const focusField = (field: FieldDef, value: string | undefined) => {
    const current = value ?? field.defaultValue;
    setFocus(field.type === "image" ? { image: typeof current === "string" ? current : undefined } : { text: typeof current === "string" ? current : undefined });
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const def = schema.tabs[activeTab]?.fields.find((f) => f.name === name);
    if (def) {
      clearTimeout(focusTimer.current);
      focusTimer.current = setTimeout(() => focusField(def, value), 450);
    }
  };

  const handleImageUpload = async (field: FieldDef, file: File) => {
    setUploadingField(field.name);
    setMessage(null);
    setImageNotes((n) => ({ ...n, [field.name]: null }));
    try {
      // Resize first: the storefront shows pictures a few hundred pixels wide, so a phone photo is never sent whole.
      const { blob, width, height } = await prepareImage(file, isLogoField(field) ? "logo" : "photo");
      const upload = new FormData();
      upload.append("file", new File([blob], `${field.name}.${blob.type.split("/")[1] === "jpeg" ? "jpg" : blob.type.split("/")[1]}`, { type: blob.type }));
      const res = await fetch("/api/v1/upload", { method: "POST", body: upload });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to upload image");
      handleChange(field.name, data.url);
      setImageNotes((n) => ({ ...n, [field.name]: `${width} × ${height} px · ${formatBytes(blob.size)}` }));
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to upload image" });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      // The backend merges rather than replaces, so this only needs what changed plus what already existed.
      const res = await fetch("/api/v1/dashboard/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: "Storefront content saved. Changes are live now." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save changes" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save changes. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return <SettingsSkeleton fields={4} />;
  }

  const activeTabDef: TabDef | undefined = schema.tabs[activeTab];
  const showPreview = previewOpen && !!storeCode;
  const preview = storeCode ? (
    <StorefrontPreview
      storeCode={storeCode}
      formData={formData}
      tabLabel={activeTabDef?.label}
      target={activeTabDef?.preview}
      focus={focus}
      onClose={() => setPreviewPref(false)}
      className="h-full"
    />
  ) : null;

  return (
    <div className={showPreview && wide ? "grid grid-cols-[minmax(0,1fr)_440px] gap-6 items-start" : ""}>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="sm:mr-auto">
            <h2 className="text-2xl font-semibold text-primary mb-1">Storefront Content</h2>
            <p className="text-secondary text-sm">
              Edit the text and images shown on your live store&apos;s <span className="font-medium text-primary">{schema.name}</span> template. The preview follows the page you are editing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewPref(!previewOpen)}
            disabled={!storeCode}
            aria-pressed={showPreview}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium shrink-0 disabled:opacity-50"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Hide preview" : "Live preview"}
          </button>
          <a
            href={`/templates/${templateId?.split("-").slice(1).join("-")}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 text-primary rounded-lg hover:bg-black/5 transition-colors text-sm font-medium shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            Preview Template
          </a>
        </div>

        {message && (
          <div role={message.type === "error" ? "alert" : "status"} className={`p-4 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-100"}`}>
            {message.text}
          </div>
        )}

        <div className="flex gap-2 border-b border-black/[0.06] overflow-x-auto" role="tablist">
          {schema.tabs.map((tab, idx) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === idx}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === idx ? "border-black text-primary" : "border-transparent text-secondary hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeTabDef?.fields.map((field) => {
            const value = valueFor(field);

            if (field.type === "image") {
              return (
                <ImageControl
                  key={field.name}
                  field={field}
                  value={typeof value === "string" ? value : ""}
                  busy={uploadingField === field.name}
                  note={imageNotes[field.name] ?? null}
                  onPick={(file) => handleImageUpload(field, file)}
                  onRemove={() => {
                    handleChange(field.name, "");
                    setImageNotes((n) => ({ ...n, [field.name]: null }));
                  }}
                  onHover={() => focusField(field, typeof value === "string" ? value : undefined)}
                />
              );
            }

            return (
              <div key={field.name} className={field.type === "textarea" ? "md:col-span-2 space-y-2" : "space-y-2"}>
                <label className="flex items-center gap-2 text-sm font-medium text-primary">
                  {field.type === "textarea" ? <AlignLeft className="w-3.5 h-3.5 text-secondary" /> : <Type className="w-3.5 h-3.5 text-secondary" />}
                  {field.label}
                </label>
                {field.description && <p className="text-xs text-secondary -mt-1">{field.description}</p>}
                {field.type === "textarea" ? (
                  <textarea
                    value={value || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    onFocus={() => focusField(field, value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    onFocus={() => focusField(field, value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-6 border-t border-black/[0.06] flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {showPreview &&
        (wide ? (
          <div className="sticky top-4 h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-black/10 shadow-sm">{preview}</div>
        ) : (
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[620px] flex-col border-l border-black/10 shadow-2xl">{preview}</div>
        ))}
    </div>
  );
}
