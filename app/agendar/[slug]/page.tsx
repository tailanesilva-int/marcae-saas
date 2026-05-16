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

function dataMaximaNascimentoPermitida() {
  const hoje = new Date();

  const dataLimite = new Date(
    hoje.getFullYear() - 10,
    hoje.getMonth(),
    hoje.getDate()
  );

  const ano = dataLimite.getFullYear();

  const mes = String(
    dataLimite.getMonth() + 1
  ).padStart(2, '0');

  const dia = String(
    dataLimite.getDate()
  ).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function clienteTemIdadeMinima(
  dataNascimento?: string
) {
  if (!dataNascimento) return false;

  const hoje = new Date();

  const nascimento = new Date(
    `${dataNascimento}T00:00:00`
  );

  let idade =
    hoje.getFullYear() -
    nascimento.getFullYear();

  const mes =
    hoje.getMonth() -
    nascimento.getMonth();

  if (
    mes < 0 ||
    (mes === 0 &&
      hoje.getDate() <
        nascimento.getDate())
  ) {
    idade--;
  }

  return idade >= 10;
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

if (!clienteTemIdadeMinima(cliente.dataNascimento)) {
  alert(
    'É necessário ter pelo menos 10 anos para realizar um agendamento.'
  );

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
  max={dataMaximaNascimentoPermitida()}
  value={cliente.dataNascimento}
  onChange={(e) => {
    const valor = e.target.value;

    if (
      valor &&
      !clienteTemIdadeMinima(valor)
    ) {
      alert(
        'É necessário ter pelo menos 10 anos para realizar um agendamento.'
      );

      setCliente({
        ...cliente,
        dataNascimento: '',
      });

      return;
    }

    setCliente({
      ...cliente,
      dataNascimento: valor,
    });
  }}
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

  :global(html),
  :global(body) {
    margin: 0;
    background: #080B0F;
  }

  .page {
    width: 100%;
    min-height: 100vh;
    background:
      radial-gradient(circle at 12% 0%, rgba(123, 58, 237, 0.34), transparent 32%),
      radial-gradient(circle at 88% 10%, rgba(183, 107, 255, 0.23), transparent 30%),
      radial-gradient(circle at 50% 100%, rgba(123, 58, 237, 0.18), transparent 34%),
      linear-gradient(180deg, #080B0F 0%, #0B0F19 46%, #111425 100%);
    color: #F8FAFC;
    overflow-x: hidden;
    display: flex;
    justify-content: center;
  }

  .page::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
    background-size: 54px 54px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 72%);
  }

  .shell {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 760px;
min-height: 100vh;
margin: 0 auto;
padding: 24px 20px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .shell > .wizardSteps {
    display: none;
  }

  .topBar {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 22px;
  }

  .marca,
  .secureBadge {
    border: 1px solid rgba(237, 233, 255, 0.12);
    background: rgba(17, 20, 37, 0.72);
    backdrop-filter: blur(18px);
    border-radius: 999px;
    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.28);
  }

  .marca {
    padding: 10px 16px;
    color: #F8FAFC;
    font-size: 18px;
    font-weight: 950;
    letter-spacing: -0.06em;
  }

  .marca span,
  .footerBrand strong span {
    color: #B76BFF;
    text-shadow: 0 0 22px rgba(183, 107, 255, 0.42);
  }

  .secureBadge {
    padding: 10px 14px;
    color: #C4B5FD;
    font-size: 12px;
    font-weight: 850;
  }

  .hero {
    position: relative;
    width: 100%;
    max-width: 720px;
    margin-bottom: 18px;
  }

  .heroBackgroundGlow {
    position: absolute;
    inset: -50px 20%;
    background: radial-gradient(circle, rgba(123, 58, 237, 0.26), transparent 64%);
    filter: blur(10px);
    pointer-events: none;
  }

  .empresaHeroCard {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(237, 233, 255, 0.14);
    background: linear-gradient(145deg, rgba(17, 20, 37, 0.86), rgba(8, 11, 15, 0.86));
    border-radius: 32px;
    padding: 24px;
    box-shadow: 0 34px 90px rgba(0, 0, 0, 0.42);
    backdrop-filter: blur(18px);
  }

  .empresaHeroCard::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(255,255,255,0.12), transparent 28%, transparent 72%, rgba(183,107,255,0.1));
    pointer-events: none;
  }

  .heroOfficialBadge,
  .heroMiniBadge,
  .tag {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: fit-content;
    margin: 0 auto 18px;
    padding: 8px 12px;
    border-radius: 999px;
    color: #EDE9FF;
    background: rgba(123, 58, 237, 0.16);
    border: 1px solid rgba(183, 107, 255, 0.28);
    font-size: 12px;
    font-weight: 900;
  }

  .heroOfficialBadge span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #7B3AED;
    color: white;
  }

  .empresaHeroCentered {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .empresaLogoBox {
    width: 86px;
    height: 86px;
    border-radius: 28px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    background: linear-gradient(145deg, rgba(237, 233, 255, 0.12), rgba(123, 58, 237, 0.12));
    border: 1px solid rgba(237, 233, 255, 0.2);
    box-shadow: 0 22px 60px rgba(123, 58, 237, 0.26);
  }

  .empresaLogo {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .empresaLogoFallback {
    color: #EDE9FF;
    font-size: 34px;
    font-weight: 950;
  }

  .hero h1 {
    margin: 0;
    max-width: 660px;
    font-size: clamp(34px, 7vw, 66px);
    line-height: 0.95;
    letter-spacing: -0.075em;
    color: #F8FAFC;
  }

  .subtitle {
    max-width: 520px;
    margin: 14px 0 0;
    color: #A7B0C5;
    font-size: 15px;
    line-height: 1.6;
  }

  .heroMiniBadges,
  .heroMiniBadgesCompact {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  .heroMiniBadge {
    margin: 0;
    background: rgba(237, 233, 255, 0.08);
  }

  .card {
    width: 100%;
    max-width: 620px;
    margin-bottom: 18px;
    padding: 24px;
    border-radius: 32px;
    background: rgba(17, 20, 37, 0.84);
    border: 1px solid rgba(237, 233, 255, 0.13);
    box-shadow: 0 36px 95px rgba(0, 0, 0, 0.44);
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .wizardCard {
    position: relative;
    overflow: hidden;
  }

  .wizardCard::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 88% 0%, rgba(183, 107, 255, 0.16), transparent 28%);
    pointer-events: none;
  }

  .wizardCard > * {
    position: relative;
    z-index: 1;
  }

  .cardHeader {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .cardHeader h2 {
    margin: 0;
    color: #F8FAFC;
    font-size: clamp(25px, 4vw, 34px);
    line-height: 1.02;
    letter-spacing: -0.06em;
  }

  .cardHeader p {
    margin: 8px 0 0;
    color: #A7B0C5;
    font-size: 13px;
    line-height: 1.5;
  }

  .step {
    min-width: 54px;
    height: 54px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 950;
    background: linear-gradient(135deg, #7B3AED, #B76BFF);
    box-shadow: 0 18px 42px rgba(123, 58, 237, 0.44);
  }

  .progressSteps.wizardSteps {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
    padding: 9px;
    border-radius: 22px;
    background: rgba(8, 11, 15, 0.58);
    border: 1px solid rgba(237, 233, 255, 0.1);
  }

  .progressStep {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border-radius: 16px;
    padding: 10px 8px;
    color: #68748A;
    transition: all 0.18s ease;
  }

  .progressStep span,
  .wizardBall {
    min-width: 23px;
    width: 23px;
    height: 23px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(237, 233, 255, 0.1);
    color: #A7B0C5;
    font-size: 11px;
    font-weight: 950;
  }

  .progressStep p,
  .wizardStep span {
    margin: 0;
    font-size: 11px;
    line-height: 1;
    font-weight: 900;
    white-space: nowrap;
  }

  .progressStep.active {
    color: #EDE9FF;
    background: rgba(123, 58, 237, 0.18);
    box-shadow: inset 0 0 0 1px rgba(183, 107, 255, 0.16);
  }

  .progressStep.active span,
  .wizardStep.active .wizardBall,
  .wizardStep.done .wizardBall {
    color: #fff;
    background: linear-gradient(135deg, #7B3AED, #B76BFF);
  }

  .cpfBox,
  .section,
  .etapaBox,
  .dadosClienteBox,
  .rescheduleForm {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .etapaIntro {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 12px;
    margin-top: 2px;
  }

  .etapaIntro > span {
    width: 42px;
    height: 42px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(123, 58, 237, 0.18);
    border: 1px solid rgba(183, 107, 255, 0.24);
  }

  .etapaIntro strong {
    display: block;
    color: #F8FAFC;
    font-size: 17px;
    letter-spacing: -0.02em;
  }

  .etapaIntro p {
    margin: 4px 0 0;
    color: #A7B0C5;
    font-size: 13px;
    line-height: 1.45;
  }

  .cpfBox label,
  .sectionTitle,
  .fieldLabel {
    color: #EDE9FF;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.01em;
  }

  .fieldHint,
  .security {
    color: #7D889F;
    font-size: 11px;
    line-height: 1.45;
  }

  .cpfLine {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 136px;
    gap: 10px;
  }

  .cpfLine input,
  .field {
    width: 100%;
    height: 52px;
    border-radius: 18px;
    border: 1px solid rgba(237, 233, 255, 0.13);
    background: rgba(8, 11, 15, 0.62);
    color: #F8FAFC;
    outline: none;
    padding: 0 14px;
    font-size: 15px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  }

  .cpfLine input::placeholder,
  .field::placeholder {
    color: #68748A;
  }

  .cpfLine input:focus,
  .field:focus {
    border-color: rgba(183, 107, 255, 0.62);
    box-shadow: 0 0 0 4px rgba(123, 58, 237, 0.18), inset 0 1px 0 rgba(255,255,255,0.06);
  }

  .cpfLine button,
  .primaryButton,
  .secondaryButton,
  .outlineButton,
  .miniButton,
  .whatsappButton,
  .trocarClienteButton,
  .removerServicoButton {
    border: 0;
    cursor: pointer;
    font-weight: 950;
    transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, background 0.16s ease;
  }

  .cpfLine button,
  .primaryButton,
  .secondaryButton,
  .miniButton {
    color: white;
    background: linear-gradient(135deg, #7B3AED 0%, #B76BFF 100%);
    box-shadow: 0 18px 44px rgba(123, 58, 237, 0.34);
  }

  .cpfLine button,
  .secondaryButton,
  .outlineButton,
  .whatsappButton {
    height: 52px;
    border-radius: 18px;
  }

  .primaryButton {
    width: 100%;
    min-height: 58px;
    border-radius: 20px;
    padding: 0 18px;
    font-size: 15px;
  }

  .outlineButton,
  .trocarClienteButton {
    width: 100%;
    color: #EDE9FF;
    background: rgba(237, 233, 255, 0.06);
    border: 1px solid rgba(183, 107, 255, 0.24);
  }

  .whatsappButton {
    width: 100%;
    color: #EFFFF7;
    background: rgba(22, 163, 74, 0.18);
    border: 1px solid rgba(74, 222, 128, 0.24);
  }

  .miniButton {
    height: 40px;
    padding: 0 14px;
    border-radius: 14px;
    white-space: nowrap;
  }

  .cpfLine button:hover,
  .primaryButton:hover,
  .secondaryButton:hover,
  .outlineButton:hover,
  .miniButton:hover,
  .whatsappButton:hover,
  .slot:hover,
  .servicoPublicoCard:hover,
  .profissionalPublicoCard:hover {
    transform: translateY(-1px);
  }

  .cpfLine button:disabled,
  .outlineButton:disabled,
  .primaryButton:disabled,
  .secondaryButton:disabled,
  .whatsappButton:disabled {
    opacity: 0.62;
    cursor: not-allowed;
    transform: none;
  }

  .successBox,
  .warningBox,
  .selectedInfo,
  .emptySlots,
  .policyBox,
  .dangerBox,
  .readyBox,
  .resumoPrePagamentoBadge,
  .clienteBadge,
  .blockedText {
    border-radius: 18px;
    padding: 13px 14px;
    font-size: 13px;
    line-height: 1.45;
  }

  .successBox {
    color: #BBF7D0;
    background: rgba(22, 163, 74, 0.12);
    border: 1px solid rgba(74, 222, 128, 0.22);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .warningBox,
  .policyBox {
    color: #EDE9FF;
    background: rgba(123, 58, 237, 0.12);
    border: 1px solid rgba(183, 107, 255, 0.24);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .dangerBox {
    grid-column: 1 / -1;
    color: #FECACA;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(248, 113, 113, 0.22);
  }

  .readyBox,
  .selectedInfo {
    color: #A7B0C5;
    background: rgba(8, 11, 15, 0.54);
    border: 1px solid rgba(237, 233, 255, 0.11);
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .readyBox strong,
  .selectedInfo strong {
    color: #F8FAFC;
  }

  .sectionTitleRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .sectionTitleRow span {
    color: #A7B0C5;
    font-size: 12px;
    font-weight: 850;
  }

  .emptySlots {
    color: #A7B0C5;
    background: rgba(8, 11, 15, 0.42);
    border: 1px dashed rgba(237, 233, 255, 0.18);
  }

  .servicosPublicos,
  .profissionaisPublicos,
  .rescheduleList,
  .resumoReserva {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .servicoPublicoCard,
  .profissionalPublicoCard,
  .rescheduleCard,
  .resumoServicoCard,
  .resumoTotalCard,
  .clienteSelecionadoCard,
  .benefit {
    width: 100%;
    border: 1px solid rgba(237, 233, 255, 0.12);
    background: rgba(8, 11, 15, 0.56);
    border-radius: 22px;
    box-shadow: 0 16px 42px rgba(0, 0, 0, 0.18);
  }

  .servicoPublicoCard,
  .profissionalPublicoCard {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 14px;
    text-align: left;
    color: inherit;
  }

  .servicoPublicoCard.active,
  .profissionalPublicoCard.active,
  .rescheduleCard.selected {
    border-color: rgba(183, 107, 255, 0.54);
    background: linear-gradient(135deg, rgba(123, 58, 237, 0.2), rgba(8, 11, 15, 0.62));
    box-shadow: 0 0 0 4px rgba(123, 58, 237, 0.12), 0 20px 54px rgba(0, 0, 0, 0.28);
  }

  .servicoPublicoIcon,
  .profissionalFotoFallback,
  .clienteAvatar,
  .resumoServicoNumero {
    width: 46px;
    height: 46px;
    border-radius: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    color: white;
    font-weight: 950;
    background: linear-gradient(135deg, #7B3AED, #B76BFF);
    box-shadow: 0 16px 35px rgba(123, 58, 237, 0.28);
  }

  .servicoPublicoInfo,
  .profissionalPublicoInfo,
  .resumoServicoInfo,
  .clienteInfo {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .servicoPublicoInfo strong,
  .profissionalPublicoInfo strong,
  .rescheduleCard strong,
  .resumoServicoInfo strong,
  .clienteInfo strong {
    color: #F8FAFC;
    font-size: 15px;
    line-height: 1.2;
  }

  .servicoPublicoInfo p,
  .profissionalPublicoInfo p,
  .rescheduleCard p,
  .resumoServicoInfo span,
  .resumoServicoInfo small,
  .clienteInfo span {
    margin: 0;
    color: #A7B0C5;
    font-size: 12px;
    line-height: 1.4;
    font-weight: 700;
  }

  .servicoPublicoMeta,
  .profissionalServicos {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 2px;
  }

  .servicoPublicoMeta span,
  .profissionalServicos span,
  .prePagamentoTag {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    min-height: 25px;
    border-radius: 999px;
    padding: 5px 8px;
    color: #DDE3F0;
    background: rgba(237, 233, 255, 0.08);
    border: 1px solid rgba(237, 233, 255, 0.12);
    font-size: 11px;
    font-weight: 850;
  }

  .prePagamentoTag,
  .resumoPrePagamentoBadge {
    color: #EDE9FF !important;
    background: rgba(123, 58, 237, 0.16) !important;
    border-color: rgba(183, 107, 255, 0.26) !important;
  }

  .servicoPublicoCheck,
  .profissionalCheck {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: rgba(237, 233, 255, 0.08);
    border: 1px solid rgba(237, 233, 255, 0.13);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 13px;
    font-weight: 950;
  }

  .servicoPublicoCard.active .servicoPublicoCheck,
  .profissionalPublicoCard.active .profissionalCheck {
    background: #7B3AED;
    border-color: #B76BFF;
  }

  .profissionalFotoBox {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(237, 233, 255, 0.16);
    background: rgba(237, 233, 255, 0.07);
  }

  .profissionalFoto {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .slots {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 9px;
  }

  .slot {
    height: 44px;
    border-radius: 16px;
    border: 1px solid rgba(237, 233, 255, 0.12);
    background: rgba(8, 11, 15, 0.54);
    color: #DDE3F0;
    cursor: pointer;
    font-weight: 950;
  }

  .slot.active {
    color: #fff;
    border-color: rgba(183, 107, 255, 0.62);
    background: linear-gradient(135deg, #7B3AED, #B76BFF);
    box-shadow: 0 16px 34px rgba(123, 58, 237, 0.32);
  }

  .rescheduleCard {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    padding: 14px;
  }

  .blockedText {
    color: #FECACA;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(248, 113, 113, 0.2);
    white-space: nowrap;
    font-weight: 900;
  }

  .rescheduleForm {
    border-top: 1px solid rgba(237, 233, 255, 0.1);
    padding-top: 14px;
  }

  .clienteSelecionadoCard {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .clienteSelecionadoTop {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .clienteSelecionadoFooter {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
  }

  .clienteBadge {
    color: #BBF7D0;
    background: rgba(22, 163, 74, 0.12);
    border: 1px solid rgba(74, 222, 128, 0.2);
    font-weight: 900;
  }

  .trocarClienteButton {
    width: auto;
    height: 42px;
    padding: 0 14px;
    border-radius: 14px;
  }

  .resumoServicoCard {
    padding: 14px;
  }

  .resumoServicoTopo {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }

  .removerServicoButton {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    color: #FECACA;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(248, 113, 113, 0.18);
    font-size: 20px;
  }

  .resumoServicoDetalhes,
  .resumoTotalValores {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .resumoServicoDetalhes div,
  .resumoTotalValores div {
    padding: 12px;
    border-radius: 16px;
    background: rgba(237, 233, 255, 0.06);
    border: 1px solid rgba(237, 233, 255, 0.09);
  }

  .resumoServicoDetalhes span,
  .resumoTotalValores span {
    display: block;
    color: #7D889F;
    font-size: 11px;
    font-weight: 850;
    margin-bottom: 4px;
  }

  .resumoServicoDetalhes strong,
  .resumoTotalValores strong {
    display: block;
    color: #F8FAFC;
    font-size: 13px;
    line-height: 1.25;
  }

  .resumoPrePagamentoBadge {
    margin-top: 10px;
    font-weight: 900;
  }

  .resumoTotalCard {
    padding: 14px;
    background: linear-gradient(135deg, rgba(123, 58, 237, 0.18), rgba(8, 11, 15, 0.68));
    border-color: rgba(183, 107, 255, 0.28);
  }

  .resumoTotalCard small {
    display: block;
    margin-top: 10px;
    color: #A7B0C5;
    font-size: 12px;
    line-height: 1.45;
  }

  .wizardActions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 4px;
  }

  .wizardActions .primaryButton,
  .wizardActions .outlineButton {
    height: auto;
    min-height: 54px;
  }

  .benefits {
    width: 100%;
    max-width: 720px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .benefit {
    padding: 16px;
    text-align: center;
  }

  .benefit span {
    display: block;
    font-size: 20px;
    margin-bottom: 8px;
  }

  .benefit strong {
    color: #F8FAFC;
    font-size: 13px;
  }

  .benefit p {
    margin: 5px 0 0;
    color: #A7B0C5;
    font-size: 12px;
    line-height: 1.4;
  }

  .footerBrand {
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: #7D889F;
    font-size: 12px;
  }

  .footerBrand p {
    margin: 0;
  }

  .footerBrand strong {
    color: #F8FAFC;
    letter-spacing: -0.04em;
  }

  .loadingPage {
    min-height: 100vh;
    background:
      radial-gradient(circle at 50% 0%, rgba(123, 58, 237, 0.28), transparent 34%),
      #080B0F;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: #F8FAFC;
  }

  .loadingCard {
    width: 100%;
    max-width: 360px;
    border-radius: 28px;
    padding: 30px;
    text-align: center;
    background: rgba(17, 20, 37, 0.86);
    border: 1px solid rgba(237, 233, 255, 0.13);
    box-shadow: 0 26px 70px rgba(0, 0, 0, 0.38);
  }

  .loadingPulse {
    font-size: 34px;
    margin-bottom: 12px;
  }

  .loadingCard h1 {
    margin: 0;
    color: #F8FAFC;
    font-size: 24px;
  }

  .loadingCard p {
    margin: 8px 0 0;
    color: #A7B0C5;
  }

  @media (max-width: 760px) {
    .shell {
      padding: 16px 12px 28px;
      align-items: stretch;
    }

    .topBar {
      margin-bottom: 14px;
    }

    .secureBadge {
      display: none;
    }

    .hero {
      max-width: none;
      margin-bottom: 12px;
    }

    .empresaHeroCard {
      padding: 18px;
      border-radius: 28px;
    }

    .empresaLogoBox {
      width: 72px;
      height: 72px;
      border-radius: 24px;
    }

    .hero h1 {
      font-size: clamp(30px, 10vw, 46px);
    }

    .card {
      max-width: none;
      padding: 18px;
      border-radius: 28px;
    }

    .cardHeader {
      gap: 12px;
    }

    .step {
      min-width: 48px;
      height: 48px;
      border-radius: 16px;
    }

    .progressSteps.wizardSteps {
      grid-template-columns: repeat(3, 1fr);
    }

    .progressStep {
      justify-content: flex-start;
      padding: 9px 8px;
    }

    .cpfLine {
      grid-template-columns: 1fr;
    }

    .servicoPublicoCard,
    .profissionalPublicoCard {
      grid-template-columns: auto 1fr;
    }

    .servicoPublicoCheck,
    .profissionalCheck {
      position: absolute;
      top: 14px;
      right: 14px;
    }

    .slots {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .wizardActions,
    .resumoServicoDetalhes,
    .resumoTotalValores,
    .benefits,
    .clienteSelecionadoFooter {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 420px) {
    .progressSteps.wizardSteps {
      grid-template-columns: repeat(2, 1fr);
    }

    .slots {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .cardHeader h2 {
      font-size: 26px;
    }

@media (min-width: 981px) {
  .page {
    justify-content: center !important;
    align-items: flex-start !important;
    padding-left: 20px;
    padding-right: 20px;
  }

  .shell {
    width: 100% !important;
    max-width: 680px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .topBar,
  .hero,
  .wizardCard {
    width: 100% !important;
  }
  
@media (min-width: 981px) {
  .page {
    width: 100vw !important;
    display: flex !important;
    justify-content: center !important;
    align-items: flex-start !important;
  }

  .shell {
    width: min(680px, 100%) !important;
    max-width: 680px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
}
`;
