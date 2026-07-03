import { NextRequest, NextResponse } from 'next/server';

const EMPRESA_COOKIE_NAME = 'marcae_empresa_token';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(EMPRESA_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));

  response.cookies.set(EMPRESA_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}