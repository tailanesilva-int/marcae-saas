import { NextRequest, NextResponse } from 'next/server';

const EMPRESA_COOKIE_NAME = 'marcae_empresa_token';

function limparCookieEmpresa(response: NextResponse) {
  response.cookies.set(EMPRESA_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export async function POST() {
  return limparCookieEmpresa(NextResponse.json({ success: true }));
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login?logout=1', request.url));

  return limparCookieEmpresa(response);
}
