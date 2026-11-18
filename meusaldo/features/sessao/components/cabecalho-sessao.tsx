"use client";

import Link from "next/link";
import { useState } from "react";
import { Icone } from "@/shared/components/icone";
import { Navegacao } from "@/shared/components/navegacao";
import { useSessao } from "./sessao-provider";

const logo = <Link href="/saldo" className="flex min-h-11 items-center gap-2.5 rounded text-xl font-bold tracking-tight text-blue-700">
  <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white"><Icone nome="alta" className="size-5" /></span>
  meusaldo
</Link>;

export function CabecalhoSessao() {
  const { status, usuario, sair } = useSessao();
  const [erro, setErro] = useState("");

  if (status === "autenticado" && usuario) {
    const iniciais = usuario.nome.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join("").toUpperCase();
    return <header data-lateral className="w-full border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-1 lg:gap-8 lg:px-5 lg:py-6">
        {logo}
        <Navegacao />
      </div>
      <div className="flex items-center gap-3 border-t border-slate-200 px-4 py-3 lg:px-5 lg:py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600" aria-hidden="true">{iniciais}</span>
        <p className="min-w-0 flex-1 text-sm"><span className="block truncate font-medium">{usuario.nome}</span><span className="block truncate text-xs text-slate-500">{usuario.email}</span></p>
        <button type="button" aria-label="Sair" title="Sair" className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={async () => { setErro(""); try { await sair(); } catch { setErro("Logout não confirmado. Verifique a sessão antes de continuar."); } }}>
          <Icone nome="sair" />
        </button>
      </div>
      {erro && <p role="alert" className="px-4 pb-3 text-sm text-red-800 lg:px-5">{erro}</p>}
    </header>;
  }

  return <header className="w-full border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
      {logo}
      {status === "verificando" ? <p role="status" className="text-sm text-slate-600">Verificando sessão…</p> : <nav aria-label="Acesso à conta" className="flex flex-wrap gap-3"><Link href="/login" className="botao-secundario">Entrar</Link><Link href="/registro" className="botao-primario">Criar conta</Link></nav>}
    </div>
  </header>;
}
