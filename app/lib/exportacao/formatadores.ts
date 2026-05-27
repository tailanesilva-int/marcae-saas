export function formatarDinheiro(valor: any) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatarNumero(valor: any) {
  return Number(valor || 0).toLocaleString('pt-BR');
}

export function formatarPercentual(valor: any) {
  return `${Number(valor || 0).toFixed(1)}%`;
}

export function formatarData(data: any) {
  if (!data) return '-';

  return new Date(data).toLocaleDateString('pt-BR');
}

export function formatarDataHora(data: any) {
  if (!data) return '-';

  return new Date(data).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatarPeriodo(dataInicio: string, dataFim: string) {
  return `${formatarData(dataInicio)} até ${formatarData(dataFim)}`;
}

export function limparTexto(valor: any) {
  if (valor === null || valor === undefined || valor === '') {
    return '-';
  }

  return String(valor);
}

export function nomeArquivoSeguro(texto: string) {
  return String(texto || 'relatorio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}