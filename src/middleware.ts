import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

/**
 * Routes that do NOT require authentication.
 * Everything else is protected by default (default-deny).
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/pricing',
  '/privacy',
  '/terms',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/session',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/logout',
  '/api/v1/store/',       // All store-facing APIs (storefront is public/has its own auth)
  '/api/auth/callback',   // OAuth callback
  '/api/webhooks/',       // Webhooks have their own signature verification
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Get the subdomain (e.g., brand-name.your-saas.com -> brand-name)
  // For local testing: brand-name.localhost:3000 -> brand-name
  const isLocalhost = hostname.includes('localhost');
  const baseDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (isLocalhost ? 'localhost:3000' : 'your-saas.com');
  
  let currentHost = hostname.replace(`.${baseDomain}`, '');
  // if currentHost is same as hostname or baseDomain, then it's the root domain.
  if (currentHost === hostname || currentHost === baseDomain || currentHost === 'www') {
    currentHost = ''; // Not a subdomain
  }

  // 1. If it's a subdomain, rewrite to /store/[slug]/...
  if (currentHost) {
    // Prevent rewriting if already fetching a store route directly
    if (url.pathname.startsWith(`/store`)) {
      return NextResponse.next();
    }
    
    // Rewrite to the store dynamic route
    return NextResponse.rewrite(new URL(`/store/${currentHost}${url.pathname}`, request.url));
  }

  // 2. Check if the route is public
  if (isPublicRoute(url.pathname)) {
    return NextResponse.next();
  }

  // 3. All other routes require authentication (default-deny)
  const session = await getSession();
  
  if (!session) {
    if (url.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add security headers to authenticated responses
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

