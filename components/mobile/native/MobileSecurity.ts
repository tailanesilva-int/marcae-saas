/**
 * components/mobile/native/MobileSecurity.ts
 *
 * Fase 4.5.1 - Mobile Security Foundation
 * Base preparada para futura integração com Capacitor Biometrics,
 * Secure Storage, Keychain e Android Keystore.
 */

export type MarcaeSecurityStatus = {
  secureContext: boolean;
  supportsWebAuthn: boolean;
  biometriaDisponivel: boolean;
  bloqueado: boolean;
};

export type MarcaeBiometriaStatus = {
  disponivel: boolean;
  tecnologia: 'webauthn' | 'future-capacitor' | 'none';
};

export type MarcaeSecurityTimeout = {
  ativo: boolean;
  timeoutMs: number;
};

let bloqueado = false


let timeoutId: ReturnType<typeof setTimeout> | null = null;

export const isSecureContextMobile = (): boolean =>
  typeof window !== 'undefined' ? window.isSecureContext === true : false;

export const possuiAutenticacaoSeguraMobile = (): boolean =>
  typeof window !== 'undefined' &&
  typeof (window as typeof window & { PublicKeyCredential?: unknown }).PublicKeyCredential !== 'undefined';

export const verificarBiometriaDisponivelMobile = (): MarcaeBiometriaStatus => ({
  disponivel: possuiAutenticacaoSeguraMobile(),
  tecnologia: possuiAutenticacaoSeguraMobile() ? 'webauthn' : 'none',
});

export const bloquearAplicativoMobile = (): void => {
  bloqueado = true;
};

export const desbloquearAplicativoMobile = (): void => {
  bloqueado = false;
};

export const estaBloqueadoMobile = (): boolean => bloqueado;

export const obterStatusSegurancaMobile = (): MarcaeSecurityStatus => ({
  secureContext: isSecureContextMobile(),
  supportsWebAuthn: possuiAutenticacaoSeguraMobile(),
  biometriaDisponivel: verificarBiometriaDisponivelMobile().disponivel,
  bloqueado,
});

export const cancelarTimeoutSegurancaMobile = (): void => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

export const configurarTimeoutSegurancaMobile = (
  timeoutMs: number,
  onTimeout?: () => void,
): MarcaeSecurityTimeout => {
  cancelarTimeoutSegurancaMobile();

  timeoutId = setTimeout(() => {
    bloquearAplicativoMobile();
    onTimeout?.();
  }, timeoutMs);

  return {
    ativo: true,
    timeoutMs,
  };
};

export const reiniciarTimeoutSegurancaMobile = (
  timeoutMs: number,
  onTimeout?: () => void,
): MarcaeSecurityTimeout =>
  configurarTimeoutSegurancaMobile(timeoutMs, onTimeout);

export const limparDadosSegurosMobile = (): void => {
  cancelarTimeoutSegurancaMobile();
  bloqueado = false;
};
