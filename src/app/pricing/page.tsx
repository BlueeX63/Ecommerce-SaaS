import { PricingCards } from "@/components/pricing/PricingCards";
import { Plus } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background pt-[120px] pb-24 overflow-hidden">
      
      {/* Hero Section */}
      <div className="max-w-[1100px] mx-auto px-6 text-center mb-16 relative z-10">
        <p className="font-accent text-accent uppercase tracking-[0.1em] text-sm mb-6 font-bold">
          Simple, transparent pricing
        </p>
        <h1 className="font-heading text-5xl md:text-[72px] leading-[1.1] text-primary mb-8 max-w-4xl mx-auto">
          The foundation of your <br className="hidden md:block"/>
          <span className="italic font-light">digital empire.</span>
        </h1>
        <p className="font-body text-secondary text-lg max-w-[480px] mx-auto">
          Start for free, then upgrade when you're ready to scale. No hidden fees, no surprises.
        </p>
      </div>

      <PricingCards />

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-6 mt-32 relative z-10">
        <h2 className="font-heading text-4xl text-primary text-center mb-12">Frequently asked questions</h2>
        <div className="space-y-4">
          {[
            { q: "Can I cancel my subscription at any time?", a: "Yes, you can cancel your subscription at any time. Your store will remain active until the end of your current billing cycle." },
            { q: "Do you take a percentage of my sales?", a: "No. Unlike other platforms, we never take a cut of your sales. You keep 100% of your revenue." },
            { q: "Can I use my own custom domain?", a: "Absolutely. All plans include the ability to connect your own custom domain for free." },
            { q: "What happens if I exceed my product limit?", a: "We'll gently notify you when you're approaching your limit. Your store won't go offline, but you'll need to upgrade to add more products." }
          ].map((faq, i) => (
            <div key={i} className="bg-surface border border-black/[0.04] rounded-2xl p-6 group cursor-pointer hover:border-black/[0.08] transition-colors">
              <div className="flex justify-between items-center">
                <h3 className="font-body font-medium text-primary text-lg pr-8">{faq.q}</h3>
                <Plus className="w-5 h-5 text-secondary group-hover:text-accent transition-colors shrink-0" />
              </div>
              <p className="font-body text-secondary mt-4 h-0 overflow-hidden opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-300">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Signals */}
      <div className="max-w-4xl mx-auto px-6 mt-24">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 border-t border-black/[0.04] pt-12">
          {["Razorpay Secured", "Cancel Anytime", "GDPR Compliant", "24/7 Support"].map((signal, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary/30" />
              <span className="font-accent text-sm text-secondary uppercase tracking-widest">{signal}</span>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
