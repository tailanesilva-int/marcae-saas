export type StatusLicencaEmpresa = 'ativo' | 'aviso' | 'bloqueio_parcial' | 'bloqueio_total';

export type ResultadoLicencaEmpresa = {
  diasAtraso: number;
  status: StatusLicencaEmpresa;
  licencaAtiva: boolean;
  trialAtivo: boolean;
  assinaturaAtiva: boolean;
  mostrarBanner: boolean;
  mostrarModalPagamento: boolean;
  bloqueioTotal: boolean;
  bloqueioParcial: boolean;
  bloquearDashboard: boolean;
  bloquearAgenda: boolean;
  bloquearClientes: boolean;
  bloquearFichasDigitais: boolean;
  bloquearServicos: boolean;
  bloquearProfissionais: boolean;
  bloquearPromocoes: boolean;
  bloquearFinanceiro: boolean;
  bloquearComissoes: boolean;
  bloquearRelatorios: boolean;
  bloquearConfiguracoes: boolean;
  dataReferencia?: string | null;
  mensagemCurta: string;
  mensagemDetalhada: string;
};

function inicioDoDia(data: Date) {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function dataValidaFuturaOuHoje(data?: string | Date | null) {
  if (!data) return false;

  const validade = inicioDoDia(new Date(data));
  const hoje = inicioDoDia(new Date());

  if (Number.isNaN(validade.getTime())) return false;

  return validade.getTime() >= hoje.getTime();
}

function calcularDiasAtraso(data?: string | Date | null) {
  if (!data) return 0;

  const vencimento = inicioDoDia(new Date(data));
  const hoje = inicioDoDia(new Date());

  if (Number.isNaN(vencimento.getTime())) return 0;

  const diff = hoje.getTime() - vencimento.getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

  return dias > 0 ? dias : 0;
}

export function obterStatusLicencaEmpresa(empresa: any): ResultadoLicencaEmpresa {
  const trialAtivo = dataValidaFuturaOuHoje(empresa?.trialExpiraEm);

  const assinaturaAtiva =
    String(empresa?.assinaturaStatus || '').toLowerCase() === 'ativa' &&
    dataValidaFuturaOuHoje(empresa?.assinaturaExpiraEm);

  const licencaAtiva = trialAtivo || assinaturaAtiva;
  const dataReferencia = trialAtivo ? empresa?.trialExpiraEm : empresa?.assinaturaExpiraEm;
  const diasAtraso = licencaAtiva ? 0 : calcularDiasAtraso(dataReferencia);

  let status: StatusLicencaEmpresa = 'ativo';

  if (!licencaAtiva) {
    if (diasAtraso >= 6) {
      status = 'bloqueio_total';
    } else if (diasAtraso >= 4) {
      status = 'bloqueio_parcial';
    } else {
      status = 'aviso';
    }
  }

  const bloqueioTotal = status === 'bloqueio_total';
  const bloqueioParcial = status === 'bloqueio_parcial';
  const mostrarBanner = status === 'aviso' || status === 'bloqueio_parcial';
  const mostrarModalPagamento = bloqueioTotal;

  const mensagemCurta =
    status === 'ativo'
      ? 'Licença ativa'
      : diasAtraso <= 1
        ? 'Assinatura vencida há 1 dia'
        : `Assinatura vencida há ${diasAtraso} dias`;

  const mensagemDetalhada =
    status === 'aviso'
      ? 'Regularize sua mensalidade para evitar bloqueios nos próximos dias.'
      : status === 'bloqueio_parcial'
        ? 'Alguns recursos foram bloqueados temporariamente: promoções, relatórios e comissões.'
        : status === 'bloqueio_total'
          ? 'Regularize sua mensalidade para continuar utilizando o Marcaê.'
          : 'Todos os recursos contratados estão disponíveis.';

  return {
    diasAtraso,
    status,
    licencaAtiva,
    trialAtivo,
    assinaturaAtiva,
    mostrarBanner,
    mostrarModalPagamento,
    bloqueioTotal,
    bloqueioParcial,
    bloquearDashboard: bloqueioTotal,
    bloquearAgenda: bloqueioTotal,
    bloquearClientes: bloqueioTotal,
    bloquearFichasDigitais: bloqueioTotal,
    bloquearServicos: bloqueioTotal,
    bloquearProfissionais: bloqueioTotal,
    bloquearPromocoes: bloqueioParcial || bloqueioTotal,
    bloquearFinanceiro: bloqueioTotal,
    bloquearComissoes: bloqueioParcial || bloqueioTotal,
    bloquearRelatorios: bloqueioParcial || bloqueioTotal,
    bloquearConfiguracoes: bloqueioTotal,
    dataReferencia,
    mensagemCurta,
    mensagemDetalhada,
  };
}

export function moduloBloqueadoPorLicenca(pathname: string, empresa: any) {
  const licenca = obterStatusLicencaEmpresa(empresa);

  if (pathname.startsWith('/planos')) return false;

  if (pathname.startsWith('/dashboard')) return licenca.bloquearDashboard;
  if (pathname.startsWith('/agenda')) return licenca.bloquearAgenda;
  if (pathname.startsWith('/clientes')) return licenca.bloquearClientes;
  if (pathname.startsWith('/fichas-digitais')) return licenca.bloquearFichasDigitais;
  if (pathname.startsWith('/servicos')) return licenca.bloquearServicos;
  if (pathname.startsWith('/profissionais')) return licenca.bloquearProfissionais;
  if (pathname.startsWith('/promocoes')) return licenca.bloquearPromocoes;
  if (pathname.startsWith('/financeiro')) return licenca.bloquearFinanceiro;
  if (pathname.startsWith('/comissoes')) return licenca.bloquearComissoes;
  if (pathname.startsWith('/relatorios')) return licenca.bloquearRelatorios;
  if (pathname.startsWith('/configuracoes')) return licenca.bloquearConfiguracoes;

  return licenca.bloqueioTotal;
}
