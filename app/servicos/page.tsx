'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import PremiumLayout from '@/components/layout/PremiumLayout';

export default function ServicosPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [pesquisaServico, setPesquisaServico] = useState('');
  const [formularioAberto, setFormularioAberto] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    duracaoMin: 30,
    capacidadeSimultanea: 1,
    valor: '',
    custo: '',
    exigePrePagamento: false,
    valorPrePagamento: '',
    imagemUrl1: '',
    imagemUrl2: '',
    imagemUrl3: '',
    ativo: true,
  });

  useEffect(() => {
    const empresaStorage = localStorage.getItem('empresaLogada');
    const usuarioStorage = localStorage.getItem('usuarioEmpresa');

    if (!empresaStorage) {
      window.location.href = '/login';
      return;
    }

    const emp = JSON.parse(empresaStorage);
    setEmpresa(emp);
    setUsuario(usuarioStorage ? JSON.parse(usuarioStorage) : null);

    carregarServicos(emp.id);
  }, []);

  async function carregarServicos(empresaId: string) {
    setCarregando(true);

    const res = await fetch(`/api/servicos?empresaId=${empresaId}`, { cache: 'no-store' });
    const data = await res.json();

    setServicos(data.servicos || []);
    setCarregando(false);
  }

  function dinheiro(valor: any) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function normalizarCapacidadeSimultanea(valor: any) {
    const convertido = Number(valor);

    if (!Number.isFinite(convertido) || convertido < 1) {
      return 1;
    }

    return Math.floor(convertido);
  }

  function montarPayloadServico(statusAtivo?: boolean) {
    return {
      id: editandoId,
      empresaId: empresa.id,
      nome: form.nome,
      descricao: form.descricao,
      duracaoMin: Math.max(Number(form.duracaoMin || 30), 5),
      capacidadeSimultanea: normalizarCapacidadeSimultanea(form.capacidadeSimultanea),
      valor: form.valor,
      custo: form.custo,
      exigePrePagamento: form.exigePrePagamento,
      valorPrePagamento: form.valorPrePagamento,
      imagemUrl1: form.imagemUrl1,
      imagemUrl2: form.imagemUrl2,
      imagemUrl3: form.imagemUrl3,
      ativo: statusAtivo === undefined ? form.ativo : statusAtivo,
    };
  }

  function limparFormulario() {
    setEditandoId('');
    setFormularioAberto(false);
    setForm({
      nome: '',
      descricao: '',
      duracaoMin: 30,
      capacidadeSimultanea: 1,
      valor: '',
      custo: '',
      exigePrePagamento: false,
      valorPrePagamento: '',
      imagemUrl1: '',
      imagemUrl2: '',
      imagemUrl3: '',
      ativo: true,
    });
  }

  function iniciarEdicao(servico: any) {
    setEditandoId(servico.id);
    setFormularioAberto(true);

    setForm({
      nome: servico.nome || '',
      descricao: servico.descricao || '',
      duracaoMin: servico.duracaoMin || 30,
      capacidadeSimultanea: normalizarCapacidadeSimultanea(servico.capacidadeSimultanea),
      valor: String(servico.valor || ''),
      custo: String(servico.custo || ''),
      exigePrePagamento: servico.exigePrePagamento || false,
      valorPrePagamento: String(servico.valorPrePagamento || ''),
      imagemUrl1: servico.imagemUrl1 || '',
      imagemUrl2: servico.imagemUrl2 || '',
      imagemUrl3: servico.imagemUrl3 || '',
      ativo: servico.ativo !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }


  function selecionarImagemServico(
    campo: 'imagemUrl1' | 'imagemUrl2' | 'imagemUrl3',
    arquivo?: File | null
  ) {
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido.');
      return;
    }

    const tamanhoMaximoMb = 2;
    const tamanhoMb = arquivo.size / 1024 / 1024;

    if (tamanhoMb > tamanhoMaximoMb) {
      alert(`A imagem deve ter no máximo ${tamanhoMaximoMb}MB.`);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((atual) => ({
        ...atual,
        [campo]: String(reader.result || ''),
      }));
    };

    reader.readAsDataURL(arquivo);
  }

  function removerImagemServico(campo: 'imagemUrl1' | 'imagemUrl2' | 'imagemUrl3') {
    setForm((atual) => ({
      ...atual,
      [campo]: '',
    }));
  }

  async function salvar() {
    if (!form.nome || !form.valor) {
      alert('Preencha nome e valor.');
      return;
    }

    const res = await fetch('/api/servicos', {
      method: editandoId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(montarPayloadServico()),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Erro ao salvar serviço.');
      return;
    }

    alert(editandoId ? 'Serviço atualizado!' : 'Serviço criado!');

    await carregarServicos(empresa.id);
    limparFormulario();
  }

  const corPrimaria = empresa?.corSidebar || empresa?.corPrimaria || '#7c3aed';
  const corSecundaria = empresa?.corSecundaria || '#06b6d4';

  const metricas = useMemo(() => {
    const totalServicos = servicos.length;

    const comPrePagamento = servicos.filter((servico) => servico.exigePrePagamento).length;

    const ticketMedio =
      totalServicos > 0
        ? servicos.reduce((acc, servico) => acc + Number(servico.valor || 0), 0) / totalServicos
        : 0;

    const duracaoMedia =
      totalServicos > 0
        ? Math.round(
            servicos.reduce((acc, servico) => acc + Number(servico.duracaoMin || 0), 0) /
              totalServicos,
          )
        : 0;

    const custoTotal = servicos.reduce((acc, servico) => acc + Number(servico.custo || 0), 0);
    const faturamentoPotencial = servicos.reduce(
      (acc, servico) => acc + Number(servico.valor || 0),
      0,
    );

    const margemMedia =
      faturamentoPotencial > 0
        ? Math.round(((faturamentoPotencial - custoTotal) / faturamentoPotencial) * 100)
        : 0;

    return {
      totalServicos,
      comPrePagamento,
      ticketMedio,
      duracaoMedia,
      custoTotal,
      faturamentoPotencial,
      margemMedia,
    };
  }, [servicos]);

const servicosFiltrados = servicos.filter((servico) => {
  const termo = pesquisaServico.trim().toLowerCase();

  const atendeStatus =
    filtroStatus === 'ativos'
      ? servico.ativo !== false
      : filtroStatus === 'inativos'
      ? servico.ativo === false
      : true;

  if (!atendeStatus) {
    return false;
  }

  if (!termo) {
    return true;
  }

  const textoBusca = [
    servico.nome,
    servico.descricao,
    servico.valor,
    servico.duracaoMin,
    servico.capacidadeSimultanea,
    servico.exigePrePagamento ? 'pre pagamento pré-pagamento sinal' : 'sem pre sem pré',
    servico.ativo === false ? 'inativo' : 'ativo',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return textoBusca.includes(termo);
});

  if (!empresa) {
    return (
      <main style={loadingPage}>
        <div style={loadingCard}>
          <div style={loadingIcon}>✂️</div>
          <strong>Carregando serviços...</strong>
          <span>Preparando sua central operacional.</span>
        </div>
      </main>
    );
  }

  return (
  <PremiumLayout empresa={empresa} usuario={usuario}>
    <main
      className="servicos-mobile-safe"
      style={{
        ...page,
        background: `
          radial-gradient(circle at top left, ${hexToRgba(corPrimaria, 0.24)}, transparent 34%),
          radial-gradient(circle at top right, ${hexToRgba(corSecundaria, 0.18)}, transparent 32%),
          linear-gradient(135deg, #020617 0%, #0f172a 46%, #111827 100%)
        `,
      }}
    >
      <style jsx global>{`
        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }

        .servicos-mobile-safe,
        .servicos-mobile-safe * {
          box-sizing: border-box;
        }

        .servicos-mobile-safe {
          width: 100%;
          overflow-x: hidden;
        }

        .servicos-container-mobile {
          width: 100%;
          max-width: 1240px;
          overflow-x: hidden;
        }

        @media (max-width: 1180px) {
          .servicos-mobile-safe {
            padding-left: 18px !important;
            padding-right: 18px !important;
            padding-bottom: 112px !important;
          }

          .servicos-container-mobile,
          .servicos-header-mobile,
          .servicos-form-card-mobile,
          .servicos-side-card-mobile,
          .servicos-lista-card-mobile {
            width: 100% !important;
            max-width: 100% !important;
          }

          .servicos-main-grid-mobile {
            grid-template-columns: 1fr !important;
          }

          .servicos-side-card-mobile {
            position: relative !important;
            top: auto !important;
          }
        }

        @media (max-width: 760px) {
          .servicos-mobile-safe {
            padding: 14px !important;
            padding-bottom: 126px !important;
          }

          .servicos-header-mobile {
            padding: 18px !important;
            border-radius: 24px !important;
            align-items: stretch !important;
          }

          .servicos-header-mobile > div:nth-child(2) {
            display: grid !important;
            grid-template-columns: 54px minmax(0, 1fr) !important;
            gap: 12px !important;
            width: 100% !important;
            align-items: start !important;
          }

          .servicos-header-mobile > div:nth-child(2) > div:first-child {
            width: 54px !important;
            height: 54px !important;
            border-radius: 18px !important;
            font-size: 22px !important;
          }

          .servicos-header-mobile h1 {
            font-size: 30px !important;
            line-height: 1.05 !important;
          }

          .servicos-header-mobile p {
            font-size: 13px !important;
          }

          .servicos-header-mobile > div:last-child {
            width: 100% !important;
            min-width: 0 !important;
            padding: 16px !important;
            border-radius: 20px !important;
          }

          .servicos-metricas-mobile {
            display: flex !important;
            overflow-x: auto !important;
            gap: 12px !important;
            padding-bottom: 8px !important;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
          }

          .servicos-metricas-mobile > div {
            min-width: 78vw !important;
            scroll-snap-align: start;
          }

          .servicos-form-card-mobile,
          .servicos-side-card-mobile,
          .servicos-lista-card-mobile,
          .servicos-imagens-box-mobile,
          .servicos-prepagamento-mobile {
            padding: 16px !important;
            border-radius: 24px !important;
          }

          .servicos-form-grid-mobile,
          .servicos-imagens-grid-mobile,
          .servicos-grid-mobile,
          .servicos-analytics-row-mobile {
            grid-template-columns: 1fr !important;
          }

          .servicos-form-grid-mobile > div,
          .servicos-imagens-box-mobile,
          .servicos-prepagamento-mobile {
            grid-column: 1 / -1 !important;
            min-width: 0 !important;
          }

          .servicos-lista-card-mobile > div:first-child {
            align-items: stretch !important;
          }

          .servicos-lista-card-mobile > div:first-child > div:last-child {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }

          .servicos-lista-card-mobile > div:first-child button,
          .servicos-lista-card-mobile > div:first-child span {
            width: 100% !important;
            text-align: center !important;
            justify-content: center !important;
          }

          .servicos-grid-mobile article {
            padding: 16px !important;
            border-radius: 24px !important;
            min-width: 0 !important;
          }

          .servicos-grid-mobile article > div:nth-child(2) {
            display: grid !important;
            grid-template-columns: 54px minmax(0, 1fr) !important;
            gap: 12px !important;
          }

          .servicos-grid-mobile article h3,
          .servicos-grid-mobile article p,
          .servicos-grid-mobile article span,
          .servicos-grid-mobile article strong {
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
          }

          .servicos-grid-mobile article > div:nth-child(3) {
            align-items: flex-start !important;
          }

          .servicos-grid-mobile article button {
            width: 100% !important;
            min-height: 48px !important;
          }

          .servicos-grid-mobile article > div[style*="display: flex"] {
            min-width: 0 !important;
          }

          .servicos-imagens-grid-mobile {
            display: flex !important;
            overflow-x: auto !important;
            gap: 10px !important;
            padding: 2px 2px 8px !important;
            scroll-snap-type: x proximity !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .servicos-imagens-grid-mobile > div {
            flex: 0 0 78% !important;
            min-width: 78% !important;
            scroll-snap-align: start !important;
          }

          .servicos-grid-mobile {
            display: flex !important;
            overflow-x: auto !important;
            gap: 12px !important;
            padding: 2px 2px 12px !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .servicos-grid-mobile article {
            flex: 0 0 86% !important;
            min-width: 86% !important;
            max-width: 86% !important;
            scroll-snap-align: start !important;
          }

          .servicos-side-card-mobile {
            padding: 14px !important;
            border-radius: 20px !important;
          }

        }


        @media (max-width: 760px) {
          .servicos-grid-mobile {
            gap: 10px !important;
          }

          .servicos-grid-mobile article {
            padding: 12px !important;
            border-radius: 20px !important;
          }
        }


          @media (max-width: 760px) {
            .servicos-header-mobile {
              padding: 16px !important;
              border-radius: 24px !important;
              margin-bottom: 12px !important;
              gap: 12px !important;
              background: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,0.94)) !important;
              box-shadow: 0 14px 34px rgba(0,0,0,0.22) !important;
              border: 1px solid rgba(148,163,184,0.14) !important;
            }

            .servicos-header-mobile > div:nth-child(2) {
              display: grid !important;
              grid-template-columns: 42px minmax(0, 1fr) !important;
              gap: 11px !important;
              align-items: center !important;
            }

            .servicos-header-mobile > div:nth-child(2) > div:first-child {
              width: 42px !important;
              height: 42px !important;
              border-radius: 15px !important;
              background: rgba(15,23,42,0.72) !important;
            }

            .servicos-header-mobile h1 {
              font-size: 25px !important;
              line-height: 1 !important;
              margin-top: 3px !important;
            }

            .servicos-header-mobile p {
              display: none !important;
            }

            .servicos-header-mobile > div:nth-child(2) > div:last-child > span:first-child {
              padding: 5px 9px !important;
              margin-bottom: 7px !important;
              font-size: 10.5px !important;
              background: rgba(124,58,237,0.12) !important;
              color: #c4b5fd !important;
              border-color: rgba(167,139,250,0.18) !important;
            }

            .servicos-header-mobile > div:nth-child(2) > div:last-child > div {
              margin-top: 9px !important;
              display: flex !important;
              gap: 6px !important;
              overflow-x: auto !important;
              padding-bottom: 2px !important;
            }

            .servicos-header-mobile > div:nth-child(2) > div:last-child > div span {
              padding: 6px 9px !important;
              font-size: 10.5px !important;
              justify-content: center !important;
              text-align: center !important;
              white-space: nowrap !important;
              flex: 0 0 auto !important;
              max-width: 160px !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }

            .servicos-header-mobile > div:last-child {
              display: grid !important;
              grid-template-columns: 1fr auto !important;
              align-items: center !important;
              padding: 11px 13px !important;
              border-radius: 17px !important;
              gap: 6px !important;
              background: rgba(2,6,23,0.44) !important;
              border-color: rgba(148,163,184,0.14) !important;
            }

            .servicos-header-mobile > div:last-child strong {
              font-size: 30px !important;
              text-align: right !important;
            }

            .servicos-header-mobile > div:last-child small {
              grid-column: 1 / -1 !important;
              font-size: 11px !important;
              margin-top: -3px !important;
            }



            .servicos-form-card-mobile > div:first-child {
              gap: 12px !important;
            }

            .servicos-form-card-mobile > div:first-child h2 {
              font-size: 26px !important;
            }

            .servicos-form-card-mobile > div:first-child p {
              font-size: 13px !important;
              line-height: 1.55 !important;
            }

            .servicos-form-card-mobile > div:first-child button {
              width: 58px !important;
              height: 58px !important;
              border-radius: 20px !important;
              font-size: 34px !important;
            }

            .servicos-filtros-status-mobile {
              width: 100% !important;
              display: flex !important;
              flex-wrap: nowrap !important;
              gap: 6px !important;
              overflow-x: auto !important;
              padding: 2px 2px 4px !important;
              -webkit-overflow-scrolling: touch !important;
            }

            .servicos-filtros-status-mobile button,
            .servicos-filtros-status-mobile span {
              width: auto !important;
              min-width: fit-content !important;
              height: 32px !important;
              padding: 0 10px !important;
              border-radius: 999px !important;
              font-size: 10.5px !important;
              line-height: 1 !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              flex: 0 0 auto !important;
              white-space: nowrap !important;
            }

            .servicos-lista-busca-mobile {
              margin: 12px 0 14px !important;
            }

            .servicos-lista-busca-mobile input {
              height: 44px !important;
              font-size: 13px !important;
            }
          }

        @media (max-width: 420px) {
          .servicos-filtros-status-mobile {
            flex-wrap: nowrap !important;
          }
        }
      `}</style>
      <div className="servicos-container-mobile" style={container}>
        <header
          className="servicos-header-mobile"
          style={{
            ...headerPremium,
            background: `
              radial-gradient(circle at top left, ${hexToRgba(corPrimaria, 0.18)}, transparent 34%),
              radial-gradient(circle at bottom right, ${hexToRgba(corSecundaria, 0.10)}, transparent 32%),
              linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,0.92))
            `,
            boxShadow: `0 18px 50px rgba(0,0,0,0.22)`,
          }}
        >
          <div style={headerOverlay} />

          <div style={headerConteudo}>
            <div style={logoHeader}>
              {empresa?.logoUrl || empresa?.logo || empresa?.imagemUrl ? (
                <img
                  src={empresa.logoUrl || empresa.logo || empresa.imagemUrl}
                  alt={empresa.nome}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span>{empresa?.nome?.charAt(0)?.toUpperCase() || 'M'}</span>
              )}
            </div>

            <div style={{ position: 'relative', zIndex: 2 }}>
              <span style={badgeBoasVindas}>✂️ Catálogo operacional</span>

              <h1 style={tituloHeader}>Serviços</h1>

              <p style={subtituloHeader}>
                Gerencie preços, duração, custos, pré-pagamentos e organização comercial dos
                serviços.
              </p>

              <div style={linhaBadgesHeader}>
                <span style={badgeEmpresa}>🏢 {empresa?.nome || 'Meu Estúdio'}</span>

                <span style={badgeModulo}>Catálogo SaaS</span>

                <span style={badgeStatusHeader}>✅ Ativo</span>
              </div>
            </div>
          </div>

        </header>

        <section className="servicos-metricas-mobile" style={metricasGrid}>
          <MetricCard
            titulo="Total de serviços"
            valor={String(metricas.totalServicos)}
            descricao="Itens disponíveis no catálogo"
            icone="✂️"
            cor={corPrimaria}
          />

          <MetricCard
            titulo="Ticket médio"
            valor={dinheiro(metricas.ticketMedio)}
            descricao="Média de preço dos serviços"
            icone="💰"
            cor="#22c55e"
          />

          <MetricCard
            titulo="Duração média"
            valor={`${metricas.duracaoMedia || 0} min`}
            descricao="Tempo médio operacional"
            icone="⏱️"
            cor="#38bdf8"
          />

          <MetricCard
            titulo="Margem estimada"
            valor={`${metricas.margemMedia || 0}%`}
            descricao="Com base em preço e custo"
            icone="📈"
            cor="#f59e0b"
          />
        </section>

        <section className="servicos-main-grid-mobile" style={mainGrid}>
          <div
            className="servicos-form-card-mobile"
            style={formularioAberto ? formCard : formCardFechado}
          >
            <div style={formResumoCadastro}>
              <div style={formResumoTexto}>
                <span style={sectionEyebrow}>
                  {editandoId ? 'Modo edição' : 'Novo cadastro'}
                </span>

                <h2 style={sectionTitle}>
                  {editandoId ? 'Editar serviço' : 'Cadastrar serviço'}
                </h2>

                <p style={sectionDescription}>
                  Monte um catálogo organizado, claro e pronto para o agendador público.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (formularioAberto && editandoId) {
                    limparFormulario();
                    return;
                  }

                  setFormularioAberto((atual) => !atual);
                }}
                aria-label={formularioAberto ? 'Ocultar cadastro de serviço' : 'Abrir cadastro de serviço'}
                style={{
                  ...botaoToggleCadastro,
                  background: formularioAberto
                    ? 'rgba(255,255,255,0.06)'
                    : `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                  boxShadow: formularioAberto
                    ? 'none'
                    : `0 16px 38px ${hexToRgba(corPrimaria, 0.32)}`,
                }}
              >
                {formularioAberto ? '×' : '+'}
              </button>
            </div>

            {formularioAberto && (
              <>
                {editandoId && (
                  <div style={edicaoAvisoLinha}>
                    <span>Você está editando um serviço existente.</span>

                    <button onClick={limparFormulario} style={botaoSecundarioCompacto}>
                      Cancelar edição
                    </button>
                  </div>
                )}

                <div className="servicos-form-grid-mobile" style={grid}>
                  <div style={campo}>
                    <label style={label}>Nome do serviço *</label>
                    <input
                      style={input}
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Ex: Corte feminino"
                    />
                  </div>

                  <div style={campo}>
                    <label style={label}>Valor *</label>
                    <input
                      style={input}
                      value={form.valor}
                      onChange={(e) => setForm({ ...form, valor: e.target.value })}
                      placeholder="Ex: 150,00"
                    />
                  </div>

                  <div style={campo}>
                    <label style={label}>Custo do serviço</label>
                    <input
                      style={input}
                      value={form.custo}
                      onChange={(e) => setForm({ ...form, custo: e.target.value })}
                      placeholder="Ex: 20,00"
                    />
                    <span style={hint}>
                      Use para material/produto. Esse valor ajuda no cálculo de lucro.
                    </span>
                  </div>

                  <div style={campo}>
                    <label style={label}>Duração</label>
                    <div style={inputComIcone}>
                      <input
                        type="number"
                        min={5}
                        style={inputInterno}
                        value={form.duracaoMin}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            duracaoMin: Math.max(Number(e.target.value || 0), 5),
                          })
                        }
                      />
                      <span style={inputUnidade}>min</span>
                    </div>
                  </div>

                  <div style={campo}>
                    <label style={label}>Atendimentos simultâneos</label>
                    <div style={inputComIcone}>
                      <input
                        type="number"
                        min={1}
                        style={inputInterno}
                        value={form.capacidadeSimultanea}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            capacidadeSimultanea: normalizarCapacidadeSimultanea(e.target.value),
                          })
                        }
                      />
                      <span style={inputUnidade}>por horário</span>
                    </div>
                    <span style={hint}>
                      Ex: 3 permite até 3 clientes no mesmo horário para este serviço e profissional.
                    </span>
                  </div>

                  <div style={{ ...campo, gridColumn: '1 / -1' }}>
                    <label style={label}>Descrição</label>
                    <textarea
                      style={{ ...input, minHeight: 104, resize: 'vertical' }}
                      value={form.descricao}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      placeholder="Descreva o que está incluso nesse serviço..."
                    />
                  </div>

                  <div className="servicos-imagens-box-mobile" style={imagensServicoBox}>
                    <div style={imagensServicoHeader}>
                      <div>
                        <label style={label}>Imagens do serviço</label>
                        <p style={hint}>
                          Cadastre até 3 imagens. A primeira será usada como destaque no agendador público.
                        </p>
                      </div>

                      <span style={imagensServicoBadge}>
                        {[form.imagemUrl1, form.imagemUrl2, form.imagemUrl3].filter(Boolean).length}/3 imagens
                      </span>
                    </div>

                    <div className="servicos-imagens-grid-mobile" style={imagensServicoGrid}>
                      {(['imagemUrl1', 'imagemUrl2', 'imagemUrl3'] as const).map((campoImagem, index) => {
                        const imagem = form[campoImagem];

                        return (
                          <div key={campoImagem} style={imagemServicoCard}>
                            <div style={imagemPreviewBox}>
                              {imagem ? (
                                <img
                                  src={imagem}
                                  alt={`Imagem ${index + 1} do serviço`}
                                  style={imagemPreview}
                                />
                              ) : (
                                <div style={imagemPreviewVazia}>
                                  <span>🖼️</span>
                                  <strong>Imagem {index + 1}</strong>
                                </div>
                              )}
                            </div>

                            <div style={imagemAcoesLinha}>
                              <label style={imagemUploadButton}>
                                {imagem ? 'Trocar' : 'Adicionar'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => selecionarImagemServico(campoImagem, e.target.files?.[0])}
                                />
                              </label>

                              {imagem && (
                                <button
                                  type="button"
                                  onClick={() => removerImagemServico(campoImagem)}
                                  style={imagemRemoverButton}
                                >
                                  Remover
                                </button>
                              )}
                            </div>

                            {index === 0 && <span style={imagemPrincipalBadge}>Destaque</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="servicos-prepagamento-mobile" style={prePagamentoBox}>
                    <label style={checkLinha}>
                      <input
                        type="checkbox"
                        checked={form.exigePrePagamento}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            exigePrePagamento: e.target.checked,
                          })
                        }
                      />
                      <span>
                        <strong>Exige pré-pagamento</strong>
                        <small>Ative quando o serviço precisar de sinal antecipado.</small>
                      </span>
                    </label>

                    {form.exigePrePagamento && (
                      <div style={campo}>
                        <label style={label}>Valor pré-pago</label>
                        <input
                          style={input}
                          value={form.valorPrePagamento}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              valorPrePagamento: e.target.value,
                            })
                          }
                          placeholder="Ex: 50,00"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={salvar}
                  style={{
                    ...botaoPrincipal,
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                    boxShadow: `0 18px 45px ${hexToRgba(corPrimaria, 0.32)}`,
                  }}
                >
                  {editandoId ? 'Atualizar serviço' : 'Salvar serviço'}
                </button>
              </>
            )}
          </div>

          <aside className="servicos-side-card-mobile" style={sideCardCompacto}>
            <div style={sideCompactoHeader}>
              <div style={sideIconCompacto}>🧾</div>

              <div>
                <span style={sectionEyebrow}>Resumo do catálogo</span>
                <h3 style={sideTitleCompacto}>Visão rápida</h3>
              </div>
            </div>

            <div style={sideStatsCompacto}>
              <div style={sideStatItemCompacto}>
                <span>Valor</span>
                <strong>{dinheiro(metricas.faturamentoPotencial)}</strong>
              </div>

              <div style={sideStatItemCompacto}>
                <span>Custo</span>
                <strong>{dinheiro(metricas.custoTotal)}</strong>
              </div>

              <div style={sideStatItemCompacto}>
                <span>Pré</span>
                <strong>{metricas.comPrePagamento}</strong>
              </div>
            </div>

            <div style={insightBoxCompacto}>
              💡 Nomes curtos, preços claros e fotos boas deixam o agendador mais vendedor.
            </div>
          </aside>
        </section>

        <section className="servicos-lista-card-mobile" style={listaCard}>
          <div style={listaHeader}>
            <div>
              <span style={sectionEyebrow}>Catálogo ativo</span>
              <h2 style={sectionTitle}>Lista de serviços</h2>
              <p style={sectionDescription}>
                Visualize e edite os serviços disponíveis para a operação da empresa.
              </p>
            </div>

            <div className="servicos-filtros-status-mobile" style={filtrosStatusLinha}>
  <button
    onClick={() => setFiltroStatus('todos')}
    style={{
      ...filtroBotao,
      background:
        filtroStatus === 'todos'
          ? 'rgba(124,58,237,0.22)'
          : 'rgba(255,255,255,0.04)',
    }}
  >
    Todos
  </button>

  <button
    onClick={() => setFiltroStatus('ativos')}
    style={{
      ...filtroBotao,
      background:
        filtroStatus === 'ativos'
          ? 'rgba(34,197,94,0.18)'
          : 'rgba(255,255,255,0.04)',
    }}
  >
    Ativos
  </button>

  <button
    onClick={() => setFiltroStatus('inativos')}
    style={{
      ...filtroBotao,
      background:
        filtroStatus === 'inativos'
          ? 'rgba(239,68,68,0.18)'
          : 'rgba(255,255,255,0.04)',
    }}
  >
    Inativos
  </button>

  <span style={listaBadge}>
    {servicosFiltrados.length} cadastrados
  </span>
</div>
          </div>

          <div className="servicos-lista-busca-mobile" style={buscaServicoBox}>
            <span style={buscaServicoIcone}>⌕</span>
            <input
              value={pesquisaServico}
              onChange={(e) => setPesquisaServico(e.target.value)}
              placeholder="Pesquisar serviço por nome, descrição, preço ou status"
              style={buscaServicoInput}
            />
            {pesquisaServico && (
              <button
                type="button"
                onClick={() => setPesquisaServico('')}
                style={buscaServicoLimpar}
              >
                ×
              </button>
            )}
          </div>

          {carregando && (
            <div style={emptyState}>
              <div style={emptyIcon}>⏳</div>
              <strong>Carregando serviços...</strong>
              <span>Buscando dados do catálogo.</span>
            </div>
          )}

          {!carregando && servicos.length === 0 && (
            <div style={emptyState}>
              <div style={emptyIcon}>✂️</div>
              <strong>Nenhum serviço cadastrado</strong>
              <span>Cadastre o primeiro serviço para iniciar seu catálogo operacional.</span>
            </div>
          )}

          {!carregando && servicos.length > 0 && servicosFiltrados.length === 0 && (
            <div style={emptyStateCompacto}>
              <strong>Nenhum serviço encontrado</strong>
              <span>Revise a busca ou altere os filtros de status.</span>
            </div>
          )}

          {!carregando && servicos.length > 0 && servicosFiltrados.length > 0 && (
            <div className="servicos-grid-mobile" style={servicosGrid}>
              {servicosFiltrados.map((s) => {
                const valor = Number(s.valor || 0);
                const custo = Number(s.custo || 0);
                const lucro = valor - custo;
                const margem = valor > 0 ? Math.round((lucro / valor) * 100) : 0;

                return (
                  <article key={s.id} style={servicoCardCompacto}>
                    <div
                      style={{
                        ...servicoGlowCompacto,
                        background: `radial-gradient(circle, ${hexToRgba(
                          corPrimaria,
                          0.18,
                        )}, transparent 72%)`,
                      }}
                    />

                    <div style={servicoCompactoTopo}>
                      <div
                        style={{
                          ...servicoIconeCompacto,
                          background: `linear-gradient(135deg, ${hexToRgba(
                            corPrimaria,
                            0.92,
                          )}, ${hexToRgba(corSecundaria, 0.72)})`,
                        }}
                      >
                        {s.imagemUrl1 ? (
                          <img src={s.imagemUrl1} alt={s.nome} style={servicoImagemMiniatura} />
                        ) : (
                          '✂️'
                        )}
                      </div>

                      <div style={servicoCompactoInfo}>
                        <div style={servicoCompactoTituloLinha}>
                          <h3 style={servicoNomeCompacto}>{s.nome}</h3>

                          <span style={s.ativo === false ? badgeInativoCompacto : badgeAtivoCompacto}>
                            {s.ativo === false ? 'Inativo' : 'Ativo'}
                          </span>
                        </div>

                        <p style={servicoDescricaoCompacta}>
                          {s.descricao || 'Sem descrição cadastrada'}
                        </p>
                      </div>
                    </div>

                    <div style={servicoCompactoValorLinha}>
                      <strong style={servicoCompactoValor}>{dinheiro(s.valor)}</strong>

                      <div style={servicoCompactoChips}>
                        <span style={duracaoBadgeCompacto}>⏱️ {s.duracaoMin || 0} min</span>
                        <span style={duracaoBadgeCompacto}>👥 {s.capacidadeSimultanea || 1}/horário</span>
                      </div>
                    </div>

                    <div style={servicoCompactoFinanceiroLinha}>
                      <span>Custo <strong>{custo > 0 ? dinheiro(custo) : 'N/I'}</strong></span>
                      <span>Lucro <strong>{dinheiro(lucro)}</strong></span>
                      <span>Margem <strong>{margem}%</strong></span>
                    </div>

                    {[s.imagemUrl1, s.imagemUrl2, s.imagemUrl3].filter(Boolean).length > 0 && (
                      <div style={servicoFotosCompactasLinha}>
                        {[s.imagemUrl1, s.imagemUrl2, s.imagemUrl3]
                          .filter(Boolean)
                          .map((imagem: string, index: number) => (
                            <img
                              key={`${s.id}-foto-compacta-${index}`}
                              src={imagem}
                              alt={`${s.nome} ${index + 1}`}
                              style={servicoFotoCompactaThumb}
                            />
                          ))}
                      </div>
                    )}

                    <div style={servicoCompactoRodape}>
                      <div style={servicoCompactoBadges}>
                        {s.exigePrePagamento ? (
                          <span style={badgePrePagamentoCompacto}>
                            💳 Pré {dinheiro(s.valorPrePagamento)}
                          </span>
                        ) : (
                          <span style={badgeSemPreCompacto}>Sem pré</span>
                        )}

                        {[s.imagemUrl1, s.imagemUrl2, s.imagemUrl3].filter(Boolean).length > 0 && (
                          <span style={badgeFotosCompacto}>
                            🖼️ {[s.imagemUrl1, s.imagemUrl2, s.imagemUrl3].filter(Boolean).length} fotos
                          </span>
                        )}
                      </div>

                      <div style={servicoCompactoAcoes}>
                        <button
                          onClick={() => iniciarEdicao(s)}
                          style={{
                            ...botaoAcaoCompacto,
                            color: '#c4b5fd',
                            borderColor: 'rgba(124,58,237,0.25)',
                          }}
                        >
                          ✏️ Editar
                        </button>

                        <button
                          onClick={async () => {
                            const confirmar = confirm(
                              s.ativo === false
                                ? 'Deseja ativar este serviço?'
                                : 'Deseja inativar este serviço?'
                            );

                            if (!confirmar) return;

                            const res = await fetch('/api/servicos', {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                id: s.id,
                                empresaId: empresa.id,
                                nome: s.nome,
                                descricao: s.descricao || '',
                                duracaoMin: Math.max(Number(s.duracaoMin || 30), 5),
                                capacidadeSimultanea: normalizarCapacidadeSimultanea(s.capacidadeSimultanea),
                                valor: s.valor,
                                custo: s.custo,
                                exigePrePagamento: s.exigePrePagamento || false,
                                valorPrePagamento: s.valorPrePagamento || '',
                                imagemUrl1: s.imagemUrl1 || '',
                                imagemUrl2: s.imagemUrl2 || '',
                                imagemUrl3: s.imagemUrl3 || '',
                                ativo: s.ativo === false,
                              }),
                            });

                            const data = await res.json();

                            if (!res.ok) {
                              alert(data.error || 'Erro ao atualizar status.');
                              return;
                            }

                            await carregarServicos(empresa.id);
                          }}
                          style={{
                            ...botaoAcaoCompacto,
                            borderColor:
                              s.ativo === false
                                ? 'rgba(34,197,94,0.25)'
                                : 'rgba(239,68,68,0.25)',
                            color:
                              s.ativo === false
                                ? '#86efac'
                                : '#fca5a5',
                          }}
                        >
                          {s.ativo === false ? '✅ Ativar' : '🚫 Inativar'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
            </div>
    </main>
  </PremiumLayout>
  );
}

function MetricCard({
  titulo,
  valor,
  descricao,
  icone,
  cor,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  icone: string;
  cor: string;
}) {
  return (
    <div style={metricCard}>
      <div
        style={{
          ...metricIcon,
          background: `linear-gradient(135deg, ${hexToRgba(cor, 0.95)}, ${hexToRgba(
            cor,
            0.45,
          )})`,
          boxShadow: `0 18px 38px ${hexToRgba(cor, 0.26)}`,
        }}
      >
        {icone}
      </div>

      <div>
        <span style={metricTitulo}>{titulo}</span>
        <strong style={metricValor}>{valor}</strong>
        <small style={metricDescricao}>{descricao}</small>
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  if (!hex) return `rgba(124,58,237,${alpha})`;

  const cleanHex = hex.replace('#', '');

  if (cleanHex.length !== 6) {
    return `rgba(124,58,237,${alpha})`;
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

const page: CSSProperties = {
  minHeight: '100vh',
  padding: 30,
  color: '#e5e7eb',
};

const container: CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
};

const loadingPage: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020617, #111827)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  padding: 30,
};

const loadingCard: CSSProperties = {
  width: '100%',
  maxWidth: 360,
  borderRadius: 26,
  padding: 28,
  background: 'rgba(15,23,42,0.82)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  alignItems: 'center',
  textAlign: 'center',
};

const loadingIcon: CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 20,
  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 26,
  marginBottom: 8,
};

const headerPremium: CSSProperties = {
  color: '#fff',
  borderRadius: 28,
  padding: 26,
  marginBottom: 20,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 18,
  flexWrap: 'wrap',
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(148,163,184,0.14)',
};

const headerOverlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.035), transparent 36%, rgba(255,255,255,0.025))',
  pointerEvents: 'none',
};

const headerConteudo: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  position: 'relative',
  zIndex: 2,
};

const logoHeader: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 22,
  overflow: 'hidden',
  background: 'rgba(15,23,42,0.72)',
  border: '1px solid rgba(148,163,184,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 26,
  fontWeight: 900,
  color: '#fff',
  boxShadow: '0 12px 28px rgba(0,0,0,0.20)',
  flexShrink: 0,
};

const badgeBoasVindas: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgba(124,58,237,0.12)',
  color: '#c4b5fd',
  padding: '6px 11px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  marginBottom: 10,
  border: '1px solid rgba(167,139,250,0.18)',
};

const tituloHeader: CSSProperties = {
  margin: 0,
  fontSize: 36,
  fontWeight: 950,
  color: '#fff',
  lineHeight: 1,
  letterSpacing: '-0.035em',
};

const subtituloHeader: CSSProperties = {
  margin: '10px 0 0',
  color: '#94a3b8',
  fontSize: 14,
  fontWeight: 500,
  maxWidth: 620,
  lineHeight: 1.55,
};

const linhaBadgesHeader: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 14,
};

const badgeEmpresa: CSSProperties = {
  background: 'rgba(15,23,42,0.58)',
  color: '#e2e8f0',
  padding: '8px 12px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  border: '1px solid rgba(148,163,184,0.18)',
};

const badgeModulo: CSSProperties = {
  background: 'rgba(245,158,11,0.10)',
  color: '#fde68a',
  padding: '8px 12px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  border: '1px solid rgba(245,158,11,0.14)',
};

const badgeStatusHeader: CSSProperties = {
  background: 'rgba(34,197,94,0.10)',
  color: '#bbf7d0',
  padding: '8px 12px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  border: '1px solid rgba(34,197,94,0.14)',
};

const headerPainel: CSSProperties = {
  minWidth: 210,
  borderRadius: 22,
  padding: 18,
  background: 'rgba(2,6,23,0.42)',
  border: '1px solid rgba(148,163,184,0.16)',
  backdropFilter: 'blur(14px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  position: 'relative',
  zIndex: 2,
};

const headerPainelLabel: CSSProperties = {
  color: 'rgba(255,255,255,0.74)',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
};

const headerPainelValor: CSSProperties = {
  fontSize: 42,
  lineHeight: 1,
  fontWeight: 950,
  color: '#fff',
};

const headerPainelTexto: CSSProperties = {
  color: 'rgba(255,255,255,0.78)',
  fontSize: 13,
  lineHeight: 1.5,
};

const metricasGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 18,
  marginBottom: 24,
};

const metricCard: CSSProperties = {
  borderRadius: 28,
  padding: 24,
  background: 'rgba(15,23,42,0.86)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  boxShadow: '0 20px 60px rgba(0,0,0,0.24)',
};

const metricIcon: CSSProperties = {
  width: 62,
  height: 62,
  borderRadius: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 28,
  flexShrink: 0,
};

const metricTitulo: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
};

const metricValor: CSSProperties = {
  display: 'block',
  color: '#fff',
  fontSize: 28,
  fontWeight: 900,
  lineHeight: 1.1,
};

const metricDescricao: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 13,
  marginTop: 8,
  lineHeight: 1.5,
};

const mainGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 340px',
  gap: 22,
  alignItems: 'start',
  marginBottom: 24,
};

const formCard: CSSProperties = {
  borderRadius: 30,
  padding: 28,
  background: 'rgba(15,23,42,0.88)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.26)',
};

const formCardFechado: CSSProperties = {
  ...formCard,
  padding: 24,
  border: '1px dashed rgba(167,139,250,0.28)',
  background: 'linear-gradient(135deg, rgba(15,23,42,0.86), rgba(2,6,23,0.74))',
};

const formResumoCadastro: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 18,
};

const formResumoTexto: CSSProperties = {
  minWidth: 0,
};

const botaoToggleCadastro: CSSProperties = {
  width: 70,
  height: 70,
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#fff',
  fontSize: 42,
  fontWeight: 300,
  lineHeight: 1,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const edicaoAvisoLinha: CSSProperties = {
  margin: '18px 0 18px',
  padding: '12px 14px',
  borderRadius: 16,
  background: 'rgba(124,58,237,0.10)',
  border: '1px solid rgba(167,139,250,0.16)',
  color: '#ddd6fe',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  fontSize: 13,
  fontWeight: 800,
};

const botaoSecundarioCompacto: CSSProperties = {
  padding: '9px 12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff',
  fontWeight: 900,
  fontSize: 12,
  cursor: 'pointer',
};

const sectionHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  marginBottom: 24,
  flexWrap: 'wrap',
  alignItems: 'flex-start',
};

const sectionEyebrow: CSSProperties = {
  display: 'inline-block',
  color: '#38bdf8',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  marginBottom: 10,
};

const sectionTitle: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 30,
  fontWeight: 900,
  letterSpacing: '-0.03em',
};

const sectionDescription: CSSProperties = {
  margin: '10px 0 0',
  color: '#94a3b8',
  fontSize: 14,
  lineHeight: 1.7,
  maxWidth: 560,
};

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 18,
  marginBottom: 24,
};

const campo: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const label: CSSProperties = {
  color: '#e2e8f0',
  fontSize: 13,
  fontWeight: 800,
};

const input: CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(2,6,23,0.66)',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const inputComIcone: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(2,6,23,0.66)',
  overflow: 'hidden',
};

const inputInterno: CSSProperties = {
  flex: 1,
  padding: '14px 16px',
  background: 'transparent',
  border: 'none',
  color: '#fff',
  outline: 'none',
  fontSize: 14,
};

const inputUnidade: CSSProperties = {
  padding: '0 16px',
  color: '#94a3b8',
  fontWeight: 700,
  fontSize: 13,
};

const hint: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.5,
};

const imagensServicoBox: CSSProperties = {
  gridColumn: '1 / -1',
  borderRadius: 22,
  padding: 22,
  background: 'rgba(2,6,23,0.5)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const imagensServicoHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
};

const imagensServicoBadge: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(124,58,237,0.16)',
  border: '1px solid rgba(124,58,237,0.20)',
  color: '#ddd6fe',
  fontSize: 12,
  fontWeight: 900,
};

const imagensServicoGrid: CSSProperties = {
  display: 'flex',
  gap: 12,
  overflowX: 'auto',
  paddingBottom: 8,
  scrollSnapType: 'x proximity',
};

const imagemServicoCard: CSSProperties = {
  position: 'relative',
  borderRadius: 18,
  padding: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flex: '0 0 220px',
  minWidth: 220,
  scrollSnapAlign: 'start',
};

const imagemPreviewBox: CSSProperties = {
  width: '100%',
  height: 112,
  borderRadius: 15,
  overflow: 'hidden',
  background: 'rgba(15,23,42,0.85)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const imagemPreview: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const imagemPreviewVazia: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 800,
  textAlign: 'center',
};

const imagemAcoesLinha: CSSProperties = {
  display: 'flex',
  gap: 8,
};

const imagemUploadButton: CSSProperties = {
  flex: 1,
  textAlign: 'center',
  padding: '10px 12px',
  borderRadius: 14,
  background: 'rgba(124,58,237,0.18)',
  border: '1px solid rgba(124,58,237,0.22)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer',
};

const imagemRemoverButton: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 14,
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.18)',
  color: '#fecaca',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer',
};

const imagemPrincipalBadge: CSSProperties = {
  position: 'absolute',
  top: 18,
  left: 18,
  padding: '6px 9px',
  borderRadius: 999,
  background: 'rgba(2,6,23,0.72)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: '#fff',
  fontSize: 11,
  fontWeight: 900,
};


const prePagamentoBox: CSSProperties = {
  gridColumn: '1 / -1',
  borderRadius: 22,
  padding: 22,
  background: 'rgba(2,6,23,0.5)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const checkLinha: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  color: '#fff',
};

const botaoPrincipal: CSSProperties = {
  width: '100%',
  padding: '16px 22px',
  borderRadius: 18,
  border: 'none',
  color: '#fff',
  fontWeight: 900,
  fontSize: 15,
  cursor: 'pointer',
};

const botaoSecundario: CSSProperties = {
  padding: '12px 18px',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const sideCard: CSSProperties = {
  borderRadius: 30,
  padding: 28,
  background: 'rgba(15,23,42,0.88)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.24)',
  position: 'sticky',
  top: 20,
};

const sideCardCompacto: CSSProperties = {
  borderRadius: 24,
  padding: 18,
  background: 'rgba(15,23,42,0.88)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 20px 56px rgba(0,0,0,0.22)',
  position: 'sticky',
  top: 20,
};

const sideCompactoHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 14,
};

const sideIconCompacto: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 15,
  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  flexShrink: 0,
};

const sideTitleCompacto: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 18,
  fontWeight: 950,
};

const sideStatsCompacto: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
};

const sideStatItemCompacto: CSSProperties = {
  borderRadius: 15,
  padding: '10px 9px',
  background: 'rgba(2,6,23,0.56)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  color: '#fff',
  minWidth: 0,
};

const insightBoxCompacto: CSSProperties = {
  marginTop: 12,
  borderRadius: 15,
  padding: 12,
  background: 'rgba(59,130,246,0.10)',
  border: '1px solid rgba(59,130,246,0.14)',
  color: '#dbeafe',
  lineHeight: 1.45,
  fontSize: 12,
  fontWeight: 750,
};

const sideIcon: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 20,
  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 28,
  marginBottom: 18,
};

const sideTitle: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 24,
  fontWeight: 900,
};

const sideText: CSSProperties = {
  margin: '14px 0 0',
  color: '#94a3b8',
  lineHeight: 1.7,
  fontSize: 14,
};

const sideStats: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  marginTop: 24,
};

const sideStatItem: CSSProperties = {
  borderRadius: 18,
  padding: 18,
  background: 'rgba(2,6,23,0.56)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  color: '#fff',
};

const insightBox: CSSProperties = {
  marginTop: 22,
  borderRadius: 20,
  padding: 20,
  background: 'rgba(59,130,246,0.10)',
  border: '1px solid rgba(59,130,246,0.14)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  color: '#dbeafe',
  lineHeight: 1.7,
};

const listaCard: CSSProperties = {
  borderRadius: 30,
  padding: 28,
  background: 'rgba(15,23,42,0.88)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.24)',
};

const listaHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  marginBottom: 26,
  flexWrap: 'wrap',
  alignItems: 'center',
};

const filtrosStatusLinha: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 8,
  flexWrap: 'wrap',
};

const listaBadge: CSSProperties = {
  minHeight: 34,
  padding: '0 11px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.075)',
  color: '#cbd5e1',
  fontSize: 11,
  fontWeight: 900,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
};

const buscaServicoBox: CSSProperties = {
  width: '100%',
  minHeight: 50,
  borderRadius: 18,
  background: 'rgba(2,6,23,0.62)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 14px',
  marginBottom: 18,
};

const buscaServicoIcone: CSSProperties = {
  color: '#93c5fd',
  fontSize: 18,
  fontWeight: 900,
  flexShrink: 0,
};

const buscaServicoInput: CSSProperties = {
  flex: 1,
  width: '100%',
  height: 50,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  minWidth: 0,
};

const buscaServicoLimpar: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 20,
  fontWeight: 900,
  lineHeight: 1,
  cursor: 'pointer',
  flexShrink: 0,
};

const emptyStateCompacto: CSSProperties = {
  borderRadius: 20,
  padding: 20,
  background: 'rgba(2,6,23,0.44)',
  border: '1px dashed rgba(255,255,255,0.10)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  color: '#94a3b8',
  textAlign: 'center',
};

const emptyState: CSSProperties = {
  borderRadius: 26,
  padding: 42,
  background: 'rgba(2,6,23,0.44)',
  border: '1px dashed rgba(255,255,255,0.10)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  gap: 10,
  color: '#94a3b8',
};

const emptyIcon: CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 24,
  background: 'rgba(124,58,237,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 32,
};

const servicosGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 20,
};

const servicoCard: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 28,
  padding: 24,
  background: 'linear-gradient(180deg, rgba(15,23,42,0.94), rgba(2,6,23,0.94))',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 26px 70px rgba(0,0,0,0.28)',
};

const servicoGlow: CSSProperties = {
  position: 'absolute',
  width: 240,
  height: 240,
  top: -120,
  right: -120,
  pointerEvents: 'none',
};

const servicoTopo: CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'flex-start',
  marginBottom: 20,
  position: 'relative',
  zIndex: 2,
};

const servicoIcone: CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 18,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 26,
  flexShrink: 0,
  color: '#fff',
};


const servicoImagemMiniatura: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const servicoTituloArea: CSSProperties = {
  flex: 1,
};

const servicoNome: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 22,
  fontWeight: 900,
};

const servicoDescricao: CSSProperties = {
  margin: '10px 0 0',
  color: '#94a3b8',
  fontSize: 14,
  lineHeight: 1.7,
};

const servicoPrecoLinha: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 14,
  marginBottom: 20,
  flexWrap: 'wrap',
};

const miniLabel: CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  marginBottom: 6,
};

const precoGrande: CSSProperties = {
  color: '#fff',
  fontSize: 34,
  fontWeight: 950,
  lineHeight: 1,
};

const duracaoBadge: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 999,
  background: 'rgba(56,189,248,0.12)',
  border: '1px solid rgba(56,189,248,0.18)',
  color: '#bae6fd',
  fontSize: 12,
  fontWeight: 900,
};

const analyticsRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
  marginBottom: 20,
};

const analyticsMiniCard: CSSProperties = {
  borderRadius: 18,
  padding: 14,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  color: '#fff',
};

const badgesLinha: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginBottom: 22,
};

const servicoGaleriaLinha: CSSProperties = {
  display: 'flex',
  gap: 10,
  marginBottom: 22,
  position: 'relative',
  zIndex: 2,
};

const servicoGaleriaThumb: CSSProperties = {
  width: 72,
  height: 58,
  borderRadius: 14,
  objectFit: 'cover',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
};


const badgePrePagamento: CSSProperties = {
  padding: '9px 14px',
  borderRadius: 999,
  background: 'rgba(34,197,94,0.14)',
  border: '1px solid rgba(34,197,94,0.18)',
  color: '#bbf7d0',
  fontSize: 12,
  fontWeight: 900,
};

const badgeSemPre: CSSProperties = {
  padding: '9px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 800,
};

const badgeCatalogo: CSSProperties = {
  padding: '9px 14px',
  borderRadius: 999,
  background: 'rgba(124,58,237,0.14)',
  border: '1px solid rgba(124,58,237,0.18)',
  color: '#ddd6fe',
  fontSize: 12,
  fontWeight: 900,
};

const botaoEditar: CSSProperties = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: 18,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontWeight: 900,
  cursor: 'pointer',
};

const filtroBotao: CSSProperties = {
  minHeight: 34,
  padding: '0 11px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.075)',
  color: '#fff',
  background: 'rgba(255,255,255,0.04)',
  cursor: 'pointer',
  fontWeight: 850,
  fontSize: 11,
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
};


const servicoCardCompacto: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 20,
  padding: 13,
  background: 'linear-gradient(180deg, rgba(15,23,42,0.94), rgba(2,6,23,0.94))',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 16px 42px rgba(0,0,0,0.22)',
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
};

const servicoGlowCompacto: CSSProperties = {
  position: 'absolute',
  width: 180,
  height: 180,
  top: -100,
  right: -100,
  pointerEvents: 'none',
};

const servicoCompactoTopo: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '48px minmax(0, 1fr)',
  gap: 12,
  alignItems: 'start',
  position: 'relative',
  zIndex: 2,
};

const servicoIconeCompacto: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  flexShrink: 0,
  color: '#fff',
};

const servicoCompactoInfo: CSSProperties = {
  minWidth: 0,
};

const servicoCompactoTituloLinha: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 8,
};

const servicoNomeCompacto: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 17,
  fontWeight: 950,
  lineHeight: 1.12,
  letterSpacing: '-0.03em',
};

const servicoDescricaoCompacta: CSSProperties = {
  margin: '5px 0 0',
  color: '#94a3b8',
  fontSize: 12,
  lineHeight: 1.35,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const servicoCompactoValorLinha: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  position: 'relative',
  zIndex: 2,
};

const servicoCompactoValor: CSSProperties = {
  color: '#fff',
  fontSize: 22,
  fontWeight: 950,
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

const servicoCompactoChips: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flexWrap: 'wrap',
};

const duracaoBadgeCompacto: CSSProperties = {
  padding: '7px 9px',
  borderRadius: 999,
  background: 'rgba(56,189,248,0.12)',
  border: '1px solid rgba(56,189,248,0.18)',
  color: '#bae6fd',
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: 'nowrap',
};

const servicoCompactoFinanceiro: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
  position: 'relative',
  zIndex: 2,
};

const servicoFinanceiroMini: CSSProperties = {
  borderRadius: 14,
  padding: '9px 10px',
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.055)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  color: '#94a3b8',
  fontSize: 10,
  fontWeight: 850,
  minWidth: 0,
};

const servicoCompactoFinanceiroLinha: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  flexWrap: 'wrap',
  position: 'relative',
  zIndex: 2,
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 850,
};

const servicoFotosCompactasLinha: CSSProperties = {
  display: 'flex',
  gap: 7,
  overflowX: 'auto',
  paddingBottom: 2,
  position: 'relative',
  zIndex: 2,
};

const servicoFotoCompactaThumb: CSSProperties = {
  width: 46,
  height: 40,
  borderRadius: 12,
  objectFit: 'cover',
  border: '1px solid rgba(255,255,255,0.10)',
  flexShrink: 0,
};

const servicoCompactoRodape: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  flexWrap: 'wrap',
  position: 'relative',
  zIndex: 2,
};

const servicoCompactoBadges: CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
};

const servicoCompactoAcoes: CSSProperties = {
  display: 'flex',
  gap: 8,
  marginLeft: 'auto',
};

const badgeAtivoCompacto: CSSProperties = {
  padding: '5px 8px',
  borderRadius: 999,
  background: 'rgba(34,197,94,0.14)',
  border: '1px solid rgba(34,197,94,0.18)',
  color: '#bbf7d0',
  fontSize: 10,
  fontWeight: 950,
  whiteSpace: 'nowrap',
};

const badgeInativoCompacto: CSSProperties = {
  padding: '5px 8px',
  borderRadius: 999,
  background: 'rgba(239,68,68,0.14)',
  border: '1px solid rgba(239,68,68,0.18)',
  color: '#fecaca',
  fontSize: 10,
  fontWeight: 950,
  whiteSpace: 'nowrap',
};

const badgePrePagamentoCompacto: CSSProperties = {
  padding: '7px 9px',
  borderRadius: 999,
  background: 'rgba(34,197,94,0.12)',
  border: '1px solid rgba(34,197,94,0.16)',
  color: '#bbf7d0',
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: 'nowrap',
};

const badgeSemPreCompacto: CSSProperties = {
  padding: '7px 9px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#cbd5e1',
  fontSize: 11,
  fontWeight: 850,
  whiteSpace: 'nowrap',
};

const badgeFotosCompacto: CSSProperties = {
  padding: '7px 9px',
  borderRadius: 999,
  background: 'rgba(124,58,237,0.14)',
  border: '1px solid rgba(124,58,237,0.18)',
  color: '#ddd6fe',
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: 'nowrap',
};

const botaoAcaoCompacto: CSSProperties = {
  minHeight: 34,
  padding: '0 11px',
  borderRadius: 12,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 11,
  fontWeight: 950,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const badgeAtivo: CSSProperties = {
  padding: '9px 14px',
  borderRadius: 999,
  background: 'rgba(34,197,94,0.14)',
  border: '1px solid rgba(34,197,94,0.18)',
  color: '#bbf7d0',
  fontSize: 12,
  fontWeight: 900,
};

const badgeInativo: CSSProperties = {
  padding: '9px 14px',
  borderRadius: 999,
  background: 'rgba(239,68,68,0.14)',
  border: '1px solid rgba(239,68,68,0.18)',
  color: '#fecaca',
  fontSize: 12,
  fontWeight: 900,
};
