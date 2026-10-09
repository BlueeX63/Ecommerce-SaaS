"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Loader2, LocateFixed, Tag, X } from "lucide-react";
import { PremiumLoader } from "@/components/auth/PremiumLoader";
import { OrderSummary, type SummaryLine, type SummaryTheme } from "@/components/storefront/OrderSummary";
import {
  PremiumPaymentSelector,
  resolveAllowedMethods,
  type PaymentMethod,
  type PaymentMethodDetails,
} from "@/components/storefront/PremiumPaymentSelector";
import { useCheckoutQuote } from "@/hooks/useCheckoutQuote";
import { formatDeliveryWindow, money } from "@/lib/storefront/quote";
import { clientStoreKey } from "@/lib/storefront/slug";

/** Class tokens each template supplies so the shared checkout matches its look. */
export interface CheckoutTheme extends SummaryTheme {
  /** Outer wrapper: background, text colour, font family. */
  page: string;
  label: string;
  input: string;
  primaryButton: string;
  secondaryButton: string;
  payment: "light" | "dark";
  paymentRing?: string;
  paymentDot?: string;
  /** Page title font/size classes. */
  title: string;
  /** Top padding; templates with a fixed header need extra room. */
  topPad?: string;
}

export type CheckoutLine = SummaryLine;

interface Props {
  theme: CheckoutTheme;
  basePath: string;
  slug?: string;
  lines: CheckoutLine[];
  currencySymbol: string;
  clearCart: () => void;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  couponError: string | null;
  initialOnlinePaymentsEnabled?: boolean;
  initialPaymentMethods?: PaymentMethodDetails;
  /** Lets a template mirror the new order into its own local state (e.g. an order history widget). */
  onOrderPlaced?: (order: { orderNumber: string; total: number }) => void;
}

type Step = "shipping" | "payment" | "placed";

interface Placed {
  orderNumber: string;
  total: number;
  minDate?: string;
  maxDate?: string;
}

const inputBase = "w-full";

function slugFromPath(explicit?: string) {
  return explicit || clientStoreKey();
}

