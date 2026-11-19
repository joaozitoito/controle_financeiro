"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PaginaFeature } from "@/shared/components/pagina-feature";
import { avisar, confirmar } from "@/shared/components/avisos";
import { Esqueleto } from "@/shared/components/esqueleto";
import { Icone } from "@/shared/components/icone";
import { ErroHttp } from "@/shared/lib/http";
import { EVENTO_DADOS_ALTERADOS, ouvirAlteracoes } from "@/shared/lib/tempo-real";
import { conjuntaApi, type EstadoConjunta } from "../api/conjunta";

const formatarHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function PaginaConjunta() {
  const [estado, setEstado] = useState<EstadoConjunta | null>(null);
  const [erroLista, setErroLista] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [convite, setConvite] = useState<{ codigo: string; conviteExpiraEm: string } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [erroCodigo, setErroCodigo] = useState("");
  const [erroOperacao, setErroOperacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();
    conjuntaApi.consultar(controlador.signal).then(dados => {
      if (!controlador.signal.aborted) { setEstado(dados); setErroLista(""); }
    }).catch((erro: unknown) => {
      if (!controlador.signal.aborted) setErroLista(erro instanceof ErroHttp ? erro.message : "Não foi possível carregar a conta conjunta.");
    });
    return () => controlador.abort();
  }, [revisao]);

  // A outra pessoa pode entrar ou sair enquanto esta tela está aberta.
  useEffect(() => ouvirAlteracoes(() => setRevisao(valor => valor + 1)), []);

  /** Executa a ação, recarrega o estado e avisa as outras telas, que passam a ver outro dono. */
  async function executar(acao: () => Promise<unknown>, mensagem: string) {
    setEnviando(true);
    setErroOperacao("");
    try {
      await acao();
      avisar(mensagem);
      setRevisao(valor => valor + 1);
      window.dispatchEvent(new Event(EVENTO_DADOS_ALTERADOS));
      return true;
    } catch (erro) {
      if (erro instanceof ErroHttp && erro.campos.codigo) setErroCodigo(erro.campos.codigo);
      else setErroOperacao(erro instanceof ErroHttp ? erro.message : "Não foi possível concluir. Tente novamente.");
      return false;
    } finally {
      setEnviando(false);
    }
  }

  async function gerarConvite() {
    await executar(async () => setConvite(await conjuntaApi.convidar()), "Convite gerado. Envie o código para a outra pessoa.");
  }

  async function entrar(evento: FormEvent) {
    evento.preventDefault();
    setErroCodigo("");
    if (!codigo.trim()) { setErroCodigo("Informe o código recebido."); return; }
    if (await executar(() => conjuntaApi.entrar(codigo), "Pronto! Agora vocês compartilham os mesmos lançamentos.")) setCodigo("");
  }

  async function sair() {
    if (!estado?.parceiro) return;
    const texto = estado.papel === "membro"
      ? `Sair da conta conjunta de ${estado.parceiro.nome}? Você volta a ver só os seus próprios dados.`
      : `Encerrar a conta conjunta com ${estado.parceiro.nome}? Os lançamentos continuam com você.`;
    if (!await confirmar({ titulo: estado.papel === "membro" ? "Sair da conta conjunta?" : "Encerrar conta conjunta?", texto, acao: estado.papel === "membro" ? "Sair" : "Encerrar", perigo: true })) return;
    setConvite(null);
    await executar(() => conjuntaApi.sair(), "Conta conjunta encerrada.");
  }

  return (
    <PaginaFeature titulo="Conta conjunta" descricao="Compartilhe receitas, despesas, contas e planejamento com outra pessoa. As alterações de um aparecem na tela do outro na hora.">
      {erroOperacao && <p role="alert" className="animate-surgir rounded-3xl border border-red-300 bg-red-50 p-3 text-sm text-red-900">{erroOperacao}</p>}
      {!estado && !erroLista && <Esqueleto rotulo="Carregando conta conjunta…" blocos={["h-40"]} />}
      {erroLista && <div role="alert" className="space-y-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"><p>{erroLista}</p><button type="button" className="botao-secundario" onClick={() => setRevisao(valor => valor + 1)}>Tentar novamente</button></div>}

      {estado?.parceiro && <section aria-labelledby="titulo-vinculo" className="cartao animate-surgir">
        <div className="mb-4 flex -space-x-3" aria-hidden="true">
          <span className="grid size-12 place-items-center rounded-full bg-blue-600 text-white ring-4 ring-white"><Icone nome="coracao" className="size-5" /></span>
          <span className="grid size-12 place-items-center rounded-full bg-rose-100 font-semibold text-rose-600 ring-4 ring-white">{estado.parceiro.nome[0]?.toUpperCase()}</span>
        </div>
        <h2 id="titulo-vinculo" className="text-lg font-bold tracking-tight">Vocês estão conectados</h2>
        <p className="mt-1 text-sm text-slate-600">
          {estado.papel === "membro"
            ? <>Você está usando a conta de <strong>{estado.parceiro.nome}</strong> ({estado.parceiro.email}). Seus dados pessoais ficam guardados e voltam quando você sair.</>
            : <><strong>{estado.parceiro.nome}</strong> ({estado.parceiro.email}) usa a sua conta com você.</>}
        </p>
        <button type="button" className="botao-secundario mt-4" disabled={enviando} onClick={sair}>
          {estado.papel === "membro" ? "Sair da conta conjunta" : "Encerrar conta conjunta"}
        </button>
      </section>}

      {estado?.papel === "individual" && <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="titulo-convidar" className="cartao animate-surgir">
          <h2 id="titulo-convidar" className="text-lg font-bold tracking-tight">Convidar alguém</h2>
          <p className="mt-1 text-sm text-slate-600">A outra pessoa passa a ver e editar os seus lançamentos. O código vale por 24 horas e funciona uma vez.</p>
          {convite
            ? <div className="mt-4 space-y-2">
              <p className="animate-surgir select-all rounded-2xl bg-slate-100 px-4 py-3 text-center font-mono text-2xl font-semibold tracking-[0.3em]" aria-label={`Código de convite ${convite.codigo.split("").join(" ")}`}>{convite.codigo}</p>
              <p className="text-xs text-slate-500">Válido até {formatarHora(convite.conviteExpiraEm)}. Ele não aparece de novo: gere outro se perder.</p>
            </div>
            : estado.conviteExpiraEm && <p className="mt-3 text-sm text-slate-600">Há um convite ativo até {formatarHora(estado.conviteExpiraEm)}. Gerar outro cancela o anterior.</p>}
          <button type="button" className="botao-primario mt-4" disabled={enviando} onClick={gerarConvite}>{convite ? "Gerar outro código" : "Gerar código de convite"}</button>
        </section>

        <section aria-labelledby="titulo-entrar" className="cartao animate-surgir [animation-delay:80ms]">
          <h2 id="titulo-entrar" className="text-lg font-bold tracking-tight">Entrar com um código</h2>
          <p className="mt-1 text-sm text-slate-600">Use o código que a outra pessoa gerou. Enquanto estiver conectado, você vê os dados da conta dela.</p>
          <form className="mt-4 space-y-2" onSubmit={entrar} noValidate autoComplete="off" aria-busy={enviando}>
            <label htmlFor="codigo-convite" className="block text-sm font-medium">Código de convite</label>
            <input id="codigo-convite" name="codigo" className="campo w-full font-mono uppercase tracking-widest" maxLength={14} value={codigo} disabled={enviando}
              aria-invalid={Boolean(erroCodigo)} aria-describedby={erroCodigo ? "codigo-convite-erro" : undefined}
              onChange={evento => { setCodigo(evento.target.value); setErroCodigo(""); }} />
            {erroCodigo && <p id="codigo-convite-erro" className="text-sm text-red-800">{erroCodigo}</p>}
            <button type="submit" className="botao-primario" disabled={enviando}>{enviando ? "Aguarde…" : "Entrar na conta conjunta"}</button>
          </form>
        </section>
      </div>}
    </PaginaFeature>
  );
}
