import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase/admin';

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Cannot sign or verify session tokens.');
}
const encodedKey = new TextEncoder().encode(SECRET_KEY);

type SessionPayload = {
  sessionId: string;
  userId: string;
  tenantId: string;
  role: string;
  expiresAt: string;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string, tenantId: string, role: string = 'USER', ipAddress?: string | null, userAgent?: string | null) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const db = getAdminClient();
  const { data: dbSession, error } = await db.from('user_sessions').insert({
    user_id: userId,
    ip_address: ipAddress,
    user_agent: userAgent,
    is_active: true
  }).select('session_id').single();

  if (error || !dbSession) {
    console.error('Database session creation error:', error);
    throw new Error(`Failed to create session in database: ${error?.message || 'Unknown error'}`);
  }

  const session = await encrypt({ 
    sessionId: dbSession.session_id,
    userId, 
    tenantId, 
    role, 
    expiresAt: expiresAt.toISOString() 
  });
  
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function updateSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const newSession = await encrypt({
    ...payload,
    expiresAt: expiresAt.toISOString(),
  });

  cookieStore.set('session', newSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
  
  return payload;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (sessionCookie) {
    const payload = await decrypt(sessionCookie);
    if (payload && payload.sessionId) {
      const db = getAdminClient();
      await db.from('user_sessions')
        .update({ is_active: false, logout_time: new Date().toISOString() })
        .eq('session_id', payload.sessionId);
    }
  }
  
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  const payload = await decrypt(session);
  if (!payload || !payload.sessionId) return null;
  
  const db = getAdminClient();
  const { data: dbSession } = await db.from('user_sessions')
    .select('is_active')
    .eq('session_id', payload.sessionId)
    .single();

  if (!dbSession || !dbSession.is_active) {
    return null;
  }
  
  return payload;
}

export async function createToken(payload: Record<string, any>, expiresIn: string = '1h') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodedKey);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}
