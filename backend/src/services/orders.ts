import { randomBytes } from 'node:crypto';
import { db } from '../lib/supabase.js';
import { ApiError } from '../lib/http.js';
import { getStoreEntitlements, hasFeature } from './entitlements.js';
import { getCustomization } from './tenants.js';
import { dispatchWebhookEvent } from './webhooks.js';
import { allocateStock } from './fulfillment.js';
import { buildQuote } from './quote.js';
import { consumeCoupon, fromCents, releaseCoupon, type OrderLineInput } from './pricing.js';

export interface ShippingAddress {
  line1: string;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  name?: string | null;
  phone?: string | null;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export type PaymentMethod = 'cod' | 'upi' | 'netbanking';

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery',
  upi: 'UPI',
  netbanking: 'Netbanking',
};

export interface PlaceOrderInput {
  tenantId: string;
  customer: { customer_id: string; phone_number: string | null };
  lines: OrderLineInput[];
  couponCode?: string | null;
  deliveryOptionId?: string | null;
  shipping: ShippingAddress;
  notes?: string | null;
  /** Defaults to Cash on Delivery, which is always available. UPI/netbanking require the store's owner
   *  to have purchased the Online Payment Integration add-on - checked here, not just hidden in the UI. */
  paymentMethod?: PaymentMethod;
}

function newOrderNumber() {
  return `ORD-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/**
 * Creates an order whose every amount is computed on the server from database prices, the coupon's stored
 * rules, the store's tax/delivery settings and the delivery option's stored price. Nothing monetary is taken
 * from the request. The amounts come from the same `buildQuote` the checkout screen displays, so what the
 * shopper saw is exactly what they are charged.
 */
export async function placeOrder(input: PlaceOrderInput) {
  const { tenantId, customer } = input;

  const paymentMethod = input.paymentMethod ?? 'cod';
  if (paymentMethod !== 'cod') {
    const entitlements = await getStoreEntitlements(tenantId);
    if (!hasFeature(entitlements, 'online_payments')) {
      throw new ApiError(403, 'Online payment is not available for this store yet. Please pay Cash on Delivery.');
    }
  }

  const quote = await buildQuote({
    tenantId,
    customer,
    lines: input.lines,
    couponCode: input.couponCode,
    deliveryOptionId: input.deliveryOptionId,
    destination: {
      line1: input.shipping.line1,
      city: input.shipping.city,
      state: input.shipping.state,
      postalCode: input.shipping.postalCode,
      country: input.shipping.country,
      point:
        typeof input.shipping.latitude === 'number' && typeof input.shipping.longitude === 'number'
          ? { lat: input.shipping.latitude, lng: input.shipping.longitude }
          : null,
    },
  });

  if (quote.unavailable.length > 0) {
    const names = quote.unavailable.map((u) => u.name).join(', ');
    throw new ApiError(409, `${names} ${quote.unavailable.length > 1 ? 'are' : 'is'} out of stock right now.`);
  }

  const { cents, priced, plan, coupon, settings, point } = quote.internal;

  let couponId: string | null = null;
  if (coupon) {
    if (!(await consumeCoupon(coupon.coupon_id))) throw new ApiError(400, 'Coupon usage limit reached');
    couponId = coupon.coupon_id;
  }

  try {
    const customization = await getCustomization(tenantId);
    const currencyRaw = String(customization.formData?.currency ?? '').toUpperCase();
    const currency = /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : undefined;

    // Payment method and coupon also live in `notes` as structured lines, which older dashboard pages parse.
    const notes = [
      `Payment method: ${PAYMENT_METHOD_LABEL[paymentMethod]}`,
      quote.couponCode ? `Coupon applied: ${quote.couponCode} (-${quote.discount})` : null,
      input.notes,
    ]
      .filter(Boolean)
      .join('\n');

    let order: any = null;
    let orderNumber = '';
    for (let attempt = 0; attempt < 3 && !order; attempt++) {
      orderNumber = newOrderNumber();
      const { data, error } = await db
        .from('orders')
        .insert({
          tenant_id: tenantId,
          customer_id: customer.customer_id,
          order_number: orderNumber,
          status: 'PENDING',
          payment_status: 'UNPAID',
          payment_method: paymentMethod,
          ...(currency ? { currency } : {}),
          subtotal: fromCents(cents.subtotal),
          tax_total: fromCents(cents.tax),
          tax_rate: quote.tax.ratePercent,
          tax_inclusive: settings.tax.inclusive,
          tax_breakdown: quote.tax.lines,
          shipping_total: fromCents(cents.shipping),
          discount_total: fromCents(cents.discount),
          grand_total: fromCents(cents.total),
          shipping_name: input.shipping.name ?? null,
          shipping_phone: input.shipping.phone ?? customer.phone_number ?? null,
          shipping_address_line_1: input.shipping.line1,
          shipping_landmark: input.shipping.landmark ?? null,
          shipping_city: input.shipping.city ?? null,
          shipping_state: input.shipping.state ?? null,
          shipping_postal_code: input.shipping.postalCode ?? null,
          shipping_country: input.shipping.country ?? null,
          shipping_latitude: point?.lat ?? null,
          shipping_longitude: point?.lng ?? null,
          estimated_delivery_date: quote.delivery.maxDate,
          fulfillment_warehouse_id: plan.shipFrom?.warehouseId ?? null,
          notes,
          delivery_option_id: quote.shipping.deliveryOptionId,
        })
        .select('order_id, order_number')
        .single();
      if (data) order = data;
      else if (error?.code !== '23505') throw error;
    }
    if (!order) throw new ApiError(500, 'Could not create the order. Please try again.');

    const { error: itemsError } = await db.from('order_items').insert(
      priced.map((line) => ({
        order_id: order.order_id,
        product_name: line.name,
        sku: line.sku,
        quantity: line.quantity,
        unit_price: fromCents(line.unitCents),
        total_price: fromCents(line.totalCents),
      })),
    );
    if (itemsError) {
      await db.from('orders').delete().eq('order_id', order.order_id).eq('tenant_id', tenantId);
      throw itemsError;
    }

    try {
      await allocateStock(tenantId, order.order_id, plan);
    } catch (error) {
      await db.from('orders').delete().eq('order_id', order.order_id).eq('tenant_id', tenantId);
      throw error;
    }

    dispatchWebhookEvent(tenantId, 'order.created', {
      orderId: order.order_id,
      orderNumber: order.order_number,
      grandTotal: fromCents(cents.total),
      items: priced.map((line) => ({ name: line.name, quantity: line.quantity })),
    });

    return {
      orderId: order.order_id as string,
      orderNumber: order.order_number as string,
      subtotal: fromCents(cents.subtotal),
      discount: fromCents(cents.discount),
      tax: fromCents(cents.tax),
      shipping: fromCents(cents.shipping),
      total: fromCents(cents.total),
      estimatedDeliveryDate: quote.delivery.maxDate,
      deliveryMinDate: quote.delivery.minDate,
    };
  } catch (error) {
    if (couponId) await releaseCoupon(couponId).catch(() => undefined);
    throw error;
  }
}
