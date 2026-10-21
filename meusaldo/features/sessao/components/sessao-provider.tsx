"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { EVENTO_SESSAO_INVALIDA, ErroHttp, novoCicloSessao } from "@/shared/lib/http";
import { sessaoApi, type Sessao, type Usuario } from "../api/sessao";

type Estado = { status: "verificando" | "autenticado" | "anonimo" | "erro"; usuario: Usuario | null; expiraEm: string | null; erro: string };
const anonimo: Estado = { status: "anonimo", usuario: null, expiraEm: null, erro: "" };
type Contexto = Estado & { entrar: (email: string, senha: string) => Promise<void>; sair: () => Promise<void>; verificar: () => Promise<void> };
const ContextoSessao = createContext<Contexto | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ ...anonimo, status: "verificando" });
  const sequencia = useRef(0);
  const canal = useRef<BroadcastChannel | null>(null);

  const invalidar = useCallback(() => {
    sequencia.current += 1;
    novoCicloSessao();
    setEstado(anonimo);
  }, []);
  const autenticar = useCallback((sessao: Sessao) => {
    sequencia.current += 1;
    novoCicloSessao();
    setEstado({ status: "autenticado", ...sessao, erro: "" });
  }, []);
  const consultar = useCallback((signal?: AbortSignal) => {
    const atual = ++sequencia.current;
    novoCicloSessao();
    return sessaoApi.consultar(signal).then(sessao => {
      if (!signal?.aborted && atual === sequencia.current) autenticar(sessao);
    }).catch((erro: unknown) => {
      if (signal?.aborted || atual !== sequencia.current) return;
      if (erro instanceof ErroHttp && erro.status === 401) invalidar();
      else setEstado({ ...anonimo, status: "erro", erro: "Não foi possível verificar a sessão. Confira a API e tente novamente." });
    });
  }, [autenticar, invalidar]);

  const verificar = useCallback(() => {
    setEstado(anterior => ({ ...anterior, status: "verificando", erro: "" }));
    return consultar();
  }, [consultar]);

  useEffect(() => {
    const controlador = new AbortController();
    window.addEventListener(EVENTO_SESSAO_INVALIDA, invalidar);
    const comunicacao = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("meusaldo-sessao") : null;
    canal.current = comunicacao;
    if (comunicacao) comunicacao.onmessage = () => { void verificar(); };
    const visibilidade = () => { if (document.visibilityState === "visible") void verificar(); };
    const retorno = (evento: PageTransitionEvent) => { if (evento.persisted) void verificar(); };
    document.addEventListener("visibilitychange", visibilidade);
    window.addEventListener("pageshow", retorno);
    void consultar(controlador.signal);
    return () => {
      controlador.abort();
      window.removeEventListener(EVENTO_SESSAO_INVALIDA, invalidar);
      document.removeEventListener("visibilitychange", visibilidade);
      window.removeEventListener("pageshow", retorno);
      comunicacao?.close();
      canal.current = null;
    };
  }, [consultar, invalidar, verificar]);

  useEffect(() => {
    if (estado.status !== "autenticado" || !estado.expiraEm) return;
    const timer = window.setTimeout(invalidar, Math.max(0, new Date(estado.expiraEm).getTime() - Date.now()));
    return () => window.clearTimeout(timer);
  }, [estado.status, estado.expiraEm, invalidar]);

  async function entrar(email: string, senha: string) {
    sequencia.current += 1;
    novoCicloSessao();
    autenticar(await sessaoApi.entrar(email, senha));
    canal.current?.postMessage("alterada");
  }
  async function sair() {
    sequencia.current += 1;
    novoCicloSessao();
    setEstado({ ...anonimo, status: "verificando" });
    try {
      await sessaoApi.sair();
    } catch (erro) {
      if (!(erro instanceof ErroHttp && erro.status === 401)) {
        setEstado({ ...anonimo, status: "erro", erro: "Não foi possível confirmar o logout. A sessão pode continuar ativa. Verifique a conexão e tente novamente." });
        throw erro;
      }
    }
    invalidar();
    canal.current?.postMessage("alterada");
  }

  return <ContextoSessao.Provider value={{ ...estado, entrar, sair, verificar }}>{children}</ContextoSessao.Provider>;
}

export function useSessao() {
  const contexto = useContext(ContextoSessao);
  if (!contexto) throw new Error("useSessao exige SessaoProvider.");
  return contexto;
}
