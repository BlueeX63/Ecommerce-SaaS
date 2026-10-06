import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { ApiError, badRequest, forbidden, notFound, parse, str, uuid } from '../lib/http.js';
import { optionalText, optionalUuid } from '../lib/validation.js';
import { evaluateCoupon } from '../services/pricing.js';
import { addToCart, assertActiveProduct, MAX_QTY_PER_LINE } from '../services/cart.js';
import { placeOrder } from '../services/orders.js';
import { requireStoreTenant } from '../services/tenants.js';

const MAX_ADDRESSES = 20;

/** The shopper's own context. Only valid behind requireShopper. */
export function me(req: Request) {
  const shopper = req.shopper;
  if (!shopper) throw new ApiError(401, 'Unauthorized');
  return { tenantId: shopper.tenantId, customerId: shopper.customerId, customer: shopper.customer };
}

/**
 * Resolves the target store from an explicit slug/host (public endpoints) or, failing that, from the shopper
 * session. If both are present they must agree, so a cookie from store A can never be used against store B.
 */
async function storeIdFor(req: Request, slug: unknown): Promise<string> {
  const key = typeof slug === 'string' ? slug.trim() : '';
  if (key) {
    const tenant = await requireStoreTenant(key);
    if (req.shopper && req.shopper.tenantId !== tenant.tenant_id) throw forbidden('Session does not belong to this store');
    return tenant.tenant_id;
  }
  if (req.shopper) return req.shopper.tenantId;
  throw badRequest('Store is required');
}

// ---------------------------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------------------------

export async function getCart(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const { data: cart, error } = await db
    .from('carts')
    .select('cart_id, cart_items(cart_item_id, product_id, variant_id, quantity)')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (error) throw error;
  res.json({ items: cart?.cart_items ?? [] });
}

export async function addCartItem(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const body = parse(
    z.object({
      product_id: z.string().uuid(),
      variant_id: optionalUuid,
      quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE),
    }),
    req.body,
  );

  const { item, created } = await addToCart(tenantId, customerId, {
    productId: body.product_id,
    variantId: body.variant_id,
    quantity: body.quantity,
  });
  res.status(created ? 201 : 200).json({ item });
}

export async function removeCartItem(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const itemId = uuid(str(req.query.item_id), 'item id');

  const { data: cart } = await db.from('carts').select('cart_id').eq('tenant_id', tenantId).eq('customer_id', customerId).maybeSingle();
  if (!cart) throw notFound('Cart not found');

  const { data: removed, error } = await db
    .from('cart_items')
    .delete()
    .eq('cart_item_id', itemId)
    .eq('cart_id', cart.cart_id)
    .select('cart_item_id');
  if (error) throw error;
  if (!removed?.length) throw notFound('Item not found in your cart');

  res.json({ success: true });
}

// ---------------------------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------------------------

export async function getWishlist(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const { data, error } = await db
    .from('wishlists')
    .select('wishlist_id, wishlist_items(wishlist_item_id, product_id)')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (error) throw error;
  res.json({ items: data?.wishlist_items ?? [] });
}

export async function addWishlistItem(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const { product_id } = parse(z.object({ product_id: z.string().uuid() }), req.body);
  await assertActiveProduct(tenantId, product_id);

  let { data: wishlist } = await db.from('wishlists').select('wishlist_id').eq('tenant_id', tenantId).eq('customer_id', customerId).maybeSingle();
  if (!wishlist) {
    const { data: created, error } = await db.from('wishlists').insert({ tenant_id: tenantId, customer_id: customerId }).select('wishlist_id').single();
    if (error) throw error;
    wishlist = created;
  }

  const { error } = await db.from('wishlist_items').insert({ wishlist_id: wishlist!.wishlist_id, product_id });
  if (error && error.code !== '23505') throw error; // already on the wishlist

  res.status(201).json({ success: true });
}

export async function removeWishlistItem(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const productId = uuid(str(req.query.product_id), 'product id');

  const { data: wishlist } = await db.from('wishlists').select('wishlist_id').eq('tenant_id', tenantId).eq('customer_id', customerId).maybeSingle();
  if (wishlist) await db.from('wishlist_items').delete().eq('wishlist_id', wishlist.wishlist_id).eq('product_id', productId);

  res.json({ success: true });
}

// ---------------------------------------------------------------------------------------------
// Addresses / profile
// ---------------------------------------------------------------------------------------------

export async function listAddresses(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const { data, error } = await db
    .from('customer_addresses')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false });
  if (error) throw error;
  res.json({ addresses: data });
}

export async function addAddress(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const body = parse(
    z.object({
      address_line_1: z.string().trim().min(1).max(255),
      address_line_2: optionalText(255),
      city: z.string().trim().min(1).max(100),
      state: z.string().trim().min(1).max(100),
      postal_code: z.string().trim().min(1).max(20),
      country: z.string().trim().min(1).max(100),
      is_default: z.boolean().optional(),
    }),
    req.body,
  );

  const { count } = await db
    .from('customer_addresses')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId);
  if ((count ?? 0) >= MAX_ADDRESSES) throw badRequest('Address limit reached');

  if (body.is_default) {
    await db.from('customer_addresses').update({ is_default: false }).eq('tenant_id', tenantId).eq('customer_id', customerId);
  }

  const { data: address, error } = await db
    .from('customer_addresses')
    .insert({ ...body, address_line_2: body.address_line_2 ?? null, is_default: body.is_default ?? false, tenant_id: tenantId, customer_id: customerId })
    .select()
    .single();
  if (error) throw error;

  res.status(201).json({ address });
}

