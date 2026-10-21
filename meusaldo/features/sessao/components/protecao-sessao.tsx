"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSessao } from "./sessao-provider";

export function ProtecaoSessao({ children }: { children: ReactNode }) {
  const { status, usuario, erro, verificar } = useSessao();
  const caminho = usePathname();
  const router = useRouter();
  const privada = ["/saldo", "/receitas", "/despesas"].includes(caminho);

  useEffect(() => {
    if (privada && status === "anonimo") router.replace(`/login?retorno=${encodeURIComponent(caminho + window.location.search)}`);
  }, [privada, status, caminho, router]);

  if (!privada) return children;
  if (usuario && (status === "autenticado" || status === "verificando")) return <>
    {status === "verificando" && <p role="status" className="text-sm text-slate-600">Verificando sessão…</p>}
    <div key={usuario.id} hidden={status === "verificando"} inert={status === "verificando"}>{children}</div>
  </>;
  if (status === "erro") return <div role="alert" className="space-y-4 rounded-md border border-red-300 bg-red-50 p-4 text-red-900"><p>{erro}</p><button type="button" className="botao-secundario" onClick={() => void verificar()}>Verificar sessão novamente</button></div>;
  return <p role="status" className="text-sm text-slate-600">Verificando sessão…</p>;
}
