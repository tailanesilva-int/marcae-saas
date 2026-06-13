"use client";

import { useEffect, useState } from "react";
import PremiumLayout from "@/components/layout/PremiumLayout";

const diasSemana = [
  { label: "Domingo", value: 0 },
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
];

type BlocoHorario = {
  horaInicio: string;
  horaFim: string;
  servicosIds: string[];
};

type DisponibilidadeDia = {
  diaSemana: number;
  ativo: boolean;
  blocos: BlocoHorario[];
};

type ComissaoServicoForm = {
  servicoId: string;
  tipoComissao: string;
  valorComissao: string;
};

function criarDisponibilidadePadrao(): DisponibilidadeDia[] {
  return diasSemana.map((d) => ({
    diaSemana: d.value,
    ativo: false,
    blocos: [
      {
        horaInicio: "08:00",
        horaFim: "18:00",
        servicosIds: [],
      },
    ],
  }));
}

export default function ProfissionaisPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvandoProfissional, setSalvandoProfissional] = useState(false);
  const [carregandoEdicaoProfissionalId, setCarregandoEdicaoProfissionalId] =
    useState<string | null>(null);
  const [profissionalStatusProcessandoId, setProfissionalStatusProcessandoId] =
    useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativos" | "inativos"
  >("todos");
  const [diaAgendaAberto, setDiaAgendaAberto] = useState<number | null>(null);
  const [formProfissionalAberto, setFormProfissionalAberto] = useState(false);
  const [buscaProfissional, setBuscaProfissional] = useState("");

  const [form, setForm] = useState({
    nome: "",
    bio: "",
    fotoUrl: "",
    ativo: true,
    servicosIds: [] as string[],
    modoComissao: "geral",
    tipoComissao: "percentual",
    valorComissao: "",
  });

  const [comissoesServicos, setComissoesServicos] = useState<
    ComissaoServicoForm[]
  >([]);

  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeDia[]>(
    criarDisponibilidadePadrao(),
  );

  useEffect(() => {
    const empresaStorage = localStorage.getItem("empresaLogada");

    if (!empresaStorage) {
      window.location.href = "/login";
      return;
    }

    const emp = JSON.parse(empresaStorage);
    setEmpresa(emp);
    carregarTudo(emp.id);
  }, []);

  async function carregarTudo(empresaId: string) {
    setCarregando(true);

    const [resProfissionais, resServicos] = await Promise.all([
      fetch(`/api/profissionais?empresaId=${empresaId}`),
      fetch(`/api/servicos?empresaId=${empresaId}`),
    ]);

    const dataProfissionais = await resProfissionais.json();
    const dataServicos = await resServicos.json();

    if (dataProfissionais.success) {
      setProfissionais(dataProfissionais.profissionais || []);
    }

    setServicos(dataServicos.servicos || []);
    setCarregando(false);
  }

  async function carregarDisponibilidade(profissionalId: string) {
    try {
      const res = await fetch(
        `/api/disponibilidades?profissionalId=${profissionalId}`,
        {
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (data.success && data.disponibilidades?.length > 0) {
        setDisponibilidade(
          diasSemana.map((dia) => {
            const blocosDoDia = data.disponibilidades
              .filter(
                (d: any) =>
                  Number(d.diaSemana) === dia.value && d.ativo !== false,
              )
              .map((d: any) => ({
                horaInicio: d.horaInicio || "08:00",
                horaFim: d.horaFim || "18:00",
                servicosIds: Array.isArray(d.servicos)
                  ? d.servicos
                      .map((item: any) => item.servicoId || item.servico?.id)
                      .filter(Boolean)
                  : Array.isArray(d.servicosIds)
                    ? d.servicosIds
                    : [],
              }));

            return {
              diaSemana: dia.value,
              ativo: blocosDoDia.length > 0,
              blocos:
                blocosDoDia.length > 0
                  ? blocosDoDia
                  : [
                      {
                        horaInicio: "08:00",
                        horaFim: "18:00",
                        servicosIds: [],
                      },
                    ],
            };
          }),
        );
      } else {
        resetarDisponibilidade();
      }
    } catch (error) {
      console.error("Erro ao carregar disponibilidade:", error);
      resetarDisponibilidade();
    }
  }

  function resetarDisponibilidade() {
    setDisponibilidade(criarDisponibilidadePadrao());
  }

  function alternarServico(servicoId: string) {
    const jaSelecionado = form.servicosIds.includes(servicoId);
    const novosServicosIds = jaSelecionado
      ? form.servicosIds.filter((id) => id !== servicoId)
      : [...form.servicosIds, servicoId];

    setForm({
      ...form,
      servicosIds: novosServicosIds,
    });

    if (jaSelecionado) {
      setDisponibilidade((atual) =>
        atual.map((dia) => ({
          ...dia,
          blocos: dia.blocos.map((bloco) => ({
            ...bloco,
            servicosIds: bloco.servicosIds.filter((id) => id !== servicoId),
          })),
        })),
      );

      setComissoesServicos((atual) =>
        atual.filter((item) => item.servicoId !== servicoId),
      );
    } else {
      setComissoesServicos((atual) => {
        const jaExiste = atual.some((item) => item.servicoId === servicoId);

        if (jaExiste) return atual;

        return [
          ...atual,
          {
            servicoId,
            tipoComissao: "percentual",
            valorComissao: "",
          },
        ];
      });
    }
  }

  function atualizarDia(index: number, campo: string, valor: any) {
    const nova = [...disponibilidade];

    nova[index] = {
      ...nova[index],
      [campo]: valor,
    };

    setDisponibilidade(nova);
  }

  function atualizarBloco(
    diaIndex: number,
    blocoIndex: number,
    campo: "horaInicio" | "horaFim",
    valor: string,
  ) {
    const nova = [...disponibilidade];

    nova[diaIndex] = {
      ...nova[diaIndex],
      blocos: nova[diaIndex].blocos.map((bloco, index) =>
        index === blocoIndex
          ? {
              ...bloco,
              [campo]: valor,
            }
          : bloco,
      ),
    };

    setDisponibilidade(nova);
  }

  function alternarServicoBloco(
    diaIndex: number,
    blocoIndex: number,
    servicoId: string,
  ) {
    const nova = [...disponibilidade];

    const bloco = nova[diaIndex].blocos[blocoIndex];

    const jaExiste = bloco.servicosIds.includes(servicoId);

    nova[diaIndex].blocos[blocoIndex] = {
      ...bloco,
      servicosIds: jaExiste
        ? bloco.servicosIds.filter((id) => id !== servicoId)
        : [...bloco.servicosIds, servicoId],
    };

    setDisponibilidade(nova);
  }

  function adicionarBloco(diaIndex: number) {
    const nova = [...disponibilidade];

    nova[diaIndex] = {
      ...nova[diaIndex],
      ativo: true,
      blocos: [
        ...nova[diaIndex].blocos,
        {
          horaInicio: "13:00",
          horaFim: "18:00",
          servicosIds: [],
        },
      ],
    };

    setDisponibilidade(nova);
  }

  function removerBloco(diaIndex: number, blocoIndex: number) {
    const nova = [...disponibilidade];
    const blocosAtualizados = nova[diaIndex].blocos.filter(
      (_, index) => index !== blocoIndex,
    );

    nova[diaIndex] = {
      ...nova[diaIndex],
      blocos:
        blocosAtualizados.length > 0
          ? blocosAtualizados
          : [
              {
                horaInicio: "08:00",
                horaFim: "18:00",
                servicosIds: [],
              },
            ],
      ativo: blocosAtualizados.length > 0 ? nova[diaIndex].ativo : false,
    };

    setDisponibilidade(nova);
  }

  function copiarHorarioParaTodos(diaIndex: number) {
    const diaOrigem = disponibilidade[diaIndex];

    const novaDisponibilidade = disponibilidade.map((dia) => ({
      ...dia,
      ativo: diaOrigem.ativo,
      blocos: diaOrigem.blocos.map((bloco) => ({
        ...bloco,
        servicosIds: [...(bloco.servicosIds || [])],
      })),
    }));

    setDisponibilidade(novaDisponibilidade);
  }

  function copiarHorarioDiasUteis(diaIndex: number) {
    const diaOrigem = disponibilidade[diaIndex];

    const novaDisponibilidade = disponibilidade.map((dia) => {
      if (dia.diaSemana >= 1 && dia.diaSemana <= 5) {
        return {
          ...dia,
          ativo: diaOrigem.ativo,
          blocos: diaOrigem.blocos.map((bloco) => ({
            ...bloco,
          })),
        };
      }

      return dia;
    });

    setDisponibilidade(novaDisponibilidade);
    alert("Horários copiados para os dias úteis: segunda a sexta.");
  }

  function copiarHorarioParaDia(
    diaOrigemIndex: number,
    diaDestinoIndex: number,
  ) {
    const origem = disponibilidade[diaOrigemIndex];

    const novaDisponibilidade = [...disponibilidade];

    novaDisponibilidade[diaDestinoIndex] = {
      ...novaDisponibilidade[diaDestinoIndex],
      ativo: origem.ativo,
      blocos: origem.blocos.map((bloco) => ({
        ...bloco,
        servicosIds: [...(bloco.servicosIds || [])],
      })),
    };

    setDisponibilidade(novaDisponibilidade);
  }

  function selecionarFoto(event: any) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onloadend = () => {
      setForm({
        ...form,
        fotoUrl: String(leitor.result),
      });
    };

    leitor.readAsDataURL(arquivo);
  }

  function formatarComissao(profissional: any) {
    if (profissional.modoComissao === "por_servico") {
      const servicosComComissao =
        profissional.servicos?.filter(
          (item: any) =>
            item.tipoComissao &&
            item.valorComissao !== null &&
            item.valorComissao !== undefined,
        ) || [];

      if (servicosComComissao.length > 0) {
        return `Por serviço (${servicosComComissao.length} configurado${
          servicosComComissao.length === 1 ? "" : "s"
        })`;
      }

      if (
        profissional.tipoComissao &&
        profissional.valorComissao !== null &&
        profissional.valorComissao !== undefined
      ) {
        return `Por serviço com fallback geral`;
      }

      return "Por serviço sem comissão configurada";
    }

    if (
      !profissional.tipoComissao ||
      profissional.valorComissao === null ||
      profissional.valorComissao === undefined
    ) {
      return "Comissão não configurada";
    }

    if (profissional.tipoComissao === "percentual") {
      return `${Number(profissional.valorComissao || 0)}% por serviço realizado`;
    }

    return `R$ ${Number(profissional.valorComissao || 0).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )} por serviço realizado`;
  }

  function formatarComissaoServico(item: any) {
    if (
      !item?.tipoComissao ||
      item?.valorComissao === null ||
      item?.valorComissao === undefined ||
      item?.valorComissao === ""
    ) {
      return "Usa fallback da comissão geral";
    }

    if (item.tipoComissao === "percentual") {
      return `${Number(item.valorComissao || 0)}%`;
    }

    return `R$ ${Number(item.valorComissao || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function obterComissaoServico(servicoId: string) {
    return (
      comissoesServicos.find((item) => item.servicoId === servicoId) || {
        servicoId,
        tipoComissao: "percentual",
        valorComissao: "",
      }
    );
  }

  function atualizarComissaoServico(
    servicoId: string,
    campo: "tipoComissao" | "valorComissao",
    valor: string,
  ) {
    setComissoesServicos((atual) => {
      const jaExiste = atual.some((item) => item.servicoId === servicoId);

      if (!jaExiste) {
        return [
          ...atual,
          {
            servicoId,
            tipoComissao: campo === "tipoComissao" ? valor : "percentual",
            valorComissao: campo === "valorComissao" ? valor : "",
          },
        ];
      }

      return atual.map((item) =>
        item.servicoId === servicoId
          ? {
              ...item,
              [campo]: valor,
            }
          : item,
      );
    });
  }

  function servicosAtivosDisponiveis() {
    return servicos.filter((servico) => servico.ativo !== false);
  }

  function servicoEstaAtivo(servicoId: string) {
    return servicos.some(
      (servico) => servico.id === servicoId && servico.ativo !== false,
    );
  }

  function servicosDoProfissional() {
    return servicosAtivosDisponiveis().filter((servico) =>
      form.servicosIds.includes(servico.id),
    );
  }

  function normalizarDisponibilidadeParaSalvar() {
    return disponibilidade.map((dia) => ({
      ...dia,
      blocos: dia.blocos.map((bloco) => ({
        horaInicio: bloco.horaInicio,
        horaFim: bloco.horaFim,
        servicosIds: Array.isArray(bloco.servicosIds)
          ? bloco.servicosIds.filter(
              (servicoId) =>
                form.servicosIds.includes(servicoId) &&
                servicoEstaAtivo(servicoId),
            )
          : [],
      })),
    }));
  }

  function validarDisponibilidade() {
    for (const dia of disponibilidade) {
      if (!dia.ativo) continue;

      if (!dia.blocos || dia.blocos.length === 0) {
        alert("Existe um dia ativo sem bloco de horário.");
        return false;
      }

      for (const bloco of dia.blocos) {
        if (!bloco.horaInicio || !bloco.horaFim) {
          alert("Preencha todos os horários da agenda semanal.");
          return false;
        }

        if (bloco.horaInicio >= bloco.horaFim) {
          const nomeDia =
            diasSemana.find((d) => d.value === dia.diaSemana)?.label ||
            "dia selecionado";
          alert(
            `No dia ${nomeDia}, o horário inicial precisa ser menor que o horário final.`,
          );
          return false;
        }
      }
    }

    return true;
  }

  async function salvar() {
    if (
      salvandoProfissional ||
      carregandoEdicaoProfissionalId ||
      profissionalStatusProcessandoId
    )
      return;

    if (!form.nome.trim()) {
      alert("Informe o nome do profissional.");
      return;
    }

    if (!validarDisponibilidade()) {
      return;
    }

    try {
      setSalvandoProfissional(true);

      const disponibilidadeParaSalvar = normalizarDisponibilidadeParaSalvar();

      const res = await fetch("/api/profissionais", {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editandoId,
          empresaId: empresa.id,
          ...form,
          servicosIds: form.servicosIds.filter((servicoId) =>
            servicoEstaAtivo(servicoId),
          ),
          valorComissao:
            form.valorComissao !== ""
              ? Number(String(form.valorComissao).replace(",", "."))
              : null,
          comissoesServicos: comissoesServicos
            .filter(
              (item) =>
                form.servicosIds.includes(item.servicoId) &&
                servicoEstaAtivo(item.servicoId),
            )
            .map((item) => ({
              servicoId: item.servicoId,
              tipoComissao: item.tipoComissao || "percentual",
              valorComissao:
                item.valorComissao !== ""
                  ? Number(String(item.valorComissao).replace(",", "."))
                  : null,
            })),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao salvar profissional.");
        return;
      }

      const profissionalId = data.profissional.id;

      const resDisponibilidade = await fetch("/api/disponibilidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresa.id,
          profissionalId,
          disponibilidades: disponibilidadeParaSalvar,
        }),
      });

      const dataDisponibilidade = await resDisponibilidade.json();

      if (!dataDisponibilidade.success) {
        alert(dataDisponibilidade.error || "Erro ao salvar agenda semanal.");
        return;
      }

      alert(
        editandoId ? "Profissional atualizado!" : "Profissional cadastrado!",
      );

      limparFormulario();
      await carregarTudo(empresa.id);
    } catch (error) {
      console.error("Erro ao salvar profissional:", error);
      alert("Erro ao salvar profissional.");
    } finally {
      setSalvandoProfissional(false);
    }
  }

  async function editar(profissional: any) {
    if (
      salvandoProfissional ||
      carregandoEdicaoProfissionalId ||
      profissionalStatusProcessandoId
    )
      return;

    try {
      setCarregandoEdicaoProfissionalId(profissional.id);

      const servicosIds =
        profissional.servicos
          ?.map((item: any) => item.servicoId)
          .filter((servicoId: string) => servicoEstaAtivo(servicoId)) || [];

      setEditandoId(profissional.id);
      setFormProfissionalAberto(true);

      setForm({
        nome: profissional.nome || "",
        bio: profissional.bio || "",
        fotoUrl: profissional.fotoUrl || "",
        ativo: profissional.ativo ?? true,
        servicosIds,
        modoComissao: profissional.modoComissao || "geral",
        tipoComissao: profissional.tipoComissao || "percentual",
        valorComissao:
          profissional.valorComissao !== null &&
          profissional.valorComissao !== undefined
            ? String(profissional.valorComissao)
            : "",
      });

      setComissoesServicos(
        profissional.servicos
          ?.filter((item: any) => servicoEstaAtivo(item.servicoId))
          .map((item: any) => ({
            servicoId: item.servicoId,
            tipoComissao: item.tipoComissao || "percentual",
            valorComissao:
              item.valorComissao !== null && item.valorComissao !== undefined
                ? String(item.valorComissao)
                : "",
          })) || [],
      );

      await carregarDisponibilidade(profissional.id);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Erro ao carregar profissional para edição:", error);
      alert("Erro ao carregar profissional para edição.");
    } finally {
      setCarregandoEdicaoProfissionalId(null);
    }
  }

  async function alternarStatusProfissional(profissional: any) {
    if (
      salvandoProfissional ||
      carregandoEdicaoProfissionalId ||
      profissionalStatusProcessandoId
    )
      return;

    const confirmar = confirm(
      profissional.ativo === false
        ? "Deseja ativar este profissional?"
        : "Deseja inativar este profissional?",
    );

    if (!confirmar) return;

    try {
      setProfissionalStatusProcessandoId(profissional.id);

      const res = await fetch("/api/profissionais", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profissional,
          empresaId: empresa.id,
          servicosIds:
            profissional.servicos?.map((item: any) => item.servicoId) || [],
          modoComissao: profissional.modoComissao || "geral",
          tipoComissao: profissional.tipoComissao || null,
          valorComissao: profissional.valorComissao ?? null,
          comissoesServicos:
            profissional.servicos?.map((item: any) => ({
              servicoId: item.servicoId,
              tipoComissao: item.tipoComissao || null,
              valorComissao: item.valorComissao ?? null,
            })) || [],
          ativo: profissional.ativo === false,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Erro ao atualizar profissional.");
        return;
      }

      await carregarTudo(empresa.id);
    } catch (error) {
      console.error("Erro ao atualizar status do profissional:", error);
      alert("Erro ao atualizar profissional. Tente novamente.");
    } finally {
      setProfissionalStatusProcessandoId(null);
    }
  }

  function limparFormulario() {
    setEditandoId(null);
    setFormProfissionalAberto(false);

    setForm({
      nome: "",
      bio: "",
      fotoUrl: "",
      ativo: true,
      servicosIds: [],
      modoComissao: "geral",
      tipoComissao: "percentual",
      valorComissao: "",
    });

    setComissoesServicos([]);
    resetarDisponibilidade();
  }

  const profissionaisFiltrados = profissionais.filter((profissional) => {
    const termo = buscaProfissional.trim().toLowerCase();

    const statusOk =
      filtroStatus === "ativos"
        ? profissional.ativo !== false
        : filtroStatus === "inativos"
          ? profissional.ativo === false
          : true;

    if (!statusOk) return false;
    if (!termo) return true;

    const nome = String(profissional.nome || "").toLowerCase();
    const bio = String(profissional.bio || "").toLowerCase();
    const comissao = formatarComissao(profissional).toLowerCase();
    const servicosTexto = String(
      profissional.servicos
        ?.map((item: any) => item.servico?.nome || "")
        .join(" ") || "",
    ).toLowerCase();

    return (
      nome.includes(termo) ||
      bio.includes(termo) ||
      comissao.includes(termo) ||
      servicosTexto.includes(termo)
    );
  });

  const totalAtivos = profissionais.filter((p) => p.ativo !== false).length;
  const totalInativos = profissionais.filter((p) => p.ativo === false).length;
  const totalComServicos = profissionais.filter(
    (p) => (p.servicos?.length || 0) > 0,
  ).length;
  const comissaoMedia =
    profissionais.length > 0
      ? Math.round(
          profissionais.reduce(
            (acc, p) => acc + Number(p.valorComissao || 0),
            0,
          ) / profissionais.length,
        )
      : 0;
  const acaoProfissionalEmAndamento =
    salvandoProfissional ||
    Boolean(carregandoEdicaoProfissionalId) ||
    Boolean(profissionalStatusProcessandoId);

  if (!empresa) {
    return (
      <main style={loadingPage}>
        <div style={loadingCard}>Carregando profissionais...</div>
      </main>
    );
  }

  return (
    <PremiumLayout empresa={empresa}>
      <main className="profissionais-mobile-safe" style={page}>
        <style jsx global>{`
          html,
          body {
            max-width: 100%;
            overflow-x: hidden;
          }

          .profissionais-mobile-safe,
          .profissionais-mobile-safe * {
            box-sizing: border-box;
          }

          .profissionais-mobile-safe {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          .profissionais-mini-resumo-mobile {
            display: none;
          }

          .profissionais-grid-horizontal {
            width: 100% !important;
            max-width: 100% !important;
          }

          .profissional-card-horizontal {
            min-width: 0 !important;
          }

          @media (min-width: 761px) {
            .profissionais-grid-horizontal {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              align-items: stretch !important;
              gap: 14px !important;
            }

            .profissional-card-horizontal {
              width: 100% !important;
              min-width: 0 !important;
              min-height: 238px !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: stretch !important;
              justify-content: flex-start !important;
              gap: 12px !important;
              overflow: hidden !important;
            }

            .profissional-card-horizontal .profissional-info-mobile {
              display: grid !important;
              grid-template-columns: 58px minmax(0, 1fr) !important;
              align-items: flex-start !important;
              gap: 10px !important;
              width: 100% !important;
              min-width: 0 !important;
            }

            .profissional-card-horizontal
              .profissional-info-mobile
              > div:last-child {
              min-width: 0 !important;
            }

            .profissional-card-horizontal .profissional-info-mobile strong,
            .profissional-card-horizontal .profissional-info-mobile p,
            .profissional-card-horizontal .profissional-info-mobile span {
              overflow-wrap: anywhere !important;
            }
          }

          @media (max-width: 760px) {
            .profissionais-grid-horizontal {
              display: flex !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              gap: 14px !important;
              padding: 4px 2px 16px !important;
              scroll-snap-type: x mandatory !important;
              -webkit-overflow-scrolling: touch !important;
            }

            .profissionais-grid-horizontal::-webkit-scrollbar {
              height: 0 !important;
            }

            .profissional-card-horizontal {
              flex: 0 0 82vw !important;
              width: 82vw !important;
              max-width: 330px !important;
              min-width: 280px !important;
              scroll-snap-align: start !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: stretch !important;
              justify-content: flex-start !important;
              gap: 12px !important;
              padding: 18px !important;
            }

            .profissional-card-horizontal .profissional-info-mobile {
              display: grid !important;
              grid-template-columns: 54px minmax(0, 1fr) !important;
              align-items: flex-start !important;
              gap: 10px !important;
              width: 100% !important;
            }

            .profissional-card-horizontal .profissional-avatar-mobile {
              width: 54px !important;
              height: 54px !important;
              min-width: 54px !important;
              max-width: 54px !important;
              flex: 0 0 54px !important;
              border-radius: 18px !important;
            }

            .profissional-card-horizontal .profissional-avatar-img-mobile {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              object-position: center top !important;
            }
          }

          @media (max-width: 900px) {
            .profissionais-mobile-safe section.profissionais-resumo-card {
              display: grid !important;
              grid-template-columns: 1fr !important;
              overflow: visible !important;
              gap: 12px !important;
              padding: 18px !important;
              border-radius: 26px !important;
            }

            .profissionais-mobile-safe section.profissionais-resumo-card > div {
              min-width: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              scroll-snap-align: unset !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:first-child {
              display: grid !important;
              grid-template-columns: 56px minmax(0, 1fr) !important;
              gap: 14px !important;
              align-items: start !important;
              margin-bottom: 0 !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:first-child
              > div:first-child {
              display: contents !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:first-child
              > div:first-child
              > div:first-child {
              width: 56px !important;
              height: 56px !important;
              border-radius: 18px !important;
              font-size: 24px !important;
              grid-column: 1 !important;
              grid-row: 1 / span 2 !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:first-child
              > div:first-child
              > div:last-child {
              grid-column: 2 !important;
              min-width: 0 !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:first-child
              > div:last-child {
              display: none !important;
            }

            .profissionais-mobile-safe section.profissionais-resumo-card h2 {
              font-size: 25px !important;
              line-height: 1.05 !important;
              margin-top: 0 !important;
            }

            .profissionais-mobile-safe section.profissionais-resumo-card p {
              font-size: 13px !important;
              line-height: 1.45 !important;
              margin-top: 6px !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:nth-child(2) {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 10px !important;
              overflow: visible !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:nth-child(2)
              > div {
              min-width: 0 !important;
              padding: 12px !important;
              border-radius: 17px !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:last-child {
              display: grid !important;
              grid-template-columns: auto minmax(0, 1fr) auto !important;
              align-items: center !important;
              gap: 10px !important;
              min-height: 48px !important;
              padding: 12px 14px !important;
              border-radius: 18px !important;
            }
          }

          @media (max-width: 760px) {
            .profissionais-form-grid-v2 {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 10px !important;
              margin-top: 14px !important;
            }

            .profissionais-form-grid-v2 > div,
            .profissionais-form-grid-v2 > label {
              min-width: 0 !important;
            }

            .profissionais-form-grid-v2 label {
              font-size: 12.5px !important;
              font-weight: 900 !important;
              color: #e2e8f0 !important;
            }

            .profissionais-form-grid-v2 input,
            .profissionais-form-grid-v2 select,
            .profissionais-form-grid-v2 textarea {
              min-height: 42px !important;
              border-radius: 15px !important;
              font-size: 13px !important;
              padding: 12px 14px !important;
            }

            .profissionais-form-grid-v2 textarea {
              min-height: 74px !important;
            }

            .profissionais-form-grid-v2 input[type="file"] {
              padding: 10px !important;
              font-size: 12px !important;
            }

            .profissionais-ativo-check-v2 {
              display: grid !important;
              grid-template-columns: 28px minmax(0, 1fr) !important;
              align-items: center !important;
              gap: 10px !important;
              padding: 12px !important;
              border-radius: 16px !important;
              background: rgba(2, 6, 23, 0.52) !important;
              border: 1px solid rgba(255, 255, 255, 0.08) !important;
            }

            .profissionais-comissao-v2,
            .profissionais-servicos-v2,
            .profissionais-agenda-v2 {
              padding: 12px !important;
              border-radius: 18px !important;
              background: rgba(2, 6, 23, 0.42) !important;
              border: 1px solid rgba(255, 255, 255, 0.07) !important;
            }

            .profissionais-comissao-v2 h3,
            .profissionais-servicos-v2 h3,
            .profissionais-agenda-v2 h3 {
              font-size: 17px !important;
              line-height: 1.1 !important;
              margin: 0 0 6px !important;
            }

            .profissionais-comissao-v2 p,
            .profissionais-agenda-v2 p {
              font-size: 11.5px !important;
              line-height: 1.35 !important;
            }

            .profissional-agenda-dia-linha-v2 {
              display: grid !important;
              grid-template-columns: 34px minmax(0, 1fr) auto !important;
              grid-template-areas:
                "check day badge"
                "button button button" !important;
              gap: 8px !important;
              align-items: center !important;
              padding: 12px 0 !important;
            }

            .profissional-agenda-dia-linha-v2 > label {
              grid-area: check !important;
              justify-self: start !important;
            }

            .profissional-agenda-dia-linha-v2 > strong {
              grid-area: day !important;
              font-size: 15px !important;
            }

            .profissional-agenda-dia-linha-v2 > button {
              grid-area: button !important;
              height: 36px !important;
              min-height: 36px !important;
              font-size: 11px !important;
              border-radius: 13px !important;
            }

            .profissional-agenda-dia-linha-v2 > span {
              grid-area: badge !important;
              justify-self: end !important;
              height: 26px !important;
              font-size: 11px !important;
            }

            .profissionais-filtros-v2 {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 7px !important;
            }

            .profissionais-filtros-v2 > span {
              grid-column: 1 / -1 !important;
              justify-self: start !important;
              width: auto !important;
            }

            .profissionais-grid-horizontal {
              display: grid !important;
              grid-template-columns: 1fr !important;
              overflow: visible !important;
              gap: 10px !important;
              padding: 0 !important;
            }

            .profissional-card-horizontal {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              flex: none !important;
              padding: 14px !important;
              border-radius: 20px !important;
              min-height: auto !important;
            }

            .profissional-card-horizontal .profissional-info-mobile {
              display: grid !important;
              grid-template-columns: 50px minmax(0, 1fr) !important;
              gap: 10px !important;
              align-items: start !important;
            }

            .profissional-card-horizontal .profissional-avatar-mobile {
              width: 50px !important;
              height: 50px !important;
              min-width: 50px !important;
              max-width: 50px !important;
              border-radius: 17px !important;
            }

            .profissional-tags-v2 {
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 6px !important;
              margin-top: 8px !important;
              max-height: 64px !important;
              overflow: hidden !important;
            }

            .profissional-tags-v2 span {
              max-width: 100% !important;
              height: 25px !important;
              padding: 0 9px !important;
              font-size: 10.5px !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }

            .profissional-actions-v2 {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
              margin-top: 10px !important;
            }

            .profissional-actions-v2 button {
              height: 36px !important;
              min-height: 36px !important;
              border-radius: 13px !important;
              font-size: 11px !important;
            }
          }

          @media (max-width: 430px) {
            .profissional-card-horizontal {
              flex-basis: 80vw !important;
              width: 80vw !important;
              min-width: 252px !important;
            }
          }

          @media (max-width: 1180px) {
            .profissionais-mobile-safe {
              padding: 22px !important;
              padding-bottom: 112px !important;
            }

            .profissionais-mobile-safe > div {
              width: 100% !important;
              max-width: 100% !important;
            }

            .profissionais-mobile-safe header {
              width: 100% !important;
              max-width: 100% !important;
            }
          }

          @media (max-width: 900px) {
            .profissionais-mobile-safe section[style] {
              width: 100% !important;
              max-width: 100% !important;
            }

            .profissionais-mobile-safe header {
              padding: 22px !important;
              border-radius: 26px !important;
              align-items: flex-start !important;
            }

            .profissionais-mobile-safe header > div:first-child {
              display: grid !important;
              grid-template-columns: 62px minmax(0, 1fr) !important;
              gap: 14px !important;
              width: 100% !important;
              min-width: 0 !important;
            }

            .profissionais-mobile-safe
              header
              > div:first-child
              > div:first-child {
              width: 62px !important;
              height: 62px !important;
              border-radius: 20px !important;
              font-size: 24px !important;
            }

            .profissionais-mobile-safe header h1 {
              font-size: 30px !important;
              line-height: 1.05 !important;
            }

            .profissionais-mobile-safe header p {
              font-size: 13px !important;
              line-height: 1.5 !important;
            }

            .profissionais-mobile-safe section:nth-of-type(1) {
              display: flex !important;
              overflow-x: auto !important;
              gap: 12px !important;
              padding-bottom: 8px !important;
              scroll-snap-type: x mandatory;
              -webkit-overflow-scrolling: touch;
            }

            .profissionais-mobile-safe section:nth-of-type(1) > div {
              min-width: 230px !important;
              scroll-snap-align: start;
            }

            .profissionais-mobile-safe section:nth-of-type(2),
            .profissionais-mobile-safe section:nth-of-type(3) {
              padding: 18px !important;
              border-radius: 24px !important;
              overflow: hidden !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(2)
              > div[style*="grid-template-columns"],
            .profissionais-mobile-safe
              section:nth-of-type(2)
              div[style*="grid-template-columns: 1fr 1fr"],
            .profissionais-mobile-safe
              section:nth-of-type(2)
              div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
            }

            .profissionais-mobile-safe input,
            .profissionais-mobile-safe select,
            .profissionais-mobile-safe textarea,
            .profissionais-mobile-safe button {
              max-width: 100% !important;
            }

            .profissionais-mobile-safe section:nth-of-type(2) h2,
            .profissionais-mobile-safe section:nth-of-type(2) h3,
            .profissionais-mobile-safe section:nth-of-type(3) h2 {
              line-height: 1.15 !important;
            }
          }

          @media (max-width: 760px) {
            .profissionais-mobile-safe {
              padding: 14px !important;
              padding-bottom: 126px !important;
            }

            .profissionais-mobile-safe > div > div:first-child {
              min-height: 66px !important;
              border-radius: 22px !important;
              padding: 12px 14px !important;
            }

            .profissionais-mobile-safe > div > section:first-of-type {
              padding: 14px !important;
              border-radius: 22px !important;
            }

            .profissionais-mobile-safe
              > div
              > section:first-of-type
              > div:nth-child(2) {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .profissionais-mobile-safe > div > section:nth-of-type(2),
            .profissionais-mobile-safe > div > section:nth-of-type(3) {
              border-radius: 22px !important;
              padding: 14px !important;
            }

            .profissionais-mobile-safe
              > div
              > section:nth-of-type(3)
              > div:first-child {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }

            .profissionais-mobile-safe
              > div
              > section:nth-of-type(3)
              > div:first-child
              > div:last-child {
              width: 100% !important;
              min-width: 0 !important;
            }

            .profissionais-mobile-safe header {
              padding: 18px !important;
              margin-bottom: 16px !important;
            }

            .profissionais-mobile-safe header > div:first-child {
              grid-template-columns: 54px minmax(0, 1fr) !important;
            }

            .profissionais-mobile-safe
              header
              > div:first-child
              > div:first-child {
              width: 54px !important;
              height: 54px !important;
            }

            .profissionais-mobile-safe header div[style*="gap: 10"] {
              gap: 8px !important;
            }

            .profissionais-mobile-safe section:nth-of-type(1) > div {
              min-width: 78vw !important;
              padding: 18px !important;
            }

            .profissionais-mobile-safe section:nth-of-type(2),
            .profissionais-mobile-safe section:nth-of-type(3) {
              padding: 16px !important;
              margin-bottom: 16px !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(2)
              > div:nth-of-type(1),
            .profissionais-mobile-safe
              section:nth-of-type(2)
              > div:nth-of-type(1)
              ~ div,
            .profissionais-mobile-safe
              section:nth-of-type(2)
              div[style*="grid"] {
              grid-template-columns: 1fr !important;
              min-width: 0 !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(2)
              div[style*="gridColumn"] {
              grid-column: auto !important;
            }

            .profissionais-mobile-safe label,
            .profissionais-mobile-safe input,
            .profissionais-mobile-safe select,
            .profissionais-mobile-safe textarea {
              width: 100% !important;
            }

            .profissionais-mobile-safe section:nth-of-type(2) button,
            .profissionais-mobile-safe section:nth-of-type(3) button {
              width: 100% !important;
              margin-left: 0 !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(2)
              div[style*="display: flex"],
            .profissionais-mobile-safe
              section:nth-of-type(3)
              div[style*="display: flex"] {
              min-width: 0 !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(2)
              div:has(> input[type="time"]) {
              display: grid !important;
              grid-template-columns: 1fr auto 1fr !important;
              gap: 8px !important;
              align-items: center !important;
            }

            .profissionais-mobile-safe input[type="time"] {
              min-width: 0 !important;
              width: 100% !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(3)
              > div:first-child {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(3)
              > div:first-child
              > div:last-child {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              width: 100% !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(3)
              > div:first-child
              > div:last-child
              span {
              grid-column: 1 / -1 !important;
              text-align: center !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(3)
              > div:last-child
              > div {
              display: flex !important;
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 14px !important;
              padding: 18px !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(3)
              > div:last-child
              > div
              > div:first-child {
              flex-direction: column !important;
              align-items: flex-start !important;
              width: 100% !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(3)
              > div:last-child
              > div
              > div:first-child
              > div:last-child {
              width: 100% !important;
              min-width: 0 !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(3)
              > div:last-child
              > div
              > div:nth-child(2) {
              display: grid !important;
              grid-template-columns: 1fr !important;
              width: 100% !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(3)
              > div:last-child
              > div
              > div:last-child {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 10px !important;
              width: 100% !important;
            }
          }

          .profissional-info-mobile {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 12px !important;
            width: 100% !important;
            min-width: 0 !important;
          }

          .profissional-avatar-mobile {
            width: 72px !important;
            height: 72px !important;
            min-width: 72px !important;
            max-width: 72px !important;
            flex: 0 0 72px !important;
            border-radius: 22px !important;
            overflow: hidden !important;
            align-self: flex-start !important;
          }

          .profissional-avatar-img-mobile {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center top !important;
            display: block !important;
          }

          .profissionais-resumo-card {
            padding: 14px !important;
            border-radius: 22px !important;
            overflow: hidden !important;
          }

          .profissionais-resumo-card > div:first-child {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 12px !important;
          }

          .profissionais-resumo-card > div:first-child > div:first-child {
            display: grid !important;
            grid-template-columns: 42px minmax(0, 1fr) !important;
            align-items: start !important;
            gap: 10px !important;
            width: 100% !important;
            min-width: 0 !important;
          }

          .profissionais-resumo-card
            > div:first-child
            > div:first-child
            > div:first-child {
            width: 42px !important;
            height: 42px !important;
            border-radius: 14px !important;
            font-size: 20px !important;
            margin: 0 !important;
          }

          .profissionais-resumo-card h2 {
            font-size: 22px !important;
            line-height: 1.06 !important;
            max-width: 100% !important;
          }

          .profissionais-resumo-card p {
            font-size: 12px !important;
            line-height: 1.35 !important;
            margin-top: 6px !important;
          }

          .profissionais-resumo-card > div:first-child > div:last-child {
            width: 100% !important;
            min-width: 0 !important;
            padding: 10px 12px !important;
            border-radius: 16px !important;
            display: grid !important;
            grid-template-columns: 1fr auto !important;
            align-items: center !important;
          }

          .profissionais-resumo-card > div:nth-child(2) {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            width: 100% !important;
            min-width: 0 !important;
          }

          .profissionais-resumo-card > div:nth-child(2) > div {
            min-width: 0 !important;
            padding: 10px !important;
            border-radius: 14px !important;
          }

          .profissionais-cadastro-card {
            padding: 14px !important;
            border-radius: 22px !important;
            margin-bottom: 16px !important;
            overflow: hidden !important;
          }

          .profissionais-cadastro-card > div:first-child {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) 48px !important;
            align-items: center !important;
            gap: 12px !important;
            width: 100% !important;
            min-width: 0 !important;
          }

          .profissionais-cadastro-card h2 {
            font-size: 23px !important;
            line-height: 1.05 !important;
            max-width: 100% !important;
          }

          .profissionais-cadastro-card p {
            font-size: 12px !important;
            line-height: 1.35 !important;
            margin-top: 6px !important;
          }

          .profissionais-cadastro-card .profissional-botao-plus {
            width: 48px !important;
            min-width: 48px !important;
            max-width: 48px !important;
            height: 48px !important;
            min-height: 48px !important;
            padding: 0 !important;
            margin-left: 0 !important;
            border-radius: 16px !important;
            justify-self: end !important;
            font-size: 26px !important;
          }

          @media (max-width: 900px) {
            .profissionais-mobile-safe section.profissionais-resumo-card {
              display: grid !important;
              grid-template-columns: 1fr !important;
              overflow: visible !important;
              gap: 12px !important;
              padding: 18px !important;
              border-radius: 26px !important;
            }

            .profissionais-mobile-safe section.profissionais-resumo-card > div {
              min-width: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              scroll-snap-align: unset !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:first-child {
              display: grid !important;
              grid-template-columns: 56px minmax(0, 1fr) !important;
              gap: 14px !important;
              align-items: start !important;
              margin-bottom: 0 !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:first-child
              > div:first-child {
              display: contents !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:first-child
              > div:first-child
              > div:first-child {
              width: 56px !important;
              height: 56px !important;
              border-radius: 18px !important;
              font-size: 24px !important;
              grid-column: 1 !important;
              grid-row: 1 / span 2 !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:first-child
              > div:first-child
              > div:last-child {
              grid-column: 2 !important;
              min-width: 0 !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:first-child
              > div:last-child {
              display: none !important;
            }

            .profissionais-mobile-safe section.profissionais-resumo-card h2 {
              font-size: 25px !important;
              line-height: 1.05 !important;
              margin-top: 0 !important;
            }

            .profissionais-mobile-safe section.profissionais-resumo-card p {
              font-size: 13px !important;
              line-height: 1.45 !important;
              margin-top: 6px !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:nth-child(2) {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              gap: 10px !important;
              overflow: visible !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:nth-child(2)
              > div {
              min-width: 0 !important;
              padding: 12px !important;
              border-radius: 17px !important;
            }

            .profissionais-mobile-safe
              section.profissionais-resumo-card
              > div:last-child {
              display: grid !important;
              grid-template-columns: auto minmax(0, 1fr) auto !important;
              align-items: center !important;
              gap: 10px !important;
              min-height: 48px !important;
              padding: 12px 14px !important;
              border-radius: 18px !important;
            }
          }

          @media (max-width: 760px) {
            .profissionais-form-grid-v2 {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 10px !important;
              margin-top: 14px !important;
            }

            .profissionais-form-grid-v2 > div,
            .profissionais-form-grid-v2 > label {
              min-width: 0 !important;
            }

            .profissionais-form-grid-v2 label {
              font-size: 12.5px !important;
              font-weight: 900 !important;
              color: #e2e8f0 !important;
            }

            .profissionais-form-grid-v2 input,
            .profissionais-form-grid-v2 select,
            .profissionais-form-grid-v2 textarea {
              min-height: 42px !important;
              border-radius: 15px !important;
              font-size: 13px !important;
              padding: 12px 14px !important;
            }

            .profissionais-form-grid-v2 textarea {
              min-height: 74px !important;
            }

            .profissionais-form-grid-v2 input[type="file"] {
              padding: 10px !important;
              font-size: 12px !important;
            }

            .profissionais-ativo-check-v2 {
              display: grid !important;
              grid-template-columns: 28px minmax(0, 1fr) !important;
              align-items: center !important;
              gap: 10px !important;
              padding: 12px !important;
              border-radius: 16px !important;
              background: rgba(2, 6, 23, 0.52) !important;
              border: 1px solid rgba(255, 255, 255, 0.08) !important;
            }

            .profissionais-comissao-v2,
            .profissionais-servicos-v2,
            .profissionais-agenda-v2 {
              padding: 12px !important;
              border-radius: 18px !important;
              background: rgba(2, 6, 23, 0.42) !important;
              border: 1px solid rgba(255, 255, 255, 0.07) !important;
            }

            .profissionais-comissao-v2 h3,
            .profissionais-servicos-v2 h3,
            .profissionais-agenda-v2 h3 {
              font-size: 17px !important;
              line-height: 1.1 !important;
              margin: 0 0 6px !important;
            }

            .profissionais-comissao-v2 p,
            .profissionais-agenda-v2 p {
              font-size: 11.5px !important;
              line-height: 1.35 !important;
            }

            .profissional-agenda-dia-linha-v2 {
              display: grid !important;
              grid-template-columns: 34px minmax(0, 1fr) auto !important;
              grid-template-areas:
                "check day badge"
                "button button button" !important;
              gap: 8px !important;
              align-items: center !important;
              padding: 12px 0 !important;
            }

            .profissional-agenda-dia-linha-v2 > label {
              grid-area: check !important;
              justify-self: start !important;
            }

            .profissional-agenda-dia-linha-v2 > strong {
              grid-area: day !important;
              font-size: 15px !important;
            }

            .profissional-agenda-dia-linha-v2 > button {
              grid-area: button !important;
              height: 36px !important;
              min-height: 36px !important;
              font-size: 11px !important;
              border-radius: 13px !important;
            }

            .profissional-agenda-dia-linha-v2 > span {
              grid-area: badge !important;
              justify-self: end !important;
              height: 26px !important;
              font-size: 11px !important;
            }

            .profissionais-filtros-v2 {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 7px !important;
            }

            .profissionais-filtros-v2 > span {
              grid-column: 1 / -1 !important;
              justify-self: start !important;
              width: auto !important;
            }

            .profissionais-grid-horizontal {
              display: grid !important;
              grid-template-columns: 1fr !important;
              overflow: visible !important;
              gap: 10px !important;
              padding: 0 !important;
            }

            .profissional-card-horizontal {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              flex: none !important;
              padding: 14px !important;
              border-radius: 20px !important;
              min-height: auto !important;
            }

            .profissional-card-horizontal .profissional-info-mobile {
              display: grid !important;
              grid-template-columns: 50px minmax(0, 1fr) !important;
              gap: 10px !important;
              align-items: start !important;
            }

            .profissional-card-horizontal .profissional-avatar-mobile {
              width: 50px !important;
              height: 50px !important;
              min-width: 50px !important;
              max-width: 50px !important;
              border-radius: 17px !important;
            }

            .profissional-tags-v2 {
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 6px !important;
              margin-top: 8px !important;
              max-height: 64px !important;
              overflow: hidden !important;
            }

            .profissional-tags-v2 span {
              max-width: 100% !important;
              height: 25px !important;
              padding: 0 9px !important;
              font-size: 10.5px !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }

            .profissional-actions-v2 {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
              margin-top: 10px !important;
            }

            .profissional-actions-v2 button {
              height: 36px !important;
              min-height: 36px !important;
              border-radius: 13px !important;
              font-size: 11px !important;
            }
          }

          .profissionais-detalhe-compacto > summary::-webkit-details-marker {
            display: none;
          }

          .profissionais-detalhe-compacto[open] > summary b {
            transform: rotate(45deg);
          }

          @media (max-width: 760px) {
            .profissionais-resumo-card {
              display: none !important;
            }

            .profissionais-cadastro-card {
              margin-bottom: 12px !important;
            }

            .profissionais-cadastro-card > div:first-child p,
            .profissionais-mobile-safe section:nth-of-type(3) p {
              display: none !important;
            }

            .profissionais-detalhe-compacto {
              padding: 0 !important;
              background: rgba(2, 6, 23, 0.34) !important;
              border: 1px solid rgba(255, 255, 255, 0.07) !important;
              border-radius: 16px !important;
              overflow: hidden !important;
            }

            .profissionais-detalhe-compacto > summary {
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) auto !important;
              align-items: center !important;
              gap: 12px !important;
              min-height: 54px !important;
              padding: 12px 14px !important;
              cursor: pointer !important;
              list-style: none !important;
            }

            .profissionais-detalhe-compacto > summary strong {
              display: block !important;
              font-size: 14px !important;
              line-height: 1.1 !important;
            }

            .profissionais-detalhe-compacto > summary small {
              display: block !important;
              color: #94a3b8 !important;
              font-size: 11px !important;
              margin-top: 3px !important;
            }

            .profissionais-detalhe-compacto > summary b {
              width: 28px !important;
              height: 28px !important;
              border-radius: 10px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              background: rgba(124, 58, 237, 0.18) !important;
              color: #ddd6fe !important;
              transition: transform 0.18s ease !important;
            }

            .profissionais-detalhe-compacto > div {
              padding: 12px !important;
              border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
            }

            .profissionais-detalhe-compacto > div > h3:first-child,
            .profissionais-detalhe-compacto > div > h3:first-child + p {
              display: none !important;
            }

            .profissionais-detalhe-compacto button {
              min-height: 38px !important;
            }

            .profissionais-servicos-v2 label {
              min-height: 66px !important;
              padding: 11px !important;
              border-radius: 16px !important;
            }

            .profissionais-servicos-v2 label strong {
              font-size: 14px !important;
              line-height: 1.1 !important;
            }

            .profissional-agenda-dia-linha-v2 {
              grid-template-columns: 28px minmax(0, 1fr) auto !important;
              grid-template-areas: "check day badge" "button button button" !important;
              padding: 9px 0 !important;
            }

            .profissional-agenda-dia-linha-v2 > label span {
              width: 24px !important;
              height: 24px !important;
              border-radius: 8px !important;
            }

            .profissional-agenda-dia-linha-v2 > button {
              height: 32px !important;
              min-height: 32px !important;
            }

            .profissional-card-horizontal {
              gap: 8px !important;
            }

            .profissional-card-horizontal .profissional-info-mobile {
              grid-template-columns: 46px minmax(0, 1fr) !important;
            }

            .profissional-card-horizontal .profissional-avatar-mobile {
              width: 46px !important;
              height: 46px !important;
              min-width: 46px !important;
              max-width: 46px !important;
            }

            .profissional-tags-v2 {
              max-height: 55px !important;
              gap: 5px !important;
            }

            .profissional-tags-v2 span {
              height: 23px !important;
              font-size: 10px !important;
            }

            .profissional-actions-v2 {
              grid-template-columns: 1fr 1fr !important;
              margin-top: 8px !important;
            }

            .profissional-actions-v2 button {
              height: 34px !important;
              min-height: 34px !important;
            }
          }

          @media (max-width: 760px) {
            .profissionais-topo-compacto-v3 {
              min-height: auto !important;
              padding: 12px !important;
              margin-bottom: 8px !important;
              border-radius: 19px !important;
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) auto !important;
              align-items: center !important;
              gap: 10px !important;
              background: linear-gradient(
                135deg,
                rgba(15, 23, 42, 0.96),
                rgba(2, 6, 23, 0.88)
              ) !important;
              box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2) !important;
            }

            .profissionais-topo-compacto-v3 > div:first-child {
              display: grid !important;
              grid-template-columns: 38px minmax(0, 1fr) !important;
              gap: 10px !important;
              align-items: center !important;
              min-width: 0 !important;
            }

            .profissionais-topo-compacto-v3
              > div:first-child
              > div:first-child {
              width: 38px !important;
              height: 38px !important;
              border-radius: 14px !important;
              font-size: 18px !important;
            }

            .profissionais-topo-compacto-v3 h1 {
              font-size: 22px !important;
              line-height: 1 !important;
              margin: 0 !important;
            }

            .profissionais-topo-compacto-v3 p {
              display: none !important;
            }

            .profissionais-topo-compacto-v3 > div:last-child {
              height: 31px !important;
              padding: 0 10px !important;
              border-radius: 999px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-size: 11px !important;
            }

            .profissionais-resumo-card {
              display: none !important;
            }

            .profissionais-mini-resumo-mobile {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 7px !important;
              margin: 0 0 10px !important;
            }

            .profissionais-mini-resumo-mobile span {
              min-height: 34px !important;
              border-radius: 13px !important;
              background: rgba(15, 23, 42, 0.82) !important;
              border: 1px solid rgba(255, 255, 255, 0.08) !important;
              color: #dbeafe !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              text-align: center !important;
              font-size: 10.5px !important;
              font-weight: 900 !important;
              line-height: 1.05 !important;
              padding: 0 6px !important;
              white-space: nowrap !important;
            }

            .profissionais-cadastro-card {
              margin-top: 0 !important;
              margin-bottom: 10px !important;
            }
          }

          @media (max-width: 430px) {
            .profissionais-mobile-safe header > div:first-child {
              grid-template-columns: 1fr !important;
            }

            .profissionais-mobile-safe
              header
              > div:first-child
              > div:first-child {
              width: 52px !important;
              height: 52px !important;
            }

            .profissionais-mobile-safe
              section:nth-of-type(3)
              > div:first-child
              > div:last-child {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            className="profissionais-topo-compacto-v3"
            style={topoModuloCompacto}
          >
            <div style={topoModuloEsquerda}>
              <div style={topoModuloIcone}>👷</div>

              <div>
                <h1 style={topoModuloTitulo}>Profissionais</h1>
                <p style={topoModuloSubtitulo}>
                  Equipe, agenda semanal, serviços e comissão.
                </p>
              </div>
            </div>

            <div style={topoModuloBadge}>
              {totalAtivos} ativo{totalAtivos === 1 ? "" : "s"}
            </div>
          </div>

          <div
            className="profissionais-mini-resumo-mobile"
            style={miniResumoMobile}
          >
            <span>{profissionais.length} total</span>
            <span>{totalAtivos} ativos</span>
            <span>{totalComServicos} com serviços</span>
          </div>

          <section
            className="profissionais-resumo-card"
            style={equipeDashboardCard}
          >
            <div style={equipeDashboardHeader}>
              <div style={equipeDashboardTituloBox}>
                <div style={equipeDashboardIcone}>💎</div>

                <div>
                  <span style={sectionEyebrow}>Equipe inteligente</span>
                  <h2 style={sectionTitle}>Resumo profissional</h2>
                  <p style={dashboardTexto}>
                    Visão rápida da equipe, comissão e disponibilidade.
                  </p>
                </div>
              </div>

              <div style={dashboardTotalBox}>
                <span>Equipe</span>
                <strong>{profissionais.length}</strong>
              </div>
            </div>

            <div style={dashboardStatsGrid}>
              <div style={dashboardStatItem}>
                <span>Ativos</span>
                <strong>{totalAtivos}</strong>
              </div>

              <div style={dashboardStatItem}>
                <span>Inativos</span>
                <strong>{totalInativos}</strong>
              </div>

              <div style={dashboardStatItem}>
                <span>Com serviços</span>
                <strong>{totalComServicos}</strong>
              </div>

              <div style={dashboardStatItem}>
                <span>Comissão média</span>
                <strong>{comissaoMedia}%</strong>
              </div>
            </div>
          </section>

          <section
            className="profissionais-cadastro-card"
            style={formCardCompacto}
          >
            <div style={cadastroCompactHeader}>
              <div>
                <h2 style={sectionTitle}>
                  {editandoId
                    ? "Editar profissional"
                    : "Cadastrar profissional"}
                </h2>
                <p style={cadastroCompactTexto}>
                  Configure dados, serviços, agenda semanal e comissão.
                </p>
              </div>

              <button
                className="profissional-botao-plus"
                type="button"
                onClick={() => {
                  if (acaoProfissionalEmAndamento) return;
                  setFormProfissionalAberto((aberto) => !aberto);
                }}
                disabled={acaoProfissionalEmAndamento}
                aria-label={
                  formProfissionalAberto
                    ? "Fechar cadastro de profissional"
                    : "Abrir cadastro de profissional"
                }
                style={{
                  ...botaoAbrirCadastro,
                  opacity: acaoProfissionalEmAndamento ? 0.55 : 1,
                  cursor: acaoProfissionalEmAndamento
                    ? "not-allowed"
                    : "pointer",
                  background: formProfissionalAberto
                    ? "rgba(255,255,255,0.08)"
                    : `linear-gradient(135deg, ${empresa?.corSidebar || "#7c3aed"}, ${
                        empresa?.corSecundaria || "#06b6d4"
                      })`,
                  boxShadow: formProfissionalAberto
                    ? "none"
                    : `0 16px 36px ${hexToRgba(empresa?.corSidebar || "#7c3aed", 0.28)}`,
                }}
              >
                {formProfissionalAberto ? "×" : "+"}
              </button>
            </div>

            {formProfissionalAberto && (
              <>
                <div className="profissionais-form-grid-v2" style={gridForm}>
                  <div style={campo}>
                    <label>Nome *</label>
                    <input
                      style={input}
                      value={form.nome}
                      onChange={(e) =>
                        setForm({ ...form, nome: e.target.value })
                      }
                      placeholder="Ex: João Silva"
                    />
                  </div>

                  <div style={campo}>
                    <label>Foto do profissional</label>
                    <input
                      type="file"
                      accept="image/*"
                      style={input}
                      onChange={selecionarFoto}
                    />

                    {form.fotoUrl && (
                      <img
                        src={form.fotoUrl}
                        alt="Prévia"
                        style={{
                          width: 76,
                          height: 76,
                          borderRadius: 999,
                          objectFit: "cover",
                          border: "2px solid #e2e8f0",
                          marginTop: 8,
                        }}
                      />
                    )}
                  </div>

                  <div style={{ ...campo, gridColumn: "1 / -1" }}>
                    <label>Bio / descrição</label>
                    <textarea
                      style={{ ...input, minHeight: 90, resize: "vertical" }}
                      value={form.bio}
                      onChange={(e) =>
                        setForm({ ...form, bio: e.target.value })
                      }
                      placeholder="Ex: Especialista em cortes femininos..."
                    />
                  </div>

                  <label
                    className="profissionais-ativo-check-v2"
                    style={checkLinha}
                  >
                    <input
                      type="checkbox"
                      checked={form.ativo}
                      onChange={(e) =>
                        setForm({ ...form, ativo: e.target.checked })
                      }
                    />
                    Profissional ativo
                  </label>

                  <details
                    className="profissionais-comissao-v2 profissionais-detalhe-compacto"
                    style={{ ...campo, gridColumn: "1 / -1", marginTop: 8 }}
                  >
                    <summary style={detalheCompactoSummary}>
                      <span>
                        <strong>Comissão</strong>
                        <small>
                          {form.modoComissao === "por_servico"
                            ? "Por serviço"
                            : "Geral"}
                          {form.valorComissao
                            ? ` · ${form.valorComissao}${form.tipoComissao === "percentual" ? "%" : ""}`
                            : ""}
                        </small>
                      </span>
                      <b>+</b>
                    </summary>

                    <div style={detalheCompactoContent}>
                      <h3 style={{ marginBottom: 4 }}>
                        Comissão do profissional
                      </h3>
                      <p
                        style={{
                          margin: "0 0 12px",
                          color: "#94a3b8",
                          fontSize: 13,
                        }}
                      >
                        Escolha se este profissional recebe uma comissão geral
                        ou uma comissão diferenciada por serviço realizado.
                      </p>

                      <div style={modoComissaoGrid}>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, modoComissao: "geral" })
                          }
                          style={
                            form.modoComissao === "geral"
                              ? modoComissaoAtivo
                              : modoComissaoInativo
                          }
                        >
                          <strong>Comissão geral</strong>
                          <span>Usa a mesma regra para todos os serviços.</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, modoComissao: "por_servico" })
                          }
                          style={
                            form.modoComissao === "por_servico"
                              ? modoComissaoAtivo
                              : modoComissaoInativo
                          }
                        >
                          <strong>Comissão por serviço</strong>
                          <span>
                            Permite percentual ou valor fixo por serviço.
                          </span>
                        </button>
                      </div>

                      <div style={{ ...comissaoGrid, marginTop: 14 }}>
                        <div style={campo}>
                          <label>
                            {form.modoComissao === "por_servico"
                              ? "Tipo de comissão geral fallback"
                              : "Tipo de comissão"}
                          </label>
                          <select
                            style={input}
                            value={form.tipoComissao}
                            onChange={(e) =>
                              setForm({ ...form, tipoComissao: e.target.value })
                            }
                          >
                            <option value="percentual">Percentual (%)</option>
                            <option value="fixo">Valor fixo (R$)</option>
                          </select>
                        </div>

                        <div style={campo}>
                          <label>
                            {form.modoComissao === "por_servico"
                              ? "Comissão geral fallback"
                              : form.tipoComissao === "percentual"
                                ? "Percentual da comissão"
                                : "Valor fixo da comissão"}
                          </label>
                          <input
                            style={input}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={
                              form.tipoComissao === "percentual"
                                ? "Ex: 40"
                                : "Ex: 25,00"
                            }
                            value={form.valorComissao}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                valorComissao: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {form.modoComissao === "por_servico" && (
                        <div style={comissaoAviso}>
                          💡 Configure a comissão individual nos serviços
                          marcados abaixo. Se algum serviço ficar sem comissão
                          específica, o sistema usa a comissão geral fallback.
                        </div>
                      )}
                    </div>
                  </details>
                </div>

                <details
                  className="profissionais-servicos-v2 profissionais-detalhe-compacto"
                  style={{ marginTop: 18 }}
                >
                  <summary style={detalheCompactoSummary}>
                    <span>
                      <strong>Serviços</strong>
                      <small>
                        {form.servicosIds.length} selecionado
                        {form.servicosIds.length === 1 ? "" : "s"}
                      </small>
                    </span>
                    <b>+</b>
                  </summary>

                  <div style={detalheCompactoContent}>
                    <h3>Serviços que este profissional realiza</h3>

                    {servicosAtivosDisponiveis().length === 0 ? (
                      <p style={{ color: "#64748b" }}>
                        Nenhum serviço ativo disponível. Ative ou cadastre um
                        serviço primeiro.
                      </p>
                    ) : (
                      <div style={servicosGrid}>
                        {servicosAtivosDisponiveis().map((servico) => {
                          const selecionado = form.servicosIds.includes(
                            servico.id,
                          );

                          return (
                            <label
                              key={servico.id}
                              style={
                                selecionado
                                  ? checkboxCardSelecionado
                                  : checkboxCard
                              }
                            >
                              <input
                                type="checkbox"
                                checked={selecionado}
                                onChange={() => alternarServico(servico.id)}
                                style={checkboxReal}
                              />

                              <span
                                style={
                                  selecionado
                                    ? checkboxVisualSelecionado
                                    : checkboxVisual
                                }
                              >
                                {selecionado ? "✓" : ""}
                              </span>

                              <div style={checkboxTextoArea}>
                                <strong style={checkboxTitulo}>
                                  {servico.nome}
                                </strong>
                                <span style={checkboxDescricao}>
                                  {servico.duracaoMin} min · R$ {servico.valor}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {form.modoComissao === "por_servico" &&
                      servicosDoProfissional().length > 0 && (
                        <div style={comissoesServicosBox}>
                          <div style={comissoesServicosHeader}>
                            <div>
                              <h3 style={{ margin: 0 }}>
                                Comissão por serviço
                              </h3>
                              <p style={comissoesServicosTexto}>
                                Defina uma comissão individual para cada serviço
                                deste profissional.
                              </p>
                            </div>

                            <span style={badgeComissaoPremium}>
                              {servicosDoProfissional().length} serviço
                              {servicosDoProfissional().length === 1 ? "" : "s"}
                            </span>
                          </div>

                          <div style={comissoesServicosLista}>
                            {servicosDoProfissional().map((servico) => {
                              const comissaoServico = obterComissaoServico(
                                servico.id,
                              );

                              return (
                                <div
                                  key={servico.id}
                                  style={comissaoServicoCard}
                                >
                                  <div>
                                    <strong style={comissaoServicoNome}>
                                      {servico.nome}
                                    </strong>
                                    <p style={comissaoServicoDetalhe}>
                                      Valor do serviço: R${" "}
                                      {Number(
                                        servico.valor || 0,
                                      ).toLocaleString("pt-BR", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </p>
                                  </div>

                                  <div style={comissaoServicoCampos}>
                                    <div style={campo}>
                                      <label>Tipo</label>
                                      <select
                                        style={input}
                                        value={comissaoServico.tipoComissao}
                                        onChange={(e) =>
                                          atualizarComissaoServico(
                                            servico.id,
                                            "tipoComissao",
                                            e.target.value,
                                          )
                                        }
                                      >
                                        <option value="percentual">
                                          Percentual (%)
                                        </option>
                                        <option value="fixo">
                                          Valor fixo (R$)
                                        </option>
                                      </select>
                                    </div>

                                    <div style={campo}>
                                      <label>
                                        {comissaoServico.tipoComissao ===
                                        "percentual"
                                          ? "Percentual"
                                          : "Valor fixo"}
                                      </label>
                                      <input
                                        style={input}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder={
                                          comissaoServico.tipoComissao ===
                                          "percentual"
                                            ? "Ex: 40"
                                            : "Ex: 60,00"
                                        }
                                        value={comissaoServico.valorComissao}
                                        onChange={(e) =>
                                          atualizarComissaoServico(
                                            servico.id,
                                            "valorComissao",
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                </details>

                <details
                  className="profissionais-agenda-v2 profissionais-detalhe-compacto"
                  style={{ marginTop: 18 }}
                >
                  <summary style={detalheCompactoSummary}>
                    <span>
                      <strong>Agenda semanal</strong>
                      <small>
                        {disponibilidade.filter((dia) => dia.ativo).length} dia
                        {disponibilidade.filter((dia) => dia.ativo).length === 1
                          ? ""
                          : "s"}{" "}
                        ativo
                        {disponibilidade.filter((dia) => dia.ativo).length === 1
                          ? ""
                          : "s"}
                      </small>
                    </span>
                    <b>+</b>
                  </summary>

                  <div style={detalheCompactoContent}>
                    <h3 style={{ marginBottom: 4 }}>Agenda semanal</h3>
                    <p
                      style={{
                        margin: "0 0 14px",
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      Configure múltiplos blocos por dia. Exemplo: 08:00 às
                      12:00 e 13:00 às 18:00.
                    </p>

                    <div style={agendaResumoBox}>
                      <div style={agendaResumoTopo}>
                        <button
                          type="button"
                          onClick={() => copiarHorarioParaTodos(1)}
                          style={botaoAgendaAcao}
                        >
                          📅 Copiar todos
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const todosAtivos = disponibilidade.every(
                              (dia) => dia.ativo,
                            );
                            setDisponibilidade((atual) =>
                              atual.map((dia) => ({
                                ...dia,
                                ativo: !todosAtivos,
                              })),
                            );
                          }}
                          style={botaoAgendaLink}
                        >
                          {disponibilidade.every((dia) => dia.ativo)
                            ? "Desmarcar todos"
                            : "Marcar todos"}
                        </button>
                      </div>

                      <div style={agendaListaMobile}>
                        {diasSemana.map((dia, index) => {
                          const ativo = disponibilidade[index].ativo;
                          const aberto = diaAgendaAberto === index;

                          return (
                            <div key={dia.value} style={agendaDiaLinhaBox}>
                              <div
                                className="profissional-agenda-dia-linha-v2"
                                style={agendaDiaLinha}
                              >
                                <label style={agendaDiaCheckLabel}>
                                  <input
                                    type="checkbox"
                                    checked={ativo}
                                    onChange={(e) =>
                                      atualizarDia(
                                        index,
                                        "ativo",
                                        e.target.checked,
                                      )
                                    }
                                    style={checkboxReal}
                                  />

                                  <span
                                    style={
                                      ativo
                                        ? checkboxVisualSelecionado
                                        : checkboxVisual
                                    }
                                  >
                                    {ativo ? "✓" : ""}
                                  </span>
                                </label>

                                <strong style={agendaDiaNome}>
                                  {dia.label}
                                </strong>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDiaAgendaAberto(aberto ? null : index)
                                  }
                                  style={
                                    ativo
                                      ? botaoEditarHorariosAtivo
                                      : botaoEditarHorariosInativo
                                  }
                                  disabled={!ativo}
                                >
                                  📅{" "}
                                  {aberto
                                    ? "Ocultar horários"
                                    : "Editar horários"}
                                </button>

                                <span
                                  style={
                                    ativo
                                      ? badgeDiaAtivoPremium
                                      : badgeDiaInativoPremium
                                  }
                                >
                                  {ativo ? "Ativo" : "Inativo"}
                                </span>
                              </div>

                              {aberto && ativo && (
                                <div style={agendaDiaDetalhe}>
                                  <div style={agendaDiaAcoesInline}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        copiarHorarioParaTodos(index)
                                      }
                                      style={botaoCopiarHorarioPremium}
                                    >
                                      Copiar para todos
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        copiarHorarioDiasUteis(index)
                                      }
                                      style={botaoCopiarHorarioPremium}
                                    >
                                      Copiar dias úteis
                                    </button>
                                  </div>

                                  <div style={blocosWrapper}>
                                    {disponibilidade[index].blocos.map(
                                      (bloco, blocoIndex) => (
                                        <div
                                          key={`${dia.value}-${blocoIndex}`}
                                          style={blocoCardPremium}
                                        >
                                          <div style={blocoLinhaPremium}>
                                            <input
                                              type="time"
                                              value={bloco.horaInicio}
                                              onChange={(e) =>
                                                atualizarBloco(
                                                  index,
                                                  blocoIndex,
                                                  "horaInicio",
                                                  e.target.value,
                                                )
                                              }
                                              style={inputHorarioPremium}
                                            />

                                            <span style={separadorHorario}>
                                              até
                                            </span>

                                            <input
                                              type="time"
                                              value={bloco.horaFim}
                                              onChange={(e) =>
                                                atualizarBloco(
                                                  index,
                                                  blocoIndex,
                                                  "horaFim",
                                                  e.target.value,
                                                )
                                              }
                                              style={inputHorarioPremium}
                                            />

                                            {disponibilidade[index].blocos
                                              .length > 1 && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removerBloco(
                                                    index,
                                                    blocoIndex,
                                                  )
                                                }
                                                style={botaoRemoverBlocoPremium}
                                                title="Remover horário"
                                              >
                                                ×
                                              </button>
                                            )}
                                          </div>

                                          <div style={servicosBlocoBox}>
                                            <span style={servicosBlocoTitulo}>
                                              Serviços neste horário
                                            </span>

                                            {servicosDoProfissional().length ===
                                            0 ? (
                                              <span style={servicosBlocoVazio}>
                                                Marque primeiro os serviços que
                                                este profissional realiza.
                                              </span>
                                            ) : (
                                              <div style={servicosBlocoGrid}>
                                                {servicosDoProfissional().map(
                                                  (servico) => {
                                                    const selecionado =
                                                      bloco.servicosIds.includes(
                                                        servico.id,
                                                      );

                                                    return (
                                                      <button
                                                        key={servico.id}
                                                        type="button"
                                                        onClick={() =>
                                                          alternarServicoBloco(
                                                            index,
                                                            blocoIndex,
                                                            servico.id,
                                                          )
                                                        }
                                                        style={
                                                          selecionado
                                                            ? servicoBlocoSelecionado
                                                            : servicoBlocoNaoSelecionado
                                                        }
                                                      >
                                                        {servico.nome}
                                                      </button>
                                                    );
                                                  },
                                                )}
                                              </div>
                                            )}

                                            <p style={servicosBlocoAjuda}>
                                              Se nenhum serviço for marcado,
                                              este horário ficará disponível
                                              para todos os serviços do
                                              profissional.
                                            </p>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => adicionarBloco(index)}
                                    style={botaoAdicionarBlocoPremium}
                                  >
                                    + Adicionar horário
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </details>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 24,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={salvar}
                    disabled={acaoProfissionalEmAndamento}
                    style={{
                      ...botaoPrincipal,
                      opacity: acaoProfissionalEmAndamento ? 0.65 : 1,
                      cursor: acaoProfissionalEmAndamento
                        ? "not-allowed"
                        : "pointer",
                    }}
                  >
                    {salvandoProfissional
                      ? editandoId
                        ? "Salvando alterações... aguarde"
                        : "Cadastrando profissional... aguarde"
                      : carregandoEdicaoProfissionalId
                        ? "Carregando edição... aguarde"
                        : profissionalStatusProcessandoId
                          ? "Processando... aguarde"
                          : editandoId
                            ? "Salvar alterações"
                            : "Cadastrar profissional"}
                  </button>

                  {editandoId && (
                    <button
                      type="button"
                      onClick={limparFormulario}
                      disabled={acaoProfissionalEmAndamento}
                      style={{
                        ...botaoSecundario,
                        opacity: acaoProfissionalEmAndamento ? 0.55 : 1,
                        cursor: acaoProfissionalEmAndamento
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      {acaoProfissionalEmAndamento
                        ? "Aguarde..."
                        : "Cancelar edição"}
                    </button>
                  )}
                </div>
              </>
            )}
          </section>

          <section style={listaCardCompacto}>
            <div style={listaHeader}>
              <div>
                <h2 style={sectionTitle}>Lista de profissionais</h2>
                <p style={listaDescricao}>
                  Pesquise por nome, serviço, descrição ou comissão.
                </p>
              </div>

              <div style={listaAcoesCompactas}>
                <div style={buscaAreaCompacta}>
                  <span style={buscaIcone}>🔎</span>
                  <input
                    value={buscaProfissional}
                    onChange={(e) => setBuscaProfissional(e.target.value)}
                    placeholder="Buscar profissional, serviço ou comissão"
                    style={inputBuscaCompacto}
                  />
                </div>

                <div
                  className="profissionais-filtros-v2"
                  style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
                >
                  <button
                    onClick={() => setFiltroStatus("todos")}
                    style={{
                      ...filtroBotao,
                      background:
                        filtroStatus === "todos"
                          ? "rgba(124,58,237,0.22)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  >
                    Todos
                  </button>

                  <button
                    onClick={() => setFiltroStatus("ativos")}
                    style={{
                      ...filtroBotao,
                      background:
                        filtroStatus === "ativos"
                          ? "rgba(34,197,94,0.18)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  >
                    Ativos
                  </button>

                  <button
                    onClick={() => setFiltroStatus("inativos")}
                    style={{
                      ...filtroBotao,
                      background:
                        filtroStatus === "inativos"
                          ? "rgba(239,68,68,0.18)"
                          : "rgba(255,255,255,0.04)",
                    }}
                  >
                    Inativos
                  </button>

                  <span style={listaBadge}>
                    {profissionaisFiltrados.length} profissionais
                  </span>
                </div>
              </div>
            </div>

            {carregando && <p>Carregando profissionais...</p>}

            {!carregando && profissionais.length === 0 && (
              <p style={{ color: "#64748b" }}>
                Nenhum profissional cadastrado ainda.
              </p>
            )}

            <div
              className="profissionais-grid-horizontal"
              style={profissionaisGrid}
            >
              {profissionaisFiltrados.map((p) => (
                <div
                  key={p.id}
                  className="profissional-card-horizontal"
                  style={{
                    ...cardProfissional,
                    opacity: p.ativo ? 1 : 0.72,
                  }}
                >
                  <div
                    className="profissional-info-mobile"
                    style={profissionalInfo}
                  >
                    <div
                      className="profissional-avatar-mobile"
                      style={avatarPremium}
                    >
                      {p.fotoUrl ? (
                        <img
                          src={p.fotoUrl}
                          alt={p.nome}
                          className="profissional-avatar-img-mobile"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center top",
                            display: "block",
                          }}
                        />
                      ) : (
                        p.nome?.charAt(0)?.toUpperCase()
                      )}
                    </div>

                    <div>
                      <div style={profissionalNomeLinha}>
                        <strong style={profissionalNome}>{p.nome}</strong>

                        <span
                          style={
                            p.ativo
                              ? badgeProfissionalAtivo
                              : badgeProfissionalInativo
                          }
                        >
                          {p.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <p style={profissionalBio}>
                        {p.bio || "Sem descrição cadastrada"}
                      </p>

                      <div
                        className="profissional-tags-v2"
                        style={profissionalTags}
                      >
                        {p.servicos?.length > 0 ? (
                          p.servicos.map((item: any) => (
                            <span key={item.id} style={badgeServicoPremium}>
                              {item.servico?.nome}
                              {p.modoComissao === "por_servico"
                                ? ` · ${formatarComissaoServico(item)}`
                                : ""}
                            </span>
                          ))
                        ) : (
                          <span style={badgeCinzaPremium}>
                            Sem serviços vinculados
                          </span>
                        )}

                        <span style={badgeComissaoPremium}>
                          {formatarComissao(p)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="profissional-actions-v2"
                    style={profissionalActions}
                  >
                    <button
                      onClick={() => editar(p)}
                      disabled={acaoProfissionalEmAndamento}
                      style={{
                        ...botaoEditarPremium,
                        opacity: acaoProfissionalEmAndamento ? 0.55 : 1,
                        cursor: acaoProfissionalEmAndamento
                          ? "not-allowed"
                          : "pointer",
                        background: `linear-gradient(135deg, ${empresa?.corSidebar || "#d709ab"}, ${
                          empresa?.corSecundaria || "#57f755"
                        })`,
                      }}
                    >
                      {carregandoEdicaoProfissionalId === p.id
                        ? "Carregando... aguarde"
                        : "Editar"}
                    </button>

                    <button
                      onClick={() => alternarStatusProfissional(p)}
                      disabled={acaoProfissionalEmAndamento}
                      style={{
                        ...botaoEditarPremium,
                        opacity: acaoProfissionalEmAndamento ? 0.55 : 1,
                        cursor: acaoProfissionalEmAndamento
                          ? "not-allowed"
                          : "pointer",
                        background:
                          p.ativo === false
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(239,68,68,0.12)",
                        border:
                          p.ativo === false
                            ? "1px solid rgba(34,197,94,0.22)"
                            : "1px solid rgba(239,68,68,0.22)",
                        color: p.ativo === false ? "#86efac" : "#fca5a5",
                      }}
                    >
                      {profissionalStatusProcessandoId === p.id
                        ? "Processando... aguarde"
                        : p.ativo === false
                          ? "✅ Ativar"
                          : "🚫 Inativar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </PremiumLayout>
  );
}

function hexToRgba(hex: string, alpha: number) {
  if (!hex) return `rgba(124,58,237,${alpha})`;

  const cleanHex = String(hex).replace("#", "");

  if (cleanHex.length !== 6) {
    return `rgba(124,58,237,${alpha})`;
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

const sectionEyebrow = {
  display: "inline-block",
  color: "#38bdf8",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase" as const,
  letterSpacing: ".08em",
  marginBottom: 10,
};

const sectionTitle = {
  margin: 0,
  color: "#fff",
  fontSize: 28,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  lineHeight: 1.08,
};

const topoModuloCompacto = {
  minHeight: 72,
  borderRadius: 24,
  padding: "14px 16px",
  marginBottom: 14,
  background: "rgba(2,6,23,0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 20px 55px rgba(0,0,0,0.26)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  color: "#fff",
};

const topoModuloEsquerda = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
};

const topoModuloIcone = {
  width: 44,
  height: 44,
  borderRadius: 16,
  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  flexShrink: 0,
  boxShadow: "0 16px 36px rgba(124,58,237,0.26)",
};

const topoModuloTitulo = {
  margin: 0,
  color: "#fff",
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  lineHeight: 1.05,
};

const topoModuloSubtitulo = {
  margin: "5px 0 0",
  color: "#94a3b8",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.35,
};

const topoModuloBadge = {
  padding: "9px 12px",
  borderRadius: 999,
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.20)",
  color: "#bbf7d0",
  fontSize: 12,
  fontWeight: 950,
  whiteSpace: "nowrap" as const,
};

const miniResumoMobile = {
  display: "none",
};

const equipeDashboardCard = {
  borderRadius: 26,
  padding: 18,
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.22)",
  marginBottom: 16,
  color: "#fff",
};

const equipeDashboardHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "center",
  marginBottom: 12,
  flexWrap: "wrap" as const,
};

const equipeDashboardTituloBox = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
};

const equipeDashboardIcone = {
  width: 44,
  height: 44,
  borderRadius: 16,
  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 23,
  flexShrink: 0,
};

const dashboardTexto = {
  margin: "8px 0 0",
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.55,
};

const dashboardTotalBox = {
  minWidth: 116,
  borderRadius: 18,
  padding: "12px 14px",
  background: "rgba(2,6,23,0.58)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  display: "flex",
  flexDirection: "column" as const,
  gap: 3,
};

const dashboardStatsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
};

const dashboardStatItem = {
  borderRadius: 14,
  padding: 12,
  background: "rgba(2,6,23,0.56)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
  color: "#fff",
};

const formCardCompacto = {
  borderRadius: 30,
  padding: 24,
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(124,58,237,0.30)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.26)",
  marginBottom: 24,
  color: "#fff",
};

const cadastroCompactHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const cadastroCompactTexto = {
  margin: "8px 0 0",
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.55,
};

const botaoAbrirCadastro = {
  width: 48,
  height: 48,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff",
  fontSize: 27,
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const listaCardCompacto = {
  borderRadius: 24,
  padding: 18,
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(14px)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.24)",
  color: "#fff",
};

const listaAcoesCompactas = {
  display: "grid",
  gap: 10,
  minWidth: 280,
};

const buscaAreaCompacta = {
  width: "100%",
  height: 48,
  borderRadius: 16,
  background: "rgba(2,6,23,0.66)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 14px",
};

const buscaIcone = {
  color: "#94a3b8",
  fontSize: 15,
};

const inputBuscaCompacto = {
  flex: 1,
  border: "none",
  background: "transparent",
  outline: "none",
  color: "#fff",
  fontSize: 13,
  minWidth: 0,
};

const header = {
  background: "#fff",
  borderRadius: 22,
  padding: 24,
  marginBottom: 22,
  boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const box = {
  background: "rgba(15,23,42,0.92)",
  padding: 28,
  borderRadius: 28,
  marginBottom: 24,
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
  color: "#fff",
};

const gridForm = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const campo = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
  fontWeight: 600,
};

const input = {
  padding: 13,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  outline: "none",
  background: "rgba(2,6,23,0.72)",
  color: "#fff",
  fontWeight: 700,
};

const checkLinha = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 600,
};

const comissaoGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const modoComissaoGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const modoComissaoAtivo = {
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(167,139,250,0.52)",
  background:
    "linear-gradient(135deg, rgba(124,58,237,0.30), rgba(215,9,171,0.16))",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
  textAlign: "left" as const,
  boxShadow: "0 18px 44px rgba(124,58,237,0.18)",
};

const modoComissaoInativo = {
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(2,6,23,0.55)",
  color: "#cbd5e1",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column" as const,
  gap: 6,
  textAlign: "left" as const,
};

const comissaoAviso = {
  marginTop: 14,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(34,197,94,0.20)",
  background: "rgba(34,197,94,0.10)",
  color: "#bbf7d0",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.5,
};

const comissoesServicosBox = {
  marginTop: 18,
  padding: 18,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(2,6,23,0.42)",
};

const comissoesServicosHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 14,
};

const comissoesServicosTexto = {
  margin: "6px 0 0",
  color: "#94a3b8",
  fontSize: 13,
  lineHeight: 1.5,
};

const comissoesServicosLista = {
  display: "grid",
  gap: 12,
};

const comissaoServicoCard = {
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(15,23,42,0.78)",
  display: "grid",
  gridTemplateColumns: "1fr 1.3fr",
  gap: 14,
  alignItems: "center",
};

const comissaoServicoNome = {
  color: "#fff",
  fontSize: 15,
  fontWeight: 950,
};

const comissaoServicoDetalhe = {
  margin: "6px 0 0",
  color: "#94a3b8",
  fontSize: 12,
};

const comissaoServicoCampos = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const servicosGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 10,
};

const checkboxCard = {
  minHeight: 84,
  display: "grid",
  gridTemplateColumns: "36px minmax(0, 1fr)",
  gap: 16,
  alignItems: "center",
  padding: "18px 20px",
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(2,6,23,0.55)",
  color: "#e5e7eb",
  cursor: "pointer",
  position: "relative" as const,
  overflow: "hidden",
};

const checkboxCardSelecionado = {
  ...checkboxCard,
  border: "1px solid rgba(167,139,250,0.45)",
  background:
    "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(2,6,23,0.66))",
  boxShadow: "0 18px 42px rgba(124,58,237,0.16)",
};

const checkboxReal = {
  position: "absolute" as const,
  opacity: 0,
  pointerEvents: "none" as const,
};

const checkboxVisual = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "2px solid rgba(148,163,184,0.80)",
  background: "rgba(2,6,23,0.42)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 950,
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)",
};

const checkboxVisualSelecionado = {
  ...checkboxVisual,
  border: "2px solid rgba(167,139,250,0.95)",
  background: "linear-gradient(135deg, #a855f7, #7c3aed)",
  boxShadow: "0 12px 26px rgba(124,58,237,0.34)",
};

const checkboxTextoArea = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column" as const,
  gap: 4,
};

const checkboxTitulo = {
  color: "#fff",
  fontSize: 17,
  lineHeight: 1.12,
  fontWeight: 950,
  wordBreak: "break-word" as const,
};

const checkboxDescricao = {
  color: "#94a3b8",
  fontSize: 13,
  lineHeight: 1.35,
  fontWeight: 750,
};

const agendaGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 12,
};

const diaCard = {
  padding: 16,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(2,6,23,0.55)",
};

const diaTopo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const diaTitulo = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontWeight: 900,
  color: "#ffffff",
};

const agendaResumoBox = {
  borderRadius: 24,
  padding: 16,
  background: "rgba(2,6,23,0.48)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const agendaResumoTopo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap" as const,
  marginBottom: 14,
};

const botaoAgendaAcao = {
  padding: "12px 18px",
  borderRadius: 16,
  border: "1px solid rgba(168,85,247,0.55)",
  background: "rgba(88,28,135,0.24)",
  color: "#ddd6fe",
  fontWeight: 950,
  cursor: "pointer",
};

const botaoAgendaLink = {
  padding: "12px 10px",
  borderRadius: 14,
  border: "none",
  background: "transparent",
  color: "#c084fc",
  fontWeight: 950,
  cursor: "pointer",
};

const agendaListaMobile = {
  display: "grid",
  gap: 0,
};

const agendaDiaLinhaBox = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const agendaDiaLinha = {
  minHeight: 66,
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) auto auto",
  alignItems: "center",
  gap: 12,
  padding: "12px 0",
};

const agendaDiaCheckLabel = {
  width: 34,
  height: 34,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  position: "relative" as const,
};

const agendaDiaNome = {
  minWidth: 0,
  color: "#fff",
  fontSize: 16,
  fontWeight: 950,
};

const botaoEditarHorariosAtivo = {
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(168,85,247,0.55)",
  background: "rgba(88,28,135,0.24)",
  color: "#ddd6fe",
  fontSize: 12,
  fontWeight: 950,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const botaoEditarHorariosInativo = {
  ...botaoEditarHorariosAtivo,
  opacity: 0.45,
  cursor: "not-allowed",
};

const badgeDiaAtivoPremium = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(34,197,94,0.18)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.20)",
  fontSize: 12,
  fontWeight: 950,
  whiteSpace: "nowrap" as const,
};

const badgeDiaInativoPremium = {
  ...badgeDiaAtivoPremium,
  background: "rgba(148,163,184,0.13)",
  color: "#cbd5e1",
  border: "1px solid rgba(148,163,184,0.16)",
};

const agendaDiaDetalhe = {
  padding: "0 0 14px 46px",
  display: "grid",
  gap: 12,
};

const agendaDiaAcoesInline = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap" as const,
};

const botaoCopiarHorarioPremium = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#e9d5ff",
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
};

const blocoCardPremium = {
  background: "rgba(15,23,42,0.82)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 14,
};

const blocoLinhaPremium = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 8,
};

const inputHorarioPremium = {
  width: "100%",
  minWidth: 0,
  padding: "10px 11px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  outline: "none",
  background: "rgba(2,6,23,0.72)",
  color: "#fff",
  fontWeight: 800,
};

const botaoRemoverBlocoPremium = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: "1px solid rgba(239,68,68,0.20)",
  background: "rgba(239,68,68,0.14)",
  color: "#fecaca",
  fontWeight: 950,
  cursor: "pointer",
};

const botaoAdicionarBlocoPremium = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px dashed rgba(168,85,247,0.55)",
  background: "rgba(88,28,135,0.18)",
  color: "#e9d5ff",
  fontWeight: 950,
  cursor: "pointer",
  width: "100%",
};

const blocosWrapper = {
  display: "grid",
  gap: 8,
  marginTop: 12,
};

const blocoLinha = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap" as const,
};

const inputHorario = {
  padding: "10px 11px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  outline: "none",
  background: "rgba(2,6,23,0.72)",
  color: "#fff",
  fontWeight: 700,
};

const separadorHorario = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 800,
};

const botaoAdicionarBloco = {
  marginTop: 12,
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px dashed #4f46e5",
  background: "#eef2ff",
  color: "#3730a3",
  fontWeight: 900,
  cursor: "pointer",
  width: "100%",
};

const botaoCopiarHorario = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #c7d2fe",
  background: "#fff",
  color: "#4338ca",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

const botaoRemoverBloco = {
  width: 30,
  height: 30,
  borderRadius: 999,
  border: "none",
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 900,
  cursor: "pointer",
};

const badgeDiaAtivo = {
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 11,
  background: "#dcfce7",
  color: "#166534",
  fontWeight: 900,
};

const badgeDiaInativo = {
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 11,
  background: "#e2e8f0",
  color: "#475569",
  fontWeight: 900,
};

const cardProfissional = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 22,
  padding: 16,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "flex-start",
  alignItems: "stretch",
  gap: 12,
  minWidth: 0,
  minHeight: 238,
  background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(2,6,23,0.96))",
  color: "#fff",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
  position: "relative" as const,
  overflow: "hidden",
};

const avatar = {
  width: 54,
  height: 54,
  borderRadius: 999,
  background: "#e0e7ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  color: "#4f46e5",
  overflow: "hidden",
};

const badgeServico = {
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 12,
  background: "#e0e7ff",
  color: "#3730a3",
  fontWeight: 600,
};

const badgeComissao = {
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 12,
  background: "#ecfdf5",
  color: "#166534",
  fontWeight: 700,
};

const badgeCinza = {
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 12,
  background: "#e2e8f0",
  color: "#475569",
};

const botaoPrincipal = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#4f46e5",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const botaoSecundario = {
  padding: "12px 18px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
};

const headerPremium = {
  background: "linear-gradient(135deg, #4f46e5, #9333ea)",
  color: "#fff",
  borderRadius: 28,
  padding: 34,
  marginBottom: 24,
  boxShadow: "0 20px 40px rgba(79,70,229,0.24)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 24,
  flexWrap: "wrap" as const,
};

const headerConteudo = {
  display: "flex",
  alignItems: "center",
  gap: 20,
};

const logoHeader = {
  width: 82,
  height: 82,
  borderRadius: 24,
  overflow: "hidden",
  background: "rgba(255,255,255,0.14)",
  border: "2px solid rgba(255,255,255,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 32,
  fontWeight: 900,
  color: "#fff",
};

const badgeBoasVindas = {
  display: "inline-block",
  background: "rgba(255,255,255,0.14)",
  color: "#fff",
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 10,
};

const tituloHeader = {
  margin: 0,
  fontSize: 38,
  fontWeight: 950,
  color: "#fff",
  lineHeight: 1,
};

const subtituloHeader = {
  margin: "10px 0 0",
  color: "rgba(255,255,255,0.84)",
  fontSize: 15,
  fontWeight: 600,
};

const linhaBadgesHeader = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
  marginTop: 16,
};

const badgeEmpresa = {
  background: "rgba(255,255,255,0.14)",
  color: "#fff",
  padding: "8px 13px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const badgeModulo = {
  background: "#dbeafe",
  color: "#1d4ed8",
  padding: "8px 13px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const badgeStatus = {
  background: "#22c55e",
  color: "#fff",
  padding: "8px 13px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

const acoesHeader = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap" as const,
};

const botaoHeaderClaro = {
  padding: "13px 18px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.14)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const botaoHeaderRoxo = {
  padding: "13px 18px",
  borderRadius: 14,
  border: "none",
  background: "#fff",
  color: "#6d28d9",
  fontWeight: 900,
  cursor: "pointer",
};

const blocoCard = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 14,
};

const servicosBlocoBox = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: "1px dashed rgba(255,255,255,0.14)",
};

const servicosBlocoTitulo = {
  display: "block",
  fontSize: 12,
  fontWeight: 900,
  color: "#e5e7eb",
  marginBottom: 8,
};

const servicosBlocoVazio = {
  fontSize: 12,
  color: "#94a3b8",
};

const servicosBlocoGrid = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
};

const servicoBlocoSelecionado = {
  padding: "7px 10px",
  borderRadius: 999,
  border: "1px solid #4f46e5",
  background: "#4f46e5",
  color: "#fff",
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
};

const servicoBlocoNaoSelecionado = {
  padding: "7px 10px",
  borderRadius: 999,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#475569",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

const servicosBlocoAjuda = {
  margin: "8px 0 0",
  color: "#94a3b8",
  fontSize: 11,
  lineHeight: 1.4,
};

const loadingPage = {
  minHeight: "100vh",
  background: "#020617",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const loadingCard = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 24,
  color: "#fff",
  fontWeight: 900,
};

const page = {
  minHeight: "100vh",
  padding: 28,
  background: "#020617",
};

const metricsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 18,
  marginBottom: 24,
};

const metricCard = {
  background: "rgba(15,23,42,0.92)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 22,
  display: "flex",
  gap: 16,
  alignItems: "center",
  boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
};

const metricIcon = {
  width: 54,
  height: 54,
  borderRadius: 18,
  background: "linear-gradient(135deg,#d709ab,#7c3aed)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
};

const metricLabel = {
  margin: 0,
  fontSize: 12,
  color: "#94a3b8",
  fontWeight: 800,
};

const metricValue = {
  display: "block",
  fontSize: 30,
  color: "#fff",
  fontWeight: 900,
  marginTop: 4,
};

const metricSub = {
  display: "block",
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
};

const profissionaisGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "stretch",
  gap: 16,
};

const profissionalInfo = {
  display: "grid",
  gridTemplateColumns: "58px minmax(0, 1fr)",
  alignItems: "flex-start",
  gap: 12,
  minWidth: 0,
  width: "100%",
};

const avatarPremium = {
  width: 58,
  height: 58,
  minWidth: 58,
  maxWidth: 58,
  flex: "0 0 58px",
  borderRadius: 18,
  background: "linear-gradient(135deg,#d709ab,#7c3aed)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 950,
  color: "#fff",
  fontSize: 23,
  overflow: "hidden",
  boxShadow: "0 18px 45px rgba(215,9,171,0.22)",
};

const profissionalNomeLinha = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap" as const,
  minWidth: 0,
};

const profissionalNome = {
  color: "#fff",
  fontSize: 17,
  fontWeight: 950,
  lineHeight: 1.08,
  overflowWrap: "anywhere" as const,
};

const profissionalBio = {
  margin: "5px 0 0",
  color: "#94a3b8",
  fontSize: 12,
  lineHeight: 1.35,
};

const profissionalTags = {
  marginTop: 10,
  display: "flex",
  gap: 7,
  flexWrap: "wrap" as const,
};

const badgeProfissionalAtivo = {
  padding: "5px 11px",
  borderRadius: 999,
  background: "rgba(34,197,94,0.14)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.28)",
  fontSize: 11,
  fontWeight: 900,
};

const badgeProfissionalInativo = {
  padding: "5px 11px",
  borderRadius: 999,
  background: "rgba(239,68,68,0.14)",
  color: "#fca5a5",
  border: "1px solid rgba(239,68,68,0.28)",
  fontSize: 11,
  fontWeight: 900,
};

const badgeServicoPremium = {
  padding: "5px 9px",
  borderRadius: 999,
  background: "rgba(59,130,246,0.14)",
  color: "#93c5fd",
  border: "1px solid rgba(59,130,246,0.28)",
  fontSize: 11,
  fontWeight: 850,
};

const badgeComissaoPremium = {
  padding: "5px 9px",
  borderRadius: 999,
  background: "rgba(34,197,94,0.14)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.28)",
  fontSize: 11,
  fontWeight: 850,
};

const badgeCinzaPremium = {
  padding: "5px 9px",
  borderRadius: 999,
  background: "rgba(148,163,184,0.14)",
  color: "#cbd5e1",
  border: "1px solid rgba(148,163,184,0.24)",
  fontSize: 12,
  fontWeight: 850,
};

const profissionalActions = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 8,
  width: "100%",
  marginTop: "auto",
};

const botaoEditarPremium = {
  width: "100%",
  minWidth: 0,
  padding: "9px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "normal" as const,
  lineHeight: 1.15,
};

const detalheCompactoSummary = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 12,
  color: "#fff",
  cursor: "pointer",
  listStyle: "none" as const,
};

const detalheCompactoContent = {
  display: "grid",
  gap: 12,
};

const listaHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 22,
};

const listaKicker = {
  display: "inline-block",
  color: "#a78bfa",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase" as const,
  letterSpacing: 0.8,
  marginBottom: 8,
};

const listaTitulo = {
  margin: 0,
  color: "#fff",
  fontSize: 26,
  fontWeight: 950,
};

const listaDescricao = {
  margin: "8px 0 0",
  color: "#94a3b8",
  lineHeight: 1.5,
};

const listaBadge = {
  background: "rgba(34,197,94,0.14)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.28)",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap" as const,
};

const filtroBotao = {
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  background: "rgba(255,255,255,0.04)",
  cursor: "pointer",
  fontWeight: 800,
};
