import { db } from '../lib/supabase.js';
import { badRequest, notFound } from '../lib/http.js';

export const MAX_QTY_PER_LINE = 99;

export async function assertActiveProduct(tenantId: string, productId: string) {
  const { data } = await db
    .from('products')
    .select('product_id')
    .eq('product_id', productId)
    .eq('tenant_id', tenantId)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (!data) throw notFound('Product not found');
}

export interface AddToCartInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

/**
 * The single add-to-cart path, shared by the storefront UI and the store assistant (text and voice), so every
 * entry point enforces the same rules: active product in this store, variant belongs to that product, quantity
 * capped per line.
 */
export async function addToCart(tenantId: string, customerId: string, input: AddToCartInput) {
  await assertActiveProduct(tenantId, input.productId);
  if (input.variantId) {
    const { data: variant } = await db
      .from('product_variants')
      .select('variant_id')
      .eq('variant_id', input.variantId)
      .eq('product_id', input.productId)
      .maybeSingle();
    if (!variant) throw badRequest('Invalid variant');
  }

  let { data: cart } = await db.from('carts').select('cart_id').eq('tenant_id', tenantId).eq('customer_id', customerId).maybeSingle();
  if (!cart) {
    const { data: created, error } = await db
      .from('carts')
      .insert({ tenant_id: tenantId, customer_id: customerId })
      .select('cart_id')
      .single();
    if (error) throw error;
    cart = created;
  }

  let existingQuery = db.from('cart_items').select('cart_item_id, quantity').eq('cart_id', cart!.cart_id).eq('product_id', input.productId);
  existingQuery = input.variantId ? existingQuery.eq('variant_id', input.variantId) : existingQuery.is('variant_id', null);
  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    const { data: updated, error } = await db
      .from('cart_items')
      .update({ quantity: Math.min(MAX_QTY_PER_LINE, existing.quantity + input.quantity) })
      .eq('cart_item_id', existing.cart_item_id)
      .select()
      .single();
    if (error) throw error;
    return { item: updated, created: false };
  }

  const { data: inserted, error } = await db
    .from('cart_items')
    .insert({ cart_id: cart!.cart_id, product_id: input.productId, variant_id: input.variantId ?? null, quantity: input.quantity })
    .select()
    .single();
  if (error) throw error;
  return { item: inserted, created: true };
}
