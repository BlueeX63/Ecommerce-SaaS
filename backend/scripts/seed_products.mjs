// Dev helper: seeds sample products for a tenant. Run from backend/ with `node scripts/seed_products.mjs <tenant-code>`.
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment (see backend/.env) - no credentials
// are read from source. Rotate the service-role key immediately if it was ever committed to git.
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run this from backend/ with a .env file present.');
  process.exit(1);
}

const tenantCode = process.argv[2];
if (!tenantCode) {
  console.error('Usage: node scripts/seed_products.mjs <tenant-code>');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log(`Finding tenant with code: ${tenantCode}...`);
  const { data: tenant, error: tError } = await db.from('tenant').select('tenant_id').eq('code', tenantCode).single();

  if (tError || !tenant) {
    console.error('Tenant not found:', tError);
    return;
  }

  const tenantId = tenant.tenant_id;
  console.log(`Found tenant: ${tenantId}`);

  const products = [
    {
      tenant_id: tenantId,
      product_name: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones-' + crypto.randomBytes(4).toString('hex'),
      sku: 'WH-1000-' + crypto.randomBytes(2).toString('hex'),
      description: 'Experience premium sound quality with active noise cancellation and 30 hours of battery life.',
      base_price: 299.99,
      status: 'ACTIVE',
    },
    {
      tenant_id: tenantId,
      product_name: 'Minimalist Leather Backpack',
      slug: 'minimalist-leather-backpack-' + crypto.randomBytes(4).toString('hex'),
      sku: 'BP-200-' + crypto.randomBytes(2).toString('hex'),
      description: 'A timeless, handcrafted leather backpack built for everyday carry.',
      base_price: 149.5,
      status: 'ACTIVE',
    },
    {
      tenant_id: tenantId,
      product_name: 'Ceramic Pour-Over Coffee Set',
      slug: 'ceramic-pour-over-coffee-set-' + crypto.randomBytes(4).toString('hex'),
      sku: 'CS-300-' + crypto.randomBytes(2).toString('hex'),
      description: 'Hand-glazed ceramic dripper and carafe for a slower, better morning.',
      base_price: 64.0,
      status: 'ACTIVE',
    },
  ];

  const { data, error } = await db.from('products').insert(products).select('product_id, product_name');
  if (error) {
    console.error('Failed to insert products:', error);
    return;
  }
  console.log(`Seeded ${data.length} products:`, data.map((p) => p.product_name).join(', '));
}

seed();
