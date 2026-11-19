"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EVENTO_CONTAS_ALTERADAS, listarContas } from "@/shared/lib/contas-api";
import { mesAtual } from "@/shared/lib/periodo";
import { ouvirAlteracoes } from "@/shared/lib/tempo-real";
import { Icone } from "./icone";

// curto: rótulo da barra de abas no celular, onde cabem ~60px por item.
const itens = [
  { href: "/saldo", titulo: "Visão geral", curto: "Início", icone: "painel" },
  { href: "/receitas", titulo: "Receitas", curto: "Receitas", icone: "alta" },
  { href: "/despesas", titulo: "Despesas", curto: "Despesas", icone: "baixa" },
  { href: "/contas", titulo: "Contas a pagar", curto: "Contas", icone: "calendario" },
  { href: "/planejamento", titulo: "Planejamento", curto: "Metas", icone: "alvo" },
  { href: "/conjunta", titulo: "Conta conjunta", curto: "Conjunta", icone: "coracao" },
] as const;

/** Quantidade de contas em aberto que vencem no mês atual; atualiza ao navegar e após mutações. */
function useContasAbertas() {
  const caminho = usePathname();
  const [quantidade, setQuantidade] = useState(0);
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    const atualizar = () => setRevisao(valor => valor + 1);
    window.addEventListener(EVENTO_CONTAS_ALTERADAS, atualizar);
    const pararTempoReal = ouvirAlteracoes(atualizar);
    return () => {
      window.removeEventListener(EVENTO_CONTAS_ALTERADAS, atualizar);
      pararTempoReal();
    };
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    // Badge é complementar: em falha mantém o último valor em vez de mostrar erro.
    listarContas({ status: "aberta", mes: mesAtual() }, controlador.signal).then(lista => setQuantidade(lista.length)).catch(() => {});
    return () => controlador.abort();
  }, [caminho, revisao]);

  return quantidade;
}

export function Navegacao() {
  const caminho = usePathname();
  const abertas = useContasAbertas();

  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:block">Principal</p>
      <ul className="grid grid-cols-6 lg:flex lg:flex-col lg:gap-1">
        {itens.map(({ href, titulo, curto, icone }) => {
          const ativo = caminho === href || caminho.startsWith(`${href}/`);

          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3 lg:py-2 lg:text-sm ${
                  ativo
                    ? "text-blue-700 lg:bg-blue-50 lg:font-semibold"
                    : "text-slate-500 hover:text-slate-900 lg:text-slate-600 lg:hover:bg-slate-100"
                }`}
              >
                <Icone nome={icone} className="size-[22px] lg:size-4" />
                <span className="max-w-full truncate lg:hidden" aria-hidden="true">{curto}</span>
                <span className="sr-only lg:not-sr-only">{titulo}</span>
                {href === "/contas" && abertas > 0 && <span className="absolute top-1.5 left-1/2 ml-1.5 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-4 text-white lg:static lg:ml-auto lg:rounded-md lg:bg-red-50 lg:py-0.5 lg:text-xs lg:text-red-700">
                  {abertas}<span className="sr-only"> em aberto neste mês</span>
                </span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
