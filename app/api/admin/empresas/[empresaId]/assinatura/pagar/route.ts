import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference, PreApproval } from "mercadopago";
import { prisma } from "@/lib/prisma";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await context.params;

    const body = await req.json().catch(() => ({}));
    const modo = body.modo || "manual"; // manual | recorrente

    // 🔎 Busca empresa
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // 🚫 Bloqueia downgrade indevido
    if (empresa.plano === "premium" && empresa.assinaturaExpiraEm) {
      const hoje = new Date();

      if (empresa.assinaturaExpiraEm > hoje) {
        return NextResponse.json(
          {
            error:
              "Você já possui um plano Premium ativo. Aguarde expirar para alterar.",
          },
          { status: 400 }
        );
      }
    }

    // =========================================
    // 🟡 MODO 1: PAGAMENTO MANUAL
    // =========================================
    if (modo === "manual") {
      const preference = new Preference(client);

      const response = await preference.create({
        body: {
          items: [
            {
              id: "plano-premium",
              title: "Assinatura Premium - Marcaê",
              quantity: 1,
              unit_price: 1,
            },
          ],
          back_urls: {
            success: `${process.env.NEXT_PUBLIC_APP_URL}/admin/empresas/${empresaId}?status=success`,
            failure: `${process.env.NEXT_PUBLIC_APP_URL}/admin/empresas/${empresaId}?status=failure`,
            pending: `${process.env.NEXT_PUBLIC_APP_URL}/admin/empresas/${empresaId}?status=pending`,
          },
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/mercadopago`,
          external_reference: empresaId,
        },
      });

      const linkPagamento = response.init_point;

      await prisma.pagamentoAssinatura.create({
        data: {
          empresaId,
          valor: 1,
          status: "pendente",
          tipo: "manual",
          preferenceId: response.id?.toString(),
          linkPagamento,
        },
      });

      return NextResponse.json({
        tipo: "manual",
        linkPagamento,
      });
    }

    // =========================================
    // 🟢 MODO 2: ASSINATURA RECORRENTE
    // =========================================
    if (modo === "recorrente") {
      const preapproval = new PreApproval(client);

      const response = await preapproval.create({
        body: {
          reason: "Assinatura Premium Marcaê",
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: 1,
            currency_id: "BRL",
          },
          back_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/empresas/${empresaId}?status=success`,
          payer_email: "teste@teste.com",
        },
      });

      await prisma.pagamentoAssinatura.create({
        data: {
          empresaId,
          valor: 1,
          status: "pendente",
          tipo: "recorrente",
          mercadoPagoAssinaturaId: response.id,
        },
      });

      await prisma.empresa.update({
        where: { id: empresaId },
        data: {
          assinaturaRecorrenteAtiva: true,
          modoPagamentoAssinatura: "recorrente",
        },
      });

      return NextResponse.json({
        tipo: "recorrente",
        linkPagamento: response.init_point,
      });
    }

    return NextResponse.json(
      { error: "Modo inválido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao gerar pagamento:", error);

    return NextResponse.json(
      { error: "Erro ao gerar pagamento" },
      { status: 500 }
    );
  }
}