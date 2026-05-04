"use client";

import { useEffect, useState } from "react";

export default function EmpresaPage({ params }: any) {
  const empresaId = params.id;

  const [empresa, setEmpresa] = useState<any>(null);

  useEffect(() => {
    async function carregar() {
      const res = await fetch(`/api/admin/empresas/${empresaId}`);
      const data = await res.json();
      setEmpresa(data);
    }

    carregar();
  }, []);

  if (!empresa) return <p>Carregando...</p>;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl text-white">
        <h1 className="text-2xl font-bold">Administração</h1>
        <p>Admin - {empresa.nome}</p>

        {empresa.plano === "premium" && (
          <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-sm">
            Premium ativo
          </span>
        )}
      </div>

      {/* DADOS EMPRESA */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Dados da empresa</h2>

        <input
          defaultValue={empresa.nome}
          className="border p-2 rounded w-full mb-2"
        />
        <input
          defaultValue={empresa.endereco || ""}
          placeholder="Endereço"
          className="border p-2 rounded w-full mb-2"
        />
        <input
          defaultValue={empresa.telefone || ""}
          placeholder="Telefone"
          className="border p-2 rounded w-full mb-2"
        />

        <button className="bg-indigo-600 text-white px-4 py-2 rounded">
          Salvar dados
        </button>
      </div>

      {/* PLANO */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">Plano e assinatura</h2>

        <p><b>Plano atual:</b> {empresa.plano}</p>
        <p><b>Status:</b> {empresa.assinaturaStatus}</p>

        {empresa.assinaturaExpiraEm && (
          <p>
            <b>Expira em:</b>{" "}
            {new Date(empresa.assinaturaExpiraEm).toLocaleDateString()}
          </p>
        )}

        {/* BOTÃO PAGAR - só aparece se NÃO for recorrente */}
        {!empresa.assinaturaRecorrenteAtiva && (
          <button
            onClick={async () => {
              const res = await fetch(
                `/api/admin/empresas/${empresaId}/assinatura/pagar`,
                {
                  method: "POST",
                  body: JSON.stringify({ modo: "manual" }),
                }
              );

              const data = await res.json();

              if (data.linkPagamento) {
                window.open(data.linkPagamento, "_blank");
              }
            }}
            className="bg-orange-500 text-white px-4 py-2 rounded mt-4"
          >
            Pagar mensalidade
          </button>
        )}
      </div>

      {/* 🔥 CONFIGURAÇÃO DE PAGAMENTO */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">
          Configuração de pagamento
        </h2>

        <div className="space-y-4">

          {/* TIPO */}
          <div>
            <p className="font-medium">Tipo de cobrança</p>

            <label className="flex gap-2 mt-2">
              <input
                type="radio"
                name="tipo"
                value="manual"
                defaultChecked={empresa.modoPagamentoAssinatura !== "recorrente"}
              />
              Pagamento manual
            </label>

            <label className="flex gap-2 mt-2">
              <input
                type="radio"
                name="tipo"
                value="recorrente"
                defaultChecked={empresa.modoPagamentoAssinatura === "recorrente"}
              />
              Pagamento automático (recorrente)
            </label>
          </div>

          {/* BOTÃO SALVAR */}
          <button
            onClick={async () => {
              const tipo = (
                document.querySelector(
                  'input[name="tipo"]:checked'
                ) as HTMLInputElement
              )?.value;

              await fetch(
                `/api/admin/empresas/${empresaId}/config-pagamento`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    modoPagamento: tipo,
                    recorrente: tipo === "recorrente",
                  }),
                }
              );

              alert("Configuração salva!");

              window.location.reload();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Salvar configuração
          </button>

          {/* ATIVAR RECORRÊNCIA */}
          <button
            onClick={async () => {
              const res = await fetch(
                `/api/admin/empresas/${empresaId}/assinatura/pagar`,
                {
                  method: "POST",
                  body: JSON.stringify({ modo: "recorrente" }),
                }
              );

              const data = await res.json();

              if (data.linkPagamento) {
                window.open(data.linkPagamento, "_blank");
              }
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Ativar pagamento automático
          </button>
        </div>
      </div>
    </div>
  );
}