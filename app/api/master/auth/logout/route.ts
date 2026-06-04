import { NextResponse } from 'next/server';

const MASTER_COOKIE_NAME = 'marcae_master_token';

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(MASTER_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL('/master/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));

  response.cookies.set(MASTER_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
