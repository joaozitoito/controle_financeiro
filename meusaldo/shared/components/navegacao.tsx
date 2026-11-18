"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "./icone";

const itens = [
  { href: "/saldo", titulo: "Visão geral", icone: "painel" },
  { href: "/receitas", titulo: "Receitas", icone: "alta" },
  { href: "/despesas", titulo: "Despesas", icone: "baixa" },
] as const;

export function Navegacao() {
  const caminho = usePathname();

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
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
