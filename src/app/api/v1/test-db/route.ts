import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('tenant').select('*');
  return NextResponse.json({ data, error });
}
