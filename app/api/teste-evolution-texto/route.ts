import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE;

    const response = await fetch(
      `${evolutionUrl}/message/sendText/${instance}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey || '',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          number: '557598979495',
          text: 'Teste envio texto Marcaê 🚀',
        }),
      }
    );

    const data = await response.text();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erro interno',
      },
      {
        status: 500,
      }
    );
  }
}