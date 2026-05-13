// Tüm sayfa ve API route'ları next-auth ile korur.
// Sayfa için → /login redirect.
// API için → 401 JSON (client fetch'i HTML response yerine doğru hata alır).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token) return NextResponse.next();

  // API route → 401 JSON
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } },
      { status: 401 }
    );
  }

  // Sayfa → /login redirect, callbackUrl ile geri dönüş
  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.svg|.*\\.png|.*\\.jpg).*)'],
};
