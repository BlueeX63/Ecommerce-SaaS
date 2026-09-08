"use client";

export default function ApiKeysSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-1">API Keys</h2>
        <p className="text-secondary text-sm">Manage API keys to access your store data programmatically.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-black/10 rounded-xl bg-black/[0.02]">
        <h3 className="text-lg font-medium text-primary mb-2">No API keys generated</h3>
        <p className="text-secondary text-sm max-w-sm mb-6">
          Create API keys to authenticate your custom integrations and external apps.
        </p>
        <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium">
          Generate API Key
        </button>
      </div>
    </div>
  );
}
