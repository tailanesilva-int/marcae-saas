'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function AgendarPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const clienteIdUrl = searchParams.get('clienteId');

  const [empresa, setEmpresa] = useState<any>(null);
  const [servicos, setServicos] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);

  const [servicoId, setServicoId] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [data, setData] = useState('');
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [servicosCarrinho, setServicosCarrinho] = useState<any[]>([]);

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

  const [etapaAtual, setEtapaAtual] = useState<
    'identificacao' | 'servico' | 'profissional' | 'data' | 'horario' | 'confirmacao'
  >('identificacao');

  useEffect(() => {
    carregarEmpresa();
  }, [slug]);

useEffect(() => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}, [etapaAtual]);

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

    if (clienteIdUrl) {
      carregarClientePorId(data.empresa.id, clienteIdUrl);
    }
  }

  async function carregarClientePorId(empresaId: string, clienteId: string) {
    try {
      const res = await fetch(
        `/api/v1/clients?empresaId=${empresaId}&clienteId=${clienteId}`,
        { cache: 'no-store' }
      );

      const data = await res.json();

      if (!data.cliente) {
        alert('Cliente não encontrado para esta empresa.');
        return;
      }

      setCpf(formatarCpf(data.cliente.cpf || ''));
      setCpfConsultado(true);
      setClienteEncontrado(data.cliente);
      setMostrarCamposExtras(false);
      setModoReagendamento(false);

      setCliente({
        nome: data.cliente.nome || '',
        whatsapp: data.cliente.whatsapp || '',
        dataNascimento: data.cliente.dataNascimento
          ? String(data.cliente.dataNascimento).slice(0, 10)
          : '',
      });

      setEtapaAtual('servico');
    } catch (error) {
      alert('Erro ao carregar cliente selecionado.');
    }
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
        setEtapaAtual('servico');
      } else {
        setClienteEncontrado(null);
        setCliente({
          nome: '',
          whatsapp: '',
          dataNascimento: '',
        });
        setMostrarCamposExtras(true);
        setEtapaAtual('identificacao');
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
      setEtapaAtual('identificacao');
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
      return false;
    }

    if (data < hojeFormatoInput()) {
      alert('A data do atendimento não pode ser anterior ao dia atual.');
      setData('');
      setHorarios([]);
      setHorarioSelecionado('');
      return false;
    }

    const res = await fetch(
      `/api/horarios-disponiveis?profissionalId=${profissionalId}&servicoId=${servicoId}&data=${data}`
    );

    const dataRes = await res.json();
    setHorarios(dataRes.horarios || []);
    setHorarioSelecionado('');
    return true;
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
    if (!clienteEncontrado && !cpf) return alert('Informe o CPF');
    if (!clienteEncontrado && !cpfConsultado) return alert('Clique em continuar para validar o CPF');

    if (itensResumo.length === 0) {
      return alert('Adicione pelo menos um serviço para finalizar o agendamento.');
    }

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
      if (!cliente.nome.trim()) return alert('Informe seu nome completo');
      if (!cliente.whatsapp.trim()) return alert('Informe seu WhatsApp');
      if (!cliente.dataNascimento) return alert('Informe sua data de nascimento');

      const hoje = new Date();
      const nascimento = new Date(cliente.dataNascimento);

      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();

      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }

      if (idade < 10) {
        return alert('É necessário ter pelo menos 10 anos para realizar um agendamento.');
      }
    }

    const dataHora = new Date(`${data}T${horarioSelecionado}`);

    const res = await fetch('/api/agendamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresaId: empresa.id,
        clienteId: clienteEncontrado?.id || null,
        cliente: {
          ...cliente,
          cpf: somenteNumeros(cpf),
          whatsapp: somenteNumeros(cliente.whatsapp),
        },
        servicosCarrinho: itensResumo.map((item) => ({
          servicoId: item.servicoId,
          profissionalId: item.profissionalId,
          dataHoraInicio: new Date(`${item.data}T${item.horario}`),
        })),
        servicoId,
        profissionalId,
        dataHoraInicio: dataHora,
      }),
    });

    const dataRes = await res.json();

    if (!dataRes.success) {
      alert(dataRes.error || 'Erro ao agendar');
      return;
    }

    const agendamentosCriados = Array.isArray(dataRes.agendamentos)
      ? dataRes.agendamentos
      : dataRes.agendamento
        ? [dataRes.agendamento]
        : [];

    const agendamentoPrincipal = dataRes.agendamento || agendamentosCriados[0];

    if (!agendamentoPrincipal?.id) {
      alert('Agendamento criado, mas não foi possível localizar o comprovante.');
      return;
    }

    const idsAgendamentos = agendamentosCriados.length > 0
      ? agendamentosCriados.map((a: any) => a.id).join(',')
      : agendamentoPrincipal.id;

    if (existePrePagamentoResumo) {
      const pagamentoRes = await fetch('/api/pagamentos/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamentoId: agendamentoPrincipal.id,
          tipo: 'agendamento',
          agendamentosIds: idsAgendamentos.split(','),
          valorTotal: totalResumo,
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

    window.location.href = `/sucesso/${agendamentoPrincipal.id}?ids=${idsAgendamentos}`;
  }

  function clienteNovoValido() {
    if (clienteEncontrado) return true;

    if (!cpfConsultado) {
      alert('Clique em continuar para validar o CPF.');
      return false;
    }

    if (!cliente.nome.trim()) {
      alert('Informe seu nome completo.');
      return false;
    }

    if (!cliente.whatsapp.trim()) {
      alert('Informe seu WhatsApp.');
      return false;
    }

    if (!cliente.dataNascimento) {
      alert('Informe sua data de nascimento.');
      return false;
    }

    return true;
  }

  function avancarParaServico() {
    if (!clienteEncontrado && !cpf) {
      alert('Informe o CPF.');
      return;
    }

    if (!clienteNovoValido()) return;

    setModoReagendamento(false);
    setEtapaAtual('servico');
  }

  function selecionarServicoPublico(servicoIdSelecionado: string) {
    setServicoId(servicoIdSelecionado);
    setProfissionalId('');
    setData('');
    setHorarios([]);
    setHorarioSelecionado('');
  }

  function avancarParaProfissional() {
    if (!servicoId) {
      alert('Escolha um serviço para continuar.');
      return;
    }

    setEtapaAtual('profissional');
  }

  function avancarParaData() {
    if (!profissionalId) {
      alert('Escolha um profissional para continuar.');
      return;
    }

    setEtapaAtual('data');
  }

  async function avancarParaHorarios() {
    const ok = await buscarHorarios();
    if (ok) {
      setEtapaAtual('horario');
    }
  }

function avancarParaConfirmacao() {
  if (!horarioSelecionado) {
    alert('Escolha um horário para continuar.');
    return;
  }

  setEtapaAtual('confirmacao');
}

function adicionarServicoAoCarrinho() {
  if (!servicoSelecionado || !profissionalSelecionado || !data || !horarioSelecionado) {
    alert('Selecione serviço, profissional, data e horário antes de adicionar.');
    return;
  }

  const item = {
    id: `${servicoId}-${profissionalId}-${data}-${horarioSelecionado}-${Date.now()}`,
    servicoId,
    profissionalId,
    data,
    horario: horarioSelecionado,
    servico: servicoSelecionado,
    profissional: profissionalSelecionado,
  };

  setServicosCarrinho((atual) => [...atual, item]);
  limparFluxoAgendamento();
  setEtapaAtual('servico');
}

function removerServicoDoCarrinho(itemId: string) {
  setServicosCarrinho((atual) => atual.filter((item) => item.id !== itemId));
}

function obterValorServico(servico: any) {
  return Number(servico?.valor ?? servico?.preco ?? servico?.valorTotal ?? 0);
}

function obterValorPrePagamentoServico(servico: any) {
  return Number(
    servico?.valorPrePagamento ??
    servico?.valorPrePago ??
    servico?.precoPrePagamento ??
    servico?.prePagamentoValor ??
    servico?.valorSinal ??
    0
  );
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function itemExigePrePagamento(item: any) {
  return Boolean(item?.servico?.exigePrePagamento || item?.servico?.prePagamentoObrigatorio);
}

  const servicoSelecionado = servicos.find((s) => s.id === servicoId);
  const profissionalSelecionado = profissionais.find((p) => p.id === profissionalId);
  const itensResumo = [
    ...servicosCarrinho,
    ...(servicoSelecionado && profissionalSelecionado && data && horarioSelecionado
      ? [{
          id: 'atual',
          servicoId,
          profissionalId,
          data,
          horario: horarioSelecionado,
          servico: servicoSelecionado,
          profissional: profissionalSelecionado,
        }]
      : []),
  ];

  const totalResumo = itensResumo.reduce((total, item) => {
    return total + obterValorServico(item.servico);
  }, 0);

  const totalPrePagamentoResumo = itensResumo.reduce((total, item) => {
    if (!itemExigePrePagamento(item)) return total;

    return total + obterValorPrePagamentoServico(item.servico);
  }, 0);

  const existePrePagamentoResumo = itensResumo.some((item) => itemExigePrePagamento(item));

  const profissionaisFiltrados = profissionais.filter((p: any) =>
  Array.isArray(p.servicos) &&
  p.servicos.some(
    (ps: any) =>
      ps.servicoId === servicoId ||
      ps.servico?.id === servicoId
  )
);
  const podeMostrarAgenda =
    !modoReagendamento && cpfConsultado && (clienteEncontrado || mostrarCamposExtras);
  const clienteVeioDoPainel = Boolean(clienteIdUrl);

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
      <div className="wizardSteps">
        {[
  { id: 'identificacao', label: 'CPF' },
  { id: 'servico', label: 'Serviço' },
  { id: 'profissional', label: 'Profissional' },
  { id: 'data', label: 'Data' },
  { id: 'horario', label: 'Horário' },
  { id: 'confirmacao', label: 'Resumo' },
].map((etapa, index) => {
  const ordem = [
    'identificacao',
    'servico',
    'profissional',
    'data',
    'horario',
    'confirmacao',
  ];

  const ativoIndex = ordem.indexOf(etapaAtual);
          const numero = index + 1;

          return (
            <div
              key={etapa.id}
              className={`wizardStep ${
                etapaAtual === etapa.id
  ? 'active'
  : ativoIndex > index
    ? 'done'
    : ''
              }`}
            >
              <div className="wizardBall">
                {numero}
              </div>

              <span>{etapa.label}</span>
            </div>
          );
        })}
      </div>

      {etapaAtual === 'identificacao' && (
  <header className="topBar">
    <div className="marca">
      Marc<span>aê</span>
    </div>

    <div className="secureBadge">
      Ambiente seguro de agendamento
    </div>
  </header>
)}

       {etapaAtual === 'identificacao' && (
<section className="hero">
  <div className="heroBackgroundGlow" />

  <div className="empresaHeroCard">
    <div className="heroOfficialBadge">
      <span>✓</span>
      Agendamento online oficial
    </div>

    <div className="empresaHeroCentered">
      <div className="empresaLogoBox">
        {empresa.logoUrl ? (
          <img
            src={empresa.logoUrl}
            alt={empresa.nome}
            className="empresaLogo"
          />
        ) : (
          <div className="empresaLogoFallback">
            {String(empresa.nome || 'M').charAt(0)}
          </div>
        )}
      </div>

      <h1>{empresa.nome}</h1>

      <p className="subtitle">
        Agende seu atendimento em poucos minutos!
      </p>

      <div className="heroMiniBadges heroMiniBadgesCompact">
  <div className="heroMiniBadge">
    🛡️ Dados protegidos
  </div>
</div>
    </div>

  </div>
</section>
)}

<section className="card wizardCard">
          <div className="cardHeader">
            <div>
              <h2>Reserve seu horário</h2>
              <p>
                {etapaAtual === 'identificacao' && 'Comece pelo CPF para localizar seu cadastro ou criar um novo.'}
                {etapaAtual === 'servico' && 'Agora escolha o serviço que deseja agendar.'}
                {etapaAtual === 'profissional' && 'Escolha o profissional disponível para o serviço selecionado.'}
                {etapaAtual === 'data' && 'Escolha o melhor dia para seu atendimento.'}
                {etapaAtual === 'horario' && 'Agora selecione o horário que funciona melhor para você.'}
                {etapaAtual === 'confirmacao' && 'Confira tudo antes de finalizar sua reserva.'}
              </p>
            </div>

            <div className="step">
              {etapaAtual === 'identificacao' && '1/6'}
              {etapaAtual === 'servico' && '2/6'}
              {etapaAtual === 'profissional' && '3/6'}
              {etapaAtual === 'data' && '4/6'}
              {etapaAtual === 'horario' && '5/6'}
              {etapaAtual === 'confirmacao' && '6/6'}
            </div>
          </div>

          <div className="progressSteps wizardSteps">
            <div className={['identificacao', 'servico', 'profissional', 'data', 'horario', 'confirmacao'].includes(etapaAtual) ? 'progressStep active' : 'progressStep'}>
              <span>1</span>
              <p>CPF</p>
            </div>

            <div className={['servico', 'profissional', 'data', 'horario', 'confirmacao'].includes(etapaAtual) ? 'progressStep active' : 'progressStep'}>
              <span>2</span>
              <p>Serviço</p>
            </div>

            <div className={['profissional', 'data', 'horario', 'confirmacao'].includes(etapaAtual) ? 'progressStep active' : 'progressStep'}>
              <span>3</span>
              <p>Profissional</p>
            </div>

            <div className={['data', 'horario', 'confirmacao'].includes(etapaAtual) ? 'progressStep active' : 'progressStep'}>
              <span>4</span>
              <p>Data</p>
            </div>

            <div className={['horario', 'confirmacao'].includes(etapaAtual) ? 'progressStep active' : 'progressStep'}>
              <span>5</span>
              <p>Horário</p>
            </div>

            <div className={etapaAtual === 'confirmacao' ? 'progressStep active' : 'progressStep'}>
              <span>6</span>
              <p>Confirmar</p>
            </div>
          </div>

          {clienteVeioDoPainel && clienteEncontrado && (
            <div className="clienteSelecionadoCard">
              <div className="clienteSelecionadoTop">
                <div className="clienteAvatar">
                  {String(clienteEncontrado.nome || 'C').charAt(0).toUpperCase()}
                </div>

                <div className="clienteInfo">
                  <strong>{clienteEncontrado.nome}</strong>
                  <span>📲 {formatarWhatsapp(clienteEncontrado.whatsapp || '')}</span>
                  {clienteEncontrado.cpf && <span>🪪 {formatarCpf(clienteEncontrado.cpf)}</span>}
                  {clienteEncontrado.dataNascimento && (
                    <span>🎂 {new Date(clienteEncontrado.dataNascimento).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              </div>

              <div className="clienteSelecionadoFooter">
                <div className="clienteBadge">✅ Cliente identificado</div>
                <button className="trocarClienteButton" onClick={() => (window.location.href = `/agendar/${slug}`)}>
                  Trocar cliente
                </button>
              </div>
            </div>
          )}

          {etapaAtual === 'identificacao' && !clienteVeioDoPainel && (
            <div className="cpfBox etapaBox">
              <div className="etapaIntro">
                <span>👋</span>
                <div>
                  <strong>Vamos começar?</strong>
                  <p>Informe seu CPF para localizarmos seu cadastro ou criar um novo rapidinho.</p>
                </div>
              </div>

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

              <button className="outlineButton" onClick={buscarAgendamentosParaReagendar} disabled={buscandoReagendamentos}>
                {buscandoReagendamentos ? 'Buscando agendamentos...' : 'Já tenho horário e quero reagendar'}
              </button>

              {clienteEncontrado && (
                <div className="successBox">
                  <strong>Cadastro encontrado</strong>
                  <span>Olá, {clienteEncontrado.nome}. Você já pode escolher seu serviço.</span>
                </div>
              )}

              {mostrarCamposExtras && (
                <div className="section dadosClienteBox">
                  <div className="warningBox">
                    <strong>Novo cadastro</strong>
                    <span>Não encontramos seu CPF. Complete seus dados uma única vez para continuar.</span>
                  </div>

                  <input
                    className="field"
                    placeholder="Nome completo"
                    value={cliente.nome}
                    onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                  />

                  <input
                    className="field"
                    placeholder="WhatsApp"
                    value={cliente.whatsapp}
                    onChange={(e) => setCliente({ ...cliente, whatsapp: formatarWhatsapp(e.target.value) })}
                  />

                  <div className="fieldGroup">
                    <label className="fieldLabel">Data de nascimento</label>
                    <input
                      className="field"
                      type="date"
                      value={cliente.dataNascimento}
                      onChange={(e) => setCliente({ ...cliente, dataNascimento: e.target.value })}
                    />
                    <span className="fieldHint">Usamos essa informação apenas para identificação do cadastro.</span>
                  </div>
                </div>
              )}

              {(clienteEncontrado || mostrarCamposExtras) && (
                <button className="primaryButton" onClick={avancarParaServico}>
                  Escolher serviço
                </button>
              )}
            </div>
          )}

          {modoReagendamento && (
            <div className="section">
              <div className="sectionTitle">Reagendamento</div>

              <div className="policyBox">
                <strong>Política de reagendamento</strong>
                <span>Você pode reagendar seu horário gratuitamente com até <b>24 horas</b> de antecedência.</span>
                <span>Após esse período, o reagendamento não estará disponível pelo link e o valor pago não será reembolsado.</span>
                <span>Em caso de dúvidas, entre em contato diretamente com a empresa.</span>
                <button className="whatsappButton" onClick={abrirWhatsappEmpresa}>Falar com a empresa no WhatsApp</button>
              </div>

              {buscandoReagendamentos && <div className="emptySlots">Buscando seus agendamentos...</div>}

              {!buscandoReagendamentos && agendamentosReagendamento.length === 0 && (
                <div className="emptySlots">Não encontramos agendamentos pagos e futuros para este CPF.</div>
              )}

              {!buscandoReagendamentos && agendamentosReagendamento.length > 0 && (
                <div className="rescheduleList">
                  {agendamentosReagendamento.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className={agendamentoSelecionado?.id === agendamento.id ? 'rescheduleCard selected' : 'rescheduleCard'}
                    >
                      <div>
                        <strong>{agendamento.servico?.nome || 'Serviço'}</strong>
                        <p>{formatarDataHora(agendamento.dataHoraInicio)}</p>
                        {agendamento.profissional?.nome && <span>Profissional: {agendamento.profissional.nome}</span>}
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
                        <div className="blockedText">Menos de 24h</div>
                      )}

                      {!agendamento.podeReagendarPublico && (
                        <div className="dangerBox">
                          {agendamento.motivoBloqueio || 'Este agendamento não pode ser reagendado pelo link público.'}
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

                  <button className="secondaryButton" onClick={buscarHorariosReagendamento}>Buscar novos horários</button>

                  <div className="sectionTitleRow">
                    <div className="sectionTitle">Novos horários</div>
                    {novosHorariosReagendamento.length > 0 && <span>{novosHorariosReagendamento.length} opções</span>}
                  </div>

                  {novosHorariosReagendamento.length === 0 ? (
                    <div className="emptySlots">Selecione uma nova data para visualizar os horários disponíveis.</div>
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

                  <button className="primaryButton" onClick={confirmarReagendamento} disabled={reagendando}>
                    {reagendando ? 'Reagendando...' : 'Confirmar novo horário'}
                  </button>
                </div>
              )}
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === 'servico' && (
            <div className="section etapaBox">
              <div className="etapaIntro">
                <span>✨</span>
                <div>
                  <strong>Agora escolha o serviço</strong>
                  <p>Selecione o atendimento que deseja reservar.</p>
                </div>
              </div>

              <div className="sectionTitleRow">
                <div className="sectionTitle">Serviços disponíveis</div>
                {servicos.length > 0 && <span>{servicos.length} opções</span>}
              </div>

              {servicos.length === 0 ? (
                <div className="emptySlots">Nenhum serviço disponível para agendamento no momento.</div>
              ) : (
                <div className="servicosPublicos">
                  {servicos.map((s) => {
                    const servicoAtivo = servicoId === s.id;
                    const valorServico =
                      typeof s.valor === 'number'
                        ? s.valor
                        : typeof s.preco === 'number'
                          ? s.preco
                          : typeof s.valorTotal === 'number'
                            ? s.valorTotal
                            : null;

                    const valorPrePagamentoServico = obterValorPrePagamentoServico(s);

                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={servicoAtivo ? 'servicoPublicoCard active' : 'servicoPublicoCard'}
                        onClick={() => selecionarServicoPublico(s.id)}
                      >
                        <div className="servicoPublicoIcon">✨</div>

                        <div className="servicoPublicoInfo">
                          <strong>{s.nome}</strong>
                          {s.descricao && <p>{s.descricao}</p>}

                          <div className="servicoPublicoMeta">
                            {s.duracaoMin && <span>⏱ {s.duracaoMin}min</span>}
                            {valorServico !== null && (
                              <span>
                                💰{' '}
                                {valorServico.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </span>
                            )}
                            {s.exigePrePagamento && (
                              <span className="prePagamentoTag">
                                Pré-pagamento
                                {valorPrePagamentoServico > 0
                                  ? `: ${formatarMoeda(valorPrePagamentoServico)}`
                                  : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="servicoPublicoCheck">{servicoAtivo ? '✓' : ''}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {servicoSelecionado && (
                <div className="selectedInfo">
                  <span>Serviço selecionado</span>
                  <strong>{servicoSelecionado.nome} • {servicoSelecionado.duracaoMin}min</strong>
                </div>
              )}

              {existePrePagamentoResumo && (
                <div className="policyBox">
                  <strong>Importante sobre o pré-pagamento</strong>
                  <span>
                    A taxa de pré-pagamento não é reembolsável em caso de falta no dia do agendamento
                    ou se o reagendamento não for solicitado com pelo menos 24h de antecedência.
                  </span>
                </div>
              )}

              <div className="wizardActions">
                <button className="outlineButton" onClick={() => setEtapaAtual('identificacao')}>Voltar</button>
                <button className="primaryButton" onClick={avancarParaProfissional}>Próximo: profissional</button>
              </div>
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === 'profissional' && (
            <div className="section etapaBox">
              <div className="etapaIntro">
                <span>👩‍💼</span>
                <div>
                  <strong>Escolha seu profissional</strong>
                  <p>Mostramos apenas profissionais que realizam o serviço escolhido.</p>
                </div>
              </div>

              <div className="sectionTitle">Profissional</div>

              {!servicoId ? (
                <div className="emptySlots">Primeiro escolha um serviço para visualizar os profissionais disponíveis.</div>
              ) : profissionaisFiltrados.length === 0 ? (
                <div className="emptySlots">Nenhum profissional disponível para este serviço no momento.</div>
              ) : (
                <div className="profissionaisPublicos">
                  {profissionaisFiltrados.map((p) => {
                    const fotoProfissional = p.fotoUrl || p.foto || p.imagemUrl || p.avatarUrl || '';
                    const bioProfissional = p.bio || p.descricao || 'Profissional disponível para atendimento.';
                    const servicosProfissional = Array.isArray(p.servicos)
                      ? p.servicos.map((item: any) => item?.nome || item?.servico?.nome).filter(Boolean)
                      : [];

                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={profissionalId === p.id ? 'profissionalPublicoCard active' : 'profissionalPublicoCard'}
                        onClick={() => {
  setProfissionalId(p.id);
  setData('');
  setHorarios([]);
  setHorarioSelecionado('');
}}
                      >
                        <div className="profissionalFotoBox">
                          {fotoProfissional ? (
                            <img src={fotoProfissional} alt={p.nome} className="profissionalFoto" />
                          ) : (
                            <div className="profissionalFotoFallback">{String(p.nome || 'P').charAt(0).toUpperCase()}</div>
                          )}
                        </div>

                        <div className="profissionalPublicoInfo">
                          <strong>{p.nome}</strong>
                          <p>{bioProfissional}</p>

                          {servicosProfissional.length > 0 && (
                            <div className="profissionalServicos">
                              {servicosProfissional.slice(0, 4).map((nomeServico: string) => (
                                <span key={nomeServico}>{nomeServico}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="profissionalCheck">{profissionalId === p.id ? '✓' : ''}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {profissionalSelecionado && (
                <div className="selectedInfo">
                  <span>Profissional selecionado</span>
                  <strong>{profissionalSelecionado.nome}</strong>
                </div>
              )}

              <div className="wizardActions">
                <button className="outlineButton" onClick={() => setEtapaAtual('servico')}>Voltar</button>
                <button className="primaryButton" onClick={avancarParaData}>Próximo: data</button>
              </div>
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === 'data' && (
            <div className="section etapaBox">
              <div className="etapaIntro">
                <span>📅</span>
                <div>
                  <strong>Escolha a data</strong>
                  <p>Selecione o melhor dia para visualizar os horários disponíveis.</p>
                </div>
              </div>

              <div className="selectedInfo">
                <span>Resumo até aqui</span>
                <strong>
                  {servicoSelecionado?.nome || 'Serviço'} • {profissionalSelecionado?.nome || 'Profissional'}
                </strong>
              </div>

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

              <div className="wizardActions">
                <button className="outlineButton" onClick={() => setEtapaAtual('profissional')}>Voltar</button>
                <button className="primaryButton" onClick={avancarParaHorarios}>Buscar horários</button>
              </div>
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === 'horario' && (
            <div className="section etapaBox">
              <div className="etapaIntro">
                <span>⏰</span>
                <div>
                  <strong>Escolha o horário</strong>
                  <p>Toque no horário desejado para continuar.</p>
                </div>
              </div>

              <div className="sectionTitleRow">
                <div className="sectionTitle">Horários disponíveis</div>
                {horarios.length > 0 && <span>{horarios.length} opções</span>}
              </div>

              {horarios.length === 0 ? (
                <div className="emptySlots">Não encontramos horários disponíveis para essa combinação. Volte e tente outra data.</div>
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

              {horarioSelecionado && (
                <div className="readyBox">
                  <strong>Horário selecionado</strong>
                  <span>{horarioSelecionado} • {servicoSelecionado?.nome}</span>
                </div>
              )}

              <div className="wizardActions">
                <button className="outlineButton" onClick={() => setEtapaAtual('data')}>Voltar</button>
                <button className="primaryButton" onClick={avancarParaConfirmacao}>Próximo: conferir</button>
              </div>
            </div>
          )}

          {podeMostrarAgenda && etapaAtual === 'confirmacao' && (
            <div className="section etapaBox">

<div className="etapaIntro">
  <span>✅</span>
  <div>
    <strong>Confira sua reserva</strong>
    <p>Veja se está tudo certo antes de finalizar.</p>
  </div>
</div>

<div className="resumoReserva">
  {itensResumo.map((item, index) => {
    const valorItem = obterValorServico(item.servico);
    const valorPrePagamentoItem = obterValorPrePagamentoServico(item.servico);
    const exigePrePagamentoItem = itemExigePrePagamento(item);
    const podeRemover = item.id !== 'atual';

    return (
      <div key={item.id} className="resumoServicoCard">
        <div className="resumoServicoTopo">
          <div className="resumoServicoNumero">{index + 1}</div>

          <div className="resumoServicoInfo">
            <span>Serviço {index + 1}</span>
            <strong>{item.servico?.nome || 'Serviço'}</strong>
            <small>{item.profissional?.nome || 'Profissional'}</small>
          </div>

          {podeRemover && (
            <button
              type="button"
              className="removerServicoButton"
              onClick={() => removerServicoDoCarrinho(item.id)}
              aria-label="Remover serviço do resumo"
            >
              ×
            </button>
          )}
        </div>

        <div className="resumoServicoDetalhes">
          <div>
            <span>Data</span>
            <strong>{item.data ? new Date(`${item.data}T00:00:00`).toLocaleDateString('pt-BR') : 'Data'}</strong>
          </div>

          <div>
            <span>Horário</span>
            <strong>{item.horario || '--:--'}</strong>
          </div>

          <div>
            <span>Duração</span>
            <strong>{item.servico?.duracaoMin ? `${item.servico.duracaoMin}min` : 'Não informada'}</strong>
          </div>

          <div>
            <span>Valor do serviço</span>
            <strong>{formatarMoeda(valorItem)}</strong>
          </div>

          {exigePrePagamentoItem && (
            <div>
              <span>Pagar agora</span>
              <strong>{formatarMoeda(valorPrePagamentoItem)}</strong>
            </div>
          )}
        </div>

        {exigePrePagamentoItem && (
          <div className="resumoPrePagamentoBadge">
            Pré-pagamento obrigatório: {formatarMoeda(valorPrePagamentoItem)}
          </div>
        )}
      </div>
    );
  })}

  <div className="resumoTotalCard">
    <div className="resumoTotalValores">
      <div>
        <span>Total dos serviços</span>
        <strong>{formatarMoeda(totalResumo)}</strong>
      </div>

      {existePrePagamentoResumo && (
        <div>
          <span>Total pré-pagamento</span>
          <strong>{formatarMoeda(totalPrePagamentoResumo)}</strong>
        </div>
      )}
    </div>

    <small>
      {itensResumo.length} {itensResumo.length === 1 ? 'serviço selecionado' : 'serviços selecionados'}
      {existePrePagamentoResumo
        ? ' • Você pagará agora apenas o valor do pré-pagamento.'
        : ''}
    </small>
  </div>
</div>

              {existePrePagamentoResumo && (
                <div className="policyBox">
                  <strong>Existe serviço com pré-pagamento neste agendamento</strong>
                  <span>Ao finalizar, você será direcionado para o pagamento seguro.</span>
                  <span>Você pagará agora {formatarMoeda(totalPrePagamentoResumo)} referente ao pré-pagamento. O valor total dos serviços é {formatarMoeda(totalResumo)}.</span>
                  <span>O valor pago não é reembolsável em caso de falta ou se o reagendamento/cancelamento não for solicitado com pelo menos 24h de antecedência.</span>
                </div>
              )}

              <div className="wizardActions">
  <button
    className="outlineButton"
    onClick={() => setEtapaAtual('horario')}
  >
    Voltar
  </button>

  <button
    className="outlineButton"
    onClick={adicionarServicoAoCarrinho}
  >
    + Adicionar outro serviço
  </button>

  <button
    className="primaryButton"
    onClick={agendar}
  >
    {existePrePagamentoResumo
      ? 'Reservar e seguir para pagamento'
      : 'Finalizar agendamento'}
  </button>
</div>

              <p className="security">
                Seus dados serão usados apenas para identificação do agendamento e comunicação sobre o atendimento.
              </p>
            </div>
          )}
        </section>

        <section className="benefits benefitsMinimal">
  <div className="benefit benefitMinimal">
    <span>⚡</span>
    <strong>Seu tempo importa</strong>
  </div>

  <div className="benefit benefitMinimal">
    <span>🔒</span>
    <strong>Seguro e confiável</strong>
  </div>

  <div className="benefit benefitMinimal">
    <span>💜</span>
    <strong>Experiência premium</strong>
  </div>
</section>

<footer className="footerBrand footerBrandPremium">
  <span>✦</span>
  <p>Agendado por</p>
  <strong>Marc<span>aê</span></strong>
  <span>✦</span>
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


  .fieldGroup {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .fieldLabel {
    font-size: 12px;
    font-weight: 800;
    color: #475569;
  }

  .fieldHint {
    font-size: 11px;
    color: #94a3b8;
  }

.clienteSelecionadoCard {
  background: linear-gradient(135deg, #ffffff, #faf5ff);
  border: 1px solid #e9d5ff;
  border-radius: 24px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 45px rgba(124, 58, 237, 0.08);
}

.clienteSelecionadoTop {
  display: flex;
  gap: 14px;
  align-items: center;
}

.clienteAvatar {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 950;
  box-shadow: 0 14px 28px rgba(124, 58, 237, 0.22);
}

.clienteInfo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.clienteInfo strong {
  font-size: 18px;
  color: #111827;
}

.clienteInfo span {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
}

.clienteSelecionadoFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.clienteBadge {
  background: #ecfdf5;
  color: #166534;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 900;
}

.trocarClienteButton {
  height: 42px;
  border: 0;
  border-radius: 14px;
  padding: 0 16px;
  background: #fff;
  border: 1px solid #ddd6fe;
  color: #7c3aed;
  font-weight: 900;
  cursor: pointer;
}

.profissionaisPublicos {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.profissionalPublicoCard {
  width: 100%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 22px;
  padding: 14px;
  display: grid;
  grid-template-columns: 66px minmax(0, 1fr) 30px;
  gap: 14px;
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition: 0.18s ease;
}

.profissionalPublicoCard:hover {
  transform: translateY(-1px);
  border-color: #c084fc;
  box-shadow: 0 14px 30px rgba(124, 58, 237, 0.1);
}

.profissionalPublicoCard.active {
  border-color: #a855f7;
  background: linear-gradient(135deg, #ffffff, #faf5ff);
  box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.12);
}

.profissionalFotoBox {
  width: 66px;
  height: 66px;
  border-radius: 22px;
  overflow: hidden;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profissionalFoto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profissionalFotoFallback {
  width: 100%;
  height: 100%;
  border-radius: 22px;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 950;
}

.profissionalPublicoInfo {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.profissionalPublicoInfo strong {
  color: #111827;
  font-size: 15px;
}

.profissionalPublicoInfo p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.profissionalServicos {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
}

.profissionalServicos span {
  background: #ede9fe;
  color: #5b21b6;
  border: 1px solid #ddd6fe;
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 900;
}

.profissionalCheck {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 950;
}

.hero {
  position: relative;
  width: 100%;
  max-width: 900px;
  margin-bottom: 28px;
}

.heroBackgroundGlow {
  position: absolute;
  inset: -40px 40px auto;
  height: 180px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.24), rgba(219, 39, 119, 0.24));
  filter: blur(50px);
  border-radius: 999px;
  z-index: 0;
}

.empresaHeroCard {
  position: relative;
  z-index: 1;
  width: 100%;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(253, 244, 255, 0.9)),
    radial-gradient(circle at top right, rgba(219, 39, 119, 0.12), transparent 42%);
  border: 1px solid rgba(255, 255, 255, 0.96);
  border-radius: 36px;
  padding: 24px;
  box-shadow: 0 32px 90px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(18px);
}

.empresaHeroTop {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
}

.empresaHeroInfo {
  min-width: 0;
  text-align: left;
}

.empresaHeroInfo h1 {
  margin: 8px 0 0;
  font-size: clamp(34px, 6vw, 62px);
  line-height: 0.96;
  letter-spacing: -0.07em;
  color: #111827;
}

.empresaHeroInfo .subtitle {
  max-width: 620px;
  margin: 14px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: #475569;
}

.empresaExtraInfos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 22px;
}

.empresaInfoItem {
  min-width: 0;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 22px;
  padding: 14px;
}

.empresaInfoItem > span {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(219, 39, 119, 0.18);
}

.empresaInfoItem strong {
  display: block;
  color: #111827;
  font-size: 13px;
  margin-bottom: 3px;
}

.empresaInfoItem p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.35;
  word-break: break-word;
}

.empresaHeroCard .trustRow {
  margin-top: 18px;
}

.servicosPublicos {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.servicoPublicoCard {
  width: 100%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 22px;
  padding: 14px;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 30px;
  gap: 13px;
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition: 0.18s ease;
}

.servicoPublicoCard:hover {
  transform: translateY(-1px);
  border-color: #c084fc;
  box-shadow: 0 14px 30px rgba(124, 58, 237, 0.1);
}

.servicoPublicoCard.active {
  border-color: #a855f7;
  background: linear-gradient(135deg, #ffffff, #faf5ff);
  box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.12);
}

.servicoPublicoIcon {
  width: 48px;
  height: 48px;
  border-radius: 18px;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 14px 28px rgba(219, 39, 119, 0.18);
}

.servicoPublicoInfo {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.servicoPublicoInfo strong {
  color: #111827;
  font-size: 15px;
}

.servicoPublicoInfo p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
}

.servicoPublicoMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.servicoPublicoMeta span {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 900;
}

.servicoPublicoMeta .prePagamentoTag {
  background: #fff7ed;
  color: #9a3412;
  border-color: #fed7aa;
}

.servicoPublicoCheck {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 950;
}

.mobileStickyBar {
  display: none;
}

.heroOfficialBadge {
  width: fit-content;
  margin: 0 auto 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  padding: 10px 16px;
  background: rgba(124, 58, 237, 0.1);
  color: #6d28d9;
  font-size: 13px;
  font-weight: 950;
}

.heroOfficialBadge span {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.empresaHeroCentered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empresaHeroCentered .empresaLogoBox {
  margin: 0 0 16px;
  width: 92px;
  height: 92px;
  border-radius: 30px;
}

.empresaHeroCentered h1 {
  margin: 0;
  font-size: clamp(48px, 8vw, 82px);
  line-height: 0.92;
  letter-spacing: -0.075em;
  color: #0f172a;
}

.empresaHeroCentered .subtitle {
  max-width: 560px;
  margin: 18px auto 0;
  font-size: 18px;
  line-height: 1.55;
  color: #475569;
}

.heroMiniBadges {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

.heroMiniBadge {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
}

.heroBanner {
  margin-top: 34px;
  min-height: 96px;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 92px;
  gap: 18px;
  align-items: center;
  border-radius: 28px;
  padding: 18px 22px;
  background:
    radial-gradient(circle at right, rgba(219, 39, 119, 0.12), transparent 34%),
    linear-gradient(135deg, rgba(250, 245, 255, 0.96), rgba(255, 255, 255, 0.92));
  border: 1px solid #e9d5ff;
  overflow: hidden;
}

.heroBannerIcon {
  width: 58px;
  height: 58px;
  border-radius: 20px;
  background: #ffffff;
  color: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 16px 30px rgba(124, 58, 237, 0.14);
}

.heroBannerText {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.heroBannerText strong {
  color: #0f172a;
  font-size: 18px;
  line-height: 1.25;
}

.heroBannerText span {
  color: #64748b;
  font-size: 14px;
  line-height: 1.45;
}

.heroBannerIllustration {
  width: 78px;
  height: 78px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 70% 70%, rgba(219, 39, 119, 0.28), transparent 32%),
    linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(219, 39, 119, 0.12));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.benefitsMinimal {
  max-width: 900px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
  border-radius: 32px;
  padding: 22px;
  gap: 0;
}

.benefitMinimal {
  border-radius: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
  padding: 22px 18px;
  position: relative;
}

.benefitMinimal:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 22px;
  right: 0;
  width: 1px;
  height: calc(100% - 44px);
  background: #e2e8f0;
}

.benefitMinimal span {
  width: 70px;
  height: 70px;
  margin: 0 auto 14px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 70% 30%, rgba(219, 39, 119, 0.18), transparent 32%),
    linear-gradient(135deg, rgba(124, 58, 237, 0.13), rgba(219, 39, 119, 0.12));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
}

.benefitMinimal strong {
  font-size: 17px;
  letter-spacing: -0.035em;
}

.footerBrandPremium {
  margin-top: 22px;
  justify-content: center;
  font-size: 18px;
  gap: 12px;
}

.footerBrandPremium > span {
  color: #a855f7;
  font-size: 18px;
}

.footerBrandPremium p {
  margin: 0;
  color: #64748b;
  font-size: 18px;
}

.footerBrandPremium strong {
  font-size: 24px;
  color: #0f172a;
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

.empresaHeroCard {
  border-radius: 30px;
  padding: 20px;
}

.empresaHeroTop {
  grid-template-columns: 1fr;
  text-align: center;
}

.empresaHeroInfo {
  text-align: center;
}

.empresaLogoBox {
  margin: 0 auto 4px;
}

.empresaExtraInfos {
  grid-template-columns: 1fr;
}

.heroBackgroundGlow {
  inset: -30px 20px auto;
  height: 150px;
}

.cardHeader {
  flex-direction: column;
}

.step {
  width: 100%;
  height: 44px;
}

.servicoPublicoCard {
  grid-template-columns: 44px minmax(0, 1fr) 28px;
  padding: 13px;
}

.servicoPublicoIcon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
}

.profissionalPublicoCard {
  grid-template-columns: 56px minmax(0, 1fr) 28px;
  padding: 13px;
}

.profissionalFotoBox {
  width: 56px;
  height: 56px;
  border-radius: 18px;
}

.mobileStickyBar {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(15, 23, 42, 0.96);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 22px;
  padding: 12px;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.32);
  backdrop-filter: blur(14px);
}

.mobileStickyBar div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobileStickyBar span {
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 800;
}

.mobileStickyBar strong {
  max-width: 190px;
  color: #ffffff;
  font-size: 13px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobileStickyBar button {
  min-width: 92px;
  height: 44px;
  border: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  color: #ffffff;
  font-weight: 950;
  cursor: pointer;
}

.page {
  padding-bottom: 82px;
}

.heroOfficialBadge {
  margin-bottom: 16px;
  padding: 9px 13px;
  font-size: 12px;
}

.empresaHeroCentered .empresaLogoBox {
  width: 78px;
  height: 78px;
  border-radius: 26px;
  margin-bottom: 14px;
}

.empresaHeroCentered h1 {
  font-size: 44px;
  letter-spacing: -0.065em;
}

.empresaHeroCentered .subtitle {
  font-size: 15px;
  line-height: 1.55;
  margin-top: 14px;
}

.heroMiniBadges {
  margin-top: 18px;
  gap: 8px;
}

.heroMiniBadge {
  width: 100%;
  min-height: 38px;
  font-size: 12px;
}

.heroBanner {
  margin-top: 24px;
  grid-template-columns: 1fr;
  text-align: center;
  padding: 18px;
  border-radius: 24px;
}

.heroBannerIcon,
.heroBannerIllustration {
  margin: 0 auto;
}

.heroBannerText {
  text-align: center;
}

.heroBannerText strong {
  font-size: 16px;
}

.heroBannerText span {
  font-size: 13px;
}

.benefitsMinimal {
  padding: 14px;
  border-radius: 28px;
  gap: 0;
}

.benefitMinimal {
  padding: 22px 14px;
}

.benefitMinimal:not(:last-child)::after {
  display: none;
}

.benefitMinimal:not(:last-child) {
  border-bottom: 1px solid #e2e8f0;
}

.benefitMinimal span {
  width: 62px;
  height: 62px;
  font-size: 30px;
  margin-bottom: 12px;
}

.benefitMinimal strong {
  font-size: 16px;
}

.footerBrandPremium {
  margin-top: 18px;
  font-size: 15px;
  gap: 8px;
  flex-wrap: wrap;
}

.footerBrandPremium p {
  font-size: 15px;
}

.footerBrandPremium strong {
  font-size: 20px;
}

/* =========================================
   MOBILE RESPONSIVO PREMIUM
========================================= */

@media (max-width: 768px) {

  .shell {
    padding: 18px 14px 120px;
  }

  .topBar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 24px;
  }

  .marca,
  .secureBadge {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .empresaHeroCard {
    padding: 18px;
    border-radius: 28px;
    overflow: hidden;
  }

  .empresaHeroCentered h1 {
    font-size: 42px;
    line-height: 0.95;
    word-break: break-word;
  }

  .empresaHeroCentered .subtitle {
    font-size: 15px;
    line-height: 1.5;
  }

  .heroMiniBadges {
    gap: 8px;
  }

  .heroMiniBadge {
    width: 100%;
    min-height: auto;
    justify-content: center;
    text-align: center;
  }

  .heroBanner {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 14px;
    padding: 18px;
  }

  .heroBannerText {
    text-align: center;
  }

  .heroBannerIllustration {
    margin: 0 auto;
  }

  .card {
    padding: 18px;
    border-radius: 26px;
  }

  .cardHeader {
    flex-direction: column;
    align-items: flex-start;
  }

  .cardHeader h2 {
    font-size: 24px;
  }

  .step {
    width: 52px;
    height: 52px;
  }

  .progressSteps {
    grid-template-columns: 1fr;
  }

  .cpfLine {
    grid-template-columns: 1fr;
  }

  .cpfLine button,
  .secondaryButton,
  .outlineButton,
  .primaryButton,
  .whatsappButton {
    width: 100%;
  }

  .servicoPublicoCard {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .servicoPublicoIcon {
    margin: 0 auto;
  }

  .servicoPublicoCheck {
    margin: 0 auto;
  }

  .profissionalPublicoCard {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .profissionalFotoBox {
    margin: 0 auto;
  }

  .profissionalCheck {
    margin: 0 auto;
  }

  .clienteSelecionadoTop {
    flex-direction: column;
    text-align: center;
  }

  .clienteSelecionadoFooter {
    flex-direction: column;
  }

  .trocarClienteButton {
    width: 100%;
  }

  .rescheduleCard {
    grid-template-columns: 1fr;
  }

  .benefits {
    grid-template-columns: 1fr;
  }

  .benefitsMinimal {
    padding: 12px;
  }

  .benefitMinimal {
    padding: 18px 12px;
  }

  .benefitMinimal:not(:last-child)::after {
    display: none;
  }

  .mobileStickyBar {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 999;
    background: rgba(15, 23, 42, 0.96);
    backdrop-filter: blur(14px);
    border-radius: 22px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 25px 60px rgba(15, 23, 42, 0.4);
  }

  .mobileStickyBar div {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .mobileStickyBar span {
    color: rgba(255,255,255,0.7);
    font-size: 11px;
    font-weight: 700;
  }

  .mobileStickyBar strong {
    color: white;
    font-size: 14px;
    line-height: 1.4;
  }

  .mobileStickyBar button {
    width: 100%;
    height: 50px;
    border: 0;
    border-radius: 16px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    color: white;
    font-weight: 900;
    font-size: 15px;
  }

  .footerBrandPremium {
    flex-wrap: wrap;
    text-align: center;
  }

  input,
  button,
  select,
  textarea {
    font-size: 16px !important;
  }
}

/* EXTRA SMALL DEVICES */

@media (max-width: 480px) {

  .empresaHeroCentered h1 {
    font-size: 34px;
  }

  .cardHeader h2 {
    font-size: 22px;
  }

  .subtitle {
    font-size: 14px !important;
  }

  .heroBannerText strong {
    font-size: 16px;
  }

  .heroBannerText span {
    font-size: 13px;
  }

  .slot {
    width: 100%;
  }

  .servicoPublicoMeta {
    justify-content: center;
  }

  .profissionalServicos {
    justify-content: center;
  }

/* =========================================
   CORREÇÃO FINAL ANTI-CORTE MOBILE
========================================= */

:global(html),
:global(body) {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

:global(*) {
  max-width: 100%;
}

.page {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.shell {
  max-width: 100%;
  overflow-x: hidden;
}

.hero,
.empresaHeroCard,
.card,
.benefits,
.footerBrand,
.cpfBox,
.section {
  max-width: 100%;
  overflow-x: hidden;
}

button,
input,
select,
textarea {
  max-width: 100%;
}

@media (max-width: 768px) {
  .shell {
    width: 100%;
    padding-left: 12px;
    padding-right: 12px;
  }

  .hero,
  .empresaHeroCard,
  .card,
  .benefitsMinimal {
    width: 100%;
    max-width: calc(100vw - 24px);
  }

  .heroBackgroundGlow {
    display: none;
  }

  .heroBanner {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }

  .empresaHeroCentered h1,
  .cardHeader h2,
  .heroBannerText strong,
  .heroBannerText span,
  .clienteInfo strong,
  .clienteInfo span {
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .cpfLine,
  .progressSteps,
  .rescheduleCard,
  .servicoPublicoCard,
  .profissionalPublicoCard {
    width: 100%;
    max-width: 100%;
  }
}



  .wizardCard {
    gap: 18px;
  }

  .wizardSteps {
    grid-template-columns: repeat(6, 1fr);
  }

  .etapaBox {
    animation: etapaEntrada 0.22s ease;
  }

  .etapaIntro {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 16px;
    border-radius: 22px;
    background: linear-gradient(135deg, #faf5ff, #ffffff);
    border: 1px solid #e9d5ff;
  }

  .etapaIntro > span {
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 16px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 14px 26px rgba(124, 58, 237, 0.2);
  }

  .etapaIntro strong {
    display: block;
    color: #111827;
    font-size: 17px;
    margin-bottom: 4px;
  }

  .etapaIntro p {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.45;
  }

  .dadosClienteBox {
    padding-top: 4px;
  }

  .wizardActions {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 10px;
    margin-top: 4px;
  }

  .resumoReserva {
    display: grid;
    gap: 12px;
  }

  .resumoServicoCard,
  .resumoTotalCard {
    border: 1px solid #e2e8f0;
    border-radius: 22px;
    background: linear-gradient(135deg, #ffffff, #f8fafc);
    padding: 14px;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
  }

  .resumoServicoTopo {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
  }

  .resumoServicoNumero {
    width: 42px;
    height: 42px;
    border-radius: 16px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 950;
    box-shadow: 0 12px 24px rgba(219, 39, 119, 0.2);
  }

  .resumoServicoInfo {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .resumoServicoInfo span,
  .resumoServicoDetalhes span,
  .resumoTotalCard span {
    color: #64748b;
    font-size: 12px;
    font-weight: 900;
  }

  .resumoServicoInfo strong,
  .resumoServicoDetalhes strong,
  .resumoTotalCard strong {
    color: #111827;
    font-size: 14px;
  }

  .resumoServicoInfo small,
  .resumoTotalCard small {
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
  }

  .removerServicoButton {
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 999px;
    background: #fef2f2;
    color: #991b1b;
    font-size: 20px;
    font-weight: 950;
    cursor: pointer;
  }

  .resumoServicoDetalhes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
    gap: 8px;
    margin-top: 12px;
  }

  .resumoServicoDetalhes > div {
    min-width: 0;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    background: #f8fafc;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .resumoPrePagamentoBadge {
    margin-top: 12px;
    border-radius: 999px;
    background: #fdf2f8;
    border: 1px solid #fbcfe8;
    color: #be185d;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 950;
    text-align: center;
  }

  .resumoTotalCard {
    background: linear-gradient(135deg, #7c3aed, #db2777);
    border-color: transparent;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .resumoTotalValores {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }

  .resumoTotalValores > div {
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.22);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .resumoTotalCard span,
  .resumoTotalCard strong,
  .resumoTotalCard small {
    color: #ffffff;
  }

  .resumoTotalCard strong {
    font-size: 24px;
    letter-spacing: -0.04em;
  }

  @keyframes etapaEntrada {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    .wizardSteps {
      grid-template-columns: repeat(3, 1fr);
    }

    .wizardActions {
      grid-template-columns: 1fr;
    }

    .etapaIntro {
      padding: 14px;
    }
  
.wizardSteps{
display:flex;
align-items:center;
gap:12px;
overflow:auto;
padding:14px 4px 20px;
margin-bottom:20px;
}

.wizardStep{
display:flex;
align-items:center;
gap:8px;
opacity:.45;
font-weight:700;
white-space:nowrap;
transition:.2s;
}

.wizardStep.active{
opacity:1;
color:#4f46e5;
}

.wizardStep.done{
opacity:1;
color:#22c55e;
}

.wizardBall{
width:34px;
height:34px;
border-radius:999px;
display:flex;
align-items:center;
justify-content:center;
background:#e2e8f0;
font-size:14px;
font-weight:800;
}

.wizardStep.active .wizardBall{
background:#4f46e5;
color:#fff;
}

.wizardStep.done .wizardBall{
background:#22c55e;
color:#fff;
}
`;