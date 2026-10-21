"use client";

import Link from "next/link";
import { useState } from "react";
import { Navegacao } from "@/shared/components/navegacao";
import { useSessao } from "./sessao-provider";

export function CabecalhoSessao() {
  const { status, usuario, sair } = useSessao();
  const [erro, setErro] = useState("");

  return <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
      <Link href="/saldo" className="flex min-h-11 items-center rounded text-xl font-bold tracking-tight text-blue-800">MeuSaldo</Link>
      {status === "autenticado" && usuario ? <>
        <Navegacao />
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <p className="min-w-0 text-sm [overflow-wrap:anywhere]"><span className="block font-medium">{usuario.nome}</span><span className="text-xs text-slate-600">{usuario.email}</span></p>
          <button type="button" className="botao-secundario" onClick={async () => { setErro(""); try { await sair(); } catch { setErro("Logout não confirmado. Verifique a sessão antes de continuar."); } }}>Sair</button>
        </div>
      </> : status === "verificando" ? <p role="status" className="text-sm text-slate-600">Verificando sessão…</p> : <nav aria-label="Acesso à conta" className="flex flex-wrap gap-3"><Link href="/login" className="botao-secundario">Entrar</Link><Link href="/registro" className="botao-primario">Criar conta</Link></nav>}
      {erro && <p role="alert" className="w-full text-sm text-red-800">{erro}</p>}
    </div>
  </header>;
}