export function getProfile(req: Request, res: Response) {
  const { customer } = me(req);
  res.json({
    first_name: customer.first_name,
    last_name: customer.last_name,
    phone_number: customer.phone_number,
    email: customer.email,
  });
}

// ---------------------------------------------------------------------------------------------
// Orders & checkout (always priced server-side)
// ---------------------------------------------------------------------------------------------

export async function listOrders(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  await storeIdFor(req, str(req.query.slug)); // rejects a session that belongs to a different store

  const { data, error } = await db
    .from('orders')
    .select('*, order_items(*)')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .order('created_date', { ascending: false })
    .limit(100);
  if (error) throw error;
  res.json(data);
}

const CANCELLABLE_STATUSES = ['PENDING', 'PROCESSING'];

/** Self-service cancellation: only while the order hasn't shipped yet. Anything further along needs the merchant. */
export async function cancelOrder(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const orderId = uuid(req.params.id);

  const { data: order } = await db
    .from('orders')
    .select('order_id, status')
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (!order) throw notFound('Order not found');
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw badRequest('This order has already shipped and can no longer be cancelled. Please contact support.');
  }

  const { error } = await db.from('orders').update({ status: 'CANCELLED' }).eq('order_id', orderId).eq('tenant_id', tenantId);
  if (error) throw error;

  res.json({ message: 'Order cancelled successfully' });
}

/**
 * Self-service return request for a delivered order. RETURN_REQUESTED is a real status (see
 * migrations/011_delivery_and_coupons.sql), so this transitions the order there; the shopper's reason has no
 * dedicated column, so it's recorded as a structured line in `notes` - the same pattern already used for
 * payment method and coupon code. The merchant resolves it from the order detail page (e.g. to REFUNDED).
 */
export async function requestReturn(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const orderId = uuid(req.params.id);
  const { reason } = parse(z.object({ reason: z.string().trim().min(1, 'Please tell us why you want to return this order').max(500) }), req.body);

  const { data: order } = await db
    .from('orders')
    .select('order_id, status, notes')
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .maybeSingle();
  if (!order) throw notFound('Order not found');
  if (order.status !== 'DELIVERED') throw badRequest('Only delivered orders can be returned');

  const notes = [order.notes, `Return requested: ${reason}`].filter(Boolean).join('\n');
  const { error } = await db.from('orders').update({ status: 'RETURN_REQUESTED', notes }).eq('order_id', orderId).eq('tenant_id', tenantId);
  if (error) throw error;

  res.json({ message: 'Return request submitted successfully' });
}

const shippingSchema = z.object({
  address: z.string().trim().min(1, 'Shipping address is required').max(255),
  city: optionalText(100),
  state: optionalText(100),
  zip: optionalText(20),
  postal_code: optionalText(20),
  country: optionalText(100),
});

/** Cart lines arrive as `{ product: { id }, quantity }` from the storefront (or flat `{ id | productId }`). */
const lineSchema = z.preprocess(
  (raw: any) => ({
    productId: raw?.productId ?? raw?.product_id ?? raw?.product?.id ?? raw?.id,
    quantity: raw?.quantity,
  }),
  z.object({ productId: z.string().uuid('Invalid product'), quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE) }),
);

const paymentMethodSchema = z.enum(['cod', 'upi', 'netbanking']).optional();

export async function createOrder(req: Request, res: Response) {
  const { tenantId, customer } = me(req);
  const body = parse(
    z.object({
      slug: z.string().max(253).optional(),
      items: z.array(lineSchema).min(1, 'Your cart is empty').max(100),
      couponCode: optionalText(50),
      deliveryOptionId: optionalUuid,
      shippingDetails: shippingSchema,
      notes: optionalText(2000),
      paymentMethod: paymentMethodSchema,
    }),
    req.body,
  );
  await storeIdFor(req, body.slug);

  const shipping = body.shippingDetails;
  const order = await placeOrder({
    tenantId,
    customer,
    lines: body.items,
    couponCode: body.couponCode,
    deliveryOptionId: body.deliveryOptionId,
    shipping: {
      line1: shipping.address,
      city: shipping.city,
      state: shipping.state,
      postalCode: shipping.zip ?? shipping.postal_code,
      country: shipping.country,
    },
    notes: body.notes,
    paymentMethod: body.paymentMethod,
  });

  res.status(201).json({ success: true, order_id: order.orderId, order_number: order.orderNumber, totals: order });
}

