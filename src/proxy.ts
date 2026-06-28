import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'better-auth.session_token';

interface MockSession {
  expiresAt: string;
  role: 'user' | 'admin';
}

// Simple edge-compatible base64 session parser
function parseMockSession(token: string): MockSession | null {
  try {
    const decoded = atob(token);
    const parsed = JSON.parse(decoded) as MockSession;
    return parsed;
  } catch (e) {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define route groups
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAdminRoute = pathname.startsWith('/admin');

  if (!isDashboardRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Retrieve auth session token cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    console.log(`[Proxy] No session cookie. Redirecting ${pathname} to /login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Attempt to parse as mock session first (resiliency fallback)
  const mockSession = parseMockSession(sessionCookie.value);

  if (mockSession) {
    // 1. Mock Session Validation
    const isExpired = new Date(mockSession.expiresAt) < new Date();
    if (isExpired) {
      console.log('[Proxy] Mock session expired. Redirecting to /login');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    if (isAdminRoute && mockSession.role !== 'admin') {
      console.warn(`[Proxy] Access Denied: User role "${mockSession.role}" tried to access admin route ${pathname}`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // 2. Real Session Validation (Fetch verification route)
  try {
    const sessionResponse = await fetch(new URL('/api/auth/get-session', request.url), {
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=${sessionCookie.value}`,
      },
    });

    if (!sessionResponse.ok) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const sessionData = await sessionResponse.json();

    if (!sessionData || !sessionData.user) {
      console.log('[Proxy] Invalid real session. Redirecting to /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role check
    if (isAdminRoute && sessionData.user.role !== 'admin') {
      console.warn(`[Proxy] Access Denied: Real user role "${sessionData.user.role}" tried to access admin route ${pathname}`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (err: any) {
    console.error('[Proxy] Session fetch error:', err.message);
    // If API fetch fails during startup/network blips, we allow transition to protect against crashes,
    // but redirect to login if the session is entirely unresolvable.
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Config to specify matching routes
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