export function StoreCheckout({
  theme,
  basePath,
  slug: slugProp,
  lines,
  currencySymbol,
  clearCart,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
  couponError,
  initialOnlinePaymentsEnabled,
  initialPaymentMethods,
  onOrderPlaced,
}: Props) {
  const router = useRouter();
  const allowedMethods = resolveAllowedMethods(initialOnlinePaymentsEnabled, initialPaymentMethods);
  const slug = slugFromPath(slugProp);

  const [step, setStep] = useState<Step>("shipping");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => allowedMethods?.[0] ?? (initialOnlinePaymentsEnabled === false ? "cod" : "upi"));
  const [couponInput, setCouponInput] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState<Array<{ delivery_option_id: string; name: string; price: number; estimated_days: string | null }>>([]);
  const [deliveryOptionId, setDeliveryOptionId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Array<{ code: string; discount_type: string; discount_amount: number }>>([]);

  const [form, setForm] = useState({ name: "", phone: "", address: "", landmark: "", city: "", state: "", zip: "", country: "India" });
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // The shopper must be signed in; the real session is verified by the backend, not a client-only flag.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/store/profile")
      .then((res) => {
        if (!res.ok) throw new Error("unauthenticated");
        return res.json();
      })
      .then((profile) => {
        if (cancelled) return;
        setForm((f) => ({
          ...f,
          name: f.name || `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
          phone: f.phone || profile.phone_number || "",
        }));
        setIsCheckingAuth(false);
      })
      .catch(() => {
        if (!cancelled) router.push(`${basePath}/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      });
    return () => {
      cancelled = true;
    };
  }, [basePath, router]);

  // Optional extras the merchant may have configured: delivery speeds and public promo codes.
  useEffect(() => {
    if (isCheckingAuth) return;
    const q = slug ? `?slug=${encodeURIComponent(slug)}` : "";
    fetch(`/api/v1/store/delivery-options${q}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          setDeliveryOptions(rows);
          setDeliveryOptionId((cur) => cur ?? rows[0].delivery_option_id);
        }
      })
      .catch(() => undefined);
    fetch(`/api/v1/store/coupons/public${q}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => Array.isArray(rows) && setOffers(rows.slice(0, 4)))
      .catch(() => undefined);
  }, [isCheckingAuth, slug]);

  const destination = useMemo(
    () => ({ address: form.address, city: form.city, state: form.state, zip: form.zip, country: form.country, latitude: point?.latitude, longitude: point?.longitude }),
    [form.address, form.city, form.state, form.zip, form.country, point],
  );
  const { quote, loading: quoting, error: quoteError } = useCheckoutQuote({
    slug,
    lines: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
    couponCode: appliedCoupon,
    deliveryOptionId,
    destination,
    enabled: !isCheckingAuth && step !== "placed",
  });

  const fallbackSubtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const blocked = !!quote && quote.unavailable.length > 0;

  const errors = {
    name: form.name.trim().length < 2 ? "Enter your full name" : "",
    phone: form.phone.replace(/\D/g, "").length < 10 ? "Enter a valid phone number" : "",
    address: form.address.trim().length < 5 ? "Enter your street address" : "",
    city: form.city.trim().length < 2 ? "Enter your city" : "",
    state: form.state.trim().length < 2 ? "Enter your state" : "",
    zip: !/^[A-Za-z0-9 -]{3,10}$/.test(form.zip.trim()) ? "Enter a valid PIN / postal code" : "",
  };
  const shippingValid = Object.values(errors).every((e) => !e);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationNote("Your browser doesn't support location access. Please type your PIN code.");
      return;
    }
    setLocating(true);
    setLocationNote(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPoint({ latitude, longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`, { headers: { Accept: "application/json" } });
          if (res.ok) {
            const data = await res.json();
            const a = data?.address ?? {};
            setForm((f) => ({
              ...f,
              city: f.city || a.city || a.town || a.village || a.suburb || a.county || "",
              state: f.state || a.state || "",
              zip: f.zip || a.postcode || "",
              country: a.country || f.country,
            }));
          }
          setLocationNote("Location added - we'll use it for a precise delivery date.");
        } catch {
          setLocationNote("Location added. Please fill in your city and PIN code.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocationNote("Couldn't get your location. You can type your PIN code instead.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  };

  async function placeOrder() {
    setOrderError(null);
    setPlacing(true);
    try {
      const res = await fetch(`/api/v1/store/orders${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug || undefined,
          items: lines.map((l) => ({ productId: l.id, quantity: l.quantity })),
          shippingDetails: {
            name: form.name.trim(),
            mobile: form.phone.trim(),
            address: form.address.trim(),
            landmark: form.landmark.trim() || undefined,
            city: form.city.trim(),
            state: form.state.trim(),
            zip: form.zip.trim(),
            country: form.country.trim() || undefined,
            latitude: point?.latitude,
            longitude: point?.longitude,
          },
          couponCode: appliedCoupon || undefined,
          deliveryOptionId: deliveryOptionId || undefined,
          paymentMethod,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrderError(data.error || "We couldn't place your order. Please try again.");
        return;
      }
      const total = Number(data.totals?.total ?? quote?.total ?? fallbackSubtotal);
      setPlaced({
        orderNumber: data.order_number,
        total,
        minDate: data.totals?.deliveryMinDate,
        maxDate: data.totals?.estimatedDeliveryDate,
      });
      onOrderPlaced?.({ orderNumber: data.order_number, total });
      clearCart();
      setStep("placed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setOrderError("We couldn't place your order. Check your connection and try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (isCheckingAuth) return <PremiumLoader />;

  // ------------------------------------------------------------------ placed
  if (step === "placed" && placed) {
    return (
      <div className={`flex min-h-[70vh] w-full flex-col items-center justify-center px-6 py-20 ${theme.page}`}>
        <div className={`w-full max-w-lg rounded-2xl border p-8 text-center sm:p-12 ${theme.panel} ${theme.border}`}>
          <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${theme.chip}`}>
            <CheckCircle2 className={`h-8 w-8 ${theme.accent}`} aria-hidden />
          </div>
          <h1 className={`mb-3 ${theme.title}`}>Order placed</h1>
          <p className={`mb-1 text-sm ${theme.muted}`}>Thank you! Your order number is</p>
          <p className="mb-6 font-mono text-lg font-semibold">{placed.orderNumber}</p>
          {placed.minDate && placed.maxDate && (
            <p className="mb-2 text-sm">
              Estimated delivery: <strong>{formatDeliveryWindow(placed.minDate, placed.maxDate)}</strong>
            </p>
          )}
          <p className={`mb-8 text-sm ${theme.muted}`}>
            Total {money(currencySymbol, placed.total)} · {paymentMethod === "cod" ? "Pay on delivery" : "Awaiting your payment confirmation"}. You can change your phone number or address within 24 hours from the orders page.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`${basePath}/orders`} className={`inline-flex items-center justify-center px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors ${theme.primaryButton}`}>
              View my orders
            </Link>
            <Link href={`${basePath}/products`} className={`inline-flex items-center justify-center px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors ${theme.secondaryButton}`}>
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ empty
  if (lines.length === 0) {
    return (
      <div className={`flex min-h-[70vh] w-full flex-col items-center justify-center px-6 py-20 text-center ${theme.page}`}>
        <h1 className={`mb-3 ${theme.title}`}>Your cart is empty</h1>
        <p className={`mb-8 text-sm ${theme.muted}`}>Add something to your cart to check out.</p>
        <Link href={`${basePath}/products`} className={`inline-flex px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${theme.primaryButton}`}>
          Browse products
        </Link>
      </div>
    );
  }

  const field = (id: keyof typeof errors, label: string, node: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`co-${id}`} className={`text-[11px] font-bold uppercase tracking-widest ${theme.label}`}>
        {label}
      </label>
      {node}
      {touched && errors[id] && (
        <p role="alert" className={`text-xs ${theme.danger}`}>
          {errors[id]}
        </p>
      )}
    </div>
  );

  const inputClass = `${inputBase} ${theme.input}`;

  return (
    <div className={`w-full ${theme.page}`}>
      <div className={`mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8 ${theme.topPad ?? "pt-10 lg:pt-14"}`}>
        {/* Stepper */}
        <nav aria-label="Checkout progress" className={`mb-8 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${theme.muted}`}>
          <Link href={`${basePath}/cart`} className="transition-opacity hover:opacity-70">
            Cart
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <button type="button" onClick={() => setStep("shipping")} className={step === "shipping" ? theme.accent : "transition-opacity hover:opacity-70"} aria-current={step === "shipping" ? "step" : undefined}>
            Shipping
          </button>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span className={step === "payment" ? theme.accent : ""} aria-current={step === "payment" ? "step" : undefined}>
            Payment
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
          {/* ----------------------------------------------------------- left column */}
          <div className="min-w-0">
            {step === "shipping" && (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  setTouched(true);
                  if (shippingValid) {
                    setStep("payment");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h1 className={theme.title}>Delivery details</h1>
                  <p className={`mt-2 text-sm ${theme.muted}`}>Where should we send your order? Your PIN code helps us find the nearest warehouse with your items in stock.</p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {field("name", "Full name", <input id="co-name" autoComplete="name" value={form.name} onChange={set("name")} className={inputClass} placeholder="Jane Doe" />)}
                  {field("phone", "Phone number", <input id="co-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} className={inputClass} placeholder="+91 98765 43210" />)}
                </div>
                {field("address", "Street address", <textarea id="co-address" rows={2} autoComplete="street-address" value={form.address} onChange={set("address")} className={`${inputClass} resize-none`} placeholder="Flat / house no., building, street, area" />)}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="co-landmark" className={`text-[11px] font-bold uppercase tracking-widest ${theme.label}`}>
                    Landmark <span className="font-normal normal-case tracking-normal opacity-60">(optional)</span>
                  </label>
                  <input id="co-landmark" value={form.landmark} onChange={set("landmark")} className={inputClass} placeholder="e.g. Near Central Park" />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {field("zip", "PIN / postal code", <input id="co-zip" inputMode="numeric" autoComplete="postal-code" value={form.zip} onChange={set("zip")} className={inputClass} placeholder="400001" />)}
                  {field("city", "City", <input id="co-city" autoComplete="address-level2" value={form.city} onChange={set("city")} className={inputClass} placeholder="Mumbai" />)}
                  {field("state", "State", <input id="co-state" autoComplete="address-level1" value={form.state} onChange={set("state")} className={inputClass} placeholder="Maharashtra" />)}
                </div>
                <div className="flex flex-col gap-1.5 sm:max-w-xs">
                  <label htmlFor="co-country" className={`text-[11px] font-bold uppercase tracking-widest ${theme.label}`}>
                    Country
                  </label>
                  <input id="co-country" autoComplete="country-name" value={form.country} onChange={set("country")} className={inputClass} />
                </div>

                {deliveryOptions.length > 0 && (
                  <fieldset className="flex flex-col gap-2">
                    <legend className={`mb-1 text-[11px] font-bold uppercase tracking-widest ${theme.label}`}>Delivery speed</legend>
                    {deliveryOptions.map((opt) => (
                      <label key={opt.delivery_option_id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 text-sm ${theme.border} ${deliveryOptionId === opt.delivery_option_id ? theme.chip : ""}`}>
                        <span className="flex items-center gap-3">
                          <input type="radio" name="delivery-option" checked={deliveryOptionId === opt.delivery_option_id} onChange={() => setDeliveryOptionId(opt.delivery_option_id)} className="h-4 w-4" />
                          <span>
                            <span className="block font-medium">{opt.name}</span>
                            {opt.estimated_days && <span className={`block text-xs ${theme.muted}`}>{opt.estimated_days}</span>}
                          </span>
                        </span>
                        <span className="tabular-nums">{Number(opt.price) === 0 ? "Free" : money(currencySymbol, Number(opt.price))}</span>
                      </label>
                    ))}
                  </fieldset>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors disabled:opacity-60 ${theme.border} ${theme.chip}`}
                  >
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LocateFixed className="h-4 w-4" aria-hidden />}
                    Use my current location
                  </button>
                  {locationNote && <span className={`text-xs ${theme.muted}`}>{locationNote}</span>}
                </div>

                <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row">
                  <Link href={`${basePath}/cart`} className={`inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors sm:flex-1 ${theme.secondaryButton}`}>
                    <ArrowLeft className="h-4 w-4" aria-hidden /> Back to cart
                  </Link>
                  <button type="submit" className={`inline-flex items-center justify-center px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors sm:flex-[2] ${theme.primaryButton}`}>
                    Continue to payment
                  </button>
                </div>
              </form>
            )}

            {step === "payment" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h1 className={theme.title}>Review &amp; pay</h1>
                  <p className={`mt-2 text-sm ${theme.muted}`}>Check your details, choose how you&apos;d like to pay, then place your order.</p>
                </div>

                <section className={`rounded-2xl border p-5 sm:p-6 ${theme.panel} ${theme.border}`} aria-label="Delivering to">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className={`text-sm font-semibold uppercase tracking-widest ${theme.heading}`}>Delivering to</h2>
                    <button type="button" onClick={() => setStep("shipping")} className={`text-xs font-bold uppercase tracking-widest ${theme.accent}`}>
                      Edit
                    </button>
                  </div>
                  <p className="text-sm font-medium">{form.name}</p>
                  <p className={`text-sm ${theme.muted}`}>{form.phone}</p>
                  <p className={`mt-1 text-sm ${theme.muted}`}>
                    {[form.address, form.landmark && `Landmark: ${form.landmark}`, [form.city, form.state, form.zip].filter(Boolean).join(", "), form.country].filter(Boolean).join(" · ")}
                  </p>
                </section>

                <section className={`rounded-2xl border p-5 sm:p-6 ${theme.panel} ${theme.border}`} aria-label="Payment method">
                  <h2 className={`mb-4 text-sm font-semibold uppercase tracking-widest ${theme.heading}`}>Payment method</h2>
                  <PremiumPaymentSelector
                    theme={theme.payment}
                    selected={paymentMethod}
                    onSelect={setPaymentMethod}
                    allowedMethods={allowedMethods}
                    details={initialPaymentMethods}
                    accentRing={theme.paymentRing}
                    accentDot={theme.paymentDot}
                  />
                </section>

                <section className={`rounded-2xl border p-5 sm:p-6 ${theme.panel} ${theme.border}`} aria-label="Promo code">
                  <h2 className={`mb-4 text-sm font-semibold uppercase tracking-widest ${theme.heading}`}>Promo code</h2>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-sm font-medium">
                        <Tag className={`h-4 w-4 ${theme.success}`} aria-hidden />
                        {appliedCoupon}
                        {quote && quote.discount > 0 && <span className={theme.success}>− {money(currencySymbol, quote.discount)}</span>}
                      </span>
                      <button type="button" onClick={removeCoupon} className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest ${theme.muted}`}>
                        <X className="h-3.5 w-3.5" aria-hidden /> Remove
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (couponInput.trim()) {
                          applyCoupon(couponInput.trim());
                          setCouponInput("");
                        }
                      }}
                      className="flex gap-3"
                    >
                      <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Enter code" aria-label="Promo code" className={`${inputClass} min-w-0 flex-1`} />
                      <button type="submit" className={`shrink-0 px-6 text-xs font-bold uppercase tracking-widest transition-colors ${theme.primaryButton}`}>
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && <p role="alert" className={`mt-3 text-xs ${theme.danger}`}>{couponError}</p>}
                  {!appliedCoupon && offers.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {offers.map((o) => (
                        <button key={o.code} type="button" onClick={() => applyCoupon(o.code)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${theme.border} ${theme.chip}`}>
                          {o.code} · {o.discount_type === "PERCENTAGE" ? `${Number(o.discount_amount)}% off` : `${money(currencySymbol, Number(o.discount_amount))} off`}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                {orderError && (
                  <p role="alert" className={`rounded-xl border p-4 text-sm ${theme.border} ${theme.danger}`}>
                    {orderError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button type="button" onClick={() => setStep("shipping")} disabled={placing} className={`inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 sm:flex-1 ${theme.secondaryButton}`}>
                    <ArrowLeft className="h-4 w-4" aria-hidden /> Back
                  </button>
                  <button
                    type="button"
                    onClick={placeOrder}
                    disabled={placing || blocked || quoting}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:flex-[2] ${theme.primaryButton}`}
                  >
                    {placing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Placing order…
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" aria-hidden /> Place order{quote ? ` · ${money(currencySymbol, quote.total)}` : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------- right column */}
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <OrderSummary theme={theme} symbol={currencySymbol} lines={lines} quote={quote} loading={quoting} error={quoteError} fallbackSubtotal={fallbackSubtotal} />
          </div>
        </div>
      </div>
    </div>
  );
}
