"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Package, LogOut, Loader2, MapPin, Phone, Mail, ShoppingBag, Clock, CheckCircle, Truck, XCircle, RotateCcw } from "lucide-react";
import { PremiumLoader } from "@/components/auth/PremiumLoader";

export type AccountTheme = {
  pageBg: string;
  textPrimary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  accentBg: string;
  accentText: string;
  headingFont: string;
  bodyFont: string;
  rounded: string;
  tracked?: boolean;
  copy: {
    pageTitle: string;
    pageSubtitle: string;
    ordersTab: string;
    profileTab: string;
    logout: string;
    emptyOrdersTitle: string;
    emptyOrdersBody: string;
    browseCta: string;
  };
};

type Order = {
  order_id: string;
  order_number: string;
  status: string;
  fulfillment_status: string;
  currency: string;
  grand_total: number;
  created_date: string;
  shipping_address_line_1: string | null;
  shipping_city: string | null;
  shipping_country: string | null;
  notes: string | null;
  order_items: { order_item_id: string; product_name: string; quantity: number; total_price: number }[];
};

const CANCELLABLE_STATUSES = ["PENDING", "PROCESSING"];

type Profile = {
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
};

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  DELIVERED: CheckCircle,
  SHIPPED: Truck,
  CANCELLED: XCircle,
  REFUNDED: XCircle,
  RETURN_REQUESTED: RotateCcw,
};

function currencyPrefix(code: string) {
  return code === "USD" ? "$" : code === "EUR" ? "€" : code === "GBP" ? "£" : "₹";
}

/** Polls for fresh order data while the tab is active so a status change the merchant makes shows up without a manual reload. */
const POLL_INTERVAL_MS = 20000;

