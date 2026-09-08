import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getAdminClient();

    const { data: existingSub } = await db.from('subscriptions').select('subscription_id').eq('user_id', session.userId).maybeSingle();

    let error;
    if (existingSub) {
      const res = await db.from('subscriptions').update({
        status: 'active',
        plan_id: 'pro',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }).eq('subscription_id', existingSub.subscription_id);
      error = res.error;
    } else {
      const res = await db.from('subscriptions').insert({
        user_id: session.userId,
        status: 'active',
        plan_id: 'pro',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });
      error = res.error;
    }

    if (error) {
      console.error('Failed to mock subscribe:', error);
      return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sessionId: 'mock_' + Math.random().toString(36).substr(2, 9) });
  } catch (error) {
    console.error('Mock subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
