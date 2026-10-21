"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ErroHttp } from "@/shared/lib/http";
import { sessaoApi } from "../api/sessao";
import { destinoSeguro, validarFormularioSessao, type FormularioSessao as DadosFormulario } from "../lib/validacao";
import { useSessao } from "./sessao-provider";

const vazio: DadosFormulario = { nome: "", email: "", senha: "", confirmacao: "" };

export function FormularioSessao({ modo }: { modo: "login" | "registro" }) {
  const registro = modo === "registro";
  const parametros = useSearchParams();
  const router = useRouter();
  const { status, entrar } = useSessao();
  const retorno = destinoSeguro(parametros.get("retorno"));
  const [formulario, setFormulario] = useState(vazio);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [campoFoco, setCampoFoco] = useState("");
  const ocupado = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const verificando = status === "verificando";

  useEffect(() => {
    if (status === "autenticado") router.replace(retorno);
  }, [status, retorno, router]);
  useEffect(() => {
    if (enviando || verificando || !campoFoco) return;
    const elemento = formRef.current?.elements.namedItem(campoFoco);
    if (elemento instanceof HTMLElement) elemento.focus();
  }, [campoFoco, enviando, verificando]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado.current || verificando) return;
    const validacao = validarFormularioSessao(modo, formulario);
    setCampos(validacao);
    setErro("");
    if (Object.keys(validacao).length) {
      const primeiro = formRef.current?.elements.namedItem(Object.keys(validacao)[0]);
      if (primeiro instanceof HTMLElement) primeiro.focus();
      return;
    }
    ocupado.current = true;
    setEnviando(true);
    try {
      if (registro) {
        await sessaoApi.registrar(formulario.nome.trim(), formulario.email.trim().toLowerCase(), formulario.senha);
        setFormulario(vazio);
        router.replace(`/login?cadastro=sucesso&retorno=${encodeURIComponent(retorno)}`);
      } else {
        await entrar(formulario.email.trim().toLowerCase(), formulario.senha);
        setFormulario(vazio);
      }
    } catch (falha) {
      setErro(falha instanceof ErroHttp ? falha.message : "Não foi possível concluir. Tente novamente.");
      if (falha instanceof ErroHttp) setCampos(falha.campos);
      setCampoFoco(falha instanceof ErroHttp && Object.keys(falha.campos).length ? Object.keys(falha.campos)[0] : "senha");
    } finally {
      ocupado.current = false;
      setEnviando(false);
    }
  }

  const entradas = [
    ...(registro ? [["nome", "Nome", "text", "name"] as const] : []),
    ["email", "E-mail", "email", "email"] as const,
    ["senha", "Senha", "password", registro ? "new-password" : "current-password"] as const,
    ...(registro ? [["confirmacao", "Confirmar senha", "password", "new-password"] as const] : []),
  ];

  if (status === "autenticado") return <p role="status" className="text-sm text-slate-600">Abrindo sua conta…</p>;

  return <section aria-labelledby="titulo-acesso" className="mx-auto max-w-md space-y-5 rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
    <div className="space-y-2"><h1 id="titulo-acesso" className="text-2xl font-semibold">{registro ? "Criar conta" : "Entrar no MeuSaldo"}</h1><p className="text-sm leading-6 text-slate-600">{registro ? "Crie sua conta para organizar suas próprias receitas e despesas." : "Acesse suas receitas, despesas e saldo."}</p></div>
    {!registro && parametros.get("cadastro") === "sucesso" && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">Conta criada com sucesso. Entre com seu e-mail e senha.</p>}
    {erro && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{erro}</p>}
    {verificando && <p role="status" className="text-sm text-slate-600">Verificando sessão…</p>}
    <form ref={formRef} onSubmit={enviar} noValidate aria-busy={enviando}>
      <fieldset disabled={enviando || verificando} className="space-y-4">
        <legend className="sr-only">{registro ? "Dados de cadastro" : "Dados de acesso"}</legend>
        {entradas.map(([nome, label, tipo, autocomplete]) => <div key={nome} className="space-y-1.5">
          <label htmlFor={`sessao-${nome}`} className="block text-sm font-medium">{label} <span className="text-slate-500">(obrigatório)</span></label>
          <input id={`sessao-${nome}`} name={nome} type={tipo} required autoComplete={autocomplete} className="campo" value={formulario[nome]} maxLength={nome === "nome" ? 100 : nome === "email" ? 254 : 256}
            autoCapitalize={nome === "email" ? "none" : undefined} spellCheck={nome === "email" ? false : undefined}
            aria-invalid={Boolean(campos[nome])} aria-describedby={[nome === "senha" && registro ? "ajuda-senha" : "", campos[nome] ? `sessao-${nome}-erro` : ""].filter(Boolean).join(" ") || undefined}
            onChange={evento => { setFormulario(anterior => ({ ...anterior, [nome]: evento.target.value })); setCampos(anterior => ({ ...anterior, [nome]: "" })); }} />
          {nome === "senha" && registro && <p id="ajuda-senha" className="text-xs leading-5 text-slate-600">Use de 12 a 128 caracteres. Você pode usar uma frase longa.</p>}
          {campos[nome] && <p role="alert" id={`sessao-${nome}-erro`} className="text-sm text-red-800">{campos[nome]}</p>}
        </div>)}
        <button type="submit" className="botao-primario w-full">{enviando ? "Aguarde…" : registro ? "Criar conta" : "Entrar"}</button>
      </fieldset>
    </form>
    <p className="text-sm text-slate-600">{registro ? "Já tem uma conta? " : "Ainda não tem conta? "}<Link href={`${registro ? "/login" : "/registro"}?retorno=${encodeURIComponent(retorno)}`} className="inline-flex min-h-11 items-center rounded font-medium text-blue-800 underline underline-offset-4">{registro ? "Entrar" : "Criar conta"}</Link></p>
  </section>;
}
