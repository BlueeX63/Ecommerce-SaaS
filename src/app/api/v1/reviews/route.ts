import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const tenantId = searchParams.get('tenantId');
    
    if (!productId || !tenantId) {
      return NextResponse.json({ error: 'Product ID and Tenant ID are required' }, { status: 400 });
    }

    const db = await getDbClient();
    
    // Fetch approved reviews for this product
    const { data: reviews, error } = await db.from('reviews')
      .select('*, customers(first_name, last_name)')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .eq('status', 'APPROVED')
      .order('created_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: reviews });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, tenantId, rating, title, comment, customerId } = body;
    
    if (!productId || !tenantId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDbClient();
    
    const { data: review, error } = await db.from('reviews')
      .insert({
        tenant_id: tenantId,
        product_id: productId,
        customer_id: customerId || null,
        rating,
        title,
        comment,
        status: 'PENDING' // Requires admin approval
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Review submitted successfully', data: review }, { status: 201 });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
