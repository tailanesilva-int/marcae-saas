import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function adicionarDias(data: Date, dias: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}

function normalizarPlano(plano?: string | null) {
  const normalizado = String(plano || "").toLowerCase();

  if (normalizado === "basico") return "basico";
  if (normalizado === "plus") return "premium";
  if (normalizado === "premium") return "premium";

  return "premium";
}

function extrairPlanoDoTipo(tipo?: string | null) {
  const normalizado = String(tipo || "").toLowerCase();

  if (normalizado.includes("basico")) return "basico";
  if (normalizado.includes("premium")) return "premium";

  return "premium";
}

async function consultarPagamentoMercadoPago(paymentId: string) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Access Token Mercado Pago do Marcaê não configurado.");
  }

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Erro ao consultar pagamento Mercado Pago:", data);
    throw new Error(
      data?.message || data?.error || "Erro ao consultar pagamento."
    );
  }

  return data;
}

async function aplicarStatusAssinatura(paymentId: string, empresaId: string, pagamentoMP: any) {
  const statusMP = String(pagamentoMP?.status || "").toLowerCase();
  const pagamentoAssinatura = await prisma.pagamentoAssinatura.findFirst({
    where: {
      empresaId,
      paymentId: String(paymentId),
    } as any,
    orderBy: {
      createdAt: "desc",
    },
  });

  const plano =
    normalizarPlano(pagamentoMP?.metadata?.plano) ||
    extrairPlanoDoTipo((pagamentoAssinatura as any)?.tipo);

  let statusAssinatura = "pendente";

  if (statusMP === "approved") {
    statusAssinatura = "aprovado";
  }

  if (["rejected", "cancelled", "refunded", "charged_back"].includes(statusMP)) {
    statusAssinatura =
      statusMP === "rejected"
        ? "recusado"
        : statusMP === "cancelled"
          ? "cancelado"
          : statusMP;
  }

  const agora = new Date();
  const vencimento = adicionarDias(agora, 30);

  await prisma.pagamentoAssinatura.updateMany({
    where: {
      empresaId,
      paymentId: String(paymentId),
    } as any,
    data: {
      status: statusAssinatura,
      dataPagamento: statusMP === "approved" ? agora : undefined,
      vencimento: statusMP === "approved" ? vencimento : undefined,
    } as any,
  });

  let empresaAtualizada = null;

  if (statusMP === "approved") {
    empresaAtualizada = await prisma.empresa.update({
      where: { id: empresaId },
      data: {
        plano,
        assinaturaStatus: "ativa",
        assinaturaExpiraEm: vencimento,
        assinaturaProximaCobrancaEm: vencimento,
        assinaturaRecorrenteAtiva: false,
        ultimoPagamentoEm: agora,
        modoPagamentoAssinatura: "manual",
        formaPagamentoAssinatura: "pix",
        statusFinanceiro: "em_dia",
        bloqueadoPorInadimplencia: false,
        trialAtivo: false,
      } as any,
    });
  }

  return {
    statusMP,
    statusAssinatura,
    aprovado: statusMP === "approved",
    empresa: empresaAtualizada,
    vencimento,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await context.params;
    const url = new URL(req.url);
    const paymentId = url.searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "paymentId não informado." },
        { status: 400 }
      );
    }

    const pagamentoMP = await consultarPagamentoMercadoPago(paymentId);
    const resultado = await aplicarStatusAssinatura(paymentId, empresaId, pagamentoMP);

    return NextResponse.json({
      success: true,
      paymentId,
      status: resultado.statusMP,
      statusAssinatura: resultado.statusAssinatura,
      aprovado: resultado.aprovado,
      empresa: resultado.empresa,
    });
  } catch (error) {
    console.error("Erro ao consultar status do Pix:", error);

    return NextResponse.json(
      { success: false, error: "Erro ao consultar status do Pix." },
      { status: 500 }
    );
  }
}
