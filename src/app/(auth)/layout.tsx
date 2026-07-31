"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import Link from "next/link";
import { TransitionLink } from "@/components/TransitionLink";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-[#EAE6DF] font-body relative overflow-hidden">

      {/* Left Column: Full-Height Image */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[60%] z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat mix-blend-multiply"
          style={{ 
            backgroundImage: "url('/premium_auth_bg_6.png')",
            maskImage: "linear-gradient(to right, black 50%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, black 50%, transparent 100%)"
          }}
        />
      </div>

      {/* Right Column: Form Area */}
      <div className="w-full lg:w-[50%] lg:ml-auto flex flex-col relative z-10 h-screen overflow-y-auto">
        {/* Top Navbar inside Form Area */}
        <div className="absolute top-0 w-full p-8 md:p-12 flex justify-end items-center z-20">
          <TransitionLink href="/" text="Monolith" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <img
              src="/logo.png"
              alt="Monolith Logo"
              className="w-8 h-8 md:w-10 md:h-10 object-contain mix-blend-multiply rounded-md"
            />
            <span className="font-heading text-xl md:text-2xl font-black tracking-tighter text-gray-900 uppercase pt-1">
              Monolith
            </span>
          </TransitionLink>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 mt-20 lg:mt-0 relative z-10">
          <div className="w-full max-w-[400px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
