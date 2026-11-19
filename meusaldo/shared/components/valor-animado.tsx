"use client";

import { useEffect, useRef, useState } from "react";
import { formatarMoeda } from "@/shared/lib/financeiro";

const DURACAO_MS = 900;

/** Moeda que "conta" do valor anterior até o novo; respeita movimento reduzido. */
export function ValorAnimado({ valor }: { valor: number }) {
  const [exibido, setExibido] = useState(0);
  const anterior = useRef(0);

  useEffect(() => {
    const inicio = anterior.current;
    anterior.current = valor;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setExibido(valor);
      return;
    }
    const comeco = performance.now();
    let quadro = requestAnimationFrame(function passo(agora) {
      const progresso = Math.min(1, (agora - comeco) / DURACAO_MS);
      setExibido(inicio + (valor - inicio) * (1 - (1 - progresso) ** 4));
      if (progresso < 1) quadro = requestAnimationFrame(passo);
    });
    return () => cancelAnimationFrame(quadro);
  }, [valor]);

  // O valor final fica disponível para leitores de tela desde o início.
  return <><span aria-hidden="true">{formatarMoeda(exibido)}</span><span className="sr-only">{formatarMoeda(valor)}</span></>;
}
