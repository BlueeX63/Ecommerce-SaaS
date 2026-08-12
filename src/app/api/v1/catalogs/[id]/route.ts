import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: catalogId } = await params;
    const db = getAdminClient();
    
    // Check ownership first
    const { data: catalog, error: catalogError } = await db.from('catalogs')
      .select('catalog_id')
      .eq('catalog_id', catalogId)
      .eq('tenant_id', session.tenantId)
      .single();

    if (catalogError || !catalog) {
      return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
    }

    const { error } = await db.from('catalogs')
      .delete()
      .eq('catalog_id', catalogId);

    if (error) throw error;

    return NextResponse.json({ message: 'Catalog deleted successfully' });
  } catch (error) {
    console.error('Delete catalog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
