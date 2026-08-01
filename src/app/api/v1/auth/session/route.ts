import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ isLoggedIn: false }, { status: 401 });
  }

  return NextResponse.json({ 
    isLoggedIn: true,
    user: {
      userId: session.userId,
      tenantId: session.tenantId,
      role: session.role
    }
  }, { status: 200 });
}
