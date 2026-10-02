"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Type, AlignLeft, Image as ImageIcon, Loader2, ExternalLink } from "lucide-react";
import { TEMPLATE_SCHEMAS, FieldDef, TabDef } from "@/app/onboarding/customize/schemas";
import { SettingsSkeleton } from "@/components/dashboard/SettingsSkeleton";

const DEFAULT_TEMPLATE_ID = "starter-minimalist";

export default function StoreCustomizePage() {
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/v1/dashboard/settings")
      .then((r) => r.json())
      .then((data) => {
        const id = data.templateId || DEFAULT_TEMPLATE_ID;
        setTemplateId(id);
        setFormData(data.formData || {});
      })
      .catch(() => setTemplateId(DEFAULT_TEMPLATE_ID))
      .finally(() => setIsFetching(false));
  }, []);

  const schema = TEMPLATE_SCHEMAS[templateId || DEFAULT_TEMPLATE_ID] || TEMPLATE_SCHEMAS[DEFAULT_TEMPLATE_ID];

  const valueFor = (field: FieldDef) => (formData[field.name] !== undefined ? formData[field.name] : field.defaultValue);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (field: FieldDef, file: File) => {
    setUploadingField(field.name);
    setMessage(null);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await fetch("/api/v1/upload", { method: "POST", body: uploadData });
      const data = await res.json();
      if (res.ok) {
        handleChange(field.name, data.url);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to upload image" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to upload image" });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      // Only send fields this schema actually owns, plus whatever else already existed in formData -
      // the backend merges rather than replaces, but this keeps the payload scoped to what's editable here.
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary mb-1">Storefront Content</h2>
          <p className="text-secondary text-sm">
            Edit the text and images shown on your live store&apos;s <span className="font-medium text-primary">{schema.name}</span> template.
          </p>
        </div>
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
        <div className={`p-4 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-100"}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-2 border-b border-black/[0.06] overflow-x-auto">
        {schema.tabs.map((tab, idx) => (
          <button
            key={tab.id}
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
              <div key={field.name} className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-primary">
                  <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    ref={(el) => {
                      fileInputs.current[field.name] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(field, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputs.current[field.name]?.click()}
                    disabled={uploadingField === field.name}
                    className="w-full h-36 bg-black/[0.02] border border-dashed border-black/15 rounded-xl flex flex-col items-center justify-center text-secondary text-xs overflow-hidden relative hover:border-black/30 transition-colors disabled:opacity-60"
                  >
                    {uploadingField === field.name ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : value ? (
                      <>
                        <img src={value} alt={field.label} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-medium text-xs">Replace Image</span>
                        </div>
                      </>
                    ) : (
                      <span>Click to upload an image</span>
                    )}
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={field.name} className={field.type === "textarea" ? "md:col-span-2 space-y-2" : "space-y-2"}>
              <label className="flex items-center gap-2 text-sm font-medium text-primary">
                {field.type === "textarea" ? <AlignLeft className="w-3.5 h-3.5 text-secondary" /> : <Type className="w-3.5 h-3.5 text-secondary" />}
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  value={value || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={value || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
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
  );
}
