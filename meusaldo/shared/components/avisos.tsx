"use client";

import { useEffect, useRef, useState } from "react";
import { Folha } from "./folha";
import { Icone } from "./icone";

type Tom = "sucesso" | "erro" | "info";
type Aviso = { id: number; texto: string; tom: Tom; saindo?: boolean };
type Pedido = { titulo: string; texto: string; acao: string; perigo?: boolean; responder: (sim: boolean) => void };

const EVENTO_AVISO = "meusaldo:aviso";
const EVENTO_CONFIRMAR = "meusaldo:confirmar";
const DURACAO_MS = 3500;

/** Mostra um aviso flutuante que some sozinho. */
export function avisar(texto: string, tom: Tom = "sucesso") {
  window.dispatchEvent(new CustomEvent(EVENTO_AVISO, { detail: { texto, tom } }));
}

/** Substitui window.confirm por uma folha do app; resolve true só se a pessoa confirmar. */
export function confirmar(pedido: Omit<Pedido, "responder">) {
  return new Promise<boolean>(responder => window.dispatchEvent(new CustomEvent(EVENTO_CONFIRMAR, { detail: { ...pedido, responder } })));
}

const ESTILO: Record<Tom, [string, "ok" | "alerta" | "sino"]> = {
  sucesso: ["bg-emerald-500", "ok"],
  erro: ["bg-red-500", "alerta"],
  info: ["bg-blue-500", "sino"],
};

/** Hospeda avisos e confirmações; montado uma vez no layout. */
export function Avisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [perguntando, setPerguntando] = useState(false);
  const contador = useRef(0);

  useEffect(() => {
    const novoAviso = (evento: Event) => {
      const { texto, tom } = (evento as CustomEvent<Omit<Aviso, "id">>).detail;
      const id = ++contador.current;
      setAvisos(lista => [...lista.slice(-2), { id, texto, tom }]);
      setTimeout(() => setAvisos(lista => lista.map(aviso => aviso.id === id ? { ...aviso, saindo: true } : aviso)), DURACAO_MS);
      setTimeout(() => setAvisos(lista => lista.filter(aviso => aviso.id !== id)), DURACAO_MS + 300);
    };
    const novoPedido = (evento: Event) => {
      setPedido((evento as CustomEvent<Pedido>).detail);
      setPerguntando(true);
    };
    window.addEventListener(EVENTO_AVISO, novoAviso);
    window.addEventListener(EVENTO_CONFIRMAR, novoPedido);
    return () => {
      window.removeEventListener(EVENTO_AVISO, novoAviso);
      window.removeEventListener(EVENTO_CONFIRMAR, novoPedido);
    };
  }, []);

  function responder(sim: boolean) {
    if (perguntando) pedido?.responder(sim);
    setPerguntando(false);
  }

  return <>
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex flex-col items-center gap-2 px-4">
      {avisos.map(aviso => <p key={aviso.id} className={`flex max-w-md items-center gap-2.5 rounded-full bg-slate-900/95 py-2.5 pr-5 pl-2.5 text-sm font-medium text-white shadow-xl shadow-slate-900/20 backdrop-blur transition-all duration-300 ${aviso.saindo ? "-translate-y-3 opacity-0" : "animate-descer"}`}>
        <span className={`grid size-7 shrink-0 place-items-center rounded-full text-white ${ESTILO[aviso.tom][0]}`}><Icone nome={ESTILO[aviso.tom][1]} className="size-4" /></span>
        {aviso.texto}
      </p>)}
    </div>
    <Folha aberta={perguntando} onFechar={() => responder(false)} titulo={pedido?.titulo}>
      <p className="text-slate-600">{pedido?.texto}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" className="botao-secundario min-h-12" onClick={() => responder(false)}>Cancelar</button>
        <button type="button" data-autofoco className={`botao-primario min-h-12 ${pedido?.perigo ? "border-red-600 bg-red-600 hover:bg-red-700" : ""}`} onClick={() => responder(true)}>{pedido?.acao}</button>
      </div>
    </Folha>
  </>;
}
