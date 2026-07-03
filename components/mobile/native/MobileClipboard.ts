export type MarcaeClipboardResult = {
  sucesso: boolean;
  mensagem: string;
  valor?: string;
};

function possuiWindow() {
  return typeof window !== 'undefined';
}

function normalizarTexto(valor: string) {
  return valor.trim();
}

function limparNumeros(valor: string) {
  return valor.replace(/\D/g, '');
}

async function copiarComFallback(valor: string): Promise<boolean> {
  if (!possuiWindow()) return false;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(valor);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = valor;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const sucesso = document.execCommand('copy');

  document.body.removeChild(textarea);

  return sucesso;
}

export async function copiarTextoMobile(
  valor: string,
  mensagemSucesso = 'Copiado com sucesso.',
): Promise<MarcaeClipboardResult> {
  const texto = normalizarTexto(valor);

  if (!texto) {
    return {
      sucesso: false,
      mensagem: 'Não há conteúdo para copiar.',
    };
  }

  try {
    const sucesso = await copiarComFallback(texto);

    return {
      sucesso,
      mensagem: sucesso ? mensagemSucesso : 'Não foi possível copiar.',
      valor: texto,
    };
  } catch {
    return {
      sucesso: false,
      mensagem: 'Não foi possível copiar.',
    };
  }
}

export async function copiarCpfMobile(cpf: string) {
  const valor = limparNumeros(cpf);

  return copiarTextoMobile(valor, 'CPF copiado.');
}

export async function copiarTelefoneMobile(telefone: string) {
  const valor = limparNumeros(telefone);

  return copiarTextoMobile(valor, 'Telefone copiado.');
}

export async function copiarEmailMobile(email: string) {
  return copiarTextoMobile(email, 'E-mail copiado.');
}

export async function copiarLinkMobile(url: string) {
  return copiarTextoMobile(url, 'Link copiado.');
}

export async function copiarPixMobile(codigoPix: string) {
  return copiarTextoMobile(codigoPix, 'Código PIX copiado.');
}

export async function copiarChavePixMobile(chavePix: string) {
  return copiarTextoMobile(chavePix, 'Chave PIX copiada.');
}

export async function copiarCodigoConfirmacaoMobile(codigo: string) {
  return copiarTextoMobile(codigo, 'Código de confirmação copiado.');
}

export async function lerClipboardMobile(): Promise<MarcaeClipboardResult> {
  if (!possuiWindow()) {
    return {
      sucesso: false,
      mensagem: 'Clipboard indisponível neste ambiente.',
    };
  }

  try {
    if (!navigator.clipboard?.readText) {
      return {
        sucesso: false,
        mensagem: 'Leitura do clipboard indisponível.',
      };
    }

    const valor = await navigator.clipboard.readText();

    return {
      sucesso: Boolean(valor),
      mensagem: valor ? 'Conteúdo lido com sucesso.' : 'Clipboard vazio.',
      valor,
    };
  } catch {
    return {
      sucesso: false,
      mensagem: 'Não foi possível ler o clipboard.',
    };
  }
}