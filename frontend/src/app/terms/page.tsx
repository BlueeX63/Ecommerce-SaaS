import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8F7F5] font-body text-primary pt-32 pb-24 px-8">
      <div className="max-w-[800px] mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-accent tracking-widest uppercase font-bold text-secondary hover:text-primary mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tighter mb-8">Terms of Service</h1>
        <div className="prose prose-lg text-secondary max-w-none">
          <p className="font-medium text-xl leading-relaxed mb-8">
            Last updated: July 25, 2026
          </p>
          <div className="space-y-8 font-medium">
            <section>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-primary mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using Monolith, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
            </section>
            <section>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-primary mb-4">2. Use License</h2>
              <p>Permission is granted to temporarily download one copy of the materials (information or software) on Monolith's website for personal, non-commercial transitory viewing only.</p>
            </section>
            <section>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-primary mb-4">3. Disclaimer</h2>
              <p>The materials on Monolith's website are provided on an 'as is' basis. Monolith makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            </section>
            <section>
              <h2 className="font-heading text-3xl uppercase tracking-tight text-primary mb-4">4. Limitations</h2>
              <p>In no event shall Monolith or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Monolith's website.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
