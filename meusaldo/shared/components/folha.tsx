"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icone } from "./icone";

const FecharFolha = createContext<(() => void) | null>(null);

/** Fecha a folha em que o componente está (ou nada, fora de uma folha). */
export function useFecharFolha() {
  return useContext(FecharFolha);
}

/** Painel modal sobre <dialog>: foco preso, Esc e toque fora fecham; anima na entrada e na saída. */
export function Folha({ aberta, onFechar, titulo, children }: { aberta: boolean; onFechar: () => void; titulo: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  // O conteúdo continua montado durante a animação de saída e é recriado a cada abertura.
  const [retido, setRetido] = useState(aberta);
  const [anterior, setAnterior] = useState(aberta);
  if (aberta !== anterior) {
    setAnterior(aberta);
    if (aberta) setRetido(true);
  }

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberta && !dialogo.open) {
      dialogo.removeAttribute("data-fechando");
      dialogo.showModal();
      // showModal foca o primeiro botão (fechar); o conteúdo pode indicar um campo melhor.
      dialogo.querySelector<HTMLElement>("[data-autofoco]")?.focus();
    }
    if (!aberta && dialogo.open) {
      dialogo.setAttribute("data-fechando", "");
      // Espera a animação de saída; sem animação (movimento reduzido) o atraso é imperceptível.
      const espera = setTimeout(() => dialogo.close(), 220);
      return () => clearTimeout(espera);
    }
  }, [aberta]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className="folha"
      onClose={() => setRetido(false)}
      onCancel={evento => { evento.preventDefault(); onFechar(); }}
      onClick={evento => { if (evento.target === evento.currentTarget) onFechar(); }}
    >
      <div className="px-5 pt-3 pb-6 sm:px-7 sm:pt-6">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={id} className="text-2xl font-bold tracking-tight">{titulo}</h2>
          <button type="button" aria-label="Fechar" className="-mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-90" onClick={onFechar}>
            <Icone nome="fechar" className="size-5" />
          </button>
        </div>
        {retido && <FecharFolha.Provider value={onFechar}>{children}</FecharFolha.Provider>}
      </div>
    </dialog>
  );
}
