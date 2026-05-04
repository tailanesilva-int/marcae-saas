import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const empresaId = searchParams.get('empresaId');
  const cpf = searchParams.get('cpf')?.replace(/\D/g, '');

  if (!empresaId || !cpf) {
    return NextResponse.json(
      { error: 'empresaId e cpf são obrigatórios.' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('Cliente')
      .select('id, nome, whatsapp, cpf, dataNascimento')
      .eq('empresaId', empresaId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const clienteEncontrado = data?.find((cliente) => {
      const cpfBanco = String(cliente.cpf || '').replace(/\D/g, '');
      return cpfBanco === cpf;
    });

    if (!clienteEncontrado) {
      return NextResponse.json({
        found: false,
        cliente: null,
      });
    }

    return NextResponse.json({
      found: true,
      cliente: clienteEncontrado,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar cliente.' },
      { status: 500 }
    );
  }
}