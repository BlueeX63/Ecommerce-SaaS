"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Package, User, Truck, Tag, CreditCard, MapPin, StickyNote, Loader2, Plus, Building2, RotateCcw, Banknote, Pencil, Phone, Warehouse,
} from "lucide-react";
import { CustomSelect } from "@/components/CustomSelect";
import { useCurrency } from "@/components/dashboard/CurrencyProvider";

import { DetailSkeleton, LoadingRegion } from "@/components/dashboard/Skeletons";
interface OrderItem {
  order_item_id: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Fulfillment {
  fulfillment_id: string;
  tracking_number: string | null;
  carrier: string | null;
  status: string;
  shipped_date: string | null;
  created_date: string;
}

interface OrderDetail {
  order_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  currency: string;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  grand_total: number;
  warehouses: { warehouse_id: string; warehouse_name: string; city: string | null; state_province: string | null } | null;
  payment_method: string | null;
  tax_inclusive: boolean | null;
  tax_breakdown: Array<{ label: string; ratePercent: number; amount: number }> | null;
  estimated_delivery_date: string | null;
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_landmark: string | null;
  shipping_address_line_1: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  notes: string | null;
  created_date: string;
  customers: { customer_id: string; first_name: string; last_name: string; email: string | null; phone_number: string | null; company_name: string | null } | null;
  dealers: { company_name: string; contact_email: string | null; contact_phone: string | null } | null;
  order_items: OrderItem[];
  fulfillments: Fulfillment[];
}

// Must match the `orders.status` CHECK constraint in the DB (see migrations/011_delivery_and_coupons.sql).
const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "RETURN_REQUESTED"];
const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"];
const FULFILLMENT_STATUSES = ["UNFULFILLED", "PARTIALLY_FULFILLED", "FULFILLED"];

/** The checkout flow records payment method / applied coupon / a customer's return reason as structured
 *  lines inside `notes` (there's no dedicated column for any of them) - this pulls them back out for display.
 *  The return request itself is the real `RETURN_REQUESTED` order status; this just recovers the shopper's reason. */
function parseNotes(notes: string | null) {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const paymentLine = lines.find((l) => l.startsWith("Payment method:"));
  const couponLine = lines.find((l) => l.startsWith("Coupon applied:"));
  const returnLine = lines.find((l) => l.startsWith("Return requested:"));
  const rest = lines.filter((l) => l !== paymentLine && l !== couponLine && l !== returnLine);
  return {
    paymentMethod: paymentLine?.replace("Payment method:", "").trim() ?? null,
    coupon: couponLine?.replace("Coupon applied:", "").trim() ?? null,
    returnRequest: returnLine?.replace("Return requested:", "").trim() ?? null,
    freeText: rest.join("\n") || null,
  };
}

