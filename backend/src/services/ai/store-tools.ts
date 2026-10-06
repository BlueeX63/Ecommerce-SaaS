import { z } from 'zod';
import { db } from '../../lib/supabase.js';
import { ApiError, escapeLike } from '../../lib/http.js';
import { addToCart } from '../cart.js';

/**
 * The complete set of actions the store assistant (text chat and voice agent) may take. The model never gets
 * database access or a generic query tool: every action is one of these, each with a strict input schema,
 * each scoped to the store the shopper is browsing, and each returning only shopper-safe fields (no cost
 * prices, no exact stock counts, no internal ids beyond product/variant ids).
 */
export interface StoreToolContext {
  tenantId: string;
  /** Set only when the shopper is logged in to this same store. */
  customerId: string | null;
}

interface StoreTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(ctx: StoreToolContext, rawInput: unknown): Promise<unknown>;
}

const uuid = z.string().uuid();

function defineTool<S extends z.ZodType>(def: {
  name: string;
  description: string;
  schema: S;
  run: (ctx: StoreToolContext, input: z.output<S>) => Promise<unknown>;
}): StoreTool {
  const json = z.toJSONSchema(def.schema) as Record<string, unknown>;
  delete json.$schema;
  return {
    name: def.name,
    description: def.description,
    inputSchema: json,
    async execute(ctx, rawInput) {
      const parsed = def.schema.safeParse(rawInput ?? {});
      if (!parsed.success) return { error: 'INVALID_ARGUMENTS', message: 'The request was missing or had invalid details.' };
      try {
        return await def.run(ctx, parsed.data);
      } catch (error) {
        if (error instanceof ApiError) return { error: 'REQUEST_FAILED', message: error.message };
        console.error(`[ai:tool:${def.name}] failed`, (error as Error)?.name);
        return { error: 'TOOL_FAILED', message: 'Something went wrong. Please try again.' };
      }
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Product lookup
// ---------------------------------------------------------------------------------------------

interface ProductDetail {
  product_id: string;
  product_name: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  has_variants: boolean;
  options: { name: string; values: string[] }[];
  variants: { variant_id: string; label: string; price: number; compare_at_price: number | null; in_stock: boolean }[];
}

async function loadProductDetail(tenantId: string, productId: string): Promise<ProductDetail | null> {
  const { data: product, error } = await db
    .from('products')
    .select('product_id, product_name, description, base_price, compare_at_price, has_variants')
    .eq('product_id', productId)
    .eq('tenant_id', tenantId)
    .eq('status', 'ACTIVE')
    .maybeSingle();
  if (error) throw error;
  if (!product) return null;

  const [{ data: options }, { data: variants }] = await Promise.all([
    db
      .from('product_options')
      .select('option_id, option_name, sort_order, product_option_values(value_id, value_name, sort_order)')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true }),
    db
      .from('product_variants')
      .select('variant_id, price, compare_at_price, inventory_quantity')
      .eq('product_id', productId),
  ]);

  const variantIds = (variants ?? []).map((v) => v.variant_id);
  const { data: links } = variantIds.length
    ? await db.from('variant_options').select('variant_id, option_id, value_id').in('variant_id', variantIds)
    : { data: [] as { variant_id: string; option_id: string; value_id: string }[] };

  // Resolve every option / value id to its display name once, so each variant label is a cheap lookup.
  const optionNames = new Map<string, string>();
  const valueNames = new Map<string, string>();
  for (const option of options ?? []) {
    optionNames.set(option.option_id, option.option_name);
    for (const value of option.product_option_values ?? []) valueNames.set(value.value_id, value.value_name);
  }

  const labelsByVariant = new Map<string, string[]>();
  for (const link of links ?? []) {
    const option = optionNames.get(link.option_id);
    const value = valueNames.get(link.value_id);
    if (!option || !value) continue;
    const list = labelsByVariant.get(link.variant_id) ?? [];
    list.push(`${option}: ${value}`);
    labelsByVariant.set(link.variant_id, list);
  }

  return {
    product_id: product.product_id,
    product_name: product.product_name,
    description: product.description ? String(product.description).slice(0, 600) : null,
    base_price: Number(product.base_price),
    compare_at_price: product.compare_at_price === null ? null : Number(product.compare_at_price),
    has_variants: !!product.has_variants,
    options: (options ?? []).map((option) => ({
      name: option.option_name,
      values: (option.product_option_values ?? [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((value) => value.value_name),
    })),
    variants: (variants ?? []).map((variant) => ({
      variant_id: variant.variant_id,
      label: (labelsByVariant.get(variant.variant_id) ?? []).join(', ') || 'Standard',
      price: variant.price === null ? Number(product.base_price) : Number(variant.price),
      compare_at_price: variant.compare_at_price === null ? null : Number(variant.compare_at_price),
      // null means stock is not tracked for this variant, which is treated as available.
      in_stock: variant.inventory_quantity === null || variant.inventory_quantity > 0,
    })),
  };
}

const searchProducts = defineTool({
  name: 'search_products',
  description: 'Search this store\'s active products by name. Returns up to 8 matches with prices.',
  schema: z.object({ query: z.string().trim().min(1).max(100) }),
  async run({ tenantId }, { query }) {
    const { data, error } = await db
      .from('products')
      .select('product_id, product_name, base_price, has_variants, categories(category_name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'ACTIVE')
      .ilike('product_name', `%${escapeLike(query)}%`)
      .order('created_date', { ascending: false })
      .limit(8);
    if (error) throw error;

    return {
      products: (data ?? []).map((p) => ({
        product_id: p.product_id,
        name: p.product_name,
        category: (p.categories as { category_name?: string } | null)?.category_name ?? null,
        price: Number(p.base_price),
        has_variants: !!p.has_variants,
      })),
    };
  },
});

const getProduct = defineTool({
  name: 'get_product',
  description:
    'Get full details of one product: description, price, its options (such as size or colour) and every variant with price and availability. Call this before adding a product that has variants.',
  schema: z.object({ product_id: uuid }),
  async run({ tenantId }, { product_id }) {
    const product = await loadProductDetail(tenantId, product_id);
    if (!product) return { error: 'PRODUCT_NOT_FOUND', message: 'That product is not available in this store.' };
    return { product };
  },
});

// ---------------------------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------------------------

const addToCartTool = defineTool({
  name: 'add_to_cart',
  description:
    'Add a product to the shopper\'s cart. For products with variants, variant_id is required: ask the shopper which option they want first (use get_product). Only call this once the shopper has clearly chosen.',
  schema: z.object({
    product_id: uuid,
    variant_id: uuid.optional(),
    quantity: z.number().int().min(1).max(10).default(1),
  }),
  async run({ tenantId, customerId }, input) {
    if (!customerId) {
      return { error: 'LOGIN_REQUIRED', message: 'The shopper must sign in to this store before items can be added to the cart.' };
    }

    const product = await loadProductDetail(tenantId, input.product_id);
    if (!product) return { error: 'PRODUCT_NOT_FOUND', message: 'That product is not available in this store.' };

    let variantId: string | null = null;
    let variantLabel: string | null = null;
    if (product.has_variants) {
      if (!input.variant_id) {
        return {
          error: 'VARIANT_REQUIRED',
          message: 'Ask the shopper to choose an option before adding this product.',
          options: product.options,
        };
      }
      const variant = product.variants.find((v) => v.variant_id === input.variant_id);
      if (!variant) return { error: 'VARIANT_NOT_FOUND', message: 'That option is not available for this product.' };
      if (!variant.in_stock) return { error: 'OUT_OF_STOCK', message: `${variant.label} is currently out of stock.` };
      variantId = variant.variant_id;
      variantLabel = variant.label;
    } else if (input.variant_id) {
      return { error: 'VARIANT_NOT_APPLICABLE', message: 'This product does not have options to choose from.' };
    }

    const { item } = await addToCart(tenantId, customerId, { productId: product.product_id, variantId, quantity: input.quantity });
    return {
      added: true,
      product_name: product.product_name,
      variant: variantLabel,
      quantity_added: input.quantity,
      quantity_in_cart: item.quantity,
    };
  },
});

const getCart = defineTool({
  name: 'get_cart',
  description: 'List what is currently in the shopper\'s cart.',
  schema: z.object({}),
  async run({ tenantId, customerId }) {
    if (!customerId) return { error: 'LOGIN_REQUIRED', message: 'The shopper must sign in to this store to see their cart.' };

    const { data: cart, error } = await db
      .from('carts')
      .select('cart_id')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (error) throw error;
    if (!cart) return { items: [] };

    const { data: lines, error: linesError } = await db
      .from('cart_items')
      .select('product_id, quantity')
      .eq('cart_id', cart.cart_id);
    if (linesError) throw linesError;
    if (!lines?.length) return { items: [] };

    const { data: products, error: productsError } = await db
      .from('products')
      .select('product_id, product_name')
      .in('product_id', lines.map((l) => l.product_id));
    if (productsError) throw productsError;

    const names = new Map((products ?? []).map((p) => [p.product_id, p.product_name]));
    return {
      items: lines.map((line) => ({ product_name: names.get(line.product_id) ?? 'Product', quantity: line.quantity })),
    };
  },
});

// ---------------------------------------------------------------------------------------------
// Registry + provider adapters
// ---------------------------------------------------------------------------------------------

const TOOLS: StoreTool[] = [searchProducts, getProduct, addToCartTool, getCart];
const TOOLS_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

export function runStoreTool(ctx: StoreToolContext, name: string, rawInput: unknown): Promise<unknown> {
  const tool = TOOLS_BY_NAME.get(name);
  if (!tool) return Promise.resolve({ error: 'UNKNOWN_TOOL', message: 'That action is not available.' });
  return tool.execute(ctx, rawInput);
}

/** Tool definitions in the shape the Anthropic Messages API expects. */
export function anthropicToolDefinitions() {
  return TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema as { type: 'object'; properties?: Record<string, unknown> } }));
}

/** Tool definitions in the shape the OpenAI Realtime API expects (function tools in the session config). */
export function realtimeToolDefinitions() {
  return TOOLS.map((t) => ({ type: 'function' as const, name: t.name, description: t.description, parameters: t.inputSchema }));
}
