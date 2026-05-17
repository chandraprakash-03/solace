import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getSessionCookieName } from './lib/auth';

const COOKIE_NAME = getSessionCookieName();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const verified = token ? await verifyJWT(token) : null;

  // 1. Route Protection: Redirect unauthenticated users trying to access dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!verified) {
      const loginUrl = new URL('/', request.url);
      // Delete cookie to prevent corrupt sessions
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
    return NextResponse.next();
  }

  // 2. Session Recovery: Automatically redirect logged-in users away from landing/auth screens to the workspace
  if (pathname === '/') {
    if (verified) {
      const dashboardUrl = new URL('/dashboard/chat', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

// Configure paths that will trigger this middleware
export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
