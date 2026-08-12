import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
if (!jwtSecret) {
  throw new Error('FATAL: JWT_SECRET or SUPABASE_JWT_SECRET must be set for store auth.');
}
const JWT_SECRET = new TextEncoder().encode(jwtSecret);

export async function getStoreSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('store_session')?.value;

  if (!token) return null;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as {
      customerId: string;
      tenantId: string;
      slug: string;
      role: string;
      sub: string;
    };
  } catch (err) {
    return null;
  }
}

export async function withStoreAuth(
  req: Request,
  handler: (req: Request, session: any) => Promise<NextResponse>
) {
  const session = await getStoreSession();
  if (!session || !session.customerId || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return handler(req, session);
}
