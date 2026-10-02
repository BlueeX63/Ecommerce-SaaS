import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqkumcyjwahsngyqzrux.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxa3VtY3lqd2Foc25neXF6cnV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM5MTU1MywiZXhwIjoyMTAwOTY3NTUzfQ.Wyov6YTjbRuvEkaYxj6qmDaY8FV96D_x3E_9P-7b2jA';

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const tenantCode = 'essentials--far0';

async function seed() {
  console.log(`Finding tenant with code: ${tenantCode}...`);
  const { data: tenant, error: tError } = await db.from('tenant').select('tenant_id').eq('code', tenantCode).single();
  
  if (tError || !tenant) {
    console.error("Tenant not found:", tError);
    return;
  }
  
  const tenantId = tenant.tenant_id;
  console.log(`Found tenant: ${tenantId}`);

  const products = [
    {
      tenant_id: tenantId,
      product_name: "Premium Wireless Headphones",
      slug: "premium-wireless-headphones-" + crypto.randomBytes(4).toString('hex'),
      sku: "WH-1000-" + crypto.randomBytes(2).toString('hex'),
      description: "Experience premium sound quality with active noise cancellation and 30 hours of battery life.",
      base_price: 299.99,
      compare_at_price: 349.99,
      status: "ACTIVE"
    },
    {
      tenant_id: tenantId,
      product_name: "Ergonomic Office Chair",
      slug: "ergonomic-office-chair-" + crypto.randomBytes(4).toString('hex'),
      sku: "OC-ERG-" + crypto.randomBytes(2).toString('hex'),
      description: "Fully adjustable ergonomic office chair with lumbar support and breathable mesh back.",
      base_price: 199.50,
      status: "ACTIVE"
    },
    {
      tenant_id: tenantId,
      product_name: "Minimalist Desk Lamp",
      slug: "minimalist-desk-lamp-" + crypto.randomBytes(4).toString('hex'),
      sku: "DL-MIN-" + crypto.randomBytes(2).toString('hex'),
      description: "LED desk lamp with adjustable brightness and color temperature. Features wireless charging pad.",
      base_price: 45.00,
      compare_at_price: 60.00,
      status: "ACTIVE"
    },
    {
      tenant_id: tenantId,
      product_name: "Mechanical Keycap Set",
      slug: "mechanical-keycap-set-" + crypto.randomBytes(4).toString('hex'),
      sku: "MK-KC-" + crypto.randomBytes(2).toString('hex'),
      description: "PBT double-shot keycaps in a retro colorway. Compatible with Cherry MX switches.",
      base_price: 35.99,
      status: "ACTIVE"
    },
    {
      tenant_id: tenantId,
      product_name: "Smart Water Bottle",
      slug: "smart-water-bottle-" + crypto.randomBytes(4).toString('hex'),
      sku: "WB-SMT-" + crypto.randomBytes(2).toString('hex'),
      description: "Tracks your daily water intake and glows to remind you to stay hydrated. Stainless steel.",
      base_price: 55.00,
      status: "ACTIVE"
    }
  ];

  console.log("Inserting products...");
  const { data: inserted, error: pError } = await db.from('products').insert(products).select();

  if (pError) {
    console.error("Failed to insert products:", pError);
  } else {
    console.log(`Successfully added ${inserted.length} products!`);
    
    // Let's add some dummy images for them as well
    for (const p of inserted) {
      await db.from('product_images').insert({
        product_id: p.product_id,
        image_url: `https://picsum.photos/seed/${p.product_id}/800/800`,
        alt_text: p.product_name,
        is_primary: true
      });
    }
    console.log("Added dummy images for products.");
  }
}

seed();
