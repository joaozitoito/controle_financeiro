"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icone } from "@/shared/components/icone";
import { Navegacao } from "@/shared/components/navegacao";
import { TempoReal } from "@/shared/components/tempo-real";
import { useSessao } from "./sessao-provider";

const logo = <Link href="/saldo" className="flex min-h-11 items-center gap-2.5 rounded text-xl font-bold tracking-tight text-blue-700">
  <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white"><Icone nome="alta" className="size-5" /></span>
  meusaldo
</Link>;

export function CabecalhoSessao() {
  const { status, usuario, sair } = useSessao();
  const [erro, setErro] = useState("");
  const caminho = usePathname();

  if (status === "autenticado" && usuario) {
    const botaoSair = <button type="button" aria-label="Sair" title="Sair" className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900" onClick={async () => { setErro(""); try { await sair(); } catch { setErro("Logout não confirmado. Verifique a sessão antes de continuar."); } }}>
      <Icone nome="sair" />
    </button>;
    const iniciais = usuario.nome.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]).join("").toUpperCase();
    return <header data-lateral className="w-full lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:mx-0 lg:flex-1 lg:flex-col lg:items-stretch lg:gap-8 lg:px-5 lg:py-6">
        <div className="flex-1 lg:flex-none">{logo}</div>
        <Navegacao />
        <div className="flex items-center gap-1 lg:hidden">
          <span className="grid size-9 place-items-center rounded-full bg-white text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200" title={usuario.nome} aria-hidden="true">{iniciais}</span>
          {botaoSair}
        </div>
      </div>
      <div className="hidden items-center gap-3 border-t border-slate-200 px-5 py-4 lg:flex">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600" aria-hidden="true">{iniciais}</span>
        <p className="min-w-0 flex-1 text-sm"><span className="block truncate font-medium">{usuario.nome}</span><span className="block truncate text-xs text-slate-500">{usuario.email}</span></p>
        {botaoSair}
      </div>
      {erro && <p role="alert" className="px-4 pt-3 text-sm text-red-800 lg:px-5 lg:pb-3">{erro}</p>}
      <TempoReal usuarioId={usuario.id} />
    </header>;
  }

  // Login e cadastro já mostram a marca; o cabeçalho seria repetido.
  if (caminho === "/login" || caminho === "/registro") return null;

  return <header className="w-full">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      {logo}
      {status === "verificando" ? <p role="status" className="text-sm text-slate-600">Verificando sessão…</p> : <nav aria-label="Acesso à conta" className="flex flex-wrap gap-3"><Link href="/login" className="botao-secundario">Entrar</Link><Link href="/registro" className="botao-primario">Criar conta</Link></nav>}
    </div>
  </header>;
}

/** Saudação com o primeiro nome; vazia enquanto a sessão não está carregada. */
export function Saudacao() {
  const { usuario } = useSessao();
  return usuario ? <>Olá, {usuario.nome.split(/\s+/)[0]}</> : null;
}
