export { default as PwaProvider } from './core/PwaProvider';
export { default as InstallPrompt } from './core/InstallPrompt';
export { default as SplashScreen } from './core/SplashScreen';

export { default as MobileProvider } from './MobileProvider';

export { usePwa } from './hooks/usePwa';

export { detectarMobilePlatform } from './native/MobilePlatform';
export { detectarMobileCapabilities } from './native/MobileCapabilities';
export { configurarMobileStatusBar } from './native/MobileStatusBar';

export {
  abrirEmailMobile,
  abrirGoogleMapsMobile,
  abrirInstagramMobile,
  abrirLinkMobile,
  abrirMercadoPagoMobile,
  abrirPixMobile,
  abrirSmsMobile,
  abrirTelefoneMobile,
  abrirWhatsappMobile,
  abrirWazeMobile,
  criarLinkEmail,
  criarLinkGoogleMaps,
  criarLinkInstagram,
  criarLinkMercadoPago,
  criarLinkPix,
  criarLinkSms,
  criarLinkTelefone,
  criarLinkWhatsapp,
  interceptarLinksMobile,
} from './native/MobileLinks';

export {
  compartilharMobile,
  copiarCompartilhamentoMobile,
  podeCompartilharMobile,
} from './native/MobileShare';

export type {
  MarcaeMobileShareFile,
  MarcaeMobileSharePayload,
  MarcaeMobileShareResult,
} from './native/MobileShare';

export {
  copiarChavePixMobile,
  copiarCodigoConfirmacaoMobile,
  copiarCpfMobile,
  copiarEmailMobile,
  copiarLinkMobile,
  copiarPixMobile,
  copiarTelefoneMobile,
  copiarTextoMobile,
  lerClipboardMobile,
} from './native/MobileClipboard';

export type { MarcaeClipboardResult } from './native/MobileClipboard';

export {
  abrirArquivoMobile,
  abrirPdfMobile,
  baixarArquivoMobile,
  baixarComprovanteMobile,
  baixarImagemMobile,
  baixarPdfMobile,
  baixarRelatorioMobile,
} from './native/MobileDownload';

export type {
  MarcaeDownloadArquivo,
  MarcaeDownloadResult,
} from './native/MobileDownload';

export {
  agendarNotificacaoMobile,
  cancelarNotificacaoMobile,
  cancelarTodasNotificacoesMobile,
  enviarNotificacaoLocalMobile,
  solicitarPermissaoNotificacaoMobile,
  verificarPermissaoNotificacaoMobile,
} from './native/MobileNotifications';

export type {
  MarcaeNotificationPayload,
  MarcaeNotificationPermission,
  MarcaeNotificationResult,
} from './native/MobileNotifications';

export {
  vibrarAlerta,
  vibrarErro,
  vibrarForte,
  vibrarLeve,
  vibrarMedio,
  vibrarPersonalizado,
  vibrarSucesso,
} from './native/MobileHaptics';

export type { MarcaeHapticResult } from './native/MobileHaptics';

export {
  escutarMudancaConexaoMobile,
  escutarMudancaOrientacaoMobile,
  obterFusoHorarioMobile,
  obterIdiomaMobile,
  obterIdiomasMobile,
  obterInformacoesConexaoMobile,
  obterInformacoesDispositivoMobile,
  obterOrientacaoMobile,
  obterTipoConexaoMobile,
  removerEscutaConexaoMobile,
  removerEscutaOrientacaoMobile,
  verificarOnlineMobile,
} from './native/MobileDevice';

export type {
  MarcaeDeviceConexaoInfo,
  MarcaeDeviceInfo,
  MarcaeDeviceListenerRemover,
} from './native/MobileDevice';

export {
  criarPreviewArquivoMobile,
  formatarTamanhoArquivoMobile,
  revogarPreviewArquivoMobile,
  selecionarArquivoMobile,
  selecionarImagemCameraMobile,
  selecionarImagemMobile,
  selecionarMultiplasImagensMobile,
  selecionarMultiplosArquivosMobile,
  validarArquivoMobile,
} from './native/MobileMedia';

export type {
  MarcaeMediaArquivo,
  MarcaeMediaSelecionarOpcoes,
  MarcaeMediaTipoArquivo,
  MarcaeMediaValidacao,
  MarcaeMediaValidarOpcoes,
} from './native/MobileMedia';

export {
  bloquearAplicativoMobile,
  cancelarTimeoutSegurancaMobile,
  desbloquearAplicativoMobile,
  estaBloqueadoMobile,
  configurarTimeoutSegurancaMobile,
  isSecureContextMobile,
  limparDadosSegurosMobile,
  obterStatusSegurancaMobile,
  possuiAutenticacaoSeguraMobile,
  reiniciarTimeoutSegurancaMobile,
  verificarBiometriaDisponivelMobile,
} from './native/MobileSecurity';

export type {
  MarcaeBiometriaStatus,
  MarcaeSecurityStatus,
  MarcaeSecurityTimeout,
} from './native/MobileSecurity';

export { iniciarNavegacaoMobile } from './native/MobileNavigation';
