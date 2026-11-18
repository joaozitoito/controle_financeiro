"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EVENTO_CONTAS_ALTERADAS, listarContas } from "@/shared/lib/contas-api";
import { mesAtual } from "@/shared/lib/periodo";
import { Icone } from "./icone";

const itens = [
  { href: "/saldo", titulo: "Visão geral", icone: "painel" },
  { href: "/receitas", titulo: "Receitas", icone: "alta" },
  { href: "/despesas", titulo: "Despesas", icone: "baixa" },
  { href: "/contas", titulo: "Contas a pagar", icone: "calendario" },
] as const;

/** Quantidade de contas em aberto que vencem no mês atual; atualiza ao navegar e após mutações. */
function useContasAbertas() {
  const caminho = usePathname();
  const [quantidade, setQuantidade] = useState(0);
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    const atualizar = () => setRevisao(valor => valor + 1);
    window.addEventListener(EVENTO_CONTAS_ALTERADAS, atualizar);
    return () => window.removeEventListener(EVENTO_CONTAS_ALTERADAS, atualizar);
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
    <nav aria-label="Navegação principal">
      <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:block">Principal</p>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {itens.map(({ href, titulo, icone }) => {
          const ativo = caminho === href || caminho.startsWith(`${href}/`);

          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                  ativo
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icone nome={icone} />
                {titulo}
                {href === "/contas" && abertas > 0 && <span className="ml-auto rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-700">
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
