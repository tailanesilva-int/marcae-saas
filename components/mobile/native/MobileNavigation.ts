import { detectarMobilePlatform } from './MobilePlatform';

const ROTAS_RAIZ_EMPRESA = ['/dashboard'];
const ROTAS_LOGIN = ['/login', '/master/login'];

function rotaAtual() {
  if (typeof window === 'undefined') return '/';

  return window.location.pathname;
}

function isRotaLogin(pathname: string) {
  return ROTAS_LOGIN.some((rota) => pathname === rota);
}

function isRotaRaizEmpresa(pathname: string) {
  return ROTAS_RAIZ_EMPRESA.some((rota) => pathname === rota);
}

function temSessaoLocalEmpresa() {
  if (typeof window === 'undefined') return false;

  try {
    return Boolean(
      localStorage.getItem('usuarioEmpresa') &&
        localStorage.getItem('empresaLogada')
    );
  } catch {
    return false;
  }
}

function limparHistoricoLoginSeLogado() {
  if (typeof window === 'undefined') return;

  const pathname = rotaAtual();

  if (!temSessaoLocalEmpresa()) return;

  if (isRotaLogin(pathname)) {
    window.history.replaceState(
      {
        ...(window.history.state || {}),
        marcaeReplaceLogin: true,
      },
      '',
      '/dashboard'
    );
  }
}

function confirmarSaidaApp() {
  if (typeof window === 'undefined') return false;

  return window.confirm('Deseja sair do Marcaê?');
}

export function iniciarNavegacaoMobile() {
  if (typeof window === 'undefined') return () => {};

  const platform = detectarMobilePlatform();

  limparHistoricoLoginSeLogado();

  function onPopState() {
    const pathname = rotaAtual();

    if (temSessaoLocalEmpresa() && isRotaLogin(pathname)) {
      window.history.replaceState(
        {
          ...(window.history.state || {}),
          marcaeBlockedLoginBack: true,
        },
        '',
        '/dashboard'
      );

      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }

    if (
      (platform.isMobile || platform.isPwa || platform.isCapacitor) &&
      isRotaRaizEmpresa(pathname)
    ) {
      window.history.pushState(
        {
          ...(window.history.state || {}),
          marcaeRootGuard: true,
        },
        '',
        pathname
      );

      const sair = confirmarSaidaApp();

      if (sair) {
        window.location.href = '/api/auth/logout';
      }

      return;
    }
  }

  window.addEventListener('popstate', onPopState);

  if (
    (platform.isMobile || platform.isPwa || platform.isCapacitor) &&
    isRotaRaizEmpresa(rotaAtual())
  ) {
    window.history.replaceState(
      {
        ...(window.history.state || {}),
        marcaeRootGuard: true,
      },
      '',
      rotaAtual()
    );

    window.history.pushState(
      {
        ...(window.history.state || {}),
        marcaeRootGuard: true,
      },
      '',
      rotaAtual()
    );
  }

  return () => {
    window.removeEventListener('popstate', onPopState);
  };
}