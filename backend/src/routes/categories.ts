import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, parse } from '../lib/http.js';
import { slugify } from '../lib/sanitize.js';
import { optionalText, optionalUuid } from '../lib/validation.js';
import { requireMerchant, tenantCtx } from '../middleware/auth.js';
import { assertOwnedOrNull } from '../services/ownership.js';
import { getCustomization } from '../services/tenants.js';

export const categoriesRouter = Router();
categoriesRouter.use(requireMerchant);

categoriesRouter.get('/', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);

  const { data: categories, error } = await db
    .from('categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true });
  if (error) throw error;

  const list = categories ?? [];

  // Auto-seed categories listed in the storefront's "shopCategories" customization field.
  const customization = await getCustomization(tenantId);
  const shopCategories = typeof customization.shopCategories === 'string' ? customization.shopCategories : '';
  if (shopCategories) {
    const expected = shopCategories
      .split(',')
      .map((c: string) => c.trim().slice(0, 100))
      .filter((c: string) => c && c.toLowerCase() !== 'all')
      .slice(0, 50);

    const existingNames = new Set(list.map((c) => c.category_name.toLowerCase()));
    const existingSlugs = new Set(list.map((c) => c.slug));
    const rows = expected
      .filter((c: string) => !existingNames.has(c.toLowerCase()))
      .map((c: string, index: number) => ({
        tenant_id: tenantId,
        category_name: c,
        slug: slugify(c, 100),
        sort_order: list.length + index,
        created_by: userId,
      }))
      .filter((row: { slug: string }) => row.slug && !existingSlugs.has(row.slug));

    if (rows.length > 0) {
      const { data: inserted, error: insertError } = await db.from('categories').insert(rows).select('*');
      if (!insertError && inserted) {
        list.push(...inserted);
        list.sort((a, b) => a.sort_order - b.sort_order);
      }
    }
  }

  res.json({ data: list });
});

categoriesRouter.post('/', async (req, res) => {
  const { tenantId, userId } = tenantCtx(req);
  const body = parse(
    z.object({
      categoryName: z.string().trim().min(1, 'Name is required').max(100),
      slug: z.string().trim().min(1, 'Slug is required').max(100),
      description: optionalText(2000),
      parentCategoryId: optionalUuid,
    }),
    req.body,
  );

  const slug = slugify(body.slug, 100);
  if (!slug) throw badRequest('Slug is required');
  const parentId = await assertOwnedOrNull('categories', body.parentCategoryId, tenantId, 'parent category');

  const { data: category, error } = await db
    .from('categories')
    .insert({
      tenant_id: tenantId,
      category_name: body.categoryName,
      slug,
      description: body.description ?? null,
      parent_category_id: parentId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw badRequest('Category slug already exists');
    throw error;
  }

  res.status(201).json({ message: 'Category created successfully', data: category });
});
