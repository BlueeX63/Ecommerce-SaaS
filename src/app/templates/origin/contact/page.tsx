"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { useCustomization } from "@/hooks/useCustomization";

export default function OriginContactPage() {
  const customData = useCustomization();
  
  const tPreTitle = customData?.formData?.contactPreTitle || "Contact Us";
  const tTitle = customData?.formData?.contactTitle || "We'd love to hear from you.";
  const tAddress = customData?.formData?.contactAddress || "254 Timber Lane\nPortland, OR 97204\nUnited States";
  const tEmail = customData?.formData?.contactEmail || "hello@originsupply.co\nsupport@originsupply.co";
  const tPhone = customData?.formData?.contactPhone || "+1 (503) 555-0199";
  const tHours = customData?.formData?.contactHours || "Mon-Fri, 9am - 5pm PT";
  return (
    <div className="w-full bg-[#fdfbf7] min-h-screen pt-16 pb-32">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* Header */}
        <div className="mb-24 text-center">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#a38c7f] mb-6">{tPreTitle}</div>
          <h1 className="font-serif text-5xl md:text-6xl text-[#402c21] leading-tight font-bold animate-in slide-in-from-bottom-5 fade-in duration-700">
            {tTitle}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Contact Details */}
          <div className="flex flex-col gap-12 bg-[#efebe9] p-10 md:p-16 rounded-sm animate-in fade-in duration-700 delay-150">
            <h2 className="font-serif text-3xl font-bold text-[#402c21] mb-2">Get in touch</h2>
            <p className="text-[#402c21]/80 font-medium leading-relaxed mb-4">
              Whether you have a question about our goods, need assistance with an order, or just want to say hello, our team is here for you.
            </p>

            <div className="flex flex-col gap-8">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-[#402c21] text-[#fdfbf7] rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#402c21] text-sm uppercase tracking-widest mb-2">Workshop</h3>
                  <p className="text-[#402c21]/80 font-medium">
                    {tAddress.split('\\n').map((line: string, i: number) => (
                      <span key={i}>{line}<br/></span>
                    ))}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-[#402c21] text-[#fdfbf7] rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#402c21] text-sm uppercase tracking-widest mb-2">Email</h3>
                  <p className="text-[#402c21]/80 font-medium">
                    {tEmail.split('\\n').map((line: string, i: number) => (
                      <span key={i}>{line}<br/></span>
                    ))}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-[#402c21] text-[#fdfbf7] rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#402c21] text-sm uppercase tracking-widest mb-2">Phone</h3>
                  <p className="text-[#402c21]/80 font-medium">
                    {tPhone}<br/>
                    {tHours.split('\\n').map((line: string, i: number) => (
                      <span key={i}>{line}<br/></span>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300 flex flex-col justify-center">
            <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-3">
                <label htmlFor="name" className="text-sm font-bold text-[#402c21] uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  className="bg-transparent border-b-2 border-[#402c21]/20 pb-3 text-base focus:outline-none focus:border-[#402c21] text-[#402c21] transition-colors"
                  placeholder="Jane Doe"
                />
              </div>
              
              <div className="flex flex-col gap-3">
                <label htmlFor="email" className="text-sm font-bold text-[#402c21] uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  className="bg-transparent border-b-2 border-[#402c21]/20 pb-3 text-base focus:outline-none focus:border-[#402c21] text-[#402c21] transition-colors"
                  placeholder="jane@example.com"
                />
              </div>
              
              <div className="flex flex-col gap-3">
                <label htmlFor="message" className="text-sm font-bold text-[#402c21] uppercase tracking-widest">Message</label>
                <textarea 
                  id="message" 
                  rows={5}
                  className="bg-transparent border-b-2 border-[#402c21]/20 pb-3 text-base focus:outline-none focus:border-[#402c21] text-[#402c21] resize-none transition-colors"
                  placeholder="How can we help you today?"
                />
              </div>

              <button 
                type="submit"
                className="bg-[#402c21] text-[#fdfbf7] py-5 text-sm font-bold uppercase tracking-widest hover:bg-[#a38c7f] transition-colors mt-4 w-full rounded-sm"
              >
                Send Message
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
