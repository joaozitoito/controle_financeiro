"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ErroHttp } from "@/shared/lib/http";
import { consultarSaldo } from "@/shared/lib/saldo-api";
import { formatarData, formatarMoeda, validarFormulario, type ApiLancamentos, type FormularioLancamento, type Lancamento, type Totais } from "@/shared/lib/financeiro";

const vazio: FormularioLancamento = { descricao: "", valor: "", categoria: "", data: "" };

export function GerenciadorLancamentos({ tipo, api }: { tipo: "receita" | "despesa"; api: ApiLancamentos }) {
  const [formulario, setFormulario] = useState(vazio);
  const [editando, setEditando] = useState<number>();
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erroOperacao, setErroOperacao] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const ocupado = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [campoFoco, setCampoFoco] = useState("");
  const [filtroDigitado, setFiltroDigitado] = useState("");
  const [filtro, setFiltro] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [consulta, setConsulta] = useState<{ lista: Lancamento[]; totais: Totais } | null>(null);
  const titulo = tipo === "receita" ? "Receitas" : "Despesas";

  useEffect(() => {
    if (enviando || !campoFoco) return;
    const elemento = formRef.current?.elements.namedItem(campoFoco);
    if (elemento instanceof HTMLElement) elemento.focus();
  }, [campoFoco, enviando]);

  useEffect(() => {
    const controlador = new AbortController();
    Promise.all([api.listar(filtro, controlador.signal), consultarSaldo(controlador.signal)])
      .then(([lista, totais]) => {
        if (controlador.signal.aborted) return;
        setConsulta({ lista, totais });
        setCarregando(false);
      })
      .catch((erro: unknown) => {
        if (controlador.signal.aborted) return;
        setErroLista(erro instanceof ErroHttp ? erro.message : "Não foi possível carregar os lançamentos.");
        setCarregando(false);
      });
    return () => controlador.abort();
  }, [api, filtro, revisao]);

  function recarregar() {
    setCarregando(true);
    setErroLista("");
    setRevisao(valor => valor + 1);
  }

  function focar(nome: string) {
    const elemento = formRef.current?.elements.namedItem(nome);
    if (elemento instanceof HTMLElement) elemento.focus();
  }

  function falha(erro: unknown) {
    setErroOperacao(erro instanceof ErroHttp ? erro.message : "Não foi possível concluir a operação.");
    if (erro instanceof ErroHttp) {
      setCampos(erro.campos);
      setCampoFoco(Object.keys(erro.campos)[0] ?? "descricao");
    }
  }

  function limparEdicao() {
    setFormulario(vazio);
    setEditando(undefined);
    setCampos({});
    setErroOperacao("");
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado.current) return;
    const validacao = validarFormulario(formulario);
    setCampos(validacao.campos);
    setErroOperacao("");
    setSucesso("");
    if (!validacao.dados) {
      focar(Object.keys(validacao.campos)[0]);
      return;
    }
    ocupado.current = true;
    setEnviando(true);
    try {
      await api.salvar(validacao.dados, editando);
      setSucesso(`${tipo === "receita" ? "Receita" : "Despesa"} ${editando ? "atualizada" : "cadastrada"} com sucesso.`);
      limparEdicao();
      recarregar();
    } catch (erro) {
      falha(erro);
    } finally {
      ocupado.current = false;
      setEnviando(false);
    }
  }

  function editar(item: Lancamento) {
    if (ocupado.current) return;
    setEditando(item.id);
    setFormulario({ descricao: item.descricao, valor: String(item.valor).replace(".", ","), categoria: item.categoria, data: item.data.slice(0, 10) });
    setCampos({});
    setErroOperacao("");
    setSucesso("");
    focar("descricao");
  }

  async function excluir(item: Lancamento) {
    if (ocupado.current || !window.confirm(`Excluir ${tipo} “${item.descricao}” de ${formatarMoeda(item.valor)}? Esta ação não pode ser desfeita.`)) return;
    ocupado.current = true;
    setEnviando(true);
    setErroOperacao("");
    setSucesso("");
    try {
      await api.excluir(item.id);
      if (editando === item.id) limparEdicao();
      setSucesso(`${tipo === "receita" ? "Receita" : "Despesa"} excluída com sucesso.`);
      recarregar();
    } catch (erro) {
      falha(erro);
    } finally {
      ocupado.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      {sucesso && <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{sucesso}</p>}
      {erroOperacao && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{erroOperacao} Os campos digitados foram preservados.</p>}

      <section id="formulario" aria-labelledby="titulo-formulario" className={`rounded-lg border border-slate-200 border-t-4 bg-white p-5 sm:p-6 ${tipo === "receita" ? "border-t-emerald-700" : "border-t-red-700"}`}>
        <h2 id="titulo-formulario" className="mb-4 text-lg font-semibold">{editando ? `Editar ${tipo}` : `Nova ${tipo}`}</h2>
        <form ref={formRef} onSubmit={salvar} noValidate autoComplete="off" aria-busy={enviando}>
          <fieldset disabled={enviando} className="grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">Dados da {tipo}</legend>
            {([
              ["descricao", "Descrição", "text"], ["valor", "Valor (R$)", "text"],
              ["categoria", "Categoria", "text"], ["data", "Data", "date"],
            ] as const).map(([nome, label, inputType]) => (
              <div key={nome} className="min-w-0 space-y-1.5">
                <label htmlFor={`${tipo}-${nome}`} className="block text-sm font-medium">{label} <span className="text-slate-500">(obrigatório)</span></label>
                <input
                  id={`${tipo}-${nome}`} name={nome} type={inputType} required
                  className="campo" value={formulario[nome]}
                  inputMode={nome === "valor" ? "decimal" : undefined}
                  maxLength={nome === "descricao" ? 100 : nome === "categoria" ? 60 : undefined}
                  min={nome === "data" ? "0001-01-01" : undefined} max={nome === "data" ? "9999-12-31" : undefined}
                  aria-invalid={Boolean(campos[nome])}
                  aria-describedby={[nome === "valor" ? "ajuda-valor" : "", campos[nome] ? `${tipo}-${nome}-erro` : ""].filter(Boolean).join(" ") || undefined}
                  onChange={evento => {
                    setFormulario(anterior => ({ ...anterior, [nome]: evento.target.value }));
                    setCampos(anterior => ({ ...anterior, [nome]: "" }));
                  }}
                />
                {nome === "valor" && <p id="ajuda-valor" className="text-xs leading-5 text-slate-600">Ex.: 1250,90. Até duas casas decimais, sem ponto de milhar.</p>}
                {campos[nome] && <p id={`${tipo}-${nome}-erro`} role="alert" className="text-sm text-red-800">{campos[nome]}</p>}
              </div>
            ))}
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button type="submit" className="botao-primario">{enviando ? "Aguarde…" : editando ? "Salvar alterações" : `Cadastrar ${tipo}`}</button>
              {editando && <button type="button" className="botao-secundario" onClick={() => { limparEdicao(); focar("descricao"); }}>Cancelar edição</button>}
            </div>
          </fieldset>
        </form>
      </section>

      <section aria-labelledby="titulo-lista" aria-busy={carregando} className="space-y-4">
        <h2 id="titulo-lista" className="text-lg font-semibold">{titulo} registradas</h2>
        <form autoComplete="off" onSubmit={evento => { evento.preventDefault(); setFiltro(filtroDigitado.trim()); recarregar(); }}>
          <fieldset disabled={enviando || carregando} className="flex flex-wrap items-end gap-3">
            <legend className="sr-only">Filtrar {titulo.toLowerCase()}</legend>
            <div className="min-w-0 flex-1 space-y-1.5">
              <label htmlFor="filtro-categoria" className="block text-sm font-medium">Filtrar por categoria</label>
              <input id="filtro-categoria" name="categoria" className="campo" value={filtroDigitado} maxLength={60} onChange={evento => setFiltroDigitado(evento.target.value)} />
            </div>
            <button className="botao-secundario" type="submit">Filtrar</button>
            {filtro && <button className="botao-secundario" type="button" onClick={() => { setFiltro(""); setFiltroDigitado(""); recarregar(); }}>Limpar filtro</button>}
          </fieldset>
        </form>
        {filtro && <p className="break-words text-sm text-slate-600">Categoria exata: <strong>{filtro}</strong></p>}
        {carregando && <p role="status" className="py-4 text-sm text-slate-600">Carregando {titulo.toLowerCase()}…</p>}
        {erroLista && <div role="alert" className="space-y-3 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900"><p>{erroLista}</p><button type="button" className="botao-secundario" disabled={enviando} onClick={recarregar}>Tentar novamente</button></div>}
        {!carregando && !erroLista && consulta && <>
          <dl className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <div><dt className="text-sm text-slate-600">Total de {titulo.toLowerCase()} (geral)</dt><dd className="mt-1 font-semibold tabular-nums">{formatarMoeda(tipo === "receita" ? consulta.totais.totalReceitas : consulta.totais.totalDespesas)}</dd></div>
            <div><dt className="text-sm text-slate-600">Saldo geral (todas as categorias)</dt><dd className="mt-1 font-semibold tabular-nums">{formatarMoeda(consulta.totais.saldo)}</dd></div>
          </dl>
          {consulta.lista.length === 0
            ? <p className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-600">{filtro ? `Nenhuma ${tipo} nesta categoria. Limpe o filtro para ver todos os registros.` : `Nenhuma ${tipo} cadastrada. Use o formulário acima para começar.`}</p>
            : <ul aria-label={`Lista de ${titulo.toLowerCase()}`} className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {consulta.lista.map(item => <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium [overflow-wrap:anywhere]">{item.descricao}</p>
                  <p className="mt-1 text-sm text-slate-600 [overflow-wrap:anywhere]">{item.categoria} <span aria-hidden="true"> / </span><time dateTime={item.data.slice(0, 10)}>{formatarData(item.data)}</time></p>
                </div>
                <p className={`shrink-0 font-semibold tabular-nums ${tipo === "receita" ? "text-emerald-800" : "text-red-800"}`}>{formatarMoeda(item.valor)}</p>
                <div className="flex shrink-0 gap-2">
                  <button type="button" className="botao-secundario" disabled={enviando} aria-label={`Editar ${tipo}: ${item.descricao}`} onClick={() => editar(item)}>Editar</button>
                  <button type="button" className="botao-secundario text-red-800" disabled={enviando} aria-label={`Excluir ${tipo}: ${item.descricao}`} onClick={() => excluir(item)}>Excluir</button>
                </div>
              </li>)}
            </ul>}
        </>}
      </section>
    </div>
  );
}
