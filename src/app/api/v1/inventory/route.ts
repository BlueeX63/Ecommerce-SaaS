import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const warehouseId = searchParams.get('warehouseId');

    const db = await getDbClient();
    
    let query = db.from('inventory')
      .select('*, product_variants(*, products(product_name, sku)), warehouses(warehouse_name)')
      .eq('tenant_id', session.tenantId);

    if (productId) {
      // Find variants for product first
      const { data: variants } = await db.from('product_variants').select('variant_id').eq('product_id', productId);
      const variantIds = variants?.map((v: any) => v.variant_id) || [];
      if (variantIds.length > 0) {
        query = query.in('variant_id', variantIds);
      }
    }

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    const { data: inventory, error } = await query;

    if (error) throw error;
    return NextResponse.json({ data: inventory });
  } catch (error) {
    console.error('Fetch inventory error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { variantId, warehouseId, quantityChange, reason } = await req.json();
    if (!variantId || !warehouseId || quantityChange === undefined) {
      return NextResponse.json({ error: 'variantId, warehouseId, and quantityChange are required' }, { status: 400 });
    }

    const db = await getDbClient();
    
    // In Supabase REST API without RPC, we have to do this in two steps or use an RPC function.
    // For simplicity, we check current inventory, update it, and log transaction.
    // In production, we'd use a Postgres stored procedure to ensure ACID compliance!
    
    // 1. Check if inventory record exists
    let { data: inv } = await db.from('inventory')
      .select('*')
      .eq('variant_id', variantId)
      .eq('warehouse_id', warehouseId)
      .eq('tenant_id', session.tenantId)
      .single();

    if (!inv) {
      // Create it
      const { data: newInv, error: insertError } = await db.from('inventory')
        .insert({
          tenant_id: session.tenantId,
          variant_id: variantId,
          warehouse_id: warehouseId,
          quantity_available: quantityChange
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      inv = newInv;
    } else {
      // Update it
      const { data: updatedInv, error: updateError } = await db.from('inventory')
        .update({ quantity_available: inv.quantity_available + quantityChange, last_updated: new Date().toISOString() })
        .eq('inventory_id', inv.inventory_id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      inv = updatedInv;
    }

    // 2. Log transaction
    await db.from('inventory_transactions').insert({
      tenant_id: session.tenantId,
      inventory_id: inv.inventory_id,
      transaction_type: 'MANUAL_ADJUSTMENT',
      quantity_change: quantityChange,
      notes: reason || 'Manual adjustment via API',
      created_by: session.userId
    });

    return NextResponse.json({ message: 'Inventory adjusted successfully', data: inv }, { status: 201 });
  } catch (error) {
    console.error('Adjust inventory error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