export default function AccountCenter({
  basePath,
  defaultTab = "orders",
  theme,
}: {
  basePath: string;
  defaultTab?: "profile" | "orders";
  theme: AccountTheme;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "orders">(defaultTab);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [returnFormOrderId, setReturnFormOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const slug = basePath.replace(/^\/store\//, "").split("/")[0] || "";
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/store/orders${slug ? `?slug=${slug}` : ""}`);
      if (res.ok) setOrders(await res.json());
    } catch {
      // silent - polling refresh, don't disrupt the page over a transient network error
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profileRes = await fetch(`/api/v1/store/profile${slug ? `?slug=${slug}` : ""}`);
        if (!profileRes.ok) {
          if (!cancelled) router.push(`${basePath}/auth/login`);
          return;
        }
        if (cancelled) return;
        setProfile(await profileRes.json());
        setIsCheckingAuth(false);
        await fetchOrders();
      } catch {
        if (!cancelled) router.push(`${basePath}/auth/login`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, slug]);

  useEffect(() => {
    if (isCheckingAuth) return;
    pollRef.current = setInterval(() => {
      if (document.visibilityState === "visible") fetchOrders();
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isCheckingAuth, fetchOrders]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/store/auth/logout", { method: "POST" });
    } catch {
      // best-effort - still redirect even if the request fails
    }
    router.push(`${basePath}/auth/login`);
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm("Cancel this order? This can't be undone.")) return;
    setBusyOrderId(orderId);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/store/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.order_id === orderId ? { ...o, status: "CANCELLED" } : o)));
      } else {
        setActionError(data.error || "Failed to cancel order");
      }
    } catch {
      setActionError("Failed to cancel order. Please try again.");
    } finally {
      setBusyOrderId(null);
    }
  };

  const submitReturn = async (orderId: string) => {
    if (!returnReason.trim()) return;
    setBusyOrderId(orderId);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/store/orders/${orderId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: returnReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.order_id === orderId
              ? { ...o, status: "RETURN_REQUESTED", notes: [o.notes, `Return requested: ${returnReason.trim()}`].filter(Boolean).join("\n") }
              : o,
          ),
        );
        setReturnFormOrderId(null);
        setReturnReason("");
      } else {
        setActionError(data.error || "Failed to submit return request");
      }
    } catch {
      setActionError("Failed to submit return request. Please try again.");
    } finally {
      setBusyOrderId(null);
    }
  };

  if (isCheckingAuth) return <PremiumLoader />;

  const t = theme;
  const labelClass = t.tracked ? "uppercase tracking-[0.15em]" : "";

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} ${t.bodyFont} pt-32 pb-24 px-6 md:px-12`}>
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16">
        <div className="w-full lg:w-64 shrink-0 space-y-8">
          <div>
            <h1 className={`${t.headingFont} text-3xl lg:text-4xl mb-2`}>{t.copy.pageTitle}</h1>
            <p className={`${t.textMuted} text-sm ${labelClass}`}>{t.copy.pageSubtitle}</p>
          </div>

          <div className="flex flex-row lg:flex-col gap-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-3 px-4 py-3 ${t.rounded} text-sm font-medium transition-colors ${
                activeTab === "orders" ? `${t.accentBg} ${t.accentText}` : `${t.cardBg} border ${t.cardBorder} ${t.textMuted}`
              }`}
            >
              <Package className="w-4 h-4" />
              <span className={labelClass}>{t.copy.ordersTab}</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-4 py-3 ${t.rounded} text-sm font-medium transition-colors ${
                activeTab === "profile" ? `${t.accentBg} ${t.accentText}` : `${t.cardBg} border ${t.cardBorder} ${t.textMuted}`
              }`}
            >
              <User className="w-4 h-4" />
              <span className={labelClass}>{t.copy.profileTab}</span>
            </button>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-4 py-3 ${t.rounded} text-sm font-medium ${t.textMuted} hover:text-red-500 transition-colors`}
            >
              <LogOut className="w-4 h-4" />
              <span className={labelClass}>{t.copy.logout}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[50vh]">
          {loading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <Loader2 className={`w-6 h-6 animate-spin ${t.textMuted}`} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "orders" ? (
                <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  {actionError && <p className="text-sm text-red-500">{actionError}</p>}
                  {orders.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-20 text-center border ${t.cardBorder} ${t.rounded}`}>
                      <ShoppingBag className={`w-8 h-8 ${t.textMuted} mb-4`} />
                      <h3 className={`${t.headingFont} text-xl mb-2`}>{t.copy.emptyOrdersTitle}</h3>
                      <p className={`${t.textMuted} max-w-sm text-sm mb-6`}>{t.copy.emptyOrdersBody}</p>
                      <button onClick={() => router.push(`${basePath}/products`)} className={`px-6 py-3 ${t.rounded} text-sm font-medium ${t.accentBg} ${t.accentText}`}>
                        {t.copy.browseCta}
                      </button>
                    </div>
                  ) : (
                    orders.map((order) => {
                      const Icon = STATUS_ICON[order.status] || Clock;
                      const symbol = currencyPrefix(order.currency);
                      const returnRequested = order.status === "RETURN_REQUESTED";
                      const canCancel = CANCELLABLE_STATUSES.includes(order.status);
                      const canReturn = order.status === "DELIVERED";
                      const isBusy = busyOrderId === order.order_id;
                      return (
                        <div key={order.order_id} className={`p-6 border ${t.cardBorder} ${t.rounded} ${t.cardBg}`}>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                              <div className="flex items-center gap-3 mb-1.5">
                                <span className="text-sm font-mono font-medium">{order.order_number}</span>
                                <span className={`px-2.5 py-0.5 ${t.rounded} text-[10px] font-medium ${labelClass} flex items-center gap-1 ${t.accentBg} ${t.accentText}`}>
                                  <Icon className="w-3 h-3" />
                                  {order.status.replace(/_/g, " ")}
                                </span>
                              </div>
                              <p className={`${t.textMuted} text-xs ${labelClass}`}>
                                {new Date(order.created_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`${t.headingFont} text-xl`}>
                                {symbol}
                                {Number(order.grand_total).toFixed(2)}
                              </p>
                              <p className={`${t.textMuted} text-xs ${labelClass}`}>{order.order_items?.length || 0} items</p>
                            </div>
                          </div>

                          <div className={`pt-5 border-t ${t.cardBorder} grid grid-cols-1 md:grid-cols-2 gap-6`}>
                            <div className="space-y-2">
                              <h4 className={`text-xs font-medium ${t.textMuted} ${labelClass}`}>Items</h4>
                              {order.order_items?.map((item) => (
                                <div key={item.order_item_id} className="flex justify-between text-sm">
                                  <span>
                                    {item.quantity}x {item.product_name}
                                  </span>
                                  <span>
                                    {symbol}
                                    {Number(item.total_price).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <h4 className={`text-xs font-medium ${t.textMuted} ${labelClass}`}>Shipping Address</h4>
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className={`w-3.5 h-3.5 mt-0.5 ${t.textMuted} shrink-0`} />
                                <div>
                                  <p>{order.shipping_address_line_1}</p>
                                  <p className={t.textMuted}>
                                    {order.shipping_city}
                                    {order.shipping_city && order.shipping_country ? ", " : ""}
                                    {order.shipping_country}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {returnRequested && (
                            <div className={`mt-5 pt-5 border-t ${t.cardBorder} flex items-center gap-2 text-sm`}>
                              <RotateCcw className={`w-4 h-4 ${t.textMuted}`} />
                              <span className={t.textMuted}>Return requested - we&apos;ll be in touch shortly.</span>
                            </div>
                          )}

                          {(canCancel || canReturn) && (
                            <div className={`mt-5 pt-5 border-t ${t.cardBorder}`}>
                              {returnFormOrderId === order.order_id ? (
                                <div className="space-y-3">
                                  <label className={`block text-xs font-medium ${t.textMuted} ${labelClass}`}>Why are you returning this order?</label>
                                  <textarea
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    rows={2}
                                    className={`w-full p-3 text-sm bg-transparent border ${t.cardBorder} ${t.rounded} focus:outline-none`}
                                    placeholder="Tell us what went wrong..."
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => submitReturn(order.order_id)}
                                      disabled={isBusy || !returnReason.trim()}
                                      className={`px-4 py-2 ${t.rounded} text-xs font-medium ${labelClass} ${t.accentBg} ${t.accentText} disabled:opacity-50`}
                                    >
                                      {isBusy ? "Submitting..." : "Submit Request"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReturnFormOrderId(null);
                                        setReturnReason("");
                                      }}
                                      className={`px-4 py-2 text-xs font-medium ${labelClass} ${t.textMuted}`}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-3">
                                  {canCancel && (
                                    <button
                                      onClick={() => handleCancel(order.order_id)}
                                      disabled={isBusy}
                                      className={`px-4 py-2 border ${t.cardBorder} ${t.rounded} text-xs font-medium ${labelClass} hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50`}
                                    >
                                      {isBusy ? "Cancelling..." : "Cancel Order"}
                                    </button>
                                  )}
                                  {canReturn && (
                                    <button
                                      onClick={() => {
                                        setReturnFormOrderId(order.order_id);
                                        setReturnReason("");
                                        setActionError(null);
                                      }}
                                      className={`px-4 py-2 border ${t.cardBorder} ${t.rounded} text-xs font-medium ${labelClass} hover:opacity-70 transition-opacity flex items-center gap-2`}
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      Request Return
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </motion.div>
              ) : (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 max-w-lg">
                  <div className={`grid grid-cols-2 gap-4`}>
                    <div className={`p-5 border ${t.cardBorder} ${t.rounded} ${t.cardBg}`}>
                      <label className={`block text-[10px] font-medium ${t.textMuted} ${labelClass} mb-2`}>First Name</label>
                      <p className="text-sm font-medium">{profile?.first_name || "-"}</p>
                    </div>
                    <div className={`p-5 border ${t.cardBorder} ${t.rounded} ${t.cardBg}`}>
                      <label className={`block text-[10px] font-medium ${t.textMuted} ${labelClass} mb-2`}>Last Name</label>
                      <p className="text-sm font-medium">{profile?.last_name || "-"}</p>
                    </div>
                  </div>
                  <div className={`p-5 border ${t.cardBorder} ${t.rounded} ${t.cardBg} flex items-center gap-4`}>
                    <Mail className={`w-4 h-4 ${t.textMuted}`} />
                    <div>
                      <label className={`block text-[10px] font-medium ${t.textMuted} ${labelClass} mb-1`}>Email</label>
                      <p className="text-sm font-medium">{profile?.email || "Not provided"}</p>
                    </div>
                  </div>
                  <div className={`p-5 border ${t.cardBorder} ${t.rounded} ${t.cardBg} flex items-center gap-4`}>
                    <Phone className={`w-4 h-4 ${t.textMuted}`} />
                    <div>
                      <label className={`block text-[10px] font-medium ${t.textMuted} ${labelClass} mb-1`}>Phone</label>
                      <p className="text-sm font-medium">{profile?.phone_number || "Not provided"}</p>
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
