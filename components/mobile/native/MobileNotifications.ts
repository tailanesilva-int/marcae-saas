export type MarcaeNotificationPermission =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported';

export type MarcaeNotificationPayload = {
  titulo: string;
  corpo?: string;
  icone?: string;
  badge?: string;
  tag?: string;
  url?: string;
  silent?: boolean;
  vibrate?: number[];
};

export type MarcaeNotificationResult = {
  sucesso: boolean;
  permissao: MarcaeNotificationPermission;
  mensagem: string;
};

function possuiWindow() {
  return typeof window !== 'undefined';
}

function possuiNotificacoes() {
  return possuiWindow() && 'Notification' in window;
}

export function verificarPermissaoNotificacaoMobile(): MarcaeNotificationPermission {
  if (!possuiNotificacoes()) return 'unsupported';

  return Notification.permission;
}

export async function solicitarPermissaoNotificacaoMobile(): Promise<MarcaeNotificationResult> {
  if (!possuiNotificacoes()) {
    return {
      sucesso: false,
      permissao: 'unsupported',
      mensagem: 'Notificações não são suportadas neste ambiente.',
    };
  }

  if (Notification.permission === 'granted') {
    return {
      sucesso: true,
      permissao: 'granted',
      mensagem: 'Permissão de notificação já concedida.',
    };
  }

  if (Notification.permission === 'denied') {
    return {
      sucesso: false,
      permissao: 'denied',
      mensagem: 'Permissão de notificação negada.',
    };
  }

  try {
    const permissao = await Notification.requestPermission();

    return {
      sucesso: permissao === 'granted',
      permissao,
      mensagem:
        permissao === 'granted'
          ? 'Permissão de notificação concedida.'
          : 'Permissão de notificação não concedida.',
    };
  } catch {
    return {
      sucesso: false,
      permissao: verificarPermissaoNotificacaoMobile(),
      mensagem: 'Não foi possível solicitar permissão de notificação.',
    };
  }
}

export async function enviarNotificacaoLocalMobile(
  payload: MarcaeNotificationPayload,
): Promise<MarcaeNotificationResult> {
  if (!payload.titulo?.trim()) {
    return {
      sucesso: false,
      permissao: verificarPermissaoNotificacaoMobile(),
      mensagem: 'Título da notificação não informado.',
    };
  }

  const permissao = verificarPermissaoNotificacaoMobile();

  if (permissao !== 'granted') {
    return {
      sucesso: false,
      permissao,
      mensagem: 'Permissão de notificação não concedida.',
    };
  }

  try {
    const notificationOptions: NotificationOptions = {
      body: payload.corpo,
      icon: payload.icone || '/icons/icon-192.png',
      badge: payload.badge || '/icons/icon-192.png',
      tag: payload.tag,
      silent: payload.silent,
    };

    const notificacao = new Notification(payload.titulo, notificationOptions);

    if (payload.vibrate?.length && typeof navigator.vibrate === 'function') {
      navigator.vibrate(payload.vibrate);
    }

    if (payload.url) {
      notificacao.onclick = () => {
        window.focus();
        window.location.href = payload.url as string;
        notificacao.close();
      };
    }

    return {
      sucesso: true,
      permissao,
      mensagem: 'Notificação enviada.',
    };
  } catch {
    return {
      sucesso: false,
      permissao,
      mensagem: 'Não foi possível enviar a notificação.',
    };
  }
}

export async function agendarNotificacaoMobile(
  payload: MarcaeNotificationPayload,
  atrasoMs: number,
): Promise<MarcaeNotificationResult> {
  if (!possuiWindow()) {
    return {
      sucesso: false,
      permissao: 'unsupported',
      mensagem: 'Agendamento indisponível neste ambiente.',
    };
  }

  const atrasoSeguro = Math.max(0, atrasoMs);

  window.setTimeout(() => {
    enviarNotificacaoLocalMobile(payload);
  }, atrasoSeguro);

  return {
    sucesso: true,
    permissao: verificarPermissaoNotificacaoMobile(),
    mensagem: 'Notificação agendada nesta sessão.',
  };
}

export async function cancelarNotificacaoMobile(): Promise<MarcaeNotificationResult> {
  return {
    sucesso: true,
    permissao: verificarPermissaoNotificacaoMobile(),
    mensagem:
      'Cancelamento individual preparado para integração futura com notificações nativas.',
  };
}

export async function cancelarTodasNotificacoesMobile(): Promise<MarcaeNotificationResult> {
  return {
    sucesso: true,
    permissao: verificarPermissaoNotificacaoMobile(),
    mensagem:
      'Cancelamento geral preparado para integração futura com notificações nativas.',
  };
}