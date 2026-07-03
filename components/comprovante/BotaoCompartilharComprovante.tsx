"use client";

import { useMemo, useState } from "react";
import { compartilharMobile } from "@/components/mobile/native/MobileShare";

type BotaoCompartilharComprovanteProps = {
  titulo: string;
  texto: string;
  url?: string;
};

function montarUrlAbsoluta(url?: string) {
  if (!url) return undefined;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (typeof window === "undefined") {
    return url;
  }

  return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function BotaoCompartilharComprovante({
  titulo,
  texto,
  url,
}: BotaoCompartilharComprovanteProps) {
  const [compartilhando, setCompartilhando] = useState(false);

  const label = useMemo(() => {
    return compartilhando ? "Preparando..." : "Compartilhar comprovante";
  }, [compartilhando]);

  async function compartilharComprovante() {
    if (compartilhando) return;

    try {
      setCompartilhando(true);

      const resultado = await compartilharMobile({
        title: titulo,
        text: texto,
        url: montarUrlAbsoluta(url),
      });

      if (!resultado.compartilhado) {
        alert(
          resultado.mensagem ||
            "Não foi possível compartilhar o comprovante neste dispositivo.",
        );
        return;
      }

      if (resultado.fallback === "clipboard") {
        alert("Comprovante copiado. Agora é só colar onde deseja enviar.");
      }
    } catch (error) {
      alert("Não foi possível compartilhar o comprovante. Tente novamente.");
    } finally {
      setCompartilhando(false);
    }
  }

  return (
    <button
      type="button"
      className="actionButton share"
      onClick={compartilharComprovante}
      disabled={compartilhando}
    >
      {label}
    </button>
  );
}
