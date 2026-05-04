'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function AgendarPage() {
  const { slug } = useParams();

  const [empresa, setEmpresa] = useState<any>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);

  const [servicoId, setServicoId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [data, setData] = useState('');
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState('');

  const [cpf, setCpf] = useState('');
  const [buscandoCpf, setBuscandoCpf] = useState(false);
  const [cpfConsultado, setCpfConsultado] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<any>(null);
  const [mostrarCamposExtras, setMostrarCamposExtras] = useState(false);

  const [modoReagendamento, setModoReagendamento] = useState(false);
  const [buscandoReagendamentos, setBuscandoReagendamentos] = useState(false);
  const [agendamentosReagendamento, setAgendamentosReagendamento] = useState<any[]>([]);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null);
  const [novaDataReagendamento, setNovaDataReagendamento] = useState('');
  const [novosHorariosReagendamento, setNovosHorariosReagendamento] = useState<string[]>([]);
  const [novoHorarioReagendamento, setNovoHorarioReagendamento] = useState('');
  const [reagendando, setReagendando] = useState(false);

  const [cliente, setCliente] = useState({
    nome: '',
    whatsapp: '',
    dataNascimento: '',
  });

  useEffect(() => {
    carregarEmpresa();
  }, [slug]);

  function hojeFormatoInput() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, '');
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

  function formatarDataHora(dataHora?: string | null) {
    if (!dataHora) return 'Data não informada';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(dataHora));
  }

  function limparFluxoAgendamento() {
    setServicoId('');
    setProfissionalId('');
    setData('');
    setHorarios([]);
    setHorarioSelecionado('');
  }

  function limparFluxoReagendamento() {
    setAgendamentosReagendamento([]);
    setAgendamentoSelecionado(null);
    setNovaDataReagendamento('');
    setNovosHorariosReagendamento([]);
    setNovoHorarioReagendamento('');
  }

  function abrirWhatsappEmpresa() {
    const numeroEmpresa = somenteNumeros(empresa?.whatsapp || empresa?.telefone || '');

    if (!numeroEmpresa) {
      alert('A empresa ainda não possui WhatsApp/telefone cadastrado.');
      return;
    }

    const mensagem = encodeURIComponent(
      `Olá! Estou tentando reagendar um horário pelo Marcaê e preciso de ajuda.\n\nEmpresa: ${empresa.nome}`
    );

    window.open(`https://wa.me/55${numeroEmpresa}?text=${mensagem}`, '_blank');
  }

  async function carregarEmpresa() {
    const res = await fetch(`/api/empresas/slug/${slug}`);
    const data = await res.json();

    if (!data.empresa) {
      alert('Empresa não encontrada');
      return;
    }

    setEmpresa(data.empresa);
    carregarDados(data.empresa.id);
  }

  async function carregarDados(empresaId: string) {
    const [s, p] = await Promise.all([
      fetch(`/api/servicos?empresaId=${empresaId}`).then((r) => r.json()),
      fetch(`/api/profissionais?empresaId=${empresaId}`).then((r) => r.json()),
    ]);

    setServicos(s.servicos || []);
    setProfissionais(p.profissionais || []);
  }

  async function buscarClientePorCpf() {
    if (!empresa?.id) return;

    const cpfLimpo = somenteNumeros(cpf);

    if (cpfLimpo.length !== 11) {
      alert('Informe um CPF válido com 11 dígitos.');
      return;
    }

    try {
      setBuscandoCpf(true);
      setModoReagendamento(false);
      limparFluxoReagendamento();

      const res = await fetch(
        `/api/v1/clients/by-cpf?empresaId=${empresa.id}&cpf=${cpfLimpo}`
      );

      const data = await res.json();

      setCpfConsultado(true);

      if (data.cliente) {
        setClienteEncontrado(data.cliente);

        setCliente({
          nome: data.cliente.nome || '',
          whatsapp: data.cliente.whatsapp || '',
          dataNascimento: data.cliente.dataNascimento
            ? String(data.cliente.dataNascimento).slice(0, 10)
            : '',
        });

        setMostrarCamposExtras(false);
      } else {
        setClienteEncontrado(null);
        setCliente({
          nome: '',
          whatsapp: '',
          dataNascimento: '',
        });
        setMostrarCamposExtras(true);
      }
    } catch (error) {
      alert('Erro ao consultar CPF. Tente novamente.');
    } finally {
      setBuscandoCpf(false);
    }
  }

  async function buscarAgendamentosParaReagendar() {
    if (!empresa?.id) return;

    const cpfLimpo = somenteNumeros(cpf);

    if (cpfLimpo.length !== 11) {
      alert('Informe o CPF para buscar seus agendamentos.');
      return;
    }

    try {
      setModoReagendamento(true);
      setCpfConsultado(false);
      setClienteEncontrado(null);
      setMostrarCamposExtras(false);
      limparFluxoAgendamento();
      limparFluxoReagendamento();
      setBuscandoReagendamentos(true);

      const res = await fetch(
        `/api/agendamentos/reagendar?empresaId=${empresa.id}&cpf=${cpfLimpo}`,
        { cache: 'no-store' }
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.error || 'Erro ao buscar agendamentos para reagendamento.');
        return;
      }

      setAgendamentosReagendamento(data.agendamentos || []);
    } catch (error) {
      alert('Erro ao buscar agendamentos para reagendamento.');
    } finally {
      setBuscandoReagendamentos(false);
    }
  }

  async function buscarHorarios() {
    if (!servicoId || !profissionalId || !data) {
      alert('Selecione serviço, profissional e data para buscar horários.');
      return;
    }

    if (data < hojeFormatoInput()) {
      alert('A data do atendimento não pode ser anterior ao dia atual.');
      setData('');
      setHorarios([]);
      setHorarioSelecionado('');
      return;
    }

    const res = await fetch(
      `/api/horarios-disponiveis?profissionalId=${profissionalId}&servicoId=${servicoId}&data=${data}`
    );

    const dataRes = await res.json();
    setHorarios(dataRes.horarios || []);
    setHorarioSelecionado('');
  }

  async function buscarHorariosReagendamento() {
    if (!agendamentoSelecionado) {
      alert('Selecione um agendamento para reagendar.');
      return;
    }

    if (!novaDataReagendamento) {
      alert('Selecione a nova data.');
      return;
    }

    if (novaDataReagendamento < hojeFormatoInput()) {
      alert('A nova data não pode ser anterior ao dia atual.');
      setNovaDataReagendamento('');
      setNovosHorariosReagendamento([]);
      setNovoHorarioReagendamento('');
      return;
    }

    const servicoAtualId = agendamentoSelecionado.servicoId;
    const profissionalAtualId = agendamentoSelecionado.profissionalId;

    if (!servicoAtualId || !profissionalAtualId) {
      alert('Este agendamento não possui serviço ou profissional vinculado para buscar horários.');
      return;
    }

    const res = await fetch(
      `/api/horarios-disponiveis?profissionalId=${profissionalAtualId}&servicoId=${servicoAtualId}&data=${novaDataReagendamento}`
    );

    const dataRes = await res.json();
    setNovosHorariosReagendamento(dataRes.horarios || []);
    setNovoHorarioReagendamento('');
  }

  async function confirmarReagendamento() {
    if (!agendamentoSelecionado) return alert('Selecione o agendamento.');
    if (!novaDataReagendamento) return alert('Selecione a nova data.');
    if (!novoHorarioReagendamento) return alert('Selecione o novo horário.');

    if (novaDataReagendamento < hojeFormatoInput()) {
      alert('A nova data não pode ser anterior ao dia atual.');
      setNovaDataReagendamento('');
      setNovosHorariosReagendamento([]);
      setNovoHorarioReagendamento('');
      return;
    }

    try {
      setReagendando(true);

      const novaDataHora = new Date(`${novaDataReagendamento}T${novoHorarioReagendamento}`);

      const res = await fetch('/api/agendamentos/reagendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamentoId: agendamentoSelecionado.id,
          dataHoraInicio: novaDataHora,
          servicoId: agendamentoSelecionado.servicoId,
          profissionalId: agendamentoSelecionado.profissionalId,
          permitirMenosDe24h: false,
        }),
      });

      const dataRes = await res.json();

      if (!dataRes.success) {
        alert(dataRes.error || 'Erro ao reagendar atendimento.');
        return;
      }

      window.location.href = `/sucesso/${dataRes.agendamento.id}`;
    } catch (error) {
      alert('Erro ao reagendar atendimento.');
    } finally {
      setReagendando(false);
    }
  }

  async function agendar() {
    if (!cpf) return alert('Informe o CPF');
    if (!cpfConsultado) return alert('Clique em continuar para validar o CPF');
    if (!servicoId) return alert('Selecione um serviço');
    if (!profissionalId) return alert('Selecione um profissional');
    if (!data) return alert('Selecione uma data');

    if (data < hojeFormatoInput()) {
      alert('A data do atendimento não pode ser anterior ao dia atual.');
      setData('');
      setHorarios([]);
      setHorarioSelecionado('');
      return;
    }

    if (!horarioSelecionado) return alert('Selecione um horário');

    if (!clienteEncontrado) {
      if (!cliente.nome.trim()) return alert('Informe seu nome');
      if (!cliente.whatsapp.trim()) return alert('Informe seu WhatsApp');
      if (!cliente.dataNascimento) return alert('Informe sua data de nascimento');
    }

    const dataHora = new Date(`${data}T${horarioSelecionado}`);

    const res = await fetch('/api/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        servicoId,
        profissionalId,
        dataHoraInicio: dataHora,
        empresaId: empresa.id,
        clienteId: clienteEncontrado?.id || null,
        cliente: {
          ...cliente,
          cpf: somenteNumeros(cpf),
          whatsapp: somenteNumeros(cliente.whatsapp),
        },
      }),
    });

    const dataRes = await res.json();

    if (!dataRes.success) {
      alert(dataRes.error || 'Erro ao agendar');
      return;
    }

    const agendamento = dataRes.agendamento;
    const exigePrePagamento = agendamento?.servico?.exigePrePagamento;

    if (exigePrePagamento) {
      const pagamentoRes = await fetch('/api/pagamentos/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamentoId: agendamento.id,
          tipo: 'agendamento',
        }),
      });

      const pagamentoData = await pagamentoRes.json();

      if (pagamentoData.linkPagamento) {
        window.location.href = pagamentoData.linkPagamento;
        return;
      }

      alert(pagamentoData.error || 'Erro ao gerar pagamento');
      return;
    }

    window.location.href = `/sucesso/${agendamento.id}`;
  }

  const servicoSelecionado = servicos.find((s) => s.id === servicoId);
  const profissionalSelecionado = profissionais.find((p) => p.id === profissionalId);
  const podeMostrarAgenda =
    !modoReagendamento && cpfConsultado && (clienteEncontrado || mostrarCamposExtras);

  if (!empresa) {
    return (
      <main className="loadingPage">
        <div className="loadingCard">
          <div className="loadingPulse">⌛</div>
          <h1>Carregando vitrine...</h1>
          <p>Estamos preparando a agenda para você.</p>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="shell">
        <header className="topBar">
          <div className="marca">
            Marc<span>aê</span>
          </div>

          <div className="secureBadge">Ambiente seguro de agendamento</div>
        </header>

        <section className="hero">
          <div className="empresaLogoBox">
            {empresa.logoUrl ? (
              <img src={empresa.logoUrl} alt={empresa.nome} className="empresaLogo" />
            ) : (
              <div className="empresaLogoFallback">
                {String(empresa.nome || 'M').charAt(0)}
              </div>
            )}
          </div>

          <div className="tag">Agenda online oficial</div>

          <h1>{empresa.nome}</h1>

          <p className="subtitle">
            Agende seu atendimento em poucos minutos, escolha o melhor horário disponível
            e receba a confirmação de forma prática.
          </p>

          <div className="trustRow">
            <div className="trustItem">
              <strong>⚡ Rápido</strong>
              <span>sem troca infinita de mensagens</span>
            </div>

            <div className="trustItem">
              <strong>📲 Prático</strong>
              <span>confirmação do atendimento</span>
            </div>

            <div className="trustItem">
              <strong>🔒 Seguro</strong>
              <span>seus dados protegidos</span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="cardHeader">
            <div>
              <h2>Reserve seu horário</h2>
              <p>Comece pelo CPF para localizar seu cadastro ou criar um novo.</p>
            </div>

            <div className="step">1/3</div>
          </div>

          <div className="progressSteps">
            <div className="progressStep active">
              <span>1</span>
              <p>Identificação</p>
            </div>

            <div className={podeMostrarAgenda ? 'progressStep active' : 'progressStep'}>
              <span>2</span>
              <p>Serviço e horário</p>
            </div>

            <div className={horarioSelecionado ? 'progressStep active' : 'progressStep'}>
              <span>3</span>
              <p>Confirmação</p>
            </div>
          </div>

          <div className="cpfBox">
            <label>Informe seu CPF</label>

            <div className="cpfLine">
              <input
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  setCpf(formatarCpf(e.target.value));
                  setCpfConsultado(false);
                  setClienteEncontrado(null);
                  setMostrarCamposExtras(false);
                  setModoReagendamento(false);
                  limparFluxoAgendamento();
                  limparFluxoReagendamento();
                }}
              />

              <button onClick={buscarClientePorCpf} disabled={buscandoCpf}>
                {buscandoCpf ? 'Buscando...' : 'Continuar'}
              </button>
            </div>

            <button
              className="outlineButton"
              onClick={buscarAgendamentosParaReagendar}
              disabled={buscandoReagendamentos}
            >
              {buscandoReagendamentos ? 'Buscando agendamentos...' : 'Já tenho horário e quero reagendar'}
            </button>

            {clienteEncontrado && (
              <div className="successBox">
                <strong>Cadastro encontrado</strong>
                <span>Olá, {clienteEncontrado.nome}. Agora escolha o serviço e o melhor horário para você.</span>
              </div>
            )}

            {mostrarCamposExtras && (
              <div className="warningBox">
                <strong>Novo cadastro</strong>
                <span>Não encontramos seu CPF. Complete seus dados uma única vez para continuar.</span>
              </div>
            )}
          </div>

          {modoReagendamento && (
            <div className="section">
              <div className="sectionTitle">Reagendamento</div>

              <div className="policyBox">
                <strong>Política de reagendamento</strong>
                <span>
                  Você pode reagendar seu horário gratuitamente com até <b>24 horas</b> de antecedência.
                </span>
                <span>
                  Após esse período, o reagendamento não estará disponível pelo link e o valor pago não será reembolsado.
                </span>
                <span>
                  Em caso de dúvidas, entre em contato diretamente com a empresa.
                </span>

                <button className="whatsappButton" onClick={abrirWhatsappEmpresa}>
                  Falar com a empresa no WhatsApp
                </button>
              </div>

              {buscandoReagendamentos && (
                <div className="emptySlots">
                  Buscando seus agendamentos...
                </div>
              )}

              {!buscandoReagendamentos && agendamentosReagendamento.length === 0 && (
                <div className="emptySlots">
                  Não encontramos agendamentos pagos e futuros para este CPF.
                </div>
              )}

              {!buscandoReagendamentos && agendamentosReagendamento.length > 0 && (
                <div className="rescheduleList">
                  {agendamentosReagendamento.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className={
                        agendamentoSelecionado?.id === agendamento.id
                          ? 'rescheduleCard selected'
                          : 'rescheduleCard'
                      }
                    >
                      <div>
                        <strong>{agendamento.servico?.nome || 'Serviço'}</strong>
                        <p>{formatarDataHora(agendamento.dataHoraInicio)}</p>

                        {agendamento.profissional?.nome && (
                          <span>Profissional: {agendamento.profissional.nome}</span>
                        )}
                      </div>

                      {agendamento.podeReagendarPublico ? (
                        <button
                          className="miniButton"
                          onClick={() => {
                            setAgendamentoSelecionado(agendamento);
                            setNovaDataReagendamento('');
                            setNovosHorariosReagendamento([]);
                            setNovoHorarioReagendamento('');
                          }}
                        >
                          Selecionar
                        </button>
                      ) : (
                        <div className="blockedText">
                          Menos de 24h
                        </div>
                      )}

                      {!agendamento.podeReagendarPublico && (
                        <div className="dangerBox">
                          {agendamento.motivoBloqueio ||
                            'Este agendamento não pode ser reagendado pelo link público.'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {agendamentoSelecionado && (
                <div className="section rescheduleForm">
                  <div className="sectionTitle">Escolha a nova data</div>

                  <input
                    className="field"
                    type="date"
                    min={hojeFormatoInput()}
                    value={novaDataReagendamento}
                    onChange={(e) => {
                      const novaData = e.target.value;

                      if (novaData && novaData < hojeFormatoInput()) {
                        alert('A nova data não pode ser anterior ao dia atual.');
                        setNovaDataReagendamento('');
                        setNovosHorariosReagendamento([]);
                        setNovoHorarioReagendamento('');
                        return;
                      }

                      setNovaDataReagendamento(novaData);
                      setNovosHorariosReagendamento([]);
                      setNovoHorarioReagendamento('');
                    }}
                  />

                  <button className="secondaryButton" onClick={buscarHorariosReagendamento}>
                    Buscar novos horários
                  </button>

                  <div className="sectionTitleRow">
                    <div className="sectionTitle">Novos horários</div>
                    {novosHorariosReagendamento.length > 0 && (
                      <span>{novosHorariosReagendamento.length} opções</span>
                    )}
                  </div>

                  {novosHorariosReagendamento.length === 0 ? (
                    <div className="emptySlots">
                      Selecione uma nova data para visualizar os horários disponíveis.
                    </div>
                  ) : (
                    <div className="slots">
                      {novosHorariosReagendamento.map((h) => (
                        <button
                          key={h}
                          onClick={() => setNovoHorarioReagendamento(h)}
                          className={novoHorarioReagendamento === h ? 'slot active' : 'slot'}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    className="primaryButton"
                    onClick={confirmarReagendamento}
                    disabled={reagendando}
                  >
                    {reagendando ? 'Reagendando...' : 'Confirmar novo horário'}
                  </button>
                </div>
              )}
            </div>
          )}

          {podeMostrarAgenda && (
            <>
              {mostrarCamposExtras && (
                <div className="section">
                  <div className="sectionTitle">Seus dados</div>

                  <input
                    className="field"
                    placeholder="Nome completo"
                    value={cliente.nome}
                    onChange={(e) =>
                      setCliente({ ...cliente, nome: e.target.value })
                    }
                  />

                  <input
                    className="field"
                    placeholder="WhatsApp"
                    value={cliente.whatsapp}
                    onChange={(e) =>
                      setCliente({
                        ...cliente,
                        whatsapp: formatarWhatsapp(e.target.value),
                      })
                    }
                  />

                  <input
                    className="field"
                    type="date"
                    value={cliente.dataNascimento}
                    onChange={(e) =>
                      setCliente({
                        ...cliente,
                        dataNascimento: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <div className="section">
                <div className="sectionTitle">Escolha o serviço</div>

                <select
                  className="field"
                  value={servicoId}
                  onChange={(e) => {
                    setServicoId(e.target.value);
                    setHorarios([]);
                    setHorarioSelecionado('');
                  }}
                >
                  <option value="">Selecione o serviço</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} - {s.duracaoMin}min
                    </option>
                  ))}
                </select>

                {servicoSelecionado && (
                  <div className="selectedInfo">
                    <span>Serviço selecionado</span>
                    <strong>
                      {servicoSelecionado.nome} • {servicoSelecionado.duracaoMin}min
                    </strong>
                  </div>
                )}

                {servicoSelecionado?.exigePrePagamento && (
                  <div className="policyBox">
                    <strong>Importante sobre o pré-pagamento</strong>
                    <span>
                      A taxa de pré-pagamento não é reembolsável em caso de falta
                      no dia do agendamento ou se o reagendamento não for solicitado
                      com pelo menos 24h de antecedência.
                    </span>
                  </div>
                )}
              </div>

              <div className="section">
                <div className="sectionTitle">Profissional</div>

                <select
                  className="field"
                  value={profissionalId}
                  onChange={(e) => {
                    setProfissionalId(e.target.value);
                    setHorarios([]);
                    setHorarioSelecionado('');
                  }}
                >
                  <option value="">Selecione o profissional</option>
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>

                {profissionalSelecionado && (
                  <div className="selectedInfo">
                    <span>Profissional selecionado</span>
                    <strong>{profissionalSelecionado.nome}</strong>
                  </div>
                )}
              </div>

              <div className="section">
                <div className="sectionTitle">Data do atendimento</div>

                <input
                  className="field"
                  type="date"
                  min={hojeFormatoInput()}
                  value={data}
                  onChange={(e) => {
                    const novaData = e.target.value;

                    if (novaData && novaData < hojeFormatoInput()) {
                      alert('A data do atendimento não pode ser anterior ao dia atual.');
                      setData('');
                      setHorarios([]);
                      setHorarioSelecionado('');
                      return;
                    }

                    setData(novaData);
                    setHorarios([]);
                    setHorarioSelecionado('');
                  }}
                />

                <button className="secondaryButton" onClick={buscarHorarios}>
                  Ver horários disponíveis
                </button>
              </div>

              <div className="section">
                <div className="sectionTitleRow">
                  <div className="sectionTitle">Horários disponíveis</div>
                  {horarios.length > 0 && <span>{horarios.length} opções</span>}
                </div>

                {horarios.length === 0 ? (
                  <div className="emptySlots">
                    Selecione serviço, profissional e data para visualizar os horários disponíveis.
                  </div>
                ) : (
                  <div className="slots">
                    {horarios.map((h) => (
                      <button
                        key={h}
                        onClick={() => setHorarioSelecionado(h)}
                        className={horarioSelecionado === h ? 'slot active' : 'slot'}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {horarioSelecionado && (
                <div className="readyBox">
                  <strong>Seu horário está quase reservado</strong>
                  <span>
                    Confira as informações e finalize para garantir seu atendimento.
                  </span>
                </div>
              )}

              <button className="primaryButton" onClick={agendar}>
                {servicoSelecionado?.exigePrePagamento
                  ? 'Reservar e seguir para pagamento'
                  : 'Finalizar meu horário agora'}
              </button>

              <p className="security">
                Seus dados serão usados apenas para identificação do agendamento e
                comunicação sobre o atendimento.
              </p>
            </>
          )}
        </section>

        <section className="benefits">
          <div className="benefit">
            <span>⚡</span>
            <strong>Rápido e prático</strong>
            <p>Agende sem precisar esperar resposta.</p>
          </div>

          <div className="benefit">
            <span>📲</span>
            <strong>Tudo registrado</strong>
            <p>Seu atendimento fica organizado.</p>
          </div>

          <div className="benefit">
            <span>✨</span>
            <strong>Experiência simples</strong>
            <p>Ideal para serviços, beleza, saúde e bem-estar.</p>
          </div>
        </section>

        <footer className="footerBrand">
          <span>Agendamento online por</span>
          <strong>Marc<span>aê</span></strong>
        </footer>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  .page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 18% 8%, rgba(219, 39, 119, 0.18), transparent 28%),
      radial-gradient(circle at 82% 6%, rgba(124, 58, 237, 0.22), transparent 30%),
      linear-gradient(180deg, #fff7fb 0%, #f8fafc 48%, #eef2ff 100%);
    color: #0f172a;
  }

  .shell {
    width: 100%;
    max-width: 980px;
    min-height: 100vh;
    margin: 0 auto;
    padding: 28px 24px 42px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .topBar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 38px;
  }

  .marca,
  .secureBadge {
    background: rgba(255, 255, 255, 0.86);
    border: 1px solid rgba(226, 232, 240, 0.95);
    box-shadow: 0 14px 38px rgba(15, 23, 42, 0.08);
    border-radius: 999px;
    padding: 10px 16px;
  }

  .marca {
    font-size: 18px;
    font-weight: 950;
    letter-spacing: -0.05em;
    color: #111827;
  }

  .marca span,
  .footerBrand strong span {
    color: #db2777;
  }

  .secureBadge {
    font-size: 13px;
    font-weight: 800;
    color: #475569;
  }

  .hero {
    width: 100%;
    max-width: 760px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24px;
  }

  .empresaLogoBox {
    width: 82px;
    height: 82px;
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(226, 232, 240, 0.95);
    box-shadow: 0 20px 55px rgba(15, 23, 42, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .empresaLogo {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .empresaLogoFallback {
    font-size: 34px;
    font-weight: 950;
    color: #7c3aed;
  }

  .tag {
    display: inline-flex;
    border-radius: 999px;
    padding: 9px 13px;
    background: rgba(124, 58, 237, 0.1);
    color: #6d28d9;
    font-size: 13px;
    font-weight: 900;
    margin-bottom: 14px;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(44px, 7vw, 78px);
    line-height: 0.96;
    letter-spacing: -0.075em;
    color: #111827;
  }

  .subtitle {
    max-width: 650px;
    margin: 20px 0 0;
    font-size: 18px;
    line-height: 1.65;
    color: #475569;
  }

  .trustRow {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 22px;
  }

  .trustItem {
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(226, 232, 240, 0.95);
    box-shadow: 0 14px 35px rgba(15, 23, 42, 0.06);
    border-radius: 20px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .trustItem strong {
    color: #111827;
    font-size: 14px;
  }

  .trustItem span {
    color: #64748b;
    font-size: 12px;
    line-height: 1.35;
  }

  .card {
    width: 100%;
    max-width: 560px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 32px;
    box-shadow: 0 30px 80px rgba(15, 23, 42, 0.15);
    padding: 26px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .cardHeader {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .cardHeader h2 {
    margin: 0;
    font-size: 30px;
    line-height: 1.05;
    letter-spacing: -0.055em;
    color: #111827;
  }

  .cardHeader p {
    margin: 8px 0 0;
    font-size: 14px;
    line-height: 1.5;
    color: #64748b;
  }

  .step {
    min-width: 50px;
    height: 50px;
    border-radius: 18px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 950;
    box-shadow: 0 16px 35px rgba(219, 39, 119, 0.28);
  }

  .progressSteps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 8px;
  }

  .progressStep {
    display: flex;
    align-items: center;
    gap: 7px;
    border-radius: 15px;
    padding: 9px 8px;
    color: #94a3b8;
  }

  .progressStep span {
    min-width: 22px;
    height: 22px;
    border-radius: 999px;
    background: #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 950;
  }

  .progressStep p {
    margin: 0;
    font-size: 11px;
    font-weight: 900;
    line-height: 1.2;
  }

  .progressStep.active {
    background: #ffffff;
    color: #6d28d9;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  }

  .progressStep.active span {
    background: linear-gradient(135deg, #7c3aed, #db2777);
    color: #ffffff;
  }

  .cpfBox,
  .section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cpfBox label,
  .sectionTitle {
    font-size: 13px;
    font-weight: 900;
    color: #334155;
  }

  .cpfLine {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 140px;
    gap: 10px;
  }

  .cpfLine input,
  .field {
    width: 100%;
    height: 50px;
    border-radius: 16px;
    border: 1px solid #dbe3ef;
    background: #ffffff;
    color: #0f172a;
    outline: none;
    padding: 0 14px;
    font-size: 15px;
  }

  .cpfLine input:focus,
  .field:focus {
    border-color: #a855f7;
    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.12);
  }

  .cpfLine button,
  .secondaryButton,
  .outlineButton,
  .miniButton,
  .whatsappButton {
    height: 50px;
    border: 0;
    border-radius: 16px;
    font-weight: 900;
    cursor: pointer;
  }

  .cpfLine button,
  .secondaryButton {
    background: #0f172a;
    color: white;
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
  }

  .cpfLine button:disabled,
  .outlineButton:disabled,
  .primaryButton:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .outlineButton {
    width: 100%;
    background: #fff;
    color: #7c3aed;
    border: 1px solid #ddd6fe;
    box-shadow: none;
  }

  .whatsappButton {
    width: 100%;
    background: #16a34a;
    color: #fff;
    margin-top: 6px;
    box-shadow: 0 12px 24px rgba(22, 163, 74, 0.18);
  }

  .miniButton {
    height: 38px;
    padding: 0 14px;
    border-radius: 12px;
    background: #7c3aed;
    color: #fff;
    white-space: nowrap;
  }

  .successBox,
  .warningBox,
  .selectedInfo,
  .emptySlots,
  .policyBox,
  .dangerBox,
  .readyBox {
    border-radius: 18px;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 1.45;
  }

  .successBox {
    background: #ecfdf5;
    border: 1px solid #bbf7d0;
    color: #166534;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .warningBox {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #9a3412;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .policyBox {
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #3730a3;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .dangerBox {
    grid-column: 1 / -1;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  .readyBox {
    background: #f5f3ff;
    border: 1px solid #ddd6fe;
    color: #5b21b6;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .selectedInfo {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #64748b;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .selectedInfo strong {
    color: #111827;
  }

  .sectionTitleRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .sectionTitleRow span {
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
  }

  .emptySlots {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    color: #64748b;
  }

  .slots {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .slot {
    min-width: 74px;
    height: 42px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #f1f5f9;
    color: #0f172a;
    cursor: pointer;
    font-weight: 900;
  }

  .slot.active {
    background: linear-gradient(135deg, #7c3aed, #db2777);
    color: white;
    border-color: transparent;
    box-shadow: 0 12px 24px rgba(219, 39, 119, 0.24);
  }

  .rescheduleList {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .rescheduleCard {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    border: 1px solid #e2e8f0;
    background: #fff;
    border-radius: 18px;
    padding: 14px;
  }

  .rescheduleCard.selected {
    border-color: #a855f7;
    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1);
  }

  .rescheduleCard strong {
    display: block;
    color: #111827;
    margin-bottom: 4px;
  }

  .rescheduleCard p {
    margin: 0 0 4px;
    color: #475569;
    font-size: 13px;
    line-height: 1.45;
  }

  .rescheduleCard span {
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
  }

  .blockedText {
    font-size: 12px;
    font-weight: 900;
    color: #991b1b;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 999px;
    padding: 8px 10px;
    white-space: nowrap;
  }

  .rescheduleForm {
    border-top: 1px solid #e2e8f0;
    padding-top: 14px;
  }

  .primaryButton {
    height: 56px;
    border: 0;
    border-radius: 18px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    color: white;
    font-size: 16px;
    font-weight: 950;
    cursor: pointer;
    box-shadow: 0 20px 38px rgba(219, 39, 119, 0.26);
  }

  .primaryButton:hover,
  .secondaryButton:hover,
  .cpfLine button:hover,
  .outlineButton:hover,
  .miniButton:hover,
  .whatsappButton:hover,
  .slot:hover {
    transform: translateY(-1px);
  }

  .security {
    margin: -2px 0 0;
    text-align: center;
    font-size: 12px;
    line-height: 1.5;
    color: #64748b;
  }

  .benefits {
    width: 100%;
    max-width: 820px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .benefit {
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(226, 232, 240, 0.95);
    box-shadow: 0 14px 40px rgba(15, 23, 42, 0.07);
    border-radius: 22px;
    padding: 18px;
    text-align: center;
  }

  .benefit span {
    display: block;
    font-size: 22px;
    margin-bottom: 8px;
  }

  .benefit strong {
    display: block;
    font-size: 14px;
    color: #111827;
    margin-bottom: 5px;
  }

  .benefit p {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: #64748b;
  }

  .footerBrand {
    margin-top: 6px;
    color: #64748b;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .footerBrand strong {
    color: #111827;
    font-size: 13px;
    letter-spacing: -0.04em;
  }

  .loadingPage {
    min-height: 100vh;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .loadingCard {
    width: 100%;
    max-width: 360px;
    background: white;
    border-radius: 28px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
  }

  .loadingPulse {
    font-size: 34px;
    margin-bottom: 12px;
  }

  .loadingCard h1 {
    margin: 0;
    color: #111827;
    font-size: 24px;
  }

  .loadingCard p {
    margin: 8px 0 0;
    color: #64748b;
  }

  @media (max-width: 720px) {
    .shell {
      padding: 18px 14px 28px;
    }

    .topBar {
      margin-bottom: 28px;
    }

    .secureBadge {
      display: none;
    }

    .hero h1 {
      font-size: 44px;
    }

    .subtitle {
      font-size: 15px;
    }

    .trustRow {
      grid-template-columns: 1fr;
    }

    .card {
      border-radius: 28px;
      padding: 20px;
    }

    .progressSteps {
      grid-template-columns: 1fr;
    }

    .cpfLine {
      grid-template-columns: 1fr;
    }

    .rescheduleCard {
      grid-template-columns: 1fr;
    }

    .miniButton {
      width: 100%;
    }

    .blockedText {
      text-align: center;
    }

    .benefits {
      grid-template-columns: 1fr;
    }
  }
`;