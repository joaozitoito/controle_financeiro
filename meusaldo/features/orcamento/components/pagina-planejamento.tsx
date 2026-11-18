"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PaginaFeature } from "@/shared/components/pagina-feature";
import { SeletorMes } from "@/shared/components/seletor-mes";
import { Icone } from "@/shared/components/icone";
import { ErroHttp } from "@/shared/lib/http";
import { CATEGORIAS, categoriaVisual } from "@/shared/lib/categorias";
import { formatarMoeda } from "@/shared/lib/financeiro";
import { COR_FAIXA, faixaOrcamento, lerLimite, type ResumoOrcamento } from "@/shared/lib/orcamento";
import { mesAtual, nomeMes } from "@/shared/lib/periodo";
import { consultarOrcamentos, salvarOrcamentos } from "../api/orcamentos";
import { ouvirAlteracoes } from "@/shared/lib/tempo-real";

const ERRO_LIMITE = "Informe um valor positivo com até duas casas, sem separador de milhar, ou deixe vazio.";

/** Texto editável de cada categoria a partir do resumo salvo (vazio = sem limite). */
function paraFormulario(resumo: ResumoOrcamento) {
  return Object.fromEntries(resumo.categorias.map(item => [item.categoria, String(item.limite).replace(".", ",")]));
}

