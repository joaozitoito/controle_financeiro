"use client";

import { useEffect, useState } from "react";
import { PaginaFeature } from "@/shared/components/pagina-feature";
import { SeletorMes } from "@/shared/components/seletor-mes";
import { COR_TOM, DataQuadrada } from "@/shared/components/data-quadrada";
import { avisar, confirmar } from "@/shared/components/avisos";
import { Esqueleto } from "@/shared/components/esqueleto";
import { Folha } from "@/shared/components/folha";
import { FormularioLancamento } from "@/shared/components/formulario-lancamento";
import { Icone } from "@/shared/components/icone";
import { ValorAnimado } from "@/shared/components/valor-animado";
import { ErroHttp } from "@/shared/lib/http";
import { EVENTO_CONTAS_ALTERADAS } from "@/shared/lib/contas-api";
import { situacaoConta, totaisContas, type Conta } from "@/shared/lib/contas";
import { formatarMoeda } from "@/shared/lib/financeiro";
import { hojeLocal, mesAtual, nomeMes } from "@/shared/lib/periodo";
import { contasApi, listarContas } from "../api/contas";
import { ouvirAlteracoes } from "@/shared/lib/tempo-real";

export function PaginaContas() {
  const [mes, setMes] = useState(mesAtual);
  const [contas, setContas] = useState<Conta[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [novo, setNovo] = useState(false);
  const [editando, setEditando] = useState<Conta>();
  const [editarAberto, setEditarAberto] = useState(false);
  const [operando, setOperando] = useState<number>();
  const hoje = hojeLocal();

  useEffect(() => {
    const controlador = new AbortController();
    listarContas({ mes }, controlador.signal).then(lista => {
      if (controlador.signal.aborted) return;
      setContas(lista);
      setErroLista("");
      setCarregando(false);
    }).catch((erro: unknown) => {
      if (controlador.signal.aborted) return;
      setErroLista(erro instanceof ErroHttp ? erro.message : "Não foi possível carregar as contas.");
      setCarregando(false);
    });
    return () => controlador.abort();
  }, [mes, revisao]);

  // Recarga silenciosa quando os dados mudam (aqui ou na conta conjunta).
  useEffect(() => ouvirAlteracoes(() => setRevisao(valor => valor + 1)), []);

  function alterado() {
    window.dispatchEvent(new Event(EVENTO_CONTAS_ALTERADAS));
    setRevisao(valor => valor + 1);
  }

  /** Executa uma mutação por vez na conta indicada e avisa o resultado. */
  async function operar(conta: Conta, acao: () => Promise<unknown>, mensagem: string) {
    if (operando !== undefined) return;
    setOperando(conta.id);
    try {
      await acao();
      avisar(mensagem);
      alterado();
    } catch (erro) {
      avisar(erro instanceof ErroHttp ? erro.message : "Não foi possível concluir a operação.", "erro");
    } finally {
      setOperando(undefined);
    }
  }

  async function pagar(conta: Conta) {
    if (await confirmar({ titulo: "Marcar como paga?", texto: `“${conta.descricao}” de ${formatarMoeda(conta.valor)}. Uma despesa com a data de hoje será registrada.`, acao: "Pagar" }))
      await operar(conta, () => contasApi.pagar(conta.id), `“${conta.descricao}” paga. Despesa registrada.`);
  }

  async function excluir(conta: Conta) {
    if (await confirmar({ titulo: "Excluir conta?", texto: `“${conta.descricao}” de ${formatarMoeda(conta.valor)} será apagada. Esta ação não pode ser desfeita.`, acao: "Excluir", perigo: true }))
      await operar(conta, () => contasApi.excluir(conta.id), "Conta excluída.");
  }

  const totais = contas && totaisContas(contas);

  return (
    <PaginaFeature titulo="Contas a pagar" descricao="Cadastre vencimentos e marque como paga: a despesa é registrada automaticamente.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeletorMes mes={mes} onMudar={proximo => { if (proximo !== mes) { setCarregando(true); setMes(proximo); } }} />
        <button type="button" className="botao-primario hidden gap-1.5 lg:inline-flex" onClick={() => setNovo(true)}><Icone nome="mais" />Nova conta</button>
      </div>

      {erroLista && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><p>{erroLista}</p><button type="button" className="botao-secundario" onClick={() => { setCarregando(true); setRevisao(valor => valor + 1); }}>Tentar novamente</button></div>}
      {carregando && !contas && <Esqueleto rotulo="Carregando contas…" blocos={["h-32", "h-64"]} />}

      {contas && totais && <div className={`space-y-5 transition-opacity duration-300 ${carregando ? "opacity-50" : ""}`} aria-busy={carregando}>
        <section aria-labelledby="titulo-resumo-contas" className="cartao animate-surgir">
          <h2 id="titulo-resumo-contas" className="text-sm text-slate-500">Em aberto em {nomeMes(mes).split(" ")[0].toLowerCase()}</h2>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums"><ValorAnimado valor={totais.aberto} /></p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-red-100" role="progressbar" aria-label="Contas pagas no mês" aria-valuenow={totais.percentualPago} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full origin-left animate-crescer-x rounded-full bg-emerald-500 transition-[width] duration-700" style={{ width: `${totais.percentualPago}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-sm text-slate-500">
            <span><span className="mr-1.5 inline-block size-2 rounded-full bg-emerald-500" aria-hidden="true" />Pago <strong className="tabular-nums text-slate-800">{formatarMoeda(totais.pago)}</strong></span>
            <span>{totais.percentualPago}% pago</span>
          </div>
        </section>

        {contas.length === 0
          ? <div className="animate-surgir rounded-3xl border border-dashed border-slate-300 p-8 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-blue-600"><Icone nome="calendario" className="size-6" /></span>
            <p className="mt-3 font-semibold">Nenhuma conta neste mês</p>
            <p className="mt-1 text-sm text-slate-500">Cadastre um vencimento para ser lembrado antes de pagar.</p>
            <button type="button" className="botao-secundario mt-4" onClick={() => setNovo(true)}><Icone nome="mais" />Nova conta</button>
          </div>
          : <ul aria-label={`Vencimentos de ${nomeMes(mes).toLowerCase()}`} className="cartao divide-y divide-slate-100 py-1 sm:py-2">
            {contas.map((conta, indice) => {
              const { texto, tom } = situacaoConta(conta, hoje);
              return <li key={conta.id} className={`flex animate-surgir items-center gap-3 py-3 transition-opacity ${operando === conta.id ? "opacity-40" : ""}`} style={{ animationDelay: `${Math.min(indice, 10) * 40}ms` }}>
                <DataQuadrada data={conta.vencimento} tom={tom} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium ${conta.pagaEm ? "text-slate-400 line-through decoration-slate-300" : ""}`}>{conta.descricao}</p>
                  <p className="truncate text-sm text-slate-500"><span className={COR_TOM[tom]}>{texto}</span> · {conta.categoria}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end sm:flex-row sm:items-center sm:gap-2">
                  <p className={`font-semibold tabular-nums ${conta.pagaEm ? "text-slate-400" : ""}`}>{formatarMoeda(conta.valor)}</p>
                  <div className="-mr-2 flex">
                    {!conta.pagaEm && <button type="button" className="grid size-9 place-items-center rounded-xl text-emerald-600 transition hover:bg-emerald-50 active:scale-90 disabled:opacity-50 sm:size-11" disabled={operando !== undefined} title="Marcar como paga" aria-label={`Marcar como paga: ${conta.descricao}`} onClick={() => void pagar(conta)}><Icone nome="ok" className="size-5" /></button>}
                    <button type="button" className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-90 disabled:opacity-50 sm:size-11" disabled={operando !== undefined} title="Editar" aria-label={`Editar conta: ${conta.descricao}`} onClick={() => { setEditando(conta); setEditarAberto(true); }}><Icone nome="lapis" /></button>
                    <button type="button" className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-700 active:scale-90 disabled:opacity-50 sm:size-11" disabled={operando !== undefined} title="Excluir" aria-label={`Excluir conta: ${conta.descricao}`} onClick={() => void excluir(conta)}><Icone nome="lixeira" /></button>
                  </div>
                </div>
              </li>;
            })}
          </ul>}
      </div>}

      {/* Celular: botão fixo acima da barra de abas. */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 bg-gradient-to-t from-[#f6f8fb] from-60% px-4 pt-6 pb-3 lg:hidden">
        <button type="button" onClick={() => setNovo(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/25 transition active:scale-[0.97]"><Icone nome="mais" className="size-5" />Nova conta</button>
      </div>

      {/* A API de contas chama a data de "vencimento"; o formulário usa "data". */}
      <Folha aberta={novo} onFechar={() => setNovo(false)} titulo="Nova conta">
        <FormularioLancamento tipo="conta" salvar={({ data, ...dados }) => contasApi.salvar({ ...dados, vencimento: data })} onSalvo={alterado} />
      </Folha>
      <Folha aberta={editarAberto} onFechar={() => setEditarAberto(false)} titulo="Editar conta">
        {editando && <FormularioLancamento tipo="conta"
          inicial={{ descricao: editando.descricao, valor: String(editando.valor).replace(".", ","), categoria: editando.categoria, data: editando.vencimento.slice(0, 10) }}
          salvar={({ data, ...dados }) => contasApi.salvar({ ...dados, vencimento: data }, editando.id)} onSalvo={alterado} />}
      </Folha>
    </PaginaFeature>
  );
}
