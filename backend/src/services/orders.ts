import { randomBytes } from 'node:crypto';
import { db } from '../lib/supabase.js';
import { ApiError } from '../lib/http.js';
import { getStoreEntitlements, hasFeature } from './entitlements.js';
import { getCustomization } from './tenants.js';
import { dispatchWebhookEvent } from './webhooks.js';
import {
  consumeCoupon,
  evaluateCoupon,
  fromCents,
  priceLines,
  releaseCoupon,
  toCents,
  type OrderLineInput,
} from './pricing.js';

export interface ShippingAddress {
  line1: string;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
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
 * rules and the delivery option's stored price. Nothing monetary is taken from the request.
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

  const priced = await priceLines(tenantId, customer, input.lines);
  const subtotalCents = priced.reduce((sum, line) => sum + line.totalCents, 0);

  let discountCents = 0;
  let couponId: string | null = null;
  let couponCode: string | null = null;
  if (input.couponCode) {
    const result = await evaluateCoupon(tenantId, input.couponCode, subtotalCents);
    if (!result.ok) throw result.error;
    if (!(await consumeCoupon(result.coupon.coupon_id))) throw new ApiError(400, 'Coupon usage limit reached');
    couponId = result.coupon.coupon_id;
    couponCode = result.coupon.code;
    discountCents = result.discountCents;
  }

  try {
    let shippingCents = 0;
    let deliveryOptionId: string | null = null;
    if (input.deliveryOptionId) {
      const { data: option } = await db
        .from('delivery_options')
        .select('delivery_option_id, price')
        .eq('delivery_option_id', input.deliveryOptionId)
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .maybeSingle();
      if (!option) throw new ApiError(400, 'Invalid delivery option');
      deliveryOptionId = option.delivery_option_id;
      shippingCents = toCents(option.price);
    }

    const grandCents = subtotalCents - discountCents + shippingCents;

    const customization = await getCustomization(tenantId);
    const currencyRaw = String(customization.formData?.currency ?? '').toUpperCase();
    const currency = /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : undefined;

    // No dedicated payment-method/coupon columns on `orders` (see migrations) - recorded as structured lines
    // in `notes` instead, which the merchant dashboard's order detail page parses back out for display.
    const notes = [
      `Payment method: ${PAYMENT_METHOD_LABEL[paymentMethod]}`,
      couponCode ? `Coupon applied: ${couponCode} (-${fromCents(discountCents)})` : null,
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
          ...(currency ? { currency } : {}),
          subtotal: fromCents(subtotalCents),
          tax_total: 0,
          shipping_total: fromCents(shippingCents),
          discount_total: fromCents(discountCents),
          grand_total: fromCents(grandCents),
          shipping_address_line_1: input.shipping.line1,
          shipping_city: input.shipping.city ?? null,
          shipping_state: input.shipping.state ?? null,
          shipping_postal_code: input.shipping.postalCode ?? null,
          shipping_country: input.shipping.country ?? null,
          notes,
          delivery_option_id: deliveryOptionId,
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

    dispatchWebhookEvent(tenantId, 'order.created', {
      orderId: order.order_id,
      orderNumber: order.order_number,
      grandTotal: fromCents(grandCents),
      items: priced.map((line) => ({ name: line.name, quantity: line.quantity })),
    });

    return {
      orderId: order.order_id as string,
      orderNumber: order.order_number as string,
      subtotal: fromCents(subtotalCents),
      discount: fromCents(discountCents),
      shipping: fromCents(shippingCents),
      total: fromCents(grandCents),
    };
  } catch (error) {
    if (couponId) await releaseCoupon(couponId).catch(() => undefined);
    throw error;
  }
}
