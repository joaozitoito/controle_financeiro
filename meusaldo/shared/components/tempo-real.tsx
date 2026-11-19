"use client";

import { useEffect } from "react";
import { avisar } from "./avisos";
import { EVENTO_DADOS_ALTERADOS, abrirEventos, descreverEvento, type EventoTempoReal } from "@/shared/lib/tempo-real";

const NOVA_TENTATIVA_MS = 10_000;

/** Ouve /eventos enquanto há sessão: recarrega as telas e avisa o que a outra pessoa mudou. */
export function TempoReal({ usuarioId }: { usuarioId: number }) {
  useEffect(() => {
    let fonte: EventSource | undefined;
    let tentativa: ReturnType<typeof setTimeout> | undefined;

    function conectar() {
      fonte = abrirEventos();
      fonte.onmessage = mensagem => {
        let evento: EventoTempoReal;
        try { evento = JSON.parse(mensagem.data); } catch { return; }
        window.dispatchEvent(new CustomEvent(EVENTO_DADOS_ALTERADOS, { detail: evento }));
        if (evento.autor.id === usuarioId) return;
        avisar(descreverEvento(evento), "info");
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
    };
  }, [usuarioId]);

  return null;
}