export function PaginaPlanejamento() {
  const [mes, setMes] = useState(mesAtual);
  const [resumo, setResumo] = useState<ResumoOrcamento | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [formulario, setFormulario] = useState<Record<string, string>>({});
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erroOperacao, setErroOperacao] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const ocupado = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Uma recarga ao vivo não apaga limites digitados e ainda não salvos.
  const editado = useRef(false);

  useEffect(() => {
    const controlador = new AbortController();
    consultarOrcamentos(mes, controlador.signal).then(dados => {
      if (controlador.signal.aborted) return;
      setResumo(dados);
      if (!editado.current) setFormulario(paraFormulario(dados));
      setCarregando(false);
    }).catch((erro: unknown) => {
      if (controlador.signal.aborted) return;
      setErroLista(erro instanceof ErroHttp ? erro.message : "Não foi possível carregar o planejamento.");
      setCarregando(false);
    });
    return () => controlador.abort();
  }, [mes, revisao]);

  // Recarga silenciosa quando os dados mudam (aqui ou na conta conjunta).
  useEffect(() => ouvirAlteracoes(() => setRevisao(valor => valor + 1)), []);

  function recarregar(proximoMes = mes) {
    editado.current = false;
    setCarregando(true);
    setErroLista("");
    setCampos({});
    setSucesso("");
    setErroOperacao("");
    setMes(proximoMes);
    setRevisao(valor => valor + 1);
  }

  // Categorias fixas e, depois, limites antigos salvos com outro nome (continuam editáveis).
  const nomes = [...CATEGORIAS.map(categoria => categoria.nome as string), ...(resumo?.categorias.map(item => item.categoria).filter(nome => !CATEGORIAS.some(categoria => categoria.nome === nome)) ?? [])];
  const salvo = new Map(resumo?.categorias.map(item => [item.categoria, item]));

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado.current) return;
    const erros: Record<string, string> = {};
    const lista: { categoria: string; limite: number }[] = [];
    for (const nome of nomes) {
      const limite = lerLimite(formulario[nome] ?? "");
      if (limite === undefined) erros[nome] = ERRO_LIMITE;
      else if (limite !== null) lista.push({ categoria: nome, limite });
    }
    setCampos(erros);
    setSucesso("");
    setErroOperacao("");
    const primeiro = Object.keys(erros)[0];
    if (primeiro) {
      const elemento = formRef.current?.elements.namedItem(primeiro);
      if (elemento instanceof HTMLElement) elemento.focus();
      return;
    }
    ocupado.current = true;
    setEnviando(true);
    try {
      const dados = await salvarOrcamentos(mes, lista);
      editado.current = false;
      setResumo(dados);
      setFormulario(paraFormulario(dados));
      setSucesso("Planejamento salvo com sucesso.");
    } catch (erro) {
      setErroOperacao(erro instanceof ErroHttp ? erro.message : "Não foi possível salvar o planejamento.");
    } finally {
      ocupado.current = false;
      setEnviando(false);
    }
  }

  const geral = resumo && faixaOrcamento(resumo.gasto, resumo.limite);

  return (
    <PaginaFeature titulo="Planejamento" descricao="Defina um limite de gastos por categoria para o mês. O gasto vem das despesas registradas na mesma categoria.">
      <div className="flex flex-wrap items-center gap-2">
        <SeletorMes mes={mes} onMudar={recarregar} />
        <button type="button" className="botao-secundario rounded-xl" disabled={carregando} onClick={() => recarregar()}>Atualizar</button>
      </div>

      {sucesso && <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{sucesso}</p>}
      {erroOperacao && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{erroOperacao}</p>}
      {carregando && <p role="status" className="text-sm text-slate-600">Carregando planejamento…</p>}
      {erroLista && <div role="alert" className="space-y-3 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900"><p>{erroLista}</p><button type="button" className="botao-secundario" onClick={() => recarregar()}>Tentar novamente</button></div>}

      {!carregando && !erroLista && resumo && geral && <>
        <section aria-labelledby="titulo-resumo-orcamento" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="titulo-resumo-orcamento" className="text-sm text-slate-600">Gasto planejado de {nomeMes(mes).toLowerCase()}</h2>
          {resumo.limite > 0
            ? <>
              <p className="mt-1 flex flex-wrap items-baseline gap-2">
                <strong className="text-2xl font-bold tabular-nums tracking-tight">{formatarMoeda(resumo.gasto)}</strong>
                <span className="text-sm text-slate-500">de {formatarMoeda(resumo.limite)} planejados</span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">{geral.percentual}% usado</span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Uso do orçamento do mês" aria-valuenow={Math.min(geral.percentual, 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full ${COR_FAIXA[geral.faixa]}`} style={{ width: `${Math.min(geral.percentual, 100)}%` }} />
              </div>
            </>
            : <p className="mt-1 text-sm text-slate-500">Nenhum limite definido para este mês.</p>}
        </section>

        <section aria-labelledby="titulo-limites" className="rounded-2xl border border-slate-200/80 border-t-4 border-t-blue-600 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="titulo-limites" className="text-lg font-semibold">Limites por categoria</h2>
          <p className="mb-4 text-sm text-slate-500">Deixe vazio para não acompanhar a categoria. Salvar substitui os limites do mês.</p>
          <form ref={formRef} onSubmit={salvar} noValidate autoComplete="off" aria-busy={enviando}>
            <fieldset disabled={enviando} className="space-y-1">
              <legend className="sr-only">Limites de {nomeMes(mes)}</legend>
              <ul className="divide-y divide-slate-100">
                {nomes.map(nome => {
                  const visual = categoriaVisual(nome);
                  const item = salvo.get(nome);
                  const faixa = item && faixaOrcamento(item.gasto, item.limite);
                  const id = `limite-${nome.replace(/\W+/g, "-")}`;
                  return <li key={nome} className="grid gap-3 py-3 sm:grid-cols-[1fr_12rem] sm:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${visual.fundo}`}><Icone nome={visual.icone} /></span>
                      <div className="min-w-0 flex-1">
                        <label htmlFor={id} className="block font-medium [overflow-wrap:anywhere]">{nome}</label>
                        {item && faixa
                          ? <>
                            <p className="text-sm text-slate-500">
                              <span className="tabular-nums">{formatarMoeda(item.gasto)}</span> de <span className="tabular-nums">{formatarMoeda(item.limite)}</span> · {faixa.percentual}%
                              {faixa.rotulo && <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${faixa.faixa === "vermelho" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}>{faixa.rotulo}</span>}
                            </p>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                              <div className={`h-full rounded-full ${COR_FAIXA[faixa.faixa]}`} style={{ width: `${Math.min(faixa.percentual, 100)}%` }} />
                            </div>
                          </>
                          : <p className="text-sm text-slate-400">Sem limite</p>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <input
                        id={id} name={nome} className="campo" inputMode="decimal" placeholder="Sem limite"
                        value={formulario[nome] ?? ""}
                        aria-invalid={Boolean(campos[nome])}
                        aria-describedby={campos[nome] ? `${id}-erro` : undefined}
                        onChange={evento => {
                          const valor = evento.target.value;
                          editado.current = true;
                          setFormulario(anterior => ({ ...anterior, [nome]: valor }));
                          setCampos(anterior => ({ ...anterior, [nome]: "" }));
                        }}
                      />
                      {campos[nome] && <p id={`${id}-erro`} role="alert" className="text-sm text-red-800">{campos[nome]}</p>}
                    </div>
                  </li>;
                })}
              </ul>
              <div className="pt-3">
                <button type="submit" className="botao-primario">{enviando ? "Aguarde…" : "Salvar planejamento"}</button>
              </div>
            </fieldset>
          </form>
        </section>
      </>}
    </PaginaFeature>
  );
}
