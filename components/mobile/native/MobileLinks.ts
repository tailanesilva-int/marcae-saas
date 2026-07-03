import { detectarMobilePlatform } from './MobilePlatform';

type MarcaeLinkFallback = {
  principal: string;
  fallback?: string;
};

function normalizarTexto(valor: string) {
  return valor.trim();
}

function limparTelefone(valor: string) {
  return valor.replace(/\D/g, '');
}

function possuiWindow() {
  return typeof window !== 'undefined';
}

function isExternalUrl(url: string) {
  if (!possuiWindow()) return false;

  try {
    const parsed = new URL(url, window.location.origin);

    return parsed.origin !== window.location.origin;
  } catch {
    return false;
  }
}

function isHttpUrl(href: string) {
  const normalized = href.toLowerCase();

  return normalized.startsWith('http://') || normalized.startsWith('https://');
}

function isLinkInterno(href: string) {
  if (!possuiWindow()) return false;

  return (
    href.startsWith('#') ||
    href.startsWith('/') ||
    href.startsWith(window.location.origin)
  );
}

function isNativeExternalLink(href: string) {
  const normalized = href.toLowerCase();

  return (
    normalized.startsWith('tel:') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('sms:') ||
    normalized.startsWith('whatsapp:') ||
    normalized.startsWith('instagram:') ||
    normalized.startsWith('geo:') ||
    normalized.startsWith('waze:') ||
    normalized.startsWith('mercadopago:') ||
    normalized.startsWith('upi:') ||
    normalized.startsWith('pix:') ||
    normalized.startsWith('intent:') ||
    normalized.includes('wa.me/') ||
    normalized.includes('api.whatsapp.com/') ||
    normalized.includes('web.whatsapp.com/') ||
    normalized.includes('instagram.com/') ||
    normalized.includes('maps.google.') ||
    normalized.includes('google.com/maps') ||
    normalized.includes('maps.app.goo.gl') ||
    normalized.includes('waze.com/') ||
    normalized.includes('mercadopago.com') ||
    normalized.includes('mercadopago.com.br') ||
    normalized.includes('mpago.la/')
  );
}

function criarFallbackPorLink(href: string): MarcaeLinkFallback {
  const normalized = href.toLowerCase();

  if (normalized.includes('wa.me/') || normalized.includes('api.whatsapp.com/')) {
    return {
      principal: href,
      fallback: href,
    };
  }

  if (normalized.includes('instagram.com/')) {
    return {
      principal: href,
      fallback: href,
    };
  }

  if (
    normalized.includes('maps.google.') ||
    normalized.includes('google.com/maps') ||
    normalized.includes('maps.app.goo.gl')
  ) {
    return {
      principal: href,
      fallback: href,
    };
  }

  if (normalized.includes('waze.com/')) {
    return {
      principal: href,
      fallback: href,
    };
  }

  if (
    normalized.includes('mercadopago.com') ||
    normalized.includes('mercadopago.com.br') ||
    normalized.includes('mpago.la/')
  ) {
    return {
      principal: href,
      fallback: href,
    };
  }

  return {
    principal: href,
    fallback: isHttpUrl(href) ? href : undefined,
  };
}

function abrirComFallback({ principal, fallback }: MarcaeLinkFallback) {
  if (!possuiWindow()) return false;

  const platform = detectarMobilePlatform();
  const isNativeAndroid = platform.isCapacitor && platform.isAndroid;
  const isMobile = platform.isMobile || platform.isStandalone || platform.isCapacitor;

  if (isNativeAndroid || (!isHttpUrl(principal) && isMobile)) {
    const visibilityBefore = document.visibilityState;

    window.location.href = principal;

    if (fallback && fallback !== principal) {
      window.setTimeout(() => {
        if (document.visibilityState === visibilityBefore) {
          window.open(fallback, '_blank', 'noopener,noreferrer');
        }
      }, 800);
    }

    return true;
  }

  window.open(principal, '_blank', 'noopener,noreferrer');

  return true;
}

export function criarLinkWhatsapp(telefone: string, mensagem?: string) {
  const numero = limparTelefone(telefone);
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : '';

  if (!numero) return '';

  return `https://wa.me/${numero}${texto}`;
}

export function criarLinkTelefone(telefone: string) {
  const numero = normalizarTexto(telefone);

  if (!numero) return '';

  return `tel:${numero}`;
}

export function criarLinkEmail(email: string, assunto?: string, corpo?: string) {
  const destinatario = normalizarTexto(email);

  if (!destinatario) return '';

  const params = new URLSearchParams();

  if (assunto) params.set('subject', assunto);
  if (corpo) params.set('body', corpo);

  const query = params.toString();

  return `mailto:${destinatario}${query ? `?${query}` : ''}`;
}