/** Cart-based checkout using a saved address. */
export async function checkout(req: Request, res: Response) {
  const { tenantId, customerId, customer } = me(req);
  const body = parse(
    z.object({
      address_id: z.string().uuid('Address required'),
      notes: optionalText(2000),
      coupon_code: optionalText(50),
      delivery_option_id: optionalUuid,
      payment_method: paymentMethodSchema,
    }),
    req.body,
  );

  const { data: address } = await db
    .from('customer_addresses')
    .select('address_line_1, city, state, postal_code, country')
    .eq('address_id', body.address_id)
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!address) throw badRequest('Invalid address');

  const { data: cart } = await db
    .from('carts')
    .select('cart_id, cart_items(product_id, quantity)')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .maybeSingle();
  const cartItems: Array<{ product_id: string; quantity: number }> = cart?.cart_items ?? [];
  if (!cart || cartItems.length === 0) throw badRequest('Cart is empty');

  const order = await placeOrder({
    tenantId,
    customer,
    lines: cartItems.map((i) => ({ productId: i.product_id, quantity: i.quantity })),
    couponCode: body.coupon_code,
    deliveryOptionId: body.delivery_option_id,
    shipping: {
      line1: address.address_line_1,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
    },
    notes: body.notes,
    paymentMethod: body.payment_method,
  });

  await db.from('cart_items').delete().eq('cart_id', cart.cart_id);
  res.status(201).json({ success: true, order_id: order.orderId, order_number: order.orderNumber, totals: order });
}

// ---------------------------------------------------------------------------------------------
// Reviews (written from the order-detail page - requires having bought & received the item)
// ---------------------------------------------------------------------------------------------

export const reviewFields = {
  rating: z.coerce.number().int().min(1).max(5),
  title: optionalText(255),
  comment: optionalText(5000),
};

export async function createOrderReview(req: Request, res: Response) {
  const { tenantId, customerId } = me(req);
  const body = parse(z.object({ product_id: z.string().uuid(), order_item_id: z.string().uuid(), ...reviewFields }), req.body);

  const { data: item } = await db
    .from('order_items')
    .select('order_item_id, product_name, orders!inner(customer_id, fulfillment_status, tenant_id)')
    .eq('order_item_id', body.order_item_id)
    .eq('orders.customer_id', customerId)
    .eq('orders.tenant_id', tenantId)
    .maybeSingle();
  if (!item) throw forbidden('Order item not found or unauthorized');

  const order: any = Array.isArray(item.orders) ? item.orders[0] : item.orders;
  if (order.fulfillment_status !== 'FULFILLED') throw forbidden('You can only review products that have been delivered.');

  // Order items only store the product name, so make sure the review targets the product that was bought.
  const { data: product } = await db
    .from('products')
    .select('product_name')
    .eq('product_id', body.product_id)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!product || product.product_name.trim().toLowerCase() !== String(item.product_name).trim().toLowerCase()) {
    throw forbidden('This order item does not match the reviewed product.');
  }

  const { data: review, error } = await db
    .from('reviews')
    .insert({
      tenant_id: tenantId,
      product_id: body.product_id,
      customer_id: customerId,
      order_item_id: body.order_item_id,
      rating: body.rating,
      title: body.title ?? null,
      comment: body.comment ?? null,
      status: 'PENDING',
    })
    .select('review_id, rating, title, comment, status')
    .single();

  if (error) {
    if (error.code === '23505') throw new ApiError(409, 'You have already reviewed this item.');
    throw error;
  }
  res.status(201).json({ success: true, review });
}

// ---------------------------------------------------------------------------------------------
// Coupons & delivery options (readable without logging in)
// ---------------------------------------------------------------------------------------------

export async function validateCoupon(req: Request, res: Response) {
  const body = parse(z.object({ code: z.string().trim().min(1, 'Code is required').max(50), slug: z.string().max(253).optional() }), req.body);
  const tenantId = await storeIdFor(req, body.slug);

  const result = await evaluateCoupon(tenantId, body.code, 0);
  if (!result.ok) throw result.error;

  res.json({ success: true, discount_type: result.coupon.discount_type, discount_amount: result.coupon.discount_amount });
}

export async function listPublicCoupons(req: Request, res: Response) {
  const tenantId = await storeIdFor(req, str(req.query.slug));
  const { data, error } = await db
    .from('coupons')
    .select('code, discount_type, discount_amount, expiry_date, max_uses, times_used')
    .eq('tenant_id', tenantId)
    .eq('is_public', true)
    .eq('is_active', true);
  if (error) throw error;

  const now = new Date();
  res.json(
    (data ?? [])
      .filter((c) => (!c.expiry_date || new Date(c.expiry_date) > now) && (c.max_uses === null || c.times_used < c.max_uses))
      .map(({ code, discount_type, discount_amount, expiry_date }) => ({ code, discount_type, discount_amount, expiry_date })),
  );
}

export async function listDeliveryOptions(req: Request, res: Response) {
  const tenantId = await storeIdFor(req, str(req.query.slug));
  const { data, error } = await db
    .from('delivery_options')
    .select('delivery_option_id, name, price, estimated_days')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('price', { ascending: true });
  if (error) throw error;
  res.json(data ?? []);
}
