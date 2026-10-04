import type { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../lib/supabase.js';
import { badRequest, parse } from '../lib/http.js';
import { isValidStoreSlug, sanitizeCustomization } from '../lib/sanitize.js';
import { setSessionTenant } from '../lib/session.js';
import { assertTenantOwner, tenantCtx } from '../middleware/auth.js';
import { invalidateTenantCache } from '../services/tenants.js';
import { assertCustomizationSize, assertStoreQuota, brandNameSchema, templateSchema } from './tenant.controller.js';

// ---------------------------------------------------------------------------------------------
// Dashboard "create another store"
// ---------------------------------------------------------------------------------------------

export async function create(req: Request, res: Response) {
  const session = req.merchant!;
  const { name, slug, template, customizationData } = parse(
    z.object({
      name: brandNameSchema,
      slug: z.string().trim().toLowerCase(),
      template: templateSchema,
      customizationData: z.record(z.string(), z.unknown()).optional(),
    }),
    req.body,
  );

  if (!isValidStoreSlug(slug)) {
    throw badRequest('Subdomain must be 3-50 characters (letters, numbers, hyphens) and cannot be a reserved name.');
  }
  if (customizationData) assertCustomizationSize(customizationData);
  await assertStoreQuota(session.userId);

  const { data: existing } = await db.from('tenant').select('tenant_id').eq('code', slug).maybeSingle();
  if (existing) throw badRequest('Subdomain is already taken.');

  const customization = sanitizeCustomization(customizationData ?? { brandName: name });

  const { data: tenant, error: tenantError } = await db
    .from('tenant')
    .insert({ tenant_name: name, code: slug, description: `Store for ${name}`, created_by: session.userId })
    .select('tenant_id')
    .single();
  if (tenantError?.code === '23505') throw badRequest('Subdomain is already taken.');
  if (tenantError || !tenant) throw tenantError;

  try {
    const { error: settingsError } = await db.from('tenant_settings').upsert(
      {
        tenant_id: tenant.tenant_id,
        setting_key: 'customization',
        setting_value: JSON.stringify({ templateId: template, formData: customization }),
      },
      { onConflict: 'tenant_id,setting_key' },
    );
    if (settingsError) throw settingsError;

    const { error: catalogError } = await db.from('catalogs').insert({
      tenant_id: tenant.tenant_id,
      catalog_name: 'Default Catalog',
      slug: 'default-catalog',
      description: 'Primary product catalog',
      is_active: true,
    });
    if (catalogError) throw catalogError;

    const { error: categoryError } = await db.from('categories').insert({
      tenant_id: tenant.tenant_id,
      category_name: 'All Products',
      slug: 'all-products',
      is_active: true,
    });
    if (categoryError) throw categoryError;
  } catch (error) {
    await db.from('tenant').delete().eq('tenant_id', tenant.tenant_id);
    throw error;
  }

  await setSessionTenant(res, session, tenant.tenant_id);
  res.json({ success: true, storeSlug: slug, tenantId: tenant.tenant_id });
}

export async function remove(req: Request, res: Response) {
  const { tenantId, userId } = tenantCtx(req);
  await assertTenantOwner(tenantId, userId);

  const { data: tenant } = await db.from('tenant').select('code, custom_domain').eq('tenant_id', tenantId).maybeSingle();

  // Unlink users first so ON DELETE CASCADE on users.tenant_id doesn't delete the accounts themselves.
  await db.from('users').update({ tenant_id: null }).eq('tenant_id', tenantId);

  const { error } = await db.from('tenant').delete().eq('tenant_id', tenantId);
  if (error) throw error;

  await invalidateTenantCache(tenantId, { keys: [tenant?.code, tenant?.custom_domain] });
  await setSessionTenant(res, req.merchant!, null);
  res.json({ success: true });
}
