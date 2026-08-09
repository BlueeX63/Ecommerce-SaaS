"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Package, Settings, LogOut, Loader2, MapPin, Phone, Mail, ChevronRight, ShoppingBag, Clock, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { PremiumLoader } from "@/components/auth/PremiumLoader";

type ProfileProps = {
  basePath: string;
  theme?: "dark" | "light"; // For templates like minimalist (light) vs velocity (dark)
};

export default function PremiumProfile({ basePath, theme = "dark" }: ProfileProps) {
  const router = useRouter();
  const slug = basePath.split("/").pop() || "";
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("orders");
  const [profileData, setProfileData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isLight = theme === "light";
  const bgClass = isLight ? "bg-[#F8F6F1]" : "bg-[#0A0A0A]";
  const textClass = isLight ? "text-black" : "text-white";
  const cardBg = isLight ? "bg-white border-black/10" : "bg-[#111111] border-white/10";
  const textMuted = isLight ? "text-black/60" : "text-white/60";
  const highlight = isLight ? "bg-black text-white" : "bg-white text-black";
  const tabInactive = isLight ? "text-black/40 hover:text-black" : "text-white/40 hover:text-white";

  useEffect(() => {
    const verifyAuthAndFetch = async () => {
      try {
        setIsCheckingAuth(true);
        setLoading(true);
        
        const profileRes = await fetch(`/api/v1/store/profile?slug=${slug}`);
        if (profileRes.ok) {
          setProfileData(await profileRes.json());
          
          // Fetch orders if auth succeeded
          const ordersRes = await fetch(`/api/v1/store/orders?slug=${slug}`);
          if (ordersRes.ok) {
            setOrders(await ordersRes.json());
          }
          setIsCheckingAuth(false);
        } else {
          // If real auth failed, check mock auth (for templates)
          const isMockLoggedIn = localStorage.getItem('mock_template_logged_in');
          if (isMockLoggedIn) {
            setIsCheckingAuth(false);
            // We can optionally mock orders here, but they will just be empty arrays
          } else {
            router.push(`${basePath}/auth/login`);
          }
        }
      } catch (e) {
        console.error("Failed to check auth data");
        // Fallback to mock
        if (localStorage.getItem('mock_template_logged_in')) {
          setIsCheckingAuth(false);
        } else {
          router.push(`${basePath}/auth/login`);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyAuthAndFetch();
  }, [basePath, router, slug]);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/store/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    }
    localStorage.removeItem('mock_template_logged_in');
    router.push(`${basePath}/auth/login`);
  };

  if (isCheckingAuth) return <PremiumLoader />;

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} pt-32 pb-24 px-6 md:px-12 font-sans overflow-hidden relative selection:bg-orange-500/30`}>
      {/* Abstract Background Elements */}
      <div className={`absolute top-0 right-0 w-[50vw] h-[50vw] bg-gradient-to-bl from-orange-500/10 to-purple-500/10 blur-[120px] rounded-full -z-10 translate-x-1/3 -translate-y-1/3 opacity-70`} />
      <div className={`absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-gradient-to-tr from-blue-500/10 to-teal-500/10 blur-[120px] rounded-full -z-10 -translate-x-1/3 translate-y-1/3 opacity-70`} />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24 relative z-10">
        
        {/* Sidebar Navigation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-72 shrink-0 space-y-8"
        >
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter mb-2">Account</h1>
            <p className={`${textMuted} uppercase tracking-[0.2em] text-xs font-medium`}>Management Center</p>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab("orders")}
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${activeTab === "orders" ? `${highlight} shadow-lg scale-[1.02]` : `${tabInactive} ${cardBg} hover:scale-[1.02]`}`}
            >
              <div className="flex items-center gap-3 font-medium">
                <Package className="w-5 h-5" />
                <span>Order History</span>
              </div>
              {activeTab === "orders" && <ChevronRight className="w-4 h-4 opacity-50" />}
            </button>
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${activeTab === "profile" ? `${highlight} shadow-lg scale-[1.02]` : `${tabInactive} ${cardBg} hover:scale-[1.02]`}`}
            >
              <div className="flex items-center gap-3 font-medium">
                <User className="w-5 h-5" />
                <span>Personal Info</span>
              </div>
              {activeTab === "profile" && <ChevronRight className="w-4 h-4 opacity-50" />}
            </button>
            <button 
              onClick={handleLogout}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 border border-transparent mt-4`}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Secure Logout</span>
            </button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-[60vh]">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className={`w-8 h-8 animate-spin ${textMuted}`} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Transmission Logs</h2>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${cardBg}`}>
                      {orders.length} Records
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-20 text-center ${cardBg} rounded-3xl border border-dashed`}>
                      <div className={`w-20 h-20 rounded-full ${isLight ? 'bg-black/5' : 'bg-white/5'} flex items-center justify-center mb-6`}>
                        <ShoppingBag className={`w-8 h-8 ${textMuted}`} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">No active payloads</h3>
                      <p className={`${textMuted} max-w-sm`}>Your order history is currently empty. Return to the grid to initiate a transfer.</p>
                      <button onClick={() => router.push(`${basePath}/products`)} className={`mt-8 px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-transform hover:scale-105 active:scale-95 ${highlight}`}>
                        Access Store
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order, i) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          key={order.order_id} 
                          className={`p-6 md:p-8 rounded-3xl border ${cardBg} shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden relative group`}
                        >
                          <div className={`absolute top-0 left-0 w-1 h-full ${order.status === 'DELIVERED' ? 'bg-green-500' : order.status === 'PENDING' ? 'bg-orange-500' : 'bg-blue-500'} opacity-50 group-hover:opacity-100 transition-opacity`} />
                          
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-mono font-bold tracking-wider">{order.order_number}</span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5
                                  ${order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                                    order.status === 'PENDING' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 
                                    'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}
                                >
                                  {order.status === 'DELIVERED' ? <CheckCircle className="w-3 h-3" /> : 
                                   order.status === 'PENDING' ? <Clock className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                                  {order.status}
                                </span>
                              </div>
                              <p className={`${textMuted} text-xs font-medium uppercase tracking-widest`}>
                                {new Date(order.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold tracking-tight">
                                {order.currency === 'USD' ? '$' : '₹'}{order.grand_total.toFixed(2)}
                              </p>
                              <p className={`${textMuted} text-xs uppercase tracking-widest mt-1`}>{order.order_items?.length || 0} Items</p>
                            </div>
                          </div>

                          <div className={`pt-6 border-t ${isLight ? 'border-black/5' : 'border-white/5'} grid grid-cols-1 md:grid-cols-2 gap-6`}>
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">Payload Contents</h4>
                              <div className="space-y-3">
                                {order.order_items?.map((item: any) => (
                                  <div key={item.item_id} className="flex justify-between items-center text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                      <span className={`${isLight ? 'bg-black/5' : 'bg-white/10'} w-6 h-6 rounded flex items-center justify-center text-[10px]`}>{item.quantity}x</span>
                                      {item.product_name}
                                    </span>
                                    <span>{order.currency === 'USD' ? '$' : '₹'}{item.total_price.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">Drop Location</h4>
                              <div className="flex items-start gap-3 text-sm font-medium">
                                <MapPin className={`w-4 h-4 mt-0.5 ${textMuted}`} />
                                <div>
                                  <p>{order.shipping_address_line_1}</p>
                                  <p className={`${textMuted} mt-1`}>{order.shipping_city}, {order.shipping_country}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-8 max-w-2xl"
                >
                  <div className="border-b border-black/10 dark:border-white/10 pb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Identity Matrix</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`p-6 rounded-2xl border ${cardBg}`}>
                        <label className={`block text-[10px] uppercase tracking-[0.2em] font-bold ${textMuted} mb-3`}>First Name</label>
                        <p className="text-lg font-medium">{profileData?.first_name || "N/A"}</p>
                      </div>
                      <div className={`p-6 rounded-2xl border ${cardBg}`}>
                        <label className={`block text-[10px] uppercase tracking-[0.2em] font-bold ${textMuted} mb-3`}>Last Name</label>
                        <p className="text-lg font-medium">{profileData?.last_name || "N/A"}</p>
                      </div>
                    </div>
                    
                    <div className={`p-6 rounded-2xl border ${cardBg} flex items-center gap-4`}>
                      <div className={`w-12 h-12 rounded-full ${isLight ? 'bg-black/5 text-black' : 'bg-white/10 text-white'} flex items-center justify-center shrink-0`}>
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <label className={`block text-[10px] uppercase tracking-[0.2em] font-bold ${textMuted} mb-1`}>Email Designation</label>
                        <p className="text-base font-medium">{profileData?.email || "N/A"}</p>
                      </div>
                    </div>

                    <div className={`p-6 rounded-2xl border ${cardBg} flex items-center gap-4`}>
                      <div className={`w-12 h-12 rounded-full ${isLight ? 'bg-black/5 text-black' : 'bg-white/10 text-white'} flex items-center justify-center shrink-0`}>
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <label className={`block text-[10px] uppercase tracking-[0.2em] font-bold ${textMuted} mb-1`}>Comlink Frequency</label>
                        <p className="text-base font-medium">{profileData?.phone_number || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
