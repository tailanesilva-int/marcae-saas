export type MarcaeDownloadArquivo = {
  nome: string;
  url?: string;
  blob?: Blob;
  mimeType?: string;
  abrirEmNovaAba?: boolean;
};

export type MarcaeDownloadResult = {
  sucesso: boolean;
  mensagem: string;
  fallback: 'download' | 'open' | 'none';
};

function possuiWindow() {
  return typeof window !== 'undefined';
}

function normalizarNomeArquivo(nome: string, fallback: string) {
  const valor = nome.trim();

  if (!valor) return fallback;

  return valor.replace(/[\\/:*?"<>|]/g, '-');
}

function criarObjectUrl(blob: Blob) {
  return URL.createObjectURL(blob);
}

function revogarObjectUrl(url: string) {
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1200);
}

function baixarPorLink(url: string, nome: string) {
  const link = document.createElement('a');

  link.href = url;
  link.download = nome;
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function abrirPorWindow(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function baixarArquivoMobile(
  arquivo: MarcaeDownloadArquivo,
): Promise<MarcaeDownloadResult> {
  if (!possuiWindow()) {
    return {
      sucesso: false,
      mensagem: 'Download indisponível neste ambiente.',
      fallback: 'none',
    };
  }

  const nome = normalizarNomeArquivo(arquivo.nome, 'marcae-arquivo');

  if (!arquivo.url && !arquivo.blob) {
    return {
      sucesso: false,
      mensagem: 'Arquivo não informado.',
      fallback: 'none',
    };
  }

  try {
    if (arquivo.blob) {
      const urlTemporaria = criarObjectUrl(arquivo.blob);

      if (arquivo.abrirEmNovaAba) {
        abrirPorWindow(urlTemporaria);
        revogarObjectUrl(urlTemporaria);

        return {
          sucesso: true,
          mensagem: 'Arquivo aberto.',
          fallback: 'open',
        };
      }

      baixarPorLink(urlTemporaria, nome);
      revogarObjectUrl(urlTemporaria);

      return {
        sucesso: true,
        mensagem: 'Download iniciado.',
        fallback: 'download',
      };
    }

    if (arquivo.url) {
      if (arquivo.abrirEmNovaAba) {
        abrirPorWindow(arquivo.url);

        return {
          sucesso: true,
          mensagem: 'Arquivo aberto.',
          fallback: 'open',
        };
      }

      baixarPorLink(arquivo.url, nome);

      return {
        sucesso: true,
        mensagem: 'Download iniciado.',
        fallback: 'download',
      };
    }
  } catch {
    return {
      sucesso: false,
      mensagem: 'Não foi possível baixar o arquivo.',
      fallback: 'none',
    };
  }

  return {
    sucesso: false,
    mensagem: 'Não foi possível processar o arquivo.',
    fallback: 'none',
  };
}

export async function abrirArquivoMobile(
  arquivo: MarcaeDownloadArquivo,
): Promise<MarcaeDownloadResult> {
  return baixarArquivoMobile({
    ...arquivo,
    abrirEmNovaAba: true,
  });
}

export async function baixarPdfMobile(
  arquivo: Omit<MarcaeDownloadArquivo, 'mimeType'>,
) {
  return baixarArquivoMobile({
    ...arquivo,
    mimeType: 'application/pdf',
  });
}

export async function abrirPdfMobile(
  arquivo: Omit<MarcaeDownloadArquivo, 'mimeType'>,
) {
  return abrirArquivoMobile({
    ...arquivo,
    mimeType: 'application/pdf',
  });
}

export async function baixarImagemMobile(
  arquivo: Omit<MarcaeDownloadArquivo, 'mimeType'>,
) {
  return baixarArquivoMobile({
    ...arquivo,
    mimeType: 'image/*',
  });
}

export async function baixarRelatorioMobile(
  arquivo: Omit<MarcaeDownloadArquivo, 'mimeType'>,
) {
  return baixarArquivoMobile({
    nome: arquivo.nome || 'relatorio-marcae',
    url: arquivo.url,
    blob: arquivo.blob,
    abrirEmNovaAba: arquivo.abrirEmNovaAba,
    mimeType: 'application/octet-stream',
  });
}

export async function baixarComprovanteMobile(
  arquivo: Omit<MarcaeDownloadArquivo, 'mimeType'>,
) {
  return baixarArquivoMobile({
    nome: arquivo.nome || 'comprovante-marcae.pdf',
    url: arquivo.url,
    blob: arquivo.blob,
    abrirEmNovaAba: arquivo.abrirEmNovaAba,
    mimeType: 'application/pdf',
  });
}