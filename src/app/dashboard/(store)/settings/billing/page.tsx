"use client";

export default function BillingSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-primary mb-1">Billing & Subscription</h2>
        <p className="text-secondary text-sm">Manage your SaaS subscription, invoices, and payment methods.</p>
      </div>

      <div className="p-6 bg-black/[0.02] border border-black/[0.08] rounded-xl flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-primary mb-1">Starter Plan</h3>
          <p className="text-sm text-secondary">Up to 5 team members and 1,000 products.</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-2xl text-primary">$49<span className="text-sm font-normal text-secondary">/mo</span></p>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors text-sm font-medium">
          Upgrade Plan
        </button>
        <button className="px-4 py-2 bg-white text-primary border border-black/10 rounded-lg hover:bg-black/5 transition-colors text-sm font-medium">
          View Invoices
        </button>
      </div>
    </div>
  );
}
