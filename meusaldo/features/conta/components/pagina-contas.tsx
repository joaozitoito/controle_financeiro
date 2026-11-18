"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PaginaFeature } from "@/shared/components/pagina-feature";
import { SeletorMes } from "@/shared/components/seletor-mes";
import { COR_TOM, DataQuadrada } from "@/shared/components/data-quadrada";
import { ErroHttp } from "@/shared/lib/http";
import { CATEGORIAS } from "@/shared/lib/categorias";
import { EVENTO_CONTAS_ALTERADAS } from "@/shared/lib/contas-api";
import { situacaoConta, totaisContas, type Conta } from "@/shared/lib/contas";
import { formatarMoeda, validarFormulario, type FormularioLancamento } from "@/shared/lib/financeiro";
import { hojeLocal, mesAtual, nomeMes } from "@/shared/lib/periodo";
import { contasApi, listarContas } from "../api/contas";

// O formulário usa o campo "data" do lançamento para reaproveitar validarFormulario; ao enviar vira "vencimento".
const vazio: FormularioLancamento = { descricao: "", valor: "", categoria: "", data: "" };
const CAMPOS = [["descricao", "Descrição", "text"], ["valor", "Valor (R$)", "text"], ["categoria", "Categoria", "text"], ["data", "Vencimento", "date"]] as const;

