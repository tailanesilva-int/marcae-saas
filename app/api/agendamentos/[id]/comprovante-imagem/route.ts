import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteProps
) {
  const { id } = await params;

  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/comprovante?id=${id}`;

  const response = await fetch(imageUrl);

  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  });
}