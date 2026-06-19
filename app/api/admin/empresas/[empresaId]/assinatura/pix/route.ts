import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function obterUrlBase() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_URL ||
    "https://www.marcaeapp.com.br"
  ).replace(/\/$/, "");
}

function normalizarValor(valor: any) {
  if (valor === null || valor === undefined || valor === "") return 0;

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  const numero = Number(
    String(valor)
      .replace("R$", "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return Number.isFinite(numero) ? numero : 0;
}

function valorMensalidadeEmpresa(empresa: any) {
  const valoresPossiveis = [
    empresa?.valorMensalPersonalizado,
    empresa?.valorPlanoPremium,
    empresa?.precoPlanoPremium,
    empresa?.valorMensalPremium,
    empresa?.valorAssinatura,
  ];

  const valorEncontrado = valoresPossiveis
    .map(normalizarValor)
    .find((valor) => valor > 0);

  return valorEncontrado || 1;
}

function emailPagadorEmpresa(empresa: any) {
  const email =
    empresa?.email ||
    empresa?.emailResponsavel ||
    empresa?.responsavelEmail ||
    empresa?.usuarioEmail ||
    "";

  if (String(email).includes("@")) {
    return String(email);
  }

  return `empresa-${empresa.id}@marcaeapp.com.br`;
}

function adicionarMinutos(data: Date, minutos: number) {
  const novaData = new Date(data);
  novaData.setMinutes(novaData.getMinutes() + minutos);
  return novaData;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const planoSelecionado = String(body.plano || "premium").toLowerCase();

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Access Token Mercado Pago do Marcaê não configurado.",
        },
        { status: 500 }
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: "Empresa não encontrada." },
        { status: 404 }
      );
    }

    const valor = valorMensalidadeEmpresa(empresa as any);
    const agora = new Date();
    const expiraEm = adicionarMinutos(agora, 30);
    const urlBase = obterUrlBase();
    const externalReference = `${empresaId}:${planoSelecionado}:pix`;
    const idempotencyKey = `marcae-assinatura-pix-${empresaId}-${Date.now()}`;

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: valor,
        description: `Assinatura ${planoSelecionado === "premium" ? "Premium" : "Básico"} - Marcaê`,
        payment_method_id: "pix",
        date_of_expiration: expiraEm.toISOString(),
        external_reference: externalReference,
        notification_url: `${urlBase}/api/webhook/mercadopago?tipo=assinatura&empresaId=${empresaId}`,
        metadata: {
          tipo: "assinatura",
          empresaId,
          plano: planoSelecionado,
          origem: "pix_mensalidade_marcae",
        },
        payer: {
          email: emailPagadorEmpresa(empresa as any),
          first_name: (empresa as any).responsavel || (empresa as any).nome || "Cliente",
        },
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Erro ao gerar Pix Mercado Pago:", data);

      return NextResponse.json(
        {
          success: false,
          error:
            data?.message ||
            data?.error ||
            "Erro ao gerar Pix Mercado Pago.",
          detalhes: data,
        },
        { status: response.status }
      );
    }

    const transactionData = data?.point_of_interaction?.transaction_data || {};
    const paymentId = data?.id ? String(data.id) : "";

    if (!paymentId || !transactionData?.qr_code) {
      return NextResponse.json(
        {
          success: false,
          error: "Mercado Pago não retornou os dados do Pix.",
          detalhes: data,
        },
        { status: 500 }
      );
    }

    await prisma.pagamentoAssinatura.create({
      data: {
        empresaId,
        valor,
        status: "pendente",
        tipo: `pix_${planoSelecionado}`,
        paymentId,
        dataPagamento: null,
        vencimento: expiraEm,
      } as any,
    });

    return NextResponse.json({
      success: true,
      tipo: "pix",
      plano: planoSelecionado,
      paymentId,
      valor,
      status: data.status || "pending",
      expiraEm: expiraEm.toISOString(),
      qrCode: transactionData.qr_code,
      qrCodeBase64: transactionData.qr_code_base64,
      ticketUrl: transactionData.ticket_url,
    });
  } catch (error) {
    console.error("Erro ao gerar Pix da assinatura:", error);

    return NextResponse.json(
      { success: false, error: "Erro ao gerar Pix da assinatura." },
      { status: 500 }
    );
  }
}
