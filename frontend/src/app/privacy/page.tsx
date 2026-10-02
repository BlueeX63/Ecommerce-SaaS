import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8F7F5] font-body text-primary pt-32 pb-24 px-8">
      <div className="max-w-[800px] mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-accent tracking-widest uppercase font-bold text-secondary hover:text-primary mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tighter mb-8">Privacy Policy</h1>
        <div className="prose prose-lg text-secondary max-w-none">
          <p className="font-medium text-xl leading-relaxed mb-8">
            Last updated: July 25, 2026
          </p>
          <div className="space-y-8 font-medium">
            <section>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-primary mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly to us when you create an account, subscribe to our newsletter, or fill out a form. We also automatically collect certain information about your device and how you interact with our services.</p>
            </section>
            <section>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-primary mb-4">2. How We Use Information</h2>
              <p>We use the information we collect to provide, maintain, and improve our services, as well as to communicate with you, monitor and analyze trends, and personalize the services.</p>
            </section>
            <section>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-primary mb-4">3. Information Sharing</h2>
              <p>We do not share your personal information with third parties except as described in this privacy policy, such as with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
            </section>
            <section>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-primary mb-4">4. Security</h2>
              <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
