type MarcaeHapticPattern = number | number[];

export type MarcaeHapticResult = {
  sucesso: boolean;
  suportado: boolean;
  executado: boolean;
  motivo?: string;
};

const criarResultado = (
  sucesso: boolean,
  suportado: boolean,
  executado: boolean,
  motivo?: string,
): MarcaeHapticResult => ({
  sucesso,
  suportado,
  executado,
  motivo,
});

const navegadorSuportaVibracao = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (typeof navigator === 'undefined') {
    return false;
  }

  return typeof navigator.vibrate === 'function';
};

const executarVibracaoMobile = (pattern: MarcaeHapticPattern): MarcaeHapticResult => {
  if (!navegadorSuportaVibracao()) {
    return criarResultado(false, false, false, 'Vibração não suportada neste ambiente.');
  }

  try {
    const executado = navigator.vibrate(pattern);

    return criarResultado(
      executado,
      true,
      executado,
      executado ? undefined : 'O navegador recusou a execução da vibração.',
    );
  } catch {
    return criarResultado(false, true, false, 'Não foi possível executar a vibração.');
  }
};

export const vibrarLeve = (): MarcaeHapticResult => {
  return executarVibracaoMobile(20);
};

export const vibrarMedio = (): MarcaeHapticResult => {
  return executarVibracaoMobile(45);
};

export const vibrarForte = (): MarcaeHapticResult => {
  return executarVibracaoMobile(80);
};

export const vibrarSucesso = (): MarcaeHapticResult => {
  return executarVibracaoMobile([25, 40, 35]);
};

export const vibrarErro = (): MarcaeHapticResult => {
  return executarVibracaoMobile([80, 50, 80]);
};

export const vibrarAlerta = (): MarcaeHapticResult => {
  return executarVibracaoMobile([45, 35, 45]);
};

export const vibrarPersonalizado = (pattern: MarcaeHapticPattern): MarcaeHapticResult => {
  return executarVibracaoMobile(pattern);
};