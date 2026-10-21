"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
  { href: "/saldo", titulo: "Resumo" },
  { href: "/receitas", titulo: "Receitas" },
  { href: "/despesas", titulo: "Despesas" },
];

export function Navegacao() {
  const caminho = usePathname();

  return (
    <nav aria-label="Navegação principal">
      <ul className="flex flex-wrap gap-1">
        {itens.map(({ href, titulo }) => {
          const ativo = caminho === href || caminho.startsWith(`${href}/`);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-md border px-3 py-2 text-sm ${
                  ativo
                    ? "border-blue-200 bg-blue-50 font-semibold text-blue-800"
                    : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {titulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
