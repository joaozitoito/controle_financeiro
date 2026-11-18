"use client";

import { useEffect, useState } from "react";
import { EVENTO_DADOS_ALTERADOS, abrirEventos, descreverEvento, type EventoTempoReal } from "@/shared/lib/tempo-real";

const AVISO_MS = 5000;
const NOVA_TENTATIVA_MS = 10_000;

/** Ouve /eventos enquanto há sessão: recarrega as telas e avisa o que a outra pessoa mudou. */
export function TempoReal({ usuarioId }: { usuarioId: number }) {
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let fonte: EventSource | undefined;
    let tentativa: ReturnType<typeof setTimeout> | undefined;
    let ocultar: ReturnType<typeof setTimeout> | undefined;

    function conectar() {
      fonte = abrirEventos();
      fonte.onmessage = mensagem => {
        let evento: EventoTempoReal;
        try { evento = JSON.parse(mensagem.data); } catch { return; }
        window.dispatchEvent(new CustomEvent(EVENTO_DADOS_ALTERADOS, { detail: evento }));
        if (evento.autor.id === usuarioId) return;
        setAviso(descreverEvento(evento));
        clearTimeout(ocultar);
        ocultar = setTimeout(() => setAviso(""), AVISO_MS);
      };
      // O navegador reconecta sozinho em quedas de rede; um 401 fecha de vez, então tentamos de novo mais tarde.
      fonte.onerror = () => {
        if (fonte?.readyState !== EventSource.CLOSED) return;
        tentativa = setTimeout(conectar, NOVA_TENTATIVA_MS);
      };
    }

    conectar();
    return () => {
      fonte?.close();
      clearTimeout(tentativa);
      clearTimeout(ocultar);
    };
  }, [usuarioId]);

  return <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6">
    {aviso && <p className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">{aviso}</p>}
  </div>;
}
