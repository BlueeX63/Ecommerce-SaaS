import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

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

  // 2. Handle SaaS Authentication for non-store routes
  const isDashboardRoute = url.pathname.startsWith('/dashboard');
  const isApiRoute = url.pathname.startsWith('/api/v1') && !url.pathname.startsWith('/api/v1/auth') && !url.pathname.startsWith('/api/v1/store');

  if (isDashboardRoute || isApiRoute) {
    const session = await getSession();
    
    if (!session) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }

  return NextResponse.next();
}
