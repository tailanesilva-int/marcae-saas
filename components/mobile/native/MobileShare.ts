import { detectarMobileCapabilities } from './MobileCapabilities';

export type MarcaeMobileShareFile = File;

export type MarcaeMobileSharePayload = {
  title?: string;
  text?: string;
  url?: string;
  files?: MarcaeMobileShareFile[];
};

export type MarcaeMobileShareResult = {
  compartilhado: boolean;
  fallback: 'native' | 'clipboard' | 'open' | 'none';
  mensagem?: string;
};

function possuiWindow() {
  return typeof window !== 'undefined';
}

function montarTextoFallback(payload: MarcaeMobileSharePayload) {
  return [payload.title, payload.text, payload.url].filter(Boolean).join('\n\n');
}

export function podeCompartilharMobile(payload?: MarcaeMobileSharePayload) {
  if (!possuiWindow()) return false;

  if (typeof navigator.share !== 'function') return false;

  if (payload?.files?.length && typeof navigator.canShare === 'function') {
    return navigator.canShare({ files: payload.files });
  }

  return true;
}

export async function copiarCompartilhamentoMobile(
  payload: MarcaeMobileSharePayload,
): Promise<MarcaeMobileShareResult> {
  if (!possuiWindow()) {
    return {
      compartilhado: false,
      fallback: 'none',
      mensagem: 'Compartilhamento indisponível neste ambiente.',
    };
  }

  const texto = montarTextoFallback(payload);

  if (!texto) {
    return {
      compartilhado: false,
      fallback: 'none',
      mensagem: 'Não há conteúdo para compartilhar.',
    };
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);

      return {
        compartilhado: true,
        fallback: 'clipboard',
        mensagem: 'Conteúdo copiado.',
      };
    }
  } catch {
    return {
      compartilhado: false,
      fallback: 'none',
      mensagem: 'Não foi possível copiar o conteúdo.',
    };
  }

  return {
    compartilhado: false,
    fallback: 'none',
    mensagem: 'Clipboard não disponível.',
  };
}

export async function compartilharMobile(
  payload: MarcaeMobileSharePayload,
): Promise<MarcaeMobileShareResult> {
  if (!possuiWindow()) {
    return {
      compartilhado: false,
      fallback: 'none',
      mensagem: 'Compartilhamento indisponível neste ambiente.',
    };
  }

  const capabilities = detectarMobileCapabilities();
  const temConteudo =
    Boolean(payload.title) ||
    Boolean(payload.text) ||
    Boolean(payload.url) ||
    Boolean(payload.files?.length);

  if (!temConteudo) {
    return {
      compartilhado: false,
      fallback: 'none',
      mensagem: 'Não há conteúdo para compartilhar.',
    };
  }

  if (capabilities.podeCompartilhar && podeCompartilharMobile(payload)) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
        files: payload.files,
      });

      return {
        compartilhado: true,
        fallback: 'native',
        mensagem: 'Compartilhado com sucesso.',
      };
    } catch {
      return copiarCompartilhamentoMobile(payload);
    }
  }

  if (payload.url && !payload.text && !payload.title && !payload.files?.length) {
    try {
      window.open(payload.url, '_blank', 'noopener,noreferrer');

      return {
        compartilhado: true,
        fallback: 'open',
        mensagem: 'Link aberto.',
      };
    } catch {
      return copiarCompartilhamentoMobile(payload);
    }
  }

  return copiarCompartilhamentoMobile(payload);
}