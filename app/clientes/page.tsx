'use client';

import PremiumLayout from '@/components/layout/PremiumLayout';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

export default function ClientesPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [formCadastroAberto, setFormCadastroAberto] = useState(false);

  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [historicoCliente, setHistoricoCliente] = useState<any[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [financeiroCliente, setFinanceiroCliente] = useState<any>({
    credito: 0,
    debito: 0,
    saldo: 0,
  });
  const [movimentacoesFinanceiras, setMovimentacoesFinanceiras] = useState<any[]>([]);
  const [modalLancamentoFinanceiroAberto, setModalLancamentoFinanceiroAberto] = useState(false);
  const [salvandoLancamentoFinanceiro, setSalvandoLancamentoFinanceiro] = useState(false);
  const [formLancamentoFinanceiro, setFormLancamentoFinanceiro] = useState({
    tipo: 'credito',
    valor: '',
    observacao: '',
  });

  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    cpf: '',
    dataNascimento: '',
  });

  const [formEdicao, setFormEdicao] = useState({
    nome: '',
    whatsapp: '',
    cpf: '',
    dataNascimento: '',
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
    carregarClientes(emp.id);
  }, []);

  function somenteNumeros(valor: string) {
    return String(valor || '').replace(/\D/g, '');
  }

  function formatarCpf(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function formatarWhatsapp(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  function dinheiro(valor: number) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function valorNumerico(valor: any) {
    const convertido = Number(String(valor || 0).replace(',', '.'));
    return Number.isNaN(convertido) ? 0 : convertido;
  }

  function textoTipoMovimentacao(tipo?: string | null) {
    if (tipo === 'credito') return 'Crédito';
    if (tipo === 'debito') return 'Débito';
    return tipo || 'Movimentação';
  }

  function textoOrigemMovimentacao(origem?: string | null) {
    if (origem === 'ajuste_manual') return 'Ajuste manual';
    if (origem === 'atendimento') return 'Atendimento';
    if (origem === 'compensacao') return 'Compensação';
    if (origem === 'pagamento') return 'Pagamento';
    if (origem === 'estorno') return 'Estorno';
    return origem || 'Não informado';
  }

  function corSaldoFinanceiro(saldo: number) {
    if (saldo > 0) return '#22c55e';
    if (saldo < 0) return '#ef4444';
    return '#94a3b8';
  }

  function formatarData(data?: string | null) {
  if (!data) return 'Não informada';

  const dataString = String(data);

  // Corrige problema de UTC em datas YYYY-MM-DD
  if (dataString.includes('-')) {
    const [ano, mes, dia] = dataString.split('T')[0].split('-');

    return `${dia}/${mes}/${ano}`;
  }

  const dataObj = new Date(data);

  return dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

  function formatarDataHora(data?: string | null) {
    if (!data) return 'Não informado';

    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function dataInput(data?: string | null) {
    if (!data) return '';
    return new Date(data).toISOString().slice(0, 10);
  }

  function textoStatus(status?: string | null) {
    if (status === 'concluido') return 'Concluído';
    if (status === 'confirmado') return 'Confirmado';
    if (status === 'cancelado') return 'Cancelado';
    if (status === 'pendente') return 'Pendente';
    return status || 'Não informado';
  }

  function textoPagamento(status?: string | null) {
    if (status === 'pago') return 'Pago';
    if (status === 'aprovado') return 'Pago';
    if (status === 'confirmado') return 'Confirmado';
    if (status === 'pendente') return 'Pendente';
    if (status === 'sem_pagamento') return 'Sem pagamento';
    return status || 'Não informado';
  }

  async function carregarClientes(empresaId: string) {
    try {
      setCarregando(true);

      const res = await fetch(`/api/v1/clients?empresaId=${empresaId}`, {
        cache: 'no-store',
      });

      const data = await res.json();

      setClientes(data.clientes || []);
    } catch (error) {
      alert('Erro ao carregar clientes.');
    } finally {
      setCarregando(false);
    }
  }

  async function salvarCliente() {
    if (!empresa?.id) return;

    if (!form.nome.trim()) return alert('Informe o nome do cliente.');

    if (somenteNumeros(form.whatsapp).length < 10) {
      return alert('Informe um WhatsApp válido.');
    }

    if (form.cpf && somenteNumeros(form.cpf).length !== 11) {
      return alert('Informe um CPF válido com 11 dígitos.');
    }

    try {
      setSalvando(true);

      const res = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresa.id,
          nome: form.nome.trim(),
          whatsapp: somenteNumeros(form.whatsapp),
          cpf: somenteNumeros(form.cpf),
          dataNascimento: form.dataNascimento || undefined,
        }),
      });

      if (!res.ok) {
        const erro = await res.json();
        alert(erro.error || 'Erro ao salvar cliente.');
        return;
      }

      setForm({
        nome: '',
        whatsapp: '',
        cpf: '',
        dataNascimento: '',
      });

      await carregarClientes(empresa.id);
      setFormCadastroAberto(false);
      alert('Cliente salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar cliente.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirEditar(cliente: any) {
    setClienteSelecionado(cliente);
    setFormEdicao({
      nome: cliente.nome || '',
      whatsapp: formatarWhatsapp(cliente.whatsapp || ''),
      cpf: formatarCpf(cliente.cpf || ''),
      dataNascimento: dataInput(cliente.dataNascimento),
    });
    setModalEditarAberto(true);
  }

  function fecharEditar() {
    setModalEditarAberto(false);
    setClienteSelecionado(null);
    setFormEdicao({
      nome: '',
      whatsapp: '',
      cpf: '',
      dataNascimento: '',
    });
  }

  async function salvarEdicaoCliente() {
    if (!empresa?.id || !clienteSelecionado?.id) return;

    if (!formEdicao.nome.trim()) return alert('Informe o nome do cliente.');

    if (somenteNumeros(formEdicao.whatsapp).length < 10) {
      return alert('Informe um WhatsApp válido.');
    }

    if (formEdicao.cpf && somenteNumeros(formEdicao.cpf).length !== 11) {
      return alert('Informe um CPF válido com 11 dígitos.');
    }

    try {
      setSalvandoEdicao(true);

      const res = await fetch('/api/v1/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresa.id,
          clienteId: clienteSelecionado.id,
          nome: formEdicao.nome.trim(),
          whatsapp: somenteNumeros(formEdicao.whatsapp),
          cpf: somenteNumeros(formEdicao.cpf),
          dataNascimento: formEdicao.dataNascimento || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || 'Erro ao editar cliente.');
        return;
      }

      await carregarClientes(empresa.id);
      fecharEditar();
      alert('Cliente atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao editar cliente.');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function abrirHistorico(cliente: any) {
    if (!empresa?.id) return;

    try {
      setClienteSelecionado(cliente);
      setModalHistoricoAberto(true);
      setCarregandoHistorico(true);
      setHistoricoCliente([]);
      setFinanceiroCliente({ credito: 0, debito: 0, saldo: 0 });
      setMovimentacoesFinanceiras([]);

      const res = await fetch(`/api/v1/clients?empresaId=${empresa.id}&clienteId=${cliente.id}`, {
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Erro ao buscar histórico.');
        return;
      }

      setHistoricoCliente(data.historico || []);
      setFinanceiroCliente(data.financeiroCliente || data.cliente?.financeiro || { credito: 0, debito: 0, saldo: 0 });
      setMovimentacoesFinanceiras(data.movimentacoesFinanceiras || []);
    } catch (error) {
      alert('Erro ao buscar histórico.');
    } finally {
      setCarregandoHistorico(false);
    }
  }

  function fecharHistorico() {
    setModalHistoricoAberto(false);
    setClienteSelecionado(null);
    setHistoricoCliente([]);
    setFinanceiroCliente({ credito: 0, debito: 0, saldo: 0 });
    setMovimentacoesFinanceiras([]);
    setModalLancamentoFinanceiroAberto(false);
  }

  function abrirLancamentoFinanceiro(tipo: 'credito' | 'debito') {
    setFormLancamentoFinanceiro({
      tipo,
      valor: '',
      observacao: '',
    });
    setModalLancamentoFinanceiroAberto(true);
  }

  async function salvarLancamentoFinanceiro() {
    if (!empresa?.id || !clienteSelecionado?.id) return;

    const valor = valorNumerico(formLancamentoFinanceiro.valor);

    if (valor <= 0) {
      alert('Informe um valor maior que zero.');
      return;
    }

    try {
      setSalvandoLancamentoFinanceiro(true);

      const res = await fetch('/api/v1/clients/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresa.id,
          clienteId: clienteSelecionado.id,
          tipo: formLancamentoFinanceiro.tipo,
          valor,
          origem: 'ajuste_manual',
          observacao: formLancamentoFinanceiro.observacao || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || 'Erro ao lançar movimentação financeira.');
        return;
      }

      setFinanceiroCliente(data.resumo || { credito: 0, debito: 0, saldo: 0 });
      setMovimentacoesFinanceiras((atual) => [data.movimentacao, ...atual]);
      setModalLancamentoFinanceiroAberto(false);
      setFormLancamentoFinanceiro({ tipo: 'credito', valor: '', observacao: '' });
      await carregarClientes(empresa.id);

      alert('Movimentação financeira lançada com sucesso!');
    } catch (error) {
      alert('Erro ao lançar movimentação financeira.');
    } finally {
      setSalvandoLancamentoFinanceiro(false);
    }
  }

  function iniciarAgendamento(cliente: any) {
  window.location.href =
    `/agendar/${empresa.slug}?clienteId=${cliente.id}&origem=painel`;
}

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const termoNumerico = somenteNumeros(busca);

    if (!termo && !termoNumerico) return clientes;

    return clientes.filter((cliente) => {
      const nome = String(cliente.nome || '').toLowerCase();
      const whatsapp = somenteNumeros(cliente.whatsapp || '');
      const cpf = somenteNumeros(cliente.cpf || '');
      const nascimentoFormatado = formatarData(cliente.dataNascimento).toLowerCase();
      const nascimentoNumerico = somenteNumeros(nascimentoFormatado);
      const nascimentoIso = String(cliente.dataNascimento || '').toLowerCase();

      return (
        nome.includes(termo) ||
        whatsapp.includes(termoNumerico) ||
        cpf.includes(termoNumerico) ||
        nascimentoFormatado.includes(termo) ||
        nascimentoIso.includes(termo) ||
        (termoNumerico.length > 0 && nascimentoNumerico.includes(termoNumerico))
      );
    });
  }, [busca, clientes]);

  const corPrimaria = empresa?.corSidebar || empresa?.corPrimaria || '#7c3aed';
  const corSecundaria = empresa?.corSecundaria || '#06b6d4';

  const metricas = useMemo(() => {
    const totalClientes = clientes.length;
    const comCpf = clientes.filter((cliente) => somenteNumeros(cliente.cpf || '').length === 11).length;
    const comNascimento = clientes.filter((cliente) => !!cliente.dataNascimento).length;
    const encontrados = clientesFiltrados.length;
    const creditoTotal = clientes.reduce(
      (total, cliente) => total + valorNumerico(cliente.financeiro?.credito),
      0
    );
    const debitoTotal = clientes.reduce(
      (total, cliente) => total + valorNumerico(cliente.financeiro?.debito),
      0
    );

    return {
      totalClientes,
      encontrados,
      comCpf,
      comNascimento,
      creditoTotal,
      debitoTotal,
    };
  }, [clientes, clientesFiltrados]);

  if (!empresa) {
    return (
      <main style={loadingPage}>
        <div style={loadingCard}>
          <div style={loadingIcon}>👤</div>
          <strong>Carregando clientes...</strong>
          <span>Preparando seu CRM premium.</span>
        </div>
      </main>
    );
  }

  return (
    <PremiumLayout empresa={empresa} usuario={usuario}>
      <main
        className="clientes-page-mobile-safe"
        style={{
          ...page,
          background: `
            radial-gradient(circle at top left, ${hexToRgba(corPrimaria, 0.22)}, transparent 34%),
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

          .clientes-page-mobile-safe,
          .clientes-page-mobile-safe * {
            box-sizing: border-box;
          }

          .clientes-page-mobile-safe {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          @media (max-width: 1180px) {
            .clientes-page-mobile-safe {
              padding: 18px !important;
              padding-bottom: 120px !important;
            }

            .clientes-container-mobile {
              max-width: 100% !important;
              width: 100% !important;
            }

            .clientes-module-top-mobile,
            .clientes-header-mobile,
            .clientes-crm-dashboard-mobile,
            .clientes-form-card-mobile,
            .clientes-side-card-mobile,
            .clientes-lista-card-mobile {
              width: 100% !important;
              max-width: 100% !important;
            }

            .clientes-main-grid-mobile {
              grid-template-columns: 1fr !important;
            }

            .clientes-side-card-mobile {
              position: relative !important;
              top: auto !important;
            }

            .clientes-metricas-mobile {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              overflow-x: hidden !important;
              gap: 10px !important;
              padding-bottom: 0 !important;
            }

            .clientes-metricas-mobile > * {
              min-width: 0 !important;
            }

            .clientes-metricas-mobile > div {
              padding: 12px !important;
              border-radius: 18px !important;
              gap: 10px !important;
              min-height: 92px !important;
            }

            .clientes-metricas-mobile > div > div:first-child {
              width: 36px !important;
              height: 36px !important;
              border-radius: 13px !important;
              font-size: 17px !important;
            }

            .clientes-metricas-mobile small {
              display: none !important;
            }

            .clientes-grid-mobile {
              display: flex !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              gap: 12px !important;
              padding: 2px 4px 12px !important;
              scroll-snap-type: x mandatory !important;
              -webkit-overflow-scrolling: touch !important;
            }
          }

          @media (max-width: 760px) {
            .clientes-page-mobile-safe {
              padding: 14px !important;
              padding-bottom: 126px !important;
            }

            .clientes-module-top-mobile {
              padding: 13px 14px !important;
              border-radius: 20px !important;
              margin-bottom: 12px !important;
            }

            .clientes-header-mobile {
              padding: 12px !important;
              border-radius: 20px !important;
              display: grid !important;
              gap: 10px !important;
              margin-bottom: 12px !important;
            }

            .clientes-header-conteudo-mobile {
              display: grid !important;
              grid-template-columns: 42px minmax(0, 1fr) !important;
              gap: 10px !important;
              align-items: start !important;
              width: 100% !important;
              min-width: 0 !important;
            }

            .clientes-logo-mobile {
              width: 42px !important;
              height: 42px !important;
              border-radius: 14px !important;
              font-size: 18px !important;
            }

            .clientes-header-mobile h1 {
              font-size: 22px !important;
              line-height: 1.05 !important;
            }

            .clientes-header-mobile p {
              display: none !important;
            }

            .clientes-header-painel-mobile {
              width: 100% !important;
              min-width: 0 !important;
              padding: 12px 14px !important;
              border-radius: 18px !important;
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) auto !important;
              align-items: center !important;
              gap: 6px 12px !important;
            }

            .clientes-header-painel-mobile strong {
              grid-row: 1 / span 2 !important;
              grid-column: 2 !important;
              font-size: 34px !important;
            }

            .clientes-crm-dashboard-mobile,
            .clientes-form-card-mobile,
            .clientes-side-card-mobile,
            .clientes-lista-card-mobile {
              padding: 14px !important;
              border-radius: 22px !important;
            }

            .clientes-form-card-mobile {
              margin-bottom: 22px !important;
            }

            .clientes-crm-dashboard-mobile > div:first-child {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }

            .clientes-crm-dashboard-mobile > div:nth-child(2) {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .clientes-grid-form-mobile,
            .clientes-grid-form-modal-mobile,
            .clientes-financeiro-grid-mobile,
            .clientes-lancamento-grid-mobile {
              grid-template-columns: 1fr !important;
            }

            .clientes-lista-header-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 12px !important;
              align-items: stretch !important;
            }

            .clientes-busca-mobile {
              max-width: 100% !important;
              width: 100% !important;
            }

            .clientes-grid-mobile {
              display: flex !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              gap: 12px !important;
              padding: 2px 4px 12px !important;
              scroll-snap-type: x mandatory !important;
              -webkit-overflow-scrolling: touch !important;
            }

            .cliente-card-mobile {
              padding: 14px !important;
              border-radius: 20px !important;
              flex: 0 0 82vw !important;
              width: 82vw !important;
              max-width: 330px !important;
              min-width: 280px !important;
              overflow: hidden !important;
              scroll-snap-align: start !important;
            }

            .cliente-topo-mobile {
              display: grid !important;
              grid-template-columns: 44px minmax(0, 1fr) !important;
              gap: 10px !important;
              min-width: 0 !important;
              margin-bottom: 12px !important;
            }

            .cliente-topo-mobile > div:first-child {
              width: 44px !important;
              height: 44px !important;
              border-radius: 14px !important;
              font-size: 18px !important;
            }

            .cliente-topo-mobile > div:last-child {
              min-width: 0 !important;
            }

            .cliente-topo-mobile strong,
            .cliente-topo-mobile span {
              overflow-wrap: anywhere !important;
              word-break: break-word !important;
            }

            .cliente-mini-grid-mobile {
              display: flex !important;
              overflow-x: auto !important;
              gap: 8px !important;
              margin-bottom: 12px !important;
              padding-bottom: 2px !important;
            }

            .cliente-mini-grid-mobile > div {
              min-width: 108px !important;
              padding: 10px !important;
              border-radius: 14px !important;
            }

            .cliente-botoes-mobile {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              gap: 8px !important;
            }

            .cliente-botoes-mobile button {
              width: 100% !important;
              min-height: 40px !important;
              padding: 10px 8px !important;
              font-size: 12px !important;
              border-radius: 14px !important;
            }

            .clientes-modal-overlay-mobile {
              align-items: stretch !important;
              padding: 0 !important;
            }

            .clientes-modal-box-mobile,
            .clientes-modal-historico-mobile {
              width: 100vw !important;
              max-width: 100vw !important;
              height: 100vh !important;
              max-height: 100vh !important;
              border-radius: 0 !important;
              padding: 16px !important;
              overflow-x: hidden !important;
            }

            .clientes-modal-header-mobile {
              position: sticky !important;
              top: 0 !important;
              z-index: 5 !important;
              background: rgba(2,6,23,0.96) !important;
              backdrop-filter: blur(18px) !important;
              margin: -16px -16px 16px !important;
              padding: 16px !important;
              border-bottom: 1px solid rgba(255,255,255,0.10) !important;
              align-items: flex-start !important;
            }

            .clientes-modal-actions-mobile,
            .clientes-financeiro-acoes-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              width: 100% !important;
            }

            .clientes-modal-actions-mobile button,
            .clientes-financeiro-acoes-mobile button {
              width: 100% !important;
            }

            .clientes-financeiro-header-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }

            .clientes-historico-topo-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              text-align: left !important;
            }

            .clientes-historico-topo-mobile > div:last-child {
              text-align: left !important;
            }

            .clientes-financeiro-cards-mobile {
              grid-template-columns: 1fr !important;
            }

            .clientes-resumo-financeiro-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 6px !important;
            }

            .clientes-movimentacao-mobile {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 430px) {
            .clientes-metricas-mobile > * {
              min-width: 0 !important;
            }

            .cliente-card-mobile {
              flex-basis: 84vw !important;
              width: 84vw !important;
              min-width: 272px !important;
            }
          }
        `}</style>

        <div className="clientes-container-mobile" style={container}>
          <section className="clientes-module-top-mobile" style={moduleTopBar}>
            <div style={moduleTopLeft}>
              <div
                style={{
                  ...moduleTopIcon,
                  background: `linear-gradient(135deg, ${hexToRgba(corPrimaria, 0.98)}, ${hexToRgba(
                    corSecundaria,
                    0.72,
                  )})`,
                  boxShadow: `0 14px 32px ${hexToRgba(corPrimaria, 0.24)}`,
                }}
              >
                👥
              </div>

              <div style={{ minWidth: 0 }}>
                <h1 style={moduleTopTitle}>Clientes</h1>
                <p style={moduleTopSubtitle}>CRM, histórico e relacionamento</p>
              </div>
            </div>

            <div style={moduleTopBadge}>
              {metricas.totalClientes} na base
            </div>
          </section>
          <section className="clientes-crm-dashboard-mobile" style={crmDashboardCard}>
            <div style={crmDashboardHeader}>
              <div style={sideCompactHeader}>
                <div style={sideIcon}>💎</div>
                <div>
                  <span style={sectionEyebrow}>CRM inteligente</span>
                  <h2 style={sectionTitle}>Resumo do cliente</h2>
                  <p style={sideText}>Base, relacionamento e saldo em uma visão compacta.</p>
                </div>
              </div>

              <div style={crmDashboardTotalBox}>
                <span>Clientes</span>
                <strong>{metricas.totalClientes}</strong>
              </div>
            </div>

            <div style={crmDashboardStats}>
              <div style={sideStatItem}>
                <span>Filtrados</span>
                <strong>{metricas.encontrados}</strong>
              </div>

              <div style={sideStatItem}>
                <span>Com CPF</span>
                <strong>{metricas.comCpf}</strong>
              </div>

              <div style={sideStatItem}>
                <span>Aniversários</span>
                <strong>{metricas.comNascimento}</strong>
              </div>

              <div style={sideStatItem}>
                <span>Saldo geral</span>
                <strong>{dinheiro(metricas.creditoTotal - metricas.debitoTotal)}</strong>
              </div>
            </div>

            <div style={insightCompactBox}>
              💡 CPF e aniversário melhoram reagendamento, campanhas e histórico do cliente.
            </div>
          </section>

          <section className="clientes-form-card-mobile" style={formCard}>
            <div style={cadastroCompactHeader}>
              <div>
                <h2 style={sectionTitle}>Cadastrar cliente</h2>
                <p style={cadastroCompactTexto}>Adicione um novo cliente à sua base.</p>
              </div>

              <button
                type="button"
                onClick={() => setFormCadastroAberto((aberto) => !aberto)}
                aria-label={formCadastroAberto ? 'Fechar cadastro de cliente' : 'Abrir cadastro de cliente'}
                style={{
                  ...botaoAbrirCadastro,
                  background: formCadastroAberto
                    ? 'rgba(255,255,255,0.08)'
                    : `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                  boxShadow: formCadastroAberto
                    ? 'none'
                    : `0 16px 36px ${hexToRgba(corPrimaria, 0.28)}`,
                }}
              >
                {formCadastroAberto ? '×' : '+'}
              </button>
            </div>

            {formCadastroAberto && (
              <>
                <div className="clientes-grid-form-mobile" style={gridFormulario}>
                  <Campo
                    label="Nome completo"
                    placeholder="Ex: Maria Silva"
                    value={form.nome}
                    onChange={(value: string) => setForm({ ...form, nome: value })}
                  />

                  <Campo
                    label="WhatsApp"
                    placeholder="(00) 00000-0000"
                    value={form.whatsapp}
                    onChange={(value: string) =>
                      setForm({ ...form, whatsapp: formatarWhatsapp(value) })
                    }
                  />

                  <Campo
                    label="CPF"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(value: string) => setForm({ ...form, cpf: formatarCpf(value) })}
                  />

                  <div>
                    <label style={label}>Data de nascimento</label>
                    <input
                      type="date"
                      value={form.dataNascimento}
                      onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                      style={input}
                    />
                  </div>
                </div>

                <button
                  onClick={salvarCliente}
                  disabled={salvando}
                  style={{
                    ...botaoPrincipal,
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                    boxShadow: `0 18px 45px ${hexToRgba(corPrimaria, 0.32)}`,
                    opacity: salvando ? 0.7 : 1,
                  }}
                >
                  {salvando ? 'Salvando cliente...' : 'Salvar cliente'}
                </button>
              </>
            )}
          </section>

          <section className="clientes-lista-card-mobile" style={listaCard}>
            <div className="clientes-lista-header-mobile" style={listaHeader}>
              <div>
                <h2 style={sectionTitle}>Lista de clientes</h2>
                <p style={sectionDescription}>
                  Pesquise por nome, telefone, WhatsApp, CPF ou aniversário. Arraste os cards para navegar.
                </p>
              </div>

              <div className="clientes-busca-mobile" style={buscaArea}>
                <span style={buscaIcon}>🔎</span>
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, WhatsApp, telefone, CPF ou aniversário"
                  style={inputBusca}
                />
              </div>
            </div>

            {carregando ? (
              <div style={emptyState}>
                <div style={emptyIcon}>⏳</div>
                <strong>Carregando clientes...</strong>
                <span>Buscando sua base de relacionamento.</span>
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div style={emptyState}>
                <div style={emptyIcon}>👤</div>
                <strong>Nenhum cliente encontrado</strong>
                <span>Tente outro termo ou cadastre um novo cliente acima.</span>
              </div>
            ) : (
              <div className="clientes-grid-mobile" style={clientesGrid}>
                {clientesFiltrados.map((cliente) => (
                  <article key={cliente.id} className="cliente-card-mobile" style={clienteCard}>
                    <div
                      style={{
                        ...clienteGlow,
                        background: `radial-gradient(circle, ${hexToRgba(
                          corPrimaria,
                          0.22,
                        )}, transparent 72%)`,
                      }}
                    />

                    <div className="cliente-topo-mobile" style={clienteTopo}>
                      <div
                        style={{
                          ...avatar,
                          background: `linear-gradient(135deg, ${hexToRgba(
                            corPrimaria,
                            0.95,
                          )}, ${hexToRgba(corSecundaria, 0.72)})`,
                        }}
                      >
                        {String(cliente.nome || 'C').charAt(0).toUpperCase()}
                      </div>

                      <div style={{ flex: 1 }}>
                        <strong style={clienteNome}>{cliente.nome}</strong>
                        <div style={clienteInfo}>
                          <span>📲 {formatarWhatsapp(cliente.whatsapp || '')}</span>
                          <span>
                            🪪 {cliente.cpf ? formatarCpf(cliente.cpf) : 'CPF não informado'}
                          </span>
                          <span>🎂 {formatarData(cliente.dataNascimento)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="cliente-mini-grid-mobile" style={clienteMiniGrid}>
                      <div style={clienteMiniCard}>
                        <span>WhatsApp</span>
                        <strong>{formatarWhatsapp(cliente.whatsapp || '') || 'Não informado'}</strong>
                      </div>

                      <div style={clienteMiniCard}>
                        <span>CPF</span>
                        <strong>{cliente.cpf ? 'Informado' : 'Pendente'}</strong>
                      </div>

                      <div style={clienteMiniCard}>
                        <span>Cadastro</span>
                        <strong>{formatarData(cliente.createdAt)}</strong>
                      </div>

                      <div style={clienteMiniCard}>
                        <span>Saldo</span>
                        <strong style={{ color: corSaldoFinanceiro(valorNumerico(cliente.financeiro?.saldo)) }}>
                          {dinheiro(valorNumerico(cliente.financeiro?.saldo))}
                        </strong>
                      </div>
                    </div>

                    <div className="cliente-botoes-mobile" style={botoesCliente}>
                      <button onClick={() => abrirEditar(cliente)} style={botaoEditar}>
                        ✏️ Editar
                      </button>

                      <button onClick={() => abrirHistorico(cliente)} style={botaoHistorico}>
                        📋 Histórico
                      </button>

                      <button
                        onClick={() => iniciarAgendamento(cliente)}
                        style={{
                          ...botaoAgendar,
                          background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                        }}
                      >
                        📅 Agendar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {modalEditarAberto && (
          <div className="clientes-modal-overlay-mobile" style={modalOverlay}>
            <div className="clientes-modal-box-mobile" style={modalBox}>
              <div className="clientes-modal-header-mobile" style={modalHeader}>
                <div>
                  <h2 style={modalTitle}>Editar cliente</h2>
                  <p style={modalSubtitle}>
                    Atualize os dados do cliente sem perder o histórico.
                  </p>
                </div>

                <button onClick={fecharEditar} style={botaoFechar}>
                  ×
                </button>
              </div>

              <div className="clientes-grid-form-modal-mobile" style={gridFormularioModal}>
                <Campo
                  label="Nome completo"
                  placeholder="Nome do cliente"
                  value={formEdicao.nome}
                  onChange={(value: string) =>
                    setFormEdicao({ ...formEdicao, nome: value })
                  }
                />

                <Campo
                  label="WhatsApp"
                  placeholder="(00) 00000-0000"
                  value={formEdicao.whatsapp}
                  onChange={(value: string) =>
                    setFormEdicao({
                      ...formEdicao,
                      whatsapp: formatarWhatsapp(value),
                    })
                  }
                />

                <Campo
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={formEdicao.cpf}
                  onChange={(value: string) =>
                    setFormEdicao({
                      ...formEdicao,
                      cpf: formatarCpf(value),
                    })
                  }
                />

                <div>
                  <label style={label}>Data de nascimento</label>
                  <input
                    type="date"
                    value={formEdicao.dataNascimento}
                    onChange={(e) =>
                      setFormEdicao({
                        ...formEdicao,
                        dataNascimento: e.target.value,
                      })
                    }
                    style={input}
                  />
                </div>
              </div>

              <div className="clientes-modal-actions-mobile" style={modalActions}>
                <button onClick={fecharEditar} style={botaoCancelar}>
                  Cancelar
                </button>

                <button
                  onClick={salvarEdicaoCliente}
                  disabled={salvandoEdicao}
                  style={{
                    ...botaoSalvarModal,
                    background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                  }}
                >
                  {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalHistoricoAberto && (
          <div className="clientes-modal-overlay-mobile" style={modalOverlay}>
            <div className="clientes-modal-historico-mobile" style={modalHistorico}>
              <div className="clientes-modal-header-mobile" style={modalHeader}>
                <div>
                  <h2 style={modalTitle}>Histórico do cliente</h2>

                  <p style={modalSubtitle}>
                    {clienteSelecionado?.nome} ·{' '}
                    {formatarWhatsapp(clienteSelecionado?.whatsapp || '')}
                  </p>
                </div>

                <button onClick={fecharHistorico} style={botaoFechar}>
                  ×
                </button>
              </div>

              <section style={clienteFinanceiroResumoBox}>
                <div className="clientes-financeiro-header-mobile" style={clienteFinanceiroResumoHeader}>
                  <div>
                    <span style={sectionEyebrow}>Conta financeira</span>
                    <h3 style={clienteFinanceiroTitulo}>Créditos e débitos do cliente</h3>
                    <p style={modalSubtitle}>
                      Controle valores a favor do cliente, pendências e compensações internas.
                    </p>
                  </div>

                  <div className="clientes-financeiro-acoes-mobile" style={clienteFinanceiroAcoes}>
                    <button
                      onClick={() => abrirLancamentoFinanceiro('credito')}
                      style={{ ...botaoCredito, background: 'rgba(34,197,94,0.16)', color: '#bbf7d0' }}
                    >
                      + Lançar crédito
                    </button>

                    <button
                      onClick={() => abrirLancamentoFinanceiro('debito')}
                      style={{ ...botaoCredito, background: 'rgba(239,68,68,0.16)', color: '#fecaca' }}
                    >
                      + Lançar débito
                    </button>
                  </div>
                </div>

                <div className="clientes-financeiro-grid-mobile" style={financeiroClienteGrid}>
                  <ResumoFinanceiro label="Crédito ativo" valor={dinheiro(financeiroCliente.credito)} />
                  <ResumoFinanceiro label="Débito aberto" valor={dinheiro(financeiroCliente.debito)} />
                  <ResumoFinanceiro label="Saldo final" valor={dinheiro(financeiroCliente.saldo)} />
                </div>

                {modalLancamentoFinanceiroAberto && (
                  <div className="clientes-lancamento-grid-mobile" style={lancamentoFinanceiroBox}>
                    <div>
                      <label style={labelStyle}>Tipo</label>
                      <select
                        value={formLancamentoFinanceiro.tipo}
                        onChange={(e) =>
                          setFormLancamentoFinanceiro({
                            ...formLancamentoFinanceiro,
                            tipo: e.target.value,
                          })
                        }
                        style={input}
                      >
                        <option value="credito">Crédito para o cliente</option>
                        <option value="debito">Débito do cliente</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Valor</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={formLancamentoFinanceiro.valor}
                        onChange={(e) =>
                          setFormLancamentoFinanceiro({
                            ...formLancamentoFinanceiro,
                            valor: e.target.value,
                          })
                        }
                        style={input}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Observação</label>
                      <textarea
                        value={formLancamentoFinanceiro.observacao}
                        onChange={(e) =>
                          setFormLancamentoFinanceiro({
                            ...formLancamentoFinanceiro,
                            observacao: e.target.value,
                          })
                        }
                        placeholder="Ex: Crédito gerado por ajuste interno / débito de valor pendente."
                        style={textareaFinanceiroCliente}
                      />
                    </div>

                    <div className="clientes-modal-actions-mobile" style={modalActions}>
                      <button
                        onClick={() => setModalLancamentoFinanceiroAberto(false)}
                        style={botaoCancelar}
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={salvarLancamentoFinanceiro}
                        disabled={salvandoLancamentoFinanceiro}
                        style={{
                          ...botaoSalvarModal,
                          background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
                        }}
                      >
                        {salvandoLancamentoFinanceiro ? 'Salvando...' : 'Salvar lançamento'}
                      </button>
                    </div>
                  </div>
                )}

                <div style={movimentacoesFinanceirasBox}>
                  <strong style={historicoServico}>Histórico financeiro</strong>

                  {movimentacoesFinanceiras.length === 0 ? (
                    <p style={historicoTexto}>Nenhuma movimentação financeira lançada.</p>
                  ) : (
                    movimentacoesFinanceiras.map((movimentacao) => (
                      <div key={movimentacao.id} className="clientes-movimentacao-mobile" style={movimentacaoLinha}>
                        <div>
                          <strong
                            style={{
                              color: movimentacao.tipo === 'credito' ? '#bbf7d0' : '#fecaca',
                            }}
                          >
                            {textoTipoMovimentacao(movimentacao.tipo)} · {dinheiro(movimentacao.valor)}
                          </strong>

                          <p style={historicoTexto}>
                            {textoOrigemMovimentacao(movimentacao.origem)} · {formatarDataHora(movimentacao.createdAt)}
                          </p>

                          {movimentacao.observacao && (
                            <p style={historicoTexto}>{movimentacao.observacao}</p>
                          )}
                        </div>

                        <span style={badgeStatus(movimentacao.status)}>
                          {movimentacao.status || 'ativo'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {carregandoHistorico ? (
                <div style={emptyState}>
                  <div style={emptyIcon}>⏳</div>
                  <strong>Carregando histórico...</strong>
                  <span>Buscando atendimentos do cliente.</span>
                </div>
              ) : historicoCliente.length === 0 ? (
                <div style={emptyState}>
                  <div style={emptyIcon}>📋</div>
                  <strong>Sem histórico</strong>
                  <span>Este cliente ainda não possui atendimentos.</span>
                </div>
              ) : (
                <div style={listaHistorico}>
                  {historicoCliente.map((item) => (
                    <div key={item.id} style={historicoCard}>
                      <div style={historicoGlow} />

                      <div className="clientes-historico-topo-mobile" style={historicoTopo}>
                        <div>
                          <strong style={historicoServico}>{item.servico}</strong>

                          <p style={historicoTexto}>
                            {item.profissional} ·{' '}
                            {formatarDataHora(item.dataHoraInicio)}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={badgeStatus(item.status)}>
                            {textoStatus(item.status)}
                          </span>

                          <p style={historicoTexto}>
                            Pagamento: {textoPagamento(item.statusPagamento)}
                          </p>
                        </div>
                      </div>

                      <div className="clientes-financeiro-cards-mobile" style={financeiroGrid}>
                        <ResumoFinanceiro
                          label="Total"
                          valor={dinheiro(item.total)}
                        />

                        <ResumoFinanceiro
                          label="Pago"
                          valor={dinheiro(item.pago)}
                        />

                        <ResumoFinanceiro
                          label="Pendente"
                          valor={dinheiro(item.pendente)}
                        />
                      </div>

                      {item.adicionais?.length > 0 && (
                        <div style={adicionaisBox}>
                          <strong>Serviços adicionais</strong>

                          {item.adicionais.map((adicional: any) => (
                            <div key={adicional.id} style={adicionalLinha}>
                              <span>
                                {adicional.nome} · {adicional.profissional}
                              </span>

                              <strong>{dinheiro(adicional.valor)}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </PremiumLayout>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: any) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      />
    </div>
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
          background: `linear-gradient(135deg, ${hexToRgba(
            cor,
            0.95,
          )}, ${hexToRgba(cor, 0.45)})`,
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

function ResumoFinanceiro({
  label,
  valor,
}: any) {
  return (
    <div className="clientes-resumo-financeiro-mobile" style={resumoFinanceiroCard}>
      <span>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function badgeStatus(status?: string | null): CSSProperties {
  if (status === 'concluido') {
    return {
      ...badgeBase,
      background: 'rgba(34,197,94,0.18)',
      color: '#bbf7d0',
      border: '1px solid rgba(34,197,94,0.20)',
    };
  }

  if (status === 'confirmado') {
    return {
      ...badgeBase,
      background: 'rgba(59,130,246,0.18)',
      color: '#bfdbfe',
      border: '1px solid rgba(59,130,246,0.20)',
    };
  }

  if (status === 'cancelado') {
    return {
      ...badgeBase,
      background: 'rgba(239,68,68,0.18)',
      color: '#fecaca',
      border: '1px solid rgba(239,68,68,0.20)',
    };
  }

  return {
    ...badgeBase,
    background: 'rgba(245,158,11,0.18)',
    color: '#fde68a',
    border: '1px solid rgba(245,158,11,0.20)',
  };
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

const moduleTopBar: CSSProperties = {
  borderRadius: 24,
  padding: '16px 18px',
  marginBottom: 14,
  background: 'linear-gradient(135deg, rgba(15,23,42,0.94), rgba(2,6,23,0.92))',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 22px 60px rgba(0,0,0,0.22)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

const moduleTopLeft: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
};

const moduleTopIcon: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 21,
  flexShrink: 0,
  color: '#fff',
};

const moduleTopTitle: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 24,
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: '-0.03em',
};

const moduleTopSubtitle: CSSProperties = {
  margin: '6px 0 0',
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.35,
};

const moduleTopBadge: CSSProperties = {
  padding: '9px 12px',
  borderRadius: 999,
  background: 'rgba(124,58,237,0.14)',
  border: '1px solid rgba(124,58,237,0.20)',
  color: '#ddd6fe',
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const page: CSSProperties = {
  minHeight: '100vh',
  padding: 30,
  color: '#e5e7eb',
};

const container: CSSProperties = {
  maxWidth: 1320,
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
  borderRadius: 24,
  padding: 22,
  marginBottom: 14,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap',
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.16)',
};

const headerOverlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.08), transparent 34%, rgba(255,255,255,0.08))',
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
  width: 62,
  height: 62,
  borderRadius: 20,
  overflow: 'hidden',
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 34,
  fontWeight: 900,
  color: '#fff',
  boxShadow: '0 14px 34px rgba(0,0,0,0.24)',
  flexShrink: 0,
};

const badgeBoasVindas: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '7px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 12,
  border: '1px solid rgba(255,255,255,0.12)',
};

const tituloHeader: CSSProperties = {
  margin: 0,
  fontSize: 34,
  fontWeight: 950,
  color: '#fff',
  lineHeight: 1,
  letterSpacing: '-0.03em',
};

const subtituloHeader: CSSProperties = {
  margin: '12px 0 0',
  color: 'rgba(255,255,255,0.82)',
  fontSize: 15,
  fontWeight: 500,
  maxWidth: 620,
  lineHeight: 1.6,
};

const linhaBadgesHeader: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 18,
};

const badgeEmpresa: CSSProperties = {
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '9px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: '1px solid rgba(255,255,255,0.12)',
};

const badgeModulo: CSSProperties = {
  background: 'rgba(245,158,11,0.18)',
  color: '#fde68a',
  padding: '9px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: '1px solid rgba(245,158,11,0.18)',
};

const badgeStatusHeader: CSSProperties = {
  background: 'rgba(34,197,94,0.16)',
  color: '#bbf7d0',
  padding: '9px 14px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: '1px solid rgba(34,197,94,0.18)',
};

const headerPainel: CSSProperties = {
  minWidth: 220,
  borderRadius: 20,
  padding: 18,
  background: 'rgba(2,6,23,0.26)',
  border: '1px solid rgba(255,255,255,0.12)',
  backdropFilter: 'blur(14px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
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
  fontSize: 44,
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 12,
  marginBottom: 14,
};

const metricCard: CSSProperties = {
  borderRadius: 20,
  padding: 16,
  background: 'rgba(15,23,42,0.86)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  boxShadow: '0 20px 60px rgba(0,0,0,0.24)',
};

const metricIcon: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 16,
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
  border: '1px solid rgba(124,58,237,0.30)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.26)',
  marginBottom: 24,
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


const crmDashboardCard: CSSProperties = {
  borderRadius: 26,
  padding: 18,
  background: 'rgba(15,23,42,0.88)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 22px 60px rgba(0,0,0,0.22)',
  marginBottom: 14,
};

const crmDashboardHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  alignItems: 'center',
  marginBottom: 12,
  flexWrap: 'wrap',
};

const crmDashboardTotalBox: CSSProperties = {
  minWidth: 116,
  borderRadius: 18,
  padding: '12px 14px',
  background: 'rgba(2,6,23,0.58)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const crmDashboardStats: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
};

const cadastroCompactHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
};

const cadastroCompactTexto: CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
  fontSize: 14,
  lineHeight: 1.55,
};

const botaoAbrirCadastro: CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#fff',
  fontSize: 26,
  fontWeight: 950,
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const gridFormulario: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 18,
  marginTop: 22,
  marginBottom: 24,
};

const label: CSSProperties = {
  color: '#e2e8f0',
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 8,
  display: 'block',
};

const labelStyle: CSSProperties = {
  color: '#e2e8f0',
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 8,
  display: 'block',
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

const sideCard: CSSProperties = {
  borderRadius: 22,
  padding: 16,
  background: 'rgba(15,23,42,0.88)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 30px 80px rgba(0,0,0,0.24)',
  position: 'sticky',
  top: 20,
};

const sideIcon: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 16,
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
  fontSize: 19,
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
  borderRadius: 14,
  padding: 12,
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
  borderRadius: 24,
  padding: 18,
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

const buscaArea: CSSProperties = {
  width: '100%',
  maxWidth: 360,
  height: 52,
  borderRadius: 18,
  background: 'rgba(2,6,23,0.66)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 14px',
};

const buscaIcon: CSSProperties = {
  color: '#94a3b8',
  fontSize: 16,
};

const inputBusca: CSSProperties = {
  flex: 1,
  border: 'none',
  background: 'transparent',
  outline: 'none',
  color: '#fff',
  fontSize: 14,
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

const clientesGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 16,
};

const clienteCard: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 22,
  padding: 16,
  background: 'linear-gradient(180deg, rgba(15,23,42,0.94), rgba(2,6,23,0.94))',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 26px 70px rgba(0,0,0,0.28)',
};

const clienteGlow: CSSProperties = {
  position: 'absolute',
  width: 240,
  height: 240,
  top: -120,
  right: -120,
  pointerEvents: 'none',
};

const clienteTopo: CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'flex-start',
  marginBottom: 20,
  position: 'relative',
  zIndex: 2,
};

const avatar: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
  fontWeight: 950,
  flexShrink: 0,
  color: '#fff',
};

const clienteNome: CSSProperties = {
  display: 'block',
  color: '#fff',
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 10,
};

const clienteInfo: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#94a3b8',
  fontSize: 13,
  fontWeight: 700,
};

const clienteMiniGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 12,
  marginBottom: 20,
};

const clienteMiniCard: CSSProperties = {
  borderRadius: 14,
  padding: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  color: '#fff',
};

const botoesCliente: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 10,
};

const botaoEditar: CSSProperties = {
  padding: '11px 10px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoHistorico: CSSProperties = {
  ...botaoEditar,
};

const botaoAgendar: CSSProperties = {
  ...botaoEditar,
  border: 'none',
};

const sideCompactHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 14,
};

const sideCompactStats: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginTop: 12,
};

const insightCompactBox: CSSProperties = {
  marginTop: 12,
  borderRadius: 16,
  padding: 12,
  background: 'rgba(59,130,246,0.08)',
  border: '1px solid rgba(59,130,246,0.12)',
  color: '#bfdbfe',
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.45,
};

const modalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(2,6,23,0.78)',
  zIndex: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  backdropFilter: 'blur(12px)',
};

const modalBox: CSSProperties = {
  width: '100%',
  maxWidth: 760,
  borderRadius: 30,
  padding: 28,
  background: 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 35px 100px rgba(0,0,0,0.48)',
  color: '#fff',
};

const modalHistorico: CSSProperties = {
  ...modalBox,
  maxWidth: 980,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const modalHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 22,
};

const modalTitle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  color: '#fff',
  fontWeight: 900,
  letterSpacing: '-0.03em',
};

const modalSubtitle: CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
  fontSize: 14,
  lineHeight: 1.6,
};

const botaoFechar: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 24,
  fontWeight: 900,
  cursor: 'pointer',
};

const gridFormularioModal: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
};

const modalActions: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  marginTop: 22,
  flexWrap: 'wrap',
};

const botaoCancelar: CSSProperties = {
  padding: '13px 18px',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoSalvarModal: CSSProperties = {
  padding: '13px 18px',
  borderRadius: 16,
  border: 'none',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const listaHistorico: CSSProperties = {
  display: 'grid',
  gap: 14,
};

const historicoCard: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 22,
  padding: 18,
  background: 'rgba(15,23,42,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const historicoGlow: CSSProperties = {
  position: 'absolute',
  width: 180,
  height: 180,
  top: -90,
  right: -90,
  background: 'radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%)',
  pointerEvents: 'none',
};

const historicoTopo: CSSProperties = {
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  marginBottom: 14,
};

const historicoServico: CSSProperties = {
  color: '#fff',
  fontSize: 18,
  fontWeight: 900,
};

const historicoTexto: CSSProperties = {
  margin: '6px 0 0',
  color: '#94a3b8',
  fontSize: 13,
  fontWeight: 700,
};

const badgeBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '7px 11px',
  fontSize: 12,
  fontWeight: 900,
};

const financeiroGrid: CSSProperties = {
  position: 'relative',
  zIndex: 2,
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 10,
  marginTop: 12,
};

const resumoFinanceiroCard: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: 14,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  color: '#fff',
  fontSize: 13,
  fontWeight: 900,
};

const adicionaisBox: CSSProperties = {
  position: 'relative',
  zIndex: 2,
  marginTop: 12,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: 14,
  color: '#fff',
};

const adicionalLinha: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 8,
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 800,
};


const clienteFinanceiroResumoBox: CSSProperties = {
  borderRadius: 24,
  padding: 20,
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
  marginBottom: 20,
};

const clienteFinanceiroResumoHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 16,
  flexWrap: 'wrap',
};

const clienteFinanceiroTitulo: CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 22,
  fontWeight: 950,
  letterSpacing: '-0.03em',
};

const clienteFinanceiroAcoes: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const botaoCredito: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 14,
  padding: '12px 14px',
  fontWeight: 900,
  cursor: 'pointer',
};

const financeiroClienteGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginBottom: 16,
};

const lancamentoFinanceiroBox: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
  borderRadius: 20,
  padding: 16,
  background: 'rgba(2,6,23,0.48)',
  border: '1px solid rgba(255,255,255,0.08)',
  marginBottom: 16,
};

const textareaFinanceiroCliente: CSSProperties = {
  ...input,
  minHeight: 92,
  resize: 'vertical',
  fontFamily: 'inherit',
};

const movimentacoesFinanceirasBox: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const movimentacaoLinha: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  padding: 14,
  borderRadius: 16,
  background: 'rgba(2,6,23,0.42)',
  border: '1px solid rgba(255,255,255,0.06)',
};