export function criarLinkSms(telefone: string, mensagem?: string) {
  const numero = normalizarTexto(telefone);

  if (!numero) return '';

  const texto = mensagem ? `?body=${encodeURIComponent(mensagem)}` : '';

  return `sms:${numero}${texto}`;
}

export function criarLinkInstagram(usuarioOuUrl: string) {
  const valor = normalizarTexto(usuarioOuUrl);

  if (!valor) return '';

  if (isHttpUrl(valor)) return valor;

  const usuario = valor.replace('@', '');

  return `https://instagram.com/${usuario}`;
}

export function criarLinkGoogleMaps(destinoOuUrl: string) {
  const valor = normalizarTexto(destinoOuUrl);

  if (!valor) return '';

  if (isHttpUrl(valor) || valor.startsWith('geo:')) return valor;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    valor,
  )}`;
}

export function criarLinkWaze(destinoOuUrl: string) {
  const valor = normalizarTexto(destinoOuUrl);

  if (!valor) return '';

  if (isHttpUrl(valor) || valor.startsWith('waze:')) return valor;

  return `https://waze.com/ul?q=${encodeURIComponent(valor)}&navigate=yes`;
}

export function criarLinkMercadoPago(url: string) {
  const valor = normalizarTexto(url);

  if (!valor) return '';

  return valor;
}

export function criarLinkPix(codigoOuUrl: string) {
  const valor = normalizarTexto(codigoOuUrl);

  if (!valor) return '';

  if (
    valor.toLowerCase().startsWith('pix:') ||
    valor.toLowerCase().startsWith('upi:') ||
    isHttpUrl(valor)
  ) {
    return valor;
  }

  return valor;
}

export function abrirLinkMobile(href: string) {
  if (!possuiWindow()) return false;

  const link = normalizarTexto(href);

  if (!link) return false;

  const deveAbrirFora = isNativeExternalLink(link) || isExternalUrl(link);

  if (!deveAbrirFora) return false;

  return abrirComFallback(criarFallbackPorLink(link));
}

export function abrirWhatsappMobile(telefone: string, mensagem?: string) {
  const link = criarLinkWhatsapp(telefone, mensagem);

  if (!link) return false;

  return abrirLinkMobile(link);
}

export function abrirTelefoneMobile(telefone: string) {
  const link = criarLinkTelefone(telefone);

  if (!link) return false;

  return abrirLinkMobile(link);
}

export function abrirEmailMobile(email: string, assunto?: string, corpo?: string) {
  const link = criarLinkEmail(email, assunto, corpo);

  if (!link) return false;

  return abrirLinkMobile(link);
}

export function abrirSmsMobile(telefone: string, mensagem?: string) {
  const link = criarLinkSms(telefone, mensagem);

  if (!link) return false;

  return abrirLinkMobile(link);
}

export function abrirInstagramMobile(usuarioOuUrl: string) {
  const link = criarLinkInstagram(usuarioOuUrl);

  if (!link) return false;

  return abrirLinkMobile(link);
}

export function abrirGoogleMapsMobile(destinoOuUrl: string) {
  const link = criarLinkGoogleMaps(destinoOuUrl);

  if (!link) return false;

  return abrirLinkMobile(link);
}

export function abrirWazeMobile(destinoOuUrl: string) {
  const link = criarLinkWaze(destinoOuUrl);

  if (!link) return false;

  return abrirLinkMobile(link);
}

export function abrirMercadoPagoMobile(url: string) {
  const link = criarLinkMercadoPago(url);

  if (!link) return false;

  return abrirLinkMobile(link);
}

export async function abrirPixMobile(codigoOuUrl: string) {
  if (!possuiWindow()) return false;

  const link = criarLinkPix(codigoOuUrl);

  if (!link) return false;

  if (
    link.toLowerCase().startsWith('pix:') ||
    link.toLowerCase().startsWith('upi:') ||
    isHttpUrl(link)
  ) {
    return abrirLinkMobile(link);
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);

      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function interceptarLinksMobile() {
  if (!possuiWindow()) return () => {};

  function onClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;

    if (!target) return;

    const link = target.closest('a');

    if (!link) return;

    const href = link.getAttribute('href');

    if (!href) return;

    if (isLinkInterno(href)) return;

    const aberto = abrirLinkMobile(href);

    if (aberto) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  document.addEventListener('click', onClick, true);

  return () => {
    document.removeEventListener('click', onClick, true);
  };
}