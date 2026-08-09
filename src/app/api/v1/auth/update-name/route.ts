import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Please provide a valid full name." }, { status: 400 });
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '-';

    const db = getAdminClient();
    
    // Update the user's name
    const { error: userError } = await db
      .from('users')
      .update({ first_name: firstName, last_name: lastName })
      .eq('user_id', session.userId);
      
    if (userError) throw userError;

    // Clear the popup flag cookie
    const cookieStore = await cookies();
    cookieStore.set('needs_name_setup', '', { maxAge: 0, path: '/' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating name:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
