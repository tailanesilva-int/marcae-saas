export type MarcaeMediaTipoArquivo = 'imagem' | 'video' | 'pdf' | 'arquivo';

export type MarcaeMediaArquivo = {
  arquivo: File;
  nome: string;
  tamanho: number;
  tamanhoFormatado: string;
  tipo: string;
  categoria: MarcaeMediaTipoArquivo;
  previewUrl: string | null;
};

export type MarcaeMediaValidacao = {
  valido: boolean;
  motivo?: string;
};

export type MarcaeMediaSelecionarOpcoes = {
  accept?: string;
  multiple?: boolean;
  capture?: boolean | 'user' | 'environment';
  criarPreview?: boolean;
};

export type MarcaeMediaValidarOpcoes = {
  tamanhoMaximoMb?: number;
  tiposPermitidos?: string[];
};

const ambienteBrowserDisponivel = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

const detectarCategoriaArquivo = (arquivo: File): MarcaeMediaTipoArquivo => {
  if (arquivo.type.startsWith('image/')) {
    return 'imagem';
  }

  if (arquivo.type.startsWith('video/')) {
    return 'video';
  }

  if (arquivo.type === 'application/pdf') {
    return 'pdf';
  }

  return 'arquivo';
};

export const formatarTamanhoArquivoMobile = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const unidades = ['B', 'KB', 'MB', 'GB'];
  const indice = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unidades.length - 1);
  const valor = bytes / Math.pow(1024, indice);

  return `${valor.toFixed(valor >= 10 || indice === 0 ? 0 : 1)} ${unidades[indice]}`;
};

export const criarPreviewArquivoMobile = (arquivo: File): string | null => {
  if (!ambienteBrowserDisponivel()) {
    return null;
  }

  if (!arquivo.type.startsWith('image/') && !arquivo.type.startsWith('video/')) {
    return null;
  }

  try {
    return URL.createObjectURL(arquivo);
  } catch {
    return null;
  }
};

export const revogarPreviewArquivoMobile = (previewUrl?: string | null): void => {
  if (!ambienteBrowserDisponivel() || !previewUrl) {
    return;
  }

  try {
    URL.revokeObjectURL(previewUrl);
  } catch {
    return;
  }
};

export const validarArquivoMobile = (
  arquivo: File,
  opcoes?: MarcaeMediaValidarOpcoes,
): MarcaeMediaValidacao => {
  const tamanhoMaximoMb = opcoes?.tamanhoMaximoMb;
  const tiposPermitidos = opcoes?.tiposPermitidos;

  if (!arquivo) {
    return {
      valido: false,
      motivo: 'Arquivo não informado.',
    };
  }

  if (typeof tamanhoMaximoMb === 'number' && tamanhoMaximoMb > 0) {
    const limiteBytes = tamanhoMaximoMb * 1024 * 1024;

    if (arquivo.size > limiteBytes) {
      return {
        valido: false,
        motivo: `Arquivo maior que ${tamanhoMaximoMb} MB.`,
      };
    }
  }

  if (Array.isArray(tiposPermitidos) && tiposPermitidos.length > 0) {
    const tipoArquivo = arquivo.type.toLowerCase();
    const nomeArquivo = arquivo.name.toLowerCase();

    const permitido = tiposPermitidos.some((tipo) => {
      const tipoNormalizado = tipo.toLowerCase().trim();

      if (tipoNormalizado.endsWith('/*')) {
        return tipoArquivo.startsWith(tipoNormalizado.replace('/*', '/'));
      }

      if (tipoNormalizado.startsWith('.')) {
        return nomeArquivo.endsWith(tipoNormalizado);
      }

      return tipoArquivo === tipoNormalizado;
    });

    if (!permitido) {
      return {
        valido: false,
        motivo: 'Tipo de arquivo não permitido.',
      };
    }
  }

  return {
    valido: true,
  };
};

const normalizarArquivoMobile = (arquivo: File, criarPreview = true): MarcaeMediaArquivo => {
  return {
    arquivo,
    nome: arquivo.name,
    tamanho: arquivo.size,
    tamanhoFormatado: formatarTamanhoArquivoMobile(arquivo.size),
    tipo: arquivo.type || 'application/octet-stream',
    categoria: detectarCategoriaArquivo(arquivo),
    previewUrl: criarPreview ? criarPreviewArquivoMobile(arquivo) : null,
  };
};

const selecionarArquivosMobile = (opcoes?: MarcaeMediaSelecionarOpcoes): Promise<MarcaeMediaArquivo[]> => {
  return new Promise((resolve) => {
    if (!ambienteBrowserDisponivel()) {
      resolve([]);
      return;
    }

    const input = document.createElement('input');

    input.type = 'file';
    input.accept = opcoes?.accept ?? '';
    input.multiple = opcoes?.multiple === true;

    if (opcoes?.capture) {
      input.setAttribute(
        'capture',
        typeof opcoes.capture === 'string' ? opcoes.capture : 'environment',
      );
    }

    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';

    const limpar = () => {
      input.remove();
    };

    input.onchange = () => {
      const arquivos = Array.from(input.files ?? []).map((arquivo) =>
        normalizarArquivoMobile(arquivo, opcoes?.criarPreview !== false),
      );

      limpar();
      resolve(arquivos);
    };

    input.oncancel = () => {
      limpar();
      resolve([]);
    };

    document.body.appendChild(input);
    input.click();
  });
};

export const selecionarImagemMobile = async (): Promise<MarcaeMediaArquivo | null> => {
  const arquivos = await selecionarArquivosMobile({
    accept: 'image/*',
    multiple: false,
    criarPreview: true,
  });

  return arquivos[0] ?? null;
};

export const selecionarImagemCameraMobile = async (): Promise<MarcaeMediaArquivo | null> => {
  const arquivos = await selecionarArquivosMobile({
    accept: 'image/*',
    multiple: false,
    capture: 'environment',
    criarPreview: true,
  });

  return arquivos[0] ?? null;
};

export const selecionarMultiplasImagensMobile = async (): Promise<MarcaeMediaArquivo[]> => {
  return selecionarArquivosMobile({
    accept: 'image/*',
    multiple: true,
    criarPreview: true,
  });
};

export const selecionarArquivoMobile = async (
  opcoes?: Omit<MarcaeMediaSelecionarOpcoes, 'multiple'>,
): Promise<MarcaeMediaArquivo | null> => {
  const arquivos = await selecionarArquivosMobile({
    ...opcoes,
    multiple: false,
  });

  return arquivos[0] ?? null;
};

export const selecionarMultiplosArquivosMobile = async (
  opcoes?: Omit<MarcaeMediaSelecionarOpcoes, 'multiple'>,
): Promise<MarcaeMediaArquivo[]> => {
  return selecionarArquivosMobile({
    ...opcoes,
    multiple: true,
  });
};