export function PaginaContas() {
  const [mes, setMes] = useState(mesAtual);
  const [contas, setContas] = useState<Conta[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [formulario, setFormulario] = useState(vazio);
  const [editando, setEditando] = useState<number>();
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erroOperacao, setErroOperacao] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const ocupado = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const hoje = hojeLocal();

  useEffect(() => {
    const controlador = new AbortController();
    listarContas({ mes }, controlador.signal).then(lista => {
      if (controlador.signal.aborted) return;
      setContas(lista);
      setCarregando(false);
    }).catch((erro: unknown) => {
      if (controlador.signal.aborted) return;
      setErroLista(erro instanceof ErroHttp ? erro.message : "Não foi possível carregar as contas.");
      setCarregando(false);
    });
    return () => controlador.abort();
  }, [mes, revisao]);

  function recarregar(proximoMes = mes) {
    setCarregando(true);
    setErroLista("");
    setMes(proximoMes);
    setRevisao(valor => valor + 1);
  }

  function focar(nome: string) {
    const elemento = formRef.current?.elements.namedItem(nome);
    if (elemento instanceof HTMLElement) elemento.focus();
  }

  function limparEdicao() {
    setFormulario(vazio);
    setEditando(undefined);
    setCampos({});
    setErroOperacao("");
  }

  /** Executa uma mutação por vez, recarrega a lista e avisa a navegação. */
  async function operar(acao: () => Promise<unknown>, mensagem: string) {
    if (ocupado.current) return false;
    ocupado.current = true;
    setEnviando(true);
    setErroOperacao("");
    setSucesso("");
    try {
      await acao();
      setSucesso(mensagem);
      window.dispatchEvent(new Event(EVENTO_CONTAS_ALTERADAS));
      recarregar();
      return true;
    } catch (erro) {
      setErroOperacao(erro instanceof ErroHttp ? erro.message : "Não foi possível concluir a operação.");
      if (erro instanceof ErroHttp) {
        const { vencimento, ...resto } = erro.campos;
        setCampos(vencimento ? { ...resto, data: vencimento } : resto);
      }
      return false;
    } finally {
      ocupado.current = false;
      setEnviando(false);
    }
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const validacao = validarFormulario(formulario);
    setCampos(validacao.campos);
    if (!validacao.dados) {
      focar(Object.keys(validacao.campos)[0]);
      return;
    }
    const { data, ...dados } = validacao.dados;
    if (await operar(() => contasApi.salvar({ ...dados, vencimento: data }, editando), `Conta ${editando ? "atualizada" : "cadastrada"} com sucesso.`)) limparEdicao();
  }

  function editar(conta: Conta) {
    if (ocupado.current) return;
    setEditando(conta.id);
    setFormulario({ descricao: conta.descricao, valor: String(conta.valor).replace(".", ","), categoria: conta.categoria, data: conta.vencimento.slice(0, 10) });
    setCampos({});
    setErroOperacao("");
    setSucesso("");
    focar("descricao");
  }

  function pagar(conta: Conta) {
    if (!window.confirm(`Marcar “${conta.descricao}” de ${formatarMoeda(conta.valor)} como paga? Uma despesa com a data de hoje será registrada.`)) return;
    void operar(() => contasApi.pagar(conta.id), `“${conta.descricao}” paga. A despesa foi registrada.`);
  }

  function excluir(conta: Conta) {
    if (!window.confirm(`Excluir a conta “${conta.descricao}” de ${formatarMoeda(conta.valor)}? Esta ação não pode ser desfeita.`)) return;
    void operar(async () => {
      await contasApi.excluir(conta.id);
      if (editando === conta.id) limparEdicao();
    }, "Conta excluída com sucesso.");
  }

  const totais = contas && totaisContas(contas);

  return (
    <PaginaFeature titulo="Contas a pagar" descricao="Cadastre vencimentos e marque como paga: a despesa é registrada automaticamente.">
      <div className="flex flex-wrap items-center gap-2">
        <SeletorMes mes={mes} onMudar={recarregar} />
        <button type="button" className="botao-secundario rounded-xl" disabled={carregando} onClick={() => recarregar()}>Atualizar</button>
      </div>

      {sucesso && <p role="status" className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{sucesso}</p>}
      {erroOperacao && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{erroOperacao}</p>}

      <section id="formulario" aria-labelledby="titulo-formulario-conta" className="rounded-2xl border border-slate-200/80 border-t-4 border-t-orange-500 bg-white p-5 shadow-sm sm:p-6">
        <h2 id="titulo-formulario-conta" className="mb-4 text-lg font-semibold">{editando ? "Editar conta" : "Nova conta"}</h2>
        <form ref={formRef} onSubmit={salvar} noValidate autoComplete="off" aria-busy={enviando}>
          <fieldset disabled={enviando} className="grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">Dados da conta</legend>
            {CAMPOS.map(([nome, rotulo, tipo]) => {
              const comum = {
                id: `conta-${nome}`, name: nome, required: true, className: "campo", value: formulario[nome],
                "aria-invalid": Boolean(campos[nome]),
                "aria-describedby": campos[nome] ? `conta-${nome}-erro` : undefined,
                onChange: (evento: { target: { value: string } }) => {
                  setFormulario(anterior => ({ ...anterior, [nome]: evento.target.value }));
                  setCampos(anterior => ({ ...anterior, [nome]: "" }));
                },
              };
              return <div key={nome} className="min-w-0 space-y-1.5">
                <label htmlFor={`conta-${nome}`} className="block text-sm font-medium">{rotulo} <span className="text-slate-500">(obrigatório)</span></label>
                {nome === "categoria"
                  ? <select {...comum}>
                    <option value="">Selecione</option>
                    {CATEGORIAS.map(categoria => <option key={categoria.nome}>{categoria.nome}</option>)}
                    {formulario.categoria && !CATEGORIAS.some(categoria => categoria.nome === formulario.categoria) && <option>{formulario.categoria}</option>}
                  </select>
                  : <input {...comum} type={tipo} inputMode={nome === "valor" ? "decimal" : undefined} maxLength={nome === "descricao" ? 100 : undefined} />}
                {campos[nome] && <p id={`conta-${nome}-erro`} role="alert" className="text-sm text-red-800">{campos[nome]}</p>}
              </div>;
            })}
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button type="submit" className="botao-primario">{enviando ? "Aguarde…" : editando ? "Salvar alterações" : "Cadastrar conta"}</button>
              {editando && <button type="button" className="botao-secundario" onClick={() => { limparEdicao(); focar("descricao"); }}>Cancelar edição</button>}
            </div>
          </fieldset>
        </form>
      </section>

      <section aria-labelledby="titulo-lista-contas" aria-busy={carregando} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 id="titulo-lista-contas" className="text-lg font-semibold">Vencimentos de {nomeMes(mes).toLowerCase()}</h2>
        {carregando && <p role="status" className="text-sm text-slate-600">Carregando contas…</p>}
        {erroLista && <div role="alert" className="space-y-3 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900"><p>{erroLista}</p><button type="button" className="botao-secundario" onClick={() => recarregar()}>Tentar novamente</button></div>}
        {!carregando && !erroLista && contas && totais && <>
          <div>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span><span className="mr-1.5 inline-block size-2 rounded-full bg-blue-600" aria-hidden="true" />Pago <strong className="tabular-nums">{formatarMoeda(totais.pago)}</strong></span>
              <span><span className="mr-1.5 inline-block size-2 rounded-full bg-red-500" aria-hidden="true" />Em aberto <strong className="tabular-nums">{formatarMoeda(totais.aberto)}</strong></span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-red-100" role="progressbar" aria-label="Contas pagas no mês" aria-valuenow={totais.percentualPago} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${totais.percentualPago}%` }} />
            </div>
          </div>
          {contas.length === 0
            ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">Nenhuma conta vence neste mês. Use o formulário acima para cadastrar.</p>
            : <ul aria-label="Contas do mês" className="divide-y divide-slate-100">
              {contas.map(conta => {
                const { texto, tom } = situacaoConta(conta, hoje);
                return <li key={conta.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <DataQuadrada data={conta.vencimento} tom={tom} />
                    <div className="min-w-0">
                      <p className="font-medium [overflow-wrap:anywhere]">{conta.descricao}</p>
                      <p className="text-sm text-slate-500"><span className={COR_TOM[tom]}>{texto}</span> · {conta.categoria}</p>
                    </div>
                    <p className="ml-auto shrink-0 font-semibold tabular-nums">{formatarMoeda(conta.valor)}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!conta.pagaEm && <button type="button" className="botao-primario" disabled={enviando} aria-label={`Marcar como paga: ${conta.descricao}`} onClick={() => pagar(conta)}>Marcar como paga</button>}
                    <button type="button" className="botao-secundario" disabled={enviando} aria-label={`Editar conta: ${conta.descricao}`} onClick={() => editar(conta)}>Editar</button>
                    <button type="button" className="botao-secundario text-red-800" disabled={enviando} aria-label={`Excluir conta: ${conta.descricao}`} onClick={() => excluir(conta)}>Excluir</button>
                  </div>
                </li>;
              })}
            </ul>}
        </>}
      </section>
    </PaginaFeature>
  );
}
