"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/navigation";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
      
      <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="bg-blue-50 p-4 rounded-full mb-6">
          <BarChart3 className="w-12 h-12 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Detailed Analytics coming soon!</h2>
        <p className="text-gray-500 max-w-md mb-8">
          We are currently working on a comprehensive suite of charts and reports. For now, you can view your core metrics on the main dashboard.
        </p>
        <a 
          href="/dashboard" 
          className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Return to Overview
        </a>
      </div>
    </div>
  );
}
