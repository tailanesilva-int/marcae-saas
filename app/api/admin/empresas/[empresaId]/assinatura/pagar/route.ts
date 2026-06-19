import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference, PreApproval } from "mercadopago";
import { prisma } from "@/lib/prisma";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await context.params;

    const body = await req.json().catch(() => ({}));
    const modo = body.modo || "manual"; // manual | recorrente
    const planoSelecionado = String(body.plano || "premium").toLowerCase();

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      return NextResponse.json(
        { success: false, error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    if (empresa.plano === "premium" && empresa.assinaturaExpiraEm) {
      const hoje = new Date();

      if (empresa.assinaturaExpiraEm > hoje && modo !== "manual") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Você já possui um plano Premium ativo. Aguarde expirar para alterar.",
          },
          { status: 400 }
        );
      }
    }

    const valorMensalidade = valorMensalidadeEmpresa(empresa as any);
    const urlBase = obterUrlBase();

    // =========================================
    // 🟡 MODO 1: PAGAMENTO MANUAL / CHECKOUT
    // =========================================
    if (modo === "manual") {
      const preference = new Preference(client);
      const externalReference = `${empresaId}:${planoSelecionado}:checkout`;

      const response = await preference.create({
        body: {
          items: [
            {
              id: `assinatura-${planoSelecionado}`,
              title: `Assinatura ${planoSelecionado === "premium" ? "Premium" : "Básico"} - Marcaê`,
              quantity: 1,
              unit_price: valorMensalidade,
              currency_id: "BRL",
            },
          ],
          back_urls: {
            success: `${urlBase}/planos?status=success`,
            failure: `${urlBase}/planos?status=failure`,
            pending: `${urlBase}/planos?status=pending`,
          },
          notification_url: `${urlBase}/api/webhook/mercadopago?tipo=assinatura&empresaId=${empresaId}`,
          external_reference: externalReference,
          metadata: {
            tipo: "assinatura",
            empresaId,
            plano: planoSelecionado,
            origem: "checkout_mensalidade_marcae",
          },
        },
      });

      const linkPagamento = response.init_point;

      await prisma.pagamentoAssinatura.create({
        data: {
          empresaId,
          valor: valorMensalidade,
          status: "pendente",
          tipo: "manual",
          preferenceId: response.id?.toString(),
          linkPagamento,
        },
      });

      return NextResponse.json({
        success: true,
        tipo: "manual",
        linkPagamento,
      });
    }

    // =========================================
    // 🟢 MODO 2: ASSINATURA RECORRENTE
    // =========================================
    if (modo === "recorrente") {
      const preapproval = new PreApproval(client);
      const externalReference = `${empresaId}:${planoSelecionado}:recorrente`;

      const response = await preapproval.create({
        body: {
          reason: `Assinatura ${planoSelecionado === "premium" ? "Premium" : "Básico"} Marcaê`,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: valorMensalidade,
            currency_id: "BRL",
          },
          back_url: `${urlBase}/planos?status=success`,
          payer_email:
            (empresa as any).email ||
            (empresa as any).emailResponsavel ||
            "financeiro@marcaeapp.com.br",
          external_reference: externalReference,
        },
      });

      await prisma.pagamentoAssinatura.create({
        data: {
          empresaId,
          valor: valorMensalidade,
          status: "pendente",
          tipo: `recorrente_${planoSelecionado}`,
          mercadoPagoAssinaturaId: response.id,
        },
      });

      await prisma.empresa.update({
        where: { id: empresaId },
        data: {
          assinaturaRecorrenteAtiva: true,
          modoPagamentoAssinatura: "recorrente",
        } as any,
      });

      return NextResponse.json({
        success: true,
        tipo: "recorrente",
        linkPagamento: response.init_point,
      });
    }

    return NextResponse.json(
      { success: false, error: "Modo inválido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao gerar pagamento:", error);

    return NextResponse.json(
      { success: false, error: "Erro ao gerar pagamento" },
      { status: 500 }
    );
  }
}
