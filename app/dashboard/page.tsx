'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const [empresa, setEmpresa] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);

  const [resumo, setResumo] = useState<any>({});
  const [graficoFaturamento, setGraficoFaturamento] = useState<any[]>([]);
  const [mostrarFinanceiro, setMostrarFinanceiro] = useState(false);

  const [modalReagendamentoAberto, setModalReagendamentoAberto] = useState(false);
  const [pesquisaReagendamento, setPesquisaReagendamento] = useState('');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null);
  const [novaDataReagendamento, setNovaDataReagendamento] = useState('');
  const [horariosReagendamento, setHorariosReagendamento] = useState<string[]>([]);
  const [horarioReagendamento, setHorarioReagendamento] = useState('');
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [reagendando, setReagendando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    const empresaStorage = localStorage.getItem('empresaLogada');
    const usuarioStorage = localStorage.getItem('usuarioEmpresa');

    if (!empresaStorage || !usuarioStorage) {
      window.location.href = '/login';
      return;
    }

    const emp = JSON.parse(empresaStorage);
    const user = JSON.parse(usuarioStorage);

    setEmpresa(emp);
    setUsuario(user);

    carregar(emp.id);
  }, []);

  async function carregar(empresaId: string) {
    const res = await fetch(`/api/dashboard/agendamentos?empresaId=${empresaId}`);
    const data = await res.json();

    if (data.success) {
      setAgendamentos(data.agendamentos || []);
      setResumo(data.resumo || {});
      setGraficoFaturamento(data.graficoFaturamento || []);
    }
  }

  function sair() {
    localStorage.clear();
    window.location.href = '/login';
  }

  function usuarioPodeVerFinanceiro() {
    if (!usuario) return false;
    if (usuario.acessoTotal === true) return true;
    if (usuario.perfil === 'admin') return true;
    if (usuario.permissoes?.visualizarFinanceiro === true) return true;

    return false;
  }

  function alternarFinanceiro() {
    if (usuarioPodeVerFinanceiro()) {
      setMostrarFinanceiro(!mostrarFinanceiro);
      return;
    }

    alert(
      'Usuário sem permissão para visualizar valores financeiros. Solicite acesso a um administrador.'
    );
  }

  function dinheiro(valor: number) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function valorFinanceiro(valor: number) {
    if (!mostrarFinanceiro) return '••••••';
    return dinheiro(valor);
  }

  function ehHoje(data: any) {
    if (!data) return false;

    const d = new Date(data);
    const hoje = new Date();

    return (
      d.getDate() === hoje.getDate() &&
      d.getMonth() === hoje.getMonth() &&
      d.getFullYear() === hoje.getFullYear()
    );
  }

  function estaNaSemanaAtual(data: any) {
    if (!data) return false;

    const d = new Date(data);
    const hoje = new Date();

    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    return d >= inicioSemana && d <= fimSemana;
  }

  function hojeFormatoInput() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  function formatarHorario(data: any) {
    if (!data) return '--:--';

    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatarDataHora(data: any) {
    if (!data) return 'Não informado';

    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function formatarCanceladoEm(data?: string | null) {
    if (!data) return 'Não informado';

    return new Date(data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  function textoStatus(status?: string | null) {
    if (status === 'cancelado') return 'Cancelado';
    if (status === 'confirmado') return 'Confirmado';
    if (status === 'pendente') return 'Pendente';
    if (status === 'concluido') return 'Concluído';

    return status || 'Não informado';
  }

  function nomeCliente(agendamento: any) {
    return (
      agendamento.Cliente?.nome ||
      agendamento.cliente?.nome ||
      agendamento.nomeCliente ||
      agendamento.clienteNome ||
      'Cliente não informado'
    );
  }

  function nomeServico(agendamento: any) {
    return (
      agendamento.Servico?.nome ||
      agendamento.servico?.nome ||
      agendamento.servicoNome ||
      'Serviço não informado'
    );
  }

  function nomeProfissional(agendamento: any) {
    return (
      agendamento.Profissional?.nome ||
      agendamento.profissional?.nome ||
      agendamento.profissionalNome ||
      'Profissional não informado'
    );
  }

  function whatsappCliente(agendamento: any) {
    return (
      agendamento.Cliente?.whatsapp ||
      agendamento.cliente?.whatsapp ||
      agendamento.whatsapp ||
      ''
    );
  }

  function cpfCliente(agendamento: any) {
    return (
      agendamento.Cliente?.cpf ||
      agendamento.cliente?.cpf ||
      agendamento.cpf ||
      ''
    );
  }

  function obterProfissional(agendamento: any) {
    return agendamento.Profissional || agendamento.profissional || null;
  }

  function calcularComissao(agendamento: any) {
    const profissional = obterProfissional(agendamento);

    if (!profissional) return 0;

    const valorServico = Number(agendamento.valorTotal || 0);
    const tipoComissao = profissional.tipoComissao;
    const valorComissao = Number(profissional.valorComissao || 0);

    if (tipoComissao === 'percentual') {
      return (valorServico * valorComissao) / 100;
    }

    if (tipoComissao === 'fixo') {
      return valorComissao;
    }

    return 0;
  }

  function agruparPorNome(lista: any[], obterNome: (item: any) => string) {
    const mapa: Record<string, number> = {};

    lista.forEach((item) => {
      const nome = obterNome(item);
      mapa[nome] = (mapa[nome] || 0) + 1;
    });

    return Object.entries(mapa)
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  function abrirModalReagendamento() {
    setModalReagendamentoAberto(true);
    setPesquisaReagendamento('');
    setAgendamentoSelecionado(null);
    setNovaDataReagendamento('');
    setHorariosReagendamento([]);
    setHorarioReagendamento('');
  }

  function fecharModalReagendamento() {
    setModalReagendamentoAberto(false);
    setPesquisaReagendamento('');
    setAgendamentoSelecionado(null);
    setNovaDataReagendamento('');
    setHorariosReagendamento([]);
    setHorarioReagendamento('');
  }

  function selecionarAgendamentoPainel(agendamento: any) {
    setAgendamentoSelecionado(agendamento);
    setNovaDataReagendamento('');
    setHorariosReagendamento([]);
    setHorarioReagendamento('');
  }

  async function buscarHorariosReagendamento() {
    if (!agendamentoSelecionado) {
      alert('Selecione um agendamento.');
      return;
    }

    if (!novaDataReagendamento) {
      alert('Selecione a nova data.');
      return;
    }

    if (novaDataReagendamento < hojeFormatoInput()) {
      alert('A nova data não pode ser anterior ao dia atual.');
      setNovaDataReagendamento('');
      setHorariosReagendamento([]);
      setHorarioReagendamento('');
      return;
    }

    const servicoId = agendamentoSelecionado.servicoId;
    const profissionalId = agendamentoSelecionado.profissionalId;

    if (!servicoId || !profissionalId) {
      alert('Este agendamento não possui serviço ou profissional vinculado.');
      return;
    }

    try {
      setBuscandoHorarios(true);

      const res = await fetch(
        `/api/horarios-disponiveis?profissionalId=${profissionalId}&servicoId=${servicoId}&data=${novaDataReagendamento}`
      );

      const data = await res.json();

      setHorariosReagendamento(data.horarios || []);
      setHorarioReagendamento('');
    } catch (error) {
      alert('Erro ao buscar horários disponíveis.');
    } finally {
      setBuscandoHorarios(false);
    }
  }

  async function confirmarReagendamento() {
    if (!empresa) return;

    if (!agendamentoSelecionado) {
      alert('Selecione um agendamento.');
      return;
    }

    if (!novaDataReagendamento) {
      alert('Selecione a nova data.');
      return;
    }

    if (!horarioReagendamento) {
      alert('Selecione o novo horário.');
      return;
    }

    try {
      setReagendando(true);

      const novaDataHora = new Date(`${novaDataReagendamento}T${horarioReagendamento}`);

      const res = await fetch('/api/agendamentos/reagendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamentoId: agendamentoSelecionado.id,
          dataHoraInicio: novaDataHora,
          servicoId: agendamentoSelecionado.servicoId,
          profissionalId: agendamentoSelecionado.profissionalId,
          permitirMenosDe24h: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao reagendar atendimento.');
        return;
      }

      alert('Atendimento reagendado com sucesso!');

      setAgendamentoSelecionado(data.agendamento);
      setNovaDataReagendamento('');
      setHorariosReagendamento([]);
      setHorarioReagendamento('');

      await carregar(empresa.id);
    } catch (error) {
      alert('Erro ao reagendar atendimento.');
    } finally {
      setReagendando(false);
    }
  }

  async function cancelarAgendamento() {
    if (!empresa) return;

    if (!agendamentoSelecionado) {
      alert('Selecione um agendamento.');
      return;
    }

    if (agendamentoSelecionado.status === 'cancelado') {
      alert('Este atendimento já está cancelado.');
      return;
    }

    const motivoCancelamento =
      window.prompt('Motivo do cancelamento (opcional):') || '';

    const confirmar = window.confirm(
      `Tem certeza que deseja cancelar o atendimento de ${nomeCliente(
        agendamentoSelecionado
      )}? O registro continuará salvo como cancelado e o horário ficará disponível para novos agendamentos.`
    );

    if (!confirmar) return;

    try {
      setCancelando(true);

      const res = await fetch('/api/agendamentos/reagendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamentoId: agendamentoSelecionado.id,
          motivoCancelamento,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao cancelar atendimento.');
        return;
      }

      alert('Atendimento cancelado com sucesso!');

      setAgendamentoSelecionado(null);
      setNovaDataReagendamento('');
      setHorariosReagendamento([]);
      setHorarioReagendamento('');

      await carregar(empresa.id);
    } catch (error) {
      alert('Erro ao cancelar atendimento.');
    } finally {
      setCancelando(false);
    }
  }

  const agendamentosHoje = agendamentos
    .filter((agendamento) => ehHoje(agendamento.dataHoraInicio))
    .sort(
      (a, b) =>
        new Date(a.dataHoraInicio).getTime() -
        new Date(b.dataHoraInicio).getTime()
    );

  const agendamentosSemana = agendamentos.filter((agendamento) =>
    estaNaSemanaAtual(agendamento.dataHoraInicio)
  );

  const agendamentosFuturos = agendamentos
    .filter((agendamento) => {
      if (!agendamento.dataHoraInicio) return false;
      return new Date(agendamento.dataHoraInicio).getTime() >= Date.now();
    })
    .sort(
      (a, b) =>
        new Date(a.dataHoraInicio).getTime() -
        new Date(b.dataHoraInicio).getTime()
    );

  const agendamentosFuturosFiltrados = agendamentosFuturos.filter((agendamento) => {
    const termo = pesquisaReagendamento.trim().toLowerCase();

    if (!termo) return true;

    const termoNumerico = termo.replace(/\D/g, '');

    const cliente = nomeCliente(agendamento).toLowerCase();
    const servico = nomeServico(agendamento).toLowerCase();
    const profissional = nomeProfissional(agendamento).toLowerCase();
    const whatsapp = String(whatsappCliente(agendamento)).replace(/\D/g, '');
    const cpf = String(cpfCliente(agendamento)).replace(/\D/g, '');

    return (
      cliente.includes(termo) ||
      servico.includes(termo) ||
      profissional.includes(termo) ||
      whatsapp.includes(termoNumerico) ||
      cpf.includes(termoNumerico)
    );
  });

  const proximoCliente = agendamentosHoje.find((agendamento) => {
    if (!agendamento.dataHoraInicio) return false;
    return new Date(agendamento.dataHoraInicio).getTime() >= Date.now();
  });

  const faturamentoHoje = agendamentosHoje
    .filter((a) => a.statusPagamento === 'pago')
    .reduce((total, a) => total + Number(a.valorTotal || 0), 0);

  const comissaoHoje = agendamentosHoje
    .filter((a) => a.statusPagamento === 'pago')
    .reduce((total, a) => total + calcularComissao(a), 0);

  const totalAtendidos = agendamentosHoje.filter(
    (a) => new Date(a.dataHoraInicio).getTime() < Date.now()
  ).length;

  const ocupacaoDia =
    agendamentosHoje.length > 0
      ? Math.round((totalAtendidos / agendamentosHoje.length) * 100)
      : 0;

  const servicosRequisitadosSemana = agruparPorNome(
    agendamentosSemana,
    nomeServico
  ).slice(0, 5);

  const profissionaisRequisitadosSemana = agruparPorNome(
    agendamentosSemana,
    nomeProfissional
  ).slice(0, 5);

  if (!empresa || !usuario) {
    return <p style={{ padding: 40 }}>Carregando...</p>;
  }

  return (
    <main style={{ padding: 30, background: '#f1f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={header}>
          <div>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <p style={{ marginTop: 8 }}>{empresa.nome}</p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={alternarFinanceiro} style={botaoHeader}>
              {mostrarFinanceiro ? '🙈 Ocultar valores' : '👁 Ver valores'}
            </button>

            <a href="/admin">
              <button style={botaoHeader}>Admin</button>
            </a>

            <a href="/agenda">
              <button style={botaoHeader}>Agenda</button>
            </a>

            <button onClick={sair} style={botaoSair}>
              Sair
            </button>
          </div>
        </header>

        <section style={gridCards}>
          <Card titulo="Faturamento" valor={valorFinanceiro(resumo.faturamentoTotal)} />
          <Card titulo="Pagos" valor={resumo.totalPagos || 0} />
          <Card titulo="Ticket Médio" valor={valorFinanceiro(resumo.ticketMedio)} />
          <Card titulo="Comissões hoje" valor={valorFinanceiro(comissaoHoje)} />
        </section>

        <section style={gridPrincipal}>
          <div style={box}>
            <h3 style={{ marginTop: 0 }}>Agendamentos de hoje</h3>

            {agendamentosHoje.length === 0 ? (
              <div style={emptyBox}>Nenhum agendamento para hoje.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {agendamentosHoje.map((agendamento) => (
                  <div key={agendamento.id} style={linhaAgendamento}>
                    <div>
                      <strong>{formatarHorario(agendamento.dataHoraInicio)}</strong>
                      <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                        {nomeCliente(agendamento)}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong>{nomeServico(agendamento)}</strong>
                      <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                        {agendamento.status || 'pendente'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div style={boxDestaque}>
              <h3 style={{ marginTop: 0 }}>Próximo cliente da fila</h3>

              {proximoCliente ? (
                <>
                  <div style={horaGrande}>
                    {formatarHorario(proximoCliente.dataHoraInicio)}
                  </div>

                  <h2 style={{ margin: '10px 0 4px' }}>
                    {nomeCliente(proximoCliente)}
                  </h2>

                  <p style={{ color: '#64748b', marginTop: 0 }}>
                    {nomeServico(proximoCliente)}
                  </p>
                </>
              ) : (
                <div style={emptyBox}>Nenhum próximo cliente para hoje.</div>
              )}

              <a href="/agenda">
                <button style={botaoPrincipal}>
                  Abrir agenda semanal completa 📅
                </button>
              </a>

              <button onClick={abrirModalReagendamento} style={botaoReagendar}>
                Reagendar ou cancelar atendimentos
              </button>
            </div>

            <div style={box}>
              <h3 style={{ marginTop: 0 }}>Resumo do dia</h3>

              <div style={{ display: 'grid', gap: 12 }}>
                <ResumoItem
                  label="💰 Faturamento hoje"
                  valor={valorFinanceiro(faturamentoHoje)}
                />

                <ResumoItem
                  label="💸 Comissões hoje"
                  valor={valorFinanceiro(comissaoHoje)}
                />

                <ResumoItem
                  label="📊 Ocupação do dia"
                  valor={`${ocupacaoDia}%`}
                />

                <ResumoItem
                  label="👥 Total atendidos"
                  valor={totalAtendidos}
                />
              </div>
            </div>

            <div style={box}>
              <h3 style={{ marginTop: 0 }}>Serviços mais requisitados da semana</h3>

              {servicosRequisitadosSemana.length === 0 ? (
                <div style={emptyBoxPequeno}>
                  Nenhum serviço requisitado nesta semana.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {servicosRequisitadosSemana.map((servico: any) => (
                    <ResumoItem
                      key={servico.nome}
                      label={servico.nome}
                      valor={servico.quantidade}
                    />
                  ))}
                </div>
              )}
            </div>

            <div style={box}>
              <h3 style={{ marginTop: 0 }}>Profissionais mais requisitados da semana</h3>

              {profissionaisRequisitadosSemana.length === 0 ? (
                <div style={emptyBoxPequeno}>
                  Nenhum profissional requisitado nesta semana.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {profissionaisRequisitadosSemana.map((profissional: any) => (
                    <ResumoItem
                      key={profissional.nome}
                      label={profissional.nome}
                      valor={profissional.quantidade}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 20 }}>
          <div style={box}>
            <h3>Faturamento</h3>

            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={graficoFaturamento}>
                <XAxis dataKey="data" />
                <Tooltip
                  formatter={(value: any) =>
                    mostrarFinanceiro ? dinheiro(Number(value)) : '••••••'
                  }
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#4f46e5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {modalReagendamentoAberto && (
        <div style={modalOverlay} onClick={fecharModalReagendamento}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <div>
                <h2 style={{ margin: 0 }}>Reagendar ou cancelar atendimentos</h2>
                <p style={{ marginTop: 6, color: '#64748b' }}>
                  Pesquise agendamentos futuros por nome, serviço, profissional, WhatsApp ou CPF.
                </p>
              </div>

              <button onClick={fecharModalReagendamento} style={botaoFecharModal}>
                ×
              </button>
            </div>

            <input
              value={pesquisaReagendamento}
              onChange={(e) => setPesquisaReagendamento(e.target.value)}
              placeholder="Pesquisar por nome, serviço, profissional, WhatsApp ou CPF"
              style={inputPesquisa}
            />

            <div style={modalGrid}>
              <div style={listaAgendamentos}>
                {agendamentosFuturosFiltrados.length === 0 ? (
                  <div style={emptyBox}>
                    Nenhum agendamento futuro encontrado.
                  </div>
                ) : (
                  agendamentosFuturosFiltrados.map((agendamento) => (
                    <button
                      key={agendamento.id}
                      onClick={() => selecionarAgendamentoPainel(agendamento)}
                      style={{
                        ...itemAgendamentoModal,
                        border:
                          agendamentoSelecionado?.id === agendamento.id
                            ? '2px solid #7c3aed'
                            : '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <strong>{nomeCliente(agendamento)}</strong>
                        <p style={{ margin: '4px 0', color: '#64748b' }}>
                          {nomeServico(agendamento)} · {nomeProfissional(agendamento)}
                        </p>
                        <span style={{ color: '#475569', fontSize: 13 }}>
                          {formatarDataHora(agendamento.dataHoraInicio)}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          color:
                            agendamento.status === 'cancelado'
                              ? '#dc2626'
                              : agendamento.statusPagamento === 'pago'
                                ? '#15803d'
                                : '#b45309',
                        }}
                      >
                        {agendamento.status === 'cancelado'
                          ? 'cancelado'
                          : agendamento.statusPagamento || 'pendente'}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div style={painelAcaoModal}>
                {!agendamentoSelecionado ? (
                  <div style={emptyBox}>
                    Selecione um agendamento para reagendar ou cancelar.
                  </div>
                ) : (
                  <>
                    <div style={cardInfoModal}>
                      <span style={labelModal}>Cliente</span>
                      <strong>{nomeCliente(agendamentoSelecionado)}</strong>
                    </div>

                    <div style={cardInfoModal}>
                      <span style={labelModal}>Serviço</span>
                      <strong>{nomeServico(agendamentoSelecionado)}</strong>
                    </div>

                    <div style={cardInfoModal}>
                      <span style={labelModal}>Data atual</span>
                      <strong>{formatarDataHora(agendamentoSelecionado.dataHoraInicio)}</strong>
                    </div>

                    <div
                      style={
                        agendamentoSelecionado.status === 'cancelado'
                          ? cardInfoCanceladoModal
                          : cardInfoModal
                      }
                    >
                      <span
                        style={
                          agendamentoSelecionado.status === 'cancelado'
                            ? labelCanceladoModal
                            : labelModal
                        }
                      >
                        Status
                      </span>
                      <strong>{textoStatus(agendamentoSelecionado.status)}</strong>
                    </div>

                    {agendamentoSelecionado.status === 'cancelado' && (
                      <>
                        <div style={cardInfoCanceladoModal}>
                          <span style={labelCanceladoModal}>Motivo do cancelamento</span>
                          <strong>
                            {agendamentoSelecionado.motivoCancelamento || 'Não informado'}
                          </strong>
                        </div>

                        <div style={cardInfoCanceladoModal}>
                          <span style={labelCanceladoModal}>Cancelado em</span>
                          <strong>{formatarCanceladoEm(agendamentoSelecionado.canceladoEm)}</strong>
                        </div>
                      </>
                    )}

                    {agendamentoSelecionado.status !== 'cancelado' ? (
                      <>
                    <label style={labelCampo}>Nova data</label>
                    <input
                      type="date"
                      min={hojeFormatoInput()}
                      value={novaDataReagendamento}
                      onChange={(e) => {
                        setNovaDataReagendamento(e.target.value);
                        setHorariosReagendamento([]);
                        setHorarioReagendamento('');
                      }}
                      style={inputData}
                    />

                    <button
                      onClick={buscarHorariosReagendamento}
                      disabled={buscandoHorarios}
                      style={botaoBuscarHorarios}
                    >
                      {buscandoHorarios ? 'Buscando horários...' : 'Buscar horários disponíveis'}
                    </button>

                    <div style={{ marginTop: 12 }}>
                      {horariosReagendamento.length === 0 ? (
                        <div style={emptyBoxPequeno}>
                          Selecione uma data e busque horários.
                        </div>
                      ) : (
                        <div style={gradeHorarios}>
                          {horariosReagendamento.map((h) => (
                            <button
                              key={h}
                              onClick={() => setHorarioReagendamento(h)}
                              style={{
                                ...botaoHorario,
                                background:
                                  horarioReagendamento === h
                                    ? 'linear-gradient(135deg, #7c3aed, #db2777)'
                                    : '#fff',
                                color: horarioReagendamento === h ? '#fff' : '#0f172a',
                                border:
                                  horarioReagendamento === h
                                    ? '1px solid transparent'
                                    : '1px solid #cbd5e1',
                              }}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={confirmarReagendamento}
                      disabled={reagendando}
                      style={botaoConfirmarReagendamento}
                    >
                      {reagendando ? 'Reagendando...' : 'Confirmar reagendamento'}
                    </button>

                    <button
                      onClick={cancelarAgendamento}
                      disabled={cancelando}
                      style={botaoCancelarAgendamento}
                    >
                      {cancelando ? 'Cancelando...' : 'Cancelar atendimento'}
                    </button>
                      </>
                    ) : (
                      <div style={emptyBoxPequeno}>
                        Este atendimento já está cancelado e permanece registrado para histórico.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Card({ titulo, valor }: any) {
  return (
    <div style={card}>
      <div style={{ fontSize: 13, color: '#64748b' }}>{titulo}</div>
      <div style={{ fontSize: 26, fontWeight: 'bold' }}>{valor}</div>
    </div>
  );
}

function ResumoItem({ label, valor }: any) {
  return (
    <div style={resumoItem}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}

const header = {
  background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
  color: '#fff',
  padding: 30,
  borderRadius: 20,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const gridCards = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,1fr)',
  gap: 16,
  marginTop: 20,
};

const gridPrincipal = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: 20,
  marginTop: 20,
};

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 16,
  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
};

const box = {
  background: '#fff',
  padding: 20,
  borderRadius: 20,
  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
};

const boxDestaque = {
  background: '#fff',
  padding: 20,
  borderRadius: 20,
  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
};

const linhaAgendamento = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const resumoItem = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 12,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
};

const emptyBox = {
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#64748b',
  borderRadius: 14,
  padding: 18,
  textAlign: 'center' as const,
};

const emptyBoxPequeno = {
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#64748b',
  borderRadius: 12,
  padding: 12,
  textAlign: 'center' as const,
  fontSize: 13,
};

const horaGrande = {
  fontSize: 42,
  fontWeight: 900,
  color: '#4f46e5',
};

const botaoHeader = {
  padding: '10px 16px',
  borderRadius: 10,
  border: 'none',
  background: '#6366f1',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const botaoSair = {
  padding: '10px 16px',
  borderRadius: 10,
  border: 'none',
  background: '#ef4444',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const botaoPrincipal = {
  width: '100%',
  marginTop: 18,
  padding: 16,
  borderRadius: 14,
  border: 'none',
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
};

const botaoReagendar = {
  width: '100%',
  marginTop: 10,
  padding: 14,
  borderRadius: 14,
  border: '1px solid #ddd6fe',
  background: '#fff',
  color: '#7c3aed',
  fontWeight: 900,
  cursor: 'pointer',
};

const modalOverlay = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(15, 23, 42, 0.45)',
  zIndex: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const modalBox = {
  width: '100%',
  maxWidth: 980,
  maxHeight: '90vh',
  overflowY: 'auto' as const,
  background: '#fff',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 30px 80px rgba(15, 23, 42, 0.25)',
};

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 18,
};

const botaoFecharModal = {
  width: 36,
  height: 36,
  borderRadius: 999,
  border: 'none',
  background: '#f1f5f9',
  cursor: 'pointer',
  fontSize: 20,
  fontWeight: 800,
};

const inputPesquisa = {
  width: '100%',
  height: 48,
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '0 14px',
  outline: 'none',
  fontSize: 14,
  background: '#f8fafc',
  marginBottom: 18,
};

const modalGrid = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 0.8fr',
  gap: 18,
};

const listaAgendamentos = {
  display: 'grid',
  gap: 10,
  alignContent: 'start',
};

const itemAgendamentoModal = {
  width: '100%',
  background: '#fff',
  borderRadius: 16,
  padding: 14,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
};

const painelAcaoModal = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 16,
  alignSelf: 'start',
};

const cardInfoModal = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  padding: 12,
  borderRadius: 12,
  marginBottom: 10,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 4,
};

const labelModal = {
  fontSize: 12,
  color: '#64748b',
};

const cardInfoCanceladoModal = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  padding: 12,
  borderRadius: 12,
  marginBottom: 10,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 4,
};

const labelCanceladoModal = {
  fontSize: 12,
  color: '#991b1b',
};

const labelCampo = {
  display: 'block',
  fontSize: 12,
  fontWeight: 800,
  color: '#334155',
  marginBottom: 6,
};

const inputData = {
  width: '100%',
  height: 44,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: '0 12px',
  marginBottom: 10,
};

const botaoBuscarHorarios = {
  width: '100%',
  padding: 12,
  borderRadius: 12,
  border: 'none',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const gradeHorarios = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 8,
};

const botaoHorario = {
  minWidth: 72,
  height: 38,
  borderRadius: 12,
  cursor: 'pointer',
  fontWeight: 800,
};

const botaoConfirmarReagendamento = {
  width: '100%',
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #7c3aed, #db2777)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const botaoCancelarAgendamento = {
  width: '100%',
  marginTop: 10,
  padding: 14,
  borderRadius: 14,
  border: 'none',
  background: '#dc2626',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};