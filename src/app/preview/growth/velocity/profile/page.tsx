"use client";

import { motion } from "framer-motion";
import { User, Activity, MapPin, Package, Shield, Settings, LogOut } from "lucide-react";

export default function VelocityProfilePage() {
  const operativeData = {
    id: "OP-9021-X",
    status: "Active",
    clearance: "Level 4 (Nexus)",
    lastLogin: "2026-07-27 14:02:44 PST",
    location: "Sector 7G, Neo-Tokyo"
  };

  const recentTransmissions = [
    { id: "TR-1029", date: "2026-07-20", item: "Zero-G Cargo Pants", status: "Delivered" },
    { id: "TR-1088", date: "2026-07-25", item: "Neon-Pulse Sneakers", status: "In Transit" },
  ];

  return (
    <div className="bg-[#050505] min-h-screen pt-32 pb-32 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,240,255,0.05)_0%,rgba(0,0,0,1)_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-12 border-b border-[#00f0ff]/20 pb-6"
        >
          <Shield className="w-8 h-8 text-[#00f0ff]" />
          <h1 className="text-4xl font-black uppercase tracking-widest font-orbitron text-white">User Profile</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Identity Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-[#0a0a0a] border border-[#00f0ff]/30 p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/10 blur-3xl rounded-full" />
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 rounded-full border-2 border-[#00f0ff] p-2 relative">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden relative">
                  <User className="w-16 h-16 text-[#00f0ff]/50" />
                  {/* Scanline */}
                  <div className="absolute inset-0 w-full h-1 bg-[#00f0ff] opacity-50 animate-[scan_2s_ease-in-out_infinite]" style={{ boxShadow: '0 0 10px #00f0ff' }} />
                </div>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs uppercase tracking-widest text-[#00f0ff]">
              <div className="flex justify-between border-b border-[#00f0ff]/20 pb-2">
                <span className="text-white/40">ID</span>
                <span className="font-bold">{operativeData.id}</span>
              </div>
              <div className="flex justify-between border-b border-[#00f0ff]/20 pb-2">
                <span className="text-white/40">Status</span>
                <span className="text-[#ff003c] font-bold flex items-center gap-2"><span className="w-2 h-2 bg-[#ff003c] rounded-full animate-pulse"/> {operativeData.status}</span>
              </div>
              <div className="flex justify-between border-b border-[#00f0ff]/20 pb-2">
                <span className="text-white/40">Clearance</span>
                <span>{operativeData.clearance}</span>
              </div>
              <div className="flex justify-between border-b border-[#00f0ff]/20 pb-2">
                <span className="text-white/40">Last Login</span>
                <span>{operativeData.lastLogin}</span>
              </div>
              <div className="flex justify-between border-b border-[#00f0ff]/20 pb-2">
                <span className="text-white/40">Location</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {operativeData.location}</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button className="w-full flex items-center gap-3 bg-[#0a0a0a] border border-[#00f0ff]/20 hover:border-[#00f0ff] text-white p-4 uppercase tracking-widest text-xs font-space transition-colors">
                <Settings className="w-4 h-4 text-[#00f0ff]" /> Settings
              </button>
              <button className="w-full flex items-center gap-3 bg-[#0a0a0a] border border-[#ff003c]/20 hover:border-[#ff003c] text-[#ff003c] p-4 uppercase tracking-widest text-xs font-space transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>

          {/* Activity Logs */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0a0a0a] border border-white/10 p-8"
            >
              <h3 className="text-xl font-black uppercase tracking-widest text-[#00f0ff] mb-6 font-orbitron flex items-center gap-3">
                <Activity className="w-5 h-5 text-[#ff003c]" /> Order History
              </h3>
              
              <div className="space-y-4 font-space">
                {recentTransmissions.map((log, i) => (
                  <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 border border-white/5 hover:border-[#00f0ff]/30 transition-colors">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <div className="w-10 h-10 bg-[#00f0ff]/10 flex items-center justify-center border border-[#00f0ff]/30">
                        <Package className="w-5 h-5 text-[#00f0ff]" />
                      </div>
                      <div>
                        <p className="font-bold uppercase tracking-widest text-sm">{log.item}</p>
                        <p className="text-xs text-[#00f0ff] font-mono tracking-widest">ID: {log.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs uppercase tracking-widest">
                      <span className="text-white/50">{log.date}</span>
                      <span className={`px-3 py-1 font-bold ${log.status === 'Delivered' ? 'text-[#00f0ff] border border-[#00f0ff]/30 bg-[#00f0ff]/10' : 'text-[#ff003c] border border-[#ff003c]/30 bg-[#ff003c]/10'}`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-[#ff003c]/10 to-[#00f0ff]/10 border border-white/10 p-8"
            >
              <h3 className="text-lg font-black uppercase tracking-widest text-white mb-4 font-orbitron">
                Premium Membership Available
              </h3>
              <p className="text-white/60 font-space text-sm mb-6 leading-relaxed max-w-lg">
                Your operative stats qualify you for Level 5 clearance. Upgrade now to access restricted prototypes and heavily encrypted comm channels.
              </p>
              <button className="bg-[#ff003c] text-white font-black uppercase tracking-[0.2em] px-8 py-3 text-xs hover:bg-white hover:text-black transition-colors font-orbitron">
                Upgrade Now
              </button>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