function StatusBadge({ value }: { value: string }) {
  const palette: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    FULFILLED: "bg-green-100 text-green-700",
    DELIVERED: "bg-green-100 text-green-700",
    SHIPPED: "bg-blue-100 text-blue-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    PARTIALLY_PAID: "bg-amber-100 text-amber-700",
    PARTIALLY_FULFILLED: "bg-amber-100 text-amber-700",
    UNPAID: "bg-amber-100 text-amber-700",
    PENDING: "bg-gray-100 text-gray-700",
    UNFULFILLED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
    REFUNDED: "bg-red-100 text-red-700",
    RETURN_REQUESTED: "bg-red-100 text-red-700",
    RETURNED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${palette[value] || "bg-gray-100 text-gray-700"}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-black/[0.04] p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-primary">
        {icon}
        <h3 className="font-heading text-sm uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { formatCurrency } = useCurrency();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFulfillForm, setShowFulfillForm] = useState(false);
  const [tracking, setTracking] = useState({ carrier: "", trackingNumber: "" });
  const [isAddingFulfillment, setIsAddingFulfillment] = useState(false);
  const [refunds, setRefunds] = useState<Array<{ refund_id: string; amount: number; status: string; method: string; created_date: string }>>([]);
  const [editingShipping, setEditingShipping] = useState(false);
  const [shipForm, setShipForm] = useState({ name: "", phone: "", line1: "", landmark: "", city: "", state: "", postalCode: "" });
  const [isSavingShipping, setIsSavingShipping] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.data);
      } else {
        setError("Order not found.");
      }
    } catch {
      setError("Failed to load order.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      const res = await fetch(`/api/v1/dashboard/refunds?orderId=${orderId}&limit=10`, { cache: "no-store" });
      if (res.ok) setRefunds((await res.json()).data ?? []);
    } catch {
      // refunds are supplementary; the order itself still renders
    }
  };

  const openShippingEditor = () => {
    if (!order) return;
    setShipForm({
      name: order.shipping_name ?? "",
      phone: order.shipping_phone ?? "",
      line1: order.shipping_address_line_1 ?? "",
      landmark: order.shipping_landmark ?? "",
      city: order.shipping_city ?? "",
      state: order.shipping_state ?? "",
      postalCode: order.shipping_postal_code ?? "",
    });
    setEditingShipping(true);
  };

  const saveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingShipping(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/dashboard/orders/${orderId}/shipping`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.details) ? data.details.join(" · ") : data.error || "Failed to update delivery details");
      setEditingShipping(false);
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update delivery details");
    } finally {
      setIsSavingShipping(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const updateStatus = async (field: "status" | "paymentStatus" | "fulfillmentStatus", value: string) => {
    if (!order) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        await fetchOrder();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update order");
      }
    } catch {
      setError("Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  const addFulfillment = async () => {
    setIsAddingFulfillment(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/fulfillments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier: tracking.carrier || undefined, trackingNumber: tracking.trackingNumber || undefined, status: "SHIPPED" }),
      });
      if (res.ok) {
        setTracking({ carrier: "", trackingNumber: "" });
        setShowFulfillForm(false);
        await fetchOrder();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to add tracking info");
      }
    } catch {
      setError("Failed to add tracking info");
    } finally {
      setIsAddingFulfillment(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingRegion label="Loading">
        <DetailSkeleton />
      </LoadingRegion>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <p className="text-secondary mb-4">{error || "Order not found."}</p>
        <Link href="/dashboard/orders" className="text-sm font-medium text-primary underline">Back to Orders</Link>
      </div>
    );
  }

  const notes = parseNotes(order.notes);
  const customerName = order.customers ? `${order.customers.first_name} ${order.customers.last_name}`.trim() : order.dealers?.company_name || "Guest";
  const shippingLines = [order.shipping_address_line_1, [order.shipping_city, order.shipping_state].filter(Boolean).join(", "), order.shipping_postal_code, order.shipping_country].filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/orders" className="p-2 mt-1 bg-white rounded-lg border border-black/10 hover:bg-black/5 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </Link>
          <div>
            <h1 className="font-heading text-3xl text-primary mb-1">{order.order_number}</h1>
            <p className="text-secondary text-sm">Placed on {new Date(order.created_date).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge value={order.status} />
          <StatusBadge value={order.payment_status} />
          <StatusBadge value={order.fulfillment_status} />
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}

      {order.status === "RETURN_REQUESTED" && notes.returnRequest && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Customer requested a return</p>
            <p className="text-sm text-amber-700 mt-0.5">{notes.returnRequest}</p>
            <p className="text-xs text-amber-700/80 mt-2">
              Once resolved, update the status below (e.g. to Refunded or Cancelled) to close this out.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <InfoCard icon={<Package className="w-4 h-4" />} title="Items Ordered">
            <div className="divide-y divide-black/[0.04]">
              {order.order_items.map((item) => (
                <div key={item.order_item_id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-primary">{item.product_name}</p>
                    <p className="text-xs text-secondary mt-0.5">
                      {item.sku && <span className="mr-3">SKU: {item.sku}</span>}
                      Qty {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-medium text-primary shrink-0">{formatCurrency(item.total_price)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-black/[0.06] space-y-2 text-sm">
              <div className="flex justify-between text-secondary"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.discount_total > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount{notes.coupon ? ` (${notes.coupon.split(" ")[0]})` : ""}</span>
                  <span>-{formatCurrency(order.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between text-secondary"><span>Delivery charge</span><span>{order.shipping_total > 0 ? formatCurrency(order.shipping_total) : "Free"}</span></div>
              {order.tax_total > 0 && (
                <>
                  <div className="flex justify-between text-secondary">
                    <span>{order.tax_inclusive ? "Taxes (included in prices)" : "Taxes"}</span>
                    <span>{formatCurrency(order.tax_total)}</span>
                  </div>
                  {order.tax_breakdown?.map((t) => (
                    <div key={t.label} className="flex justify-between text-xs text-secondary pl-4">
                      <span>{t.label} ({t.ratePercent}%)</span>
                      <span>{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </>
              )}
              <div className="flex justify-between font-semibold text-primary text-base pt-2 border-t border-black/[0.06]">
                <span>Total</span><span>{formatCurrency(order.grand_total)}</span>
              </div>
            </div>
          </InfoCard>

          <InfoCard icon={<Truck className="w-4 h-4" />} title="Fulfillment">
            {order.fulfillments.length > 0 ? (
              <div className="space-y-3 mb-4">
                {order.fulfillments.map((f) => (
                  <div key={f.fulfillment_id} className="flex items-center justify-between p-3 rounded-lg bg-black/[0.02] border border-black/[0.04]">
                    <div>
                      <p className="text-sm font-medium text-primary">{f.carrier || "Carrier not specified"}</p>
                      <p className="text-xs text-secondary">{f.tracking_number ? `Tracking: ${f.tracking_number}` : "No tracking number"}</p>
                    </div>
                    <StatusBadge value={f.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary mb-4">No shipments recorded yet.</p>
            )}

            {showFulfillForm ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Carrier (e.g. FedEx)"
                  value={tracking.carrier}
                  onChange={(e) => setTracking((p) => ({ ...p, carrier: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                />
                <input
                  type="text"
                  placeholder="Tracking number"
                  value={tracking.trackingNumber}
                  onChange={(e) => setTracking((p) => ({ ...p, trackingNumber: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                />
                <button
                  onClick={addFulfillment}
                  disabled={isAddingFulfillment}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 transition-colors disabled:opacity-50 shrink-0"
                >
                  {isAddingFulfillment ? "Saving..." : "Mark as Shipped"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowFulfillForm(true)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Tracking Info
              </button>
            )}
          </InfoCard>

          {(notes.freeText) && (
            <InfoCard icon={<StickyNote className="w-4 h-4" />} title="Notes">
              <p className="text-sm text-secondary whitespace-pre-line">{notes.freeText}</p>
            </InfoCard>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <InfoCard icon={<Package className="w-4 h-4" />} title="Update Status">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Order Status</label>
                <CustomSelect
                  name="status"
                  value={order.status}
                  onChange={(v) => updateStatus("status", v)}
                  options={ORDER_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Payment Status</label>
                <CustomSelect
                  name="paymentStatus"
                  value={order.payment_status}
                  onChange={(v) => updateStatus("paymentStatus", v)}
                  options={PAYMENT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Fulfillment Status</label>
                <CustomSelect
                  name="fulfillmentStatus"
                  value={order.fulfillment_status}
                  onChange={(v) => updateStatus("fulfillmentStatus", v)}
                  options={FULFILLMENT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
                />
              </div>
              {isSaving && <p className="text-xs text-secondary">Saving...</p>}
            </div>
          </InfoCard>

          <InfoCard icon={order.dealers ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />} title={order.dealers ? "Dealer" : "Customer"}>
            <p className="font-medium text-primary mb-1">{customerName}</p>
            {order.customers?.email && <p className="text-sm text-secondary">{order.customers.email}</p>}
            {order.customers?.phone_number && <p className="text-sm text-secondary">{order.customers.phone_number}</p>}
            {order.dealers?.contact_email && <p className="text-sm text-secondary">{order.dealers.contact_email}</p>}
            {order.dealers?.contact_phone && <p className="text-sm text-secondary">{order.dealers.contact_phone}</p>}
          </InfoCard>

          <InfoCard icon={<Warehouse className="w-4 h-4" />} title="Handled by">
            {order.warehouses ? (
              <>
                <p className="text-sm font-medium text-primary">{order.warehouses.warehouse_name}</p>
                <p className="text-xs text-secondary mt-0.5">{[order.warehouses.city, order.warehouses.state_province].filter(Boolean).join(", ")}</p>
                <p className="text-xs text-secondary mt-2">The nearest warehouse with stock. Its team can update this order&apos;s status.</p>
              </>
            ) : (
              <p className="text-sm text-secondary">No warehouse assigned — the items in this order don&apos;t have tracked stock.</p>
            )}
          </InfoCard>

          <InfoCard icon={<MapPin className="w-4 h-4" />} title="Delivery">
            {editingShipping ? (
              <form onSubmit={saveShipping} className="space-y-2.5">
                {([
                  ["name", "Recipient name"],
                  ["phone", "Phone"],
                  ["line1", "Street address"],
                  ["landmark", "Landmark"],
                  ["city", "City"],
                  ["state", "State"],
                  ["postalCode", "PIN / postal code"],
                ] as const).map(([key, label]) => (
                  <input
                    key={key}
                    aria-label={label}
                    placeholder={label}
                    value={shipForm[key]}
                    onChange={(e) => setShipForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/[0.02] border border-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  />
                ))}
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={isSavingShipping} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    {isSavingShipping ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={() => setEditingShipping(false)} className="px-3 py-2 text-sm text-secondary">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="text-sm text-secondary space-y-0.5">
                  {order.shipping_name && <p className="text-primary font-medium">{order.shipping_name}</p>}
                  {shippingLines.map((line, i) => <p key={i}>{line}</p>)}
                  {order.shipping_landmark && <p>Landmark: {order.shipping_landmark}</p>}
                  {order.shipping_phone && <p className="flex items-center gap-1.5 pt-1"><Phone className="w-3.5 h-3.5" /> {order.shipping_phone}</p>}
                  {shippingLines.length === 0 && !order.shipping_phone && <p>No delivery details recorded.</p>}
                </div>
                {order.estimated_delivery_date && !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status) && (
                  <p className="mt-3 pt-3 border-t border-black/[0.06] text-sm text-secondary flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 shrink-0" /> Estimated delivery by <span className="font-medium text-primary">{new Date(order.estimated_delivery_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                  </p>
                )}
                {!["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status) && (
                  <button type="button" onClick={openShippingEditor} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                    <Pencil className="w-3 h-3" /> Edit delivery details
                  </button>
                )}
              </>
            )}
          </InfoCard>

          <InfoCard icon={<CreditCard className="w-4 h-4" />} title="Payment">
            <p className="text-sm text-primary font-medium">
              {order.payment_method ? ({ cod: "Cash on Delivery", upi: "UPI", netbanking: "Netbanking" } as Record<string, string>)[order.payment_method] ?? order.payment_method : notes.paymentMethod || "Not recorded"}
            </p>
            {refunds.length > 0 && (
              <div className="mt-3 pt-3 border-t border-black/[0.06] space-y-2">
                {refunds.map((r) => (
                  <Link key={r.refund_id} href="/dashboard/support" className="flex items-center justify-between gap-2 text-sm hover:underline">
                    <span className="flex items-center gap-2 text-primary"><Banknote className="w-3.5 h-3.5" /> Refund {formatCurrency(Number(r.amount))}</span>
                    <StatusBadge value={r.status} />
                  </Link>
                ))}
              </div>
            )}
            {notes.coupon && (
              <div className="mt-3 pt-3 border-t border-black/[0.06] flex items-center gap-2 text-sm text-green-700">
                <Tag className="w-3.5 h-3.5 shrink-0" />
                <span>{notes.coupon}</span>
              </div>
            )}
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
