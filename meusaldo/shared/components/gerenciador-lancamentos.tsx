"use client";

import { useEffect, useState } from "react";
import { ErroHttp } from "@/shared/lib/http";
import { consultarSaldo } from "@/shared/lib/saldo-api";
import { CATEGORIAS, categoriaVisual } from "@/shared/lib/categorias";
import { formatarData, formatarMoeda, type ApiLancamentos, type Lancamento, type Totais } from "@/shared/lib/financeiro";
import { mesAtual, nomeMes } from "@/shared/lib/periodo";
import { ouvirAlteracoes } from "@/shared/lib/tempo-real";
import { avisar, confirmar } from "./avisos";
import { Esqueleto } from "./esqueleto";
import { Folha } from "./folha";
import { FormularioLancamento } from "./formulario-lancamento";
import { Icone } from "./icone";
import { SeletorMes } from "./seletor-mes";
import { ValorAnimado } from "./valor-animado";

export function GerenciadorLancamentos({ tipo, api }: { tipo: "receita" | "despesa"; api: ApiLancamentos }) {
  const [mes, setMes] = useState(mesAtual);
  const [categoria, setCategoria] = useState("");
  const [revisao, setRevisao] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [consulta, setConsulta] = useState<{ lista: Lancamento[]; doMes: Totais; geral: Totais } | null>(null);
  const [novo, setNovo] = useState(false);
  const [editando, setEditando] = useState<Lancamento>();
  const [editarAberto, setEditarAberto] = useState(false);
  const [excluindo, setExcluindo] = useState<number>();
  const cor = tipo === "receita" ? "text-emerald-600" : "text-red-600";

  useEffect(() => {
    const controlador = new AbortController();
    Promise.all([api.listar({ categoria, mes }, controlador.signal), consultarSaldo(controlador.signal, mes), consultarSaldo(controlador.signal)])
      .then(([lista, doMes, geral]) => {
        if (controlador.signal.aborted) return;
        setConsulta({ lista, doMes, geral });
        setErroLista("");
        setCarregando(false);
      })
      .catch((erro: unknown) => {
        if (controlador.signal.aborted) return;
        setErroLista(erro instanceof ErroHttp ? erro.message : "Não foi possível carregar os lançamentos.");
        setCarregando(false);
      });
    return () => controlador.abort();
  }, [api, mes, categoria, revisao]);

  // Recarga silenciosa quando os dados mudam (aqui ou na conta conjunta).
  useEffect(() => ouvirAlteracoes(() => setRevisao(valor => valor + 1)), []);

  function filtrar(proximo: { mes?: string; categoria?: string }) {
    if ((proximo.mes ?? mes) === mes && (proximo.categoria ?? categoria) === categoria) return;
    setCarregando(true);
    if (proximo.mes !== undefined) setMes(proximo.mes);
    if (proximo.categoria !== undefined) setCategoria(proximo.categoria);
  }

  async function excluir(item: Lancamento) {
    const sim = await confirmar({ titulo: `Excluir ${tipo}?`, texto: `“${item.descricao}” de ${formatarMoeda(item.valor)} será apagada. Esta ação não pode ser desfeita.`, acao: "Excluir", perigo: true });
    if (!sim) return;
    setExcluindo(item.id);
    try {
      await api.excluir(item.id);
      avisar(`${tipo === "receita" ? "Receita" : "Despesa"} excluída.`);
      setRevisao(valor => valor + 1);
    } catch (erro) {
      avisar(erro instanceof ErroHttp ? erro.message : "Não foi possível excluir.", "erro");
    } finally {
      setExcluindo(undefined);
    }
  }

  const total = consulta && (tipo === "receita" ? consulta.doMes.totalReceitas : consulta.doMes.totalDespesas);
  const nomeDoMes = nomeMes(mes).split(" ")[0].toLowerCase();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SeletorMes mes={mes} onMudar={proximo => filtrar({ mes: proximo })} />
        <button type="button" className={`botao-primario hidden gap-1.5 lg:inline-flex ${tipo === "receita" ? "border-emerald-600 bg-emerald-600 hover:bg-emerald-700" : "border-red-600 bg-red-600 hover:bg-red-700"}`} onClick={() => setNovo(true)}>
          <Icone nome="mais" />Nova {tipo}
        </button>
      </div>

      <div role="group" aria-label="Filtrar por categoria" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {["", ...CATEGORIAS.map(opcao => opcao.nome)].map(opcao => <button key={opcao || "todas"} type="button" aria-pressed={categoria === opcao} onClick={() => filtrar({ categoria: opcao })}
          className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition duration-200 active:scale-95 ${categoria === opcao ? "bg-slate-900 text-white shadow-md shadow-slate-900/15" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300"}`}>
          {opcao && <Icone nome={categoriaVisual(opcao).icone} className="size-4 opacity-80" />}{opcao || "Todas"}
        </button>)}
      </div>

      {erroLista && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><p>{erroLista}</p><button type="button" className="botao-secundario" onClick={() => { setCarregando(true); setRevisao(valor => valor + 1); }}>Tentar novamente</button></div>}
      {carregando && !consulta && <Esqueleto rotulo={`Carregando ${tipo}s…`} blocos={["h-28", "h-72"]} />}

      {consulta && total !== null && <div className={`space-y-5 transition-opacity duration-300 ${carregando ? "opacity-50" : ""}`} aria-busy={carregando}>
        <dl className="cartao animate-surgir grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">{tipo === "receita" ? "Recebido" : "Gasto"} em {nomeDoMes}</dt>
            <dd className={`mt-1 text-2xl font-bold tracking-tight tabular-nums ${cor}`}><ValorAnimado valor={total} /></dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Saldo em conta</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums"><ValorAnimado valor={consulta.geral.saldo} /></dd>
          </div>
          {categoria && <p className="col-span-2 -mt-1 text-xs text-slate-500">Totais de todas as categorias. A lista abaixo mostra só {categoria}.</p>}
        </dl>

        {consulta.lista.length === 0
          ? <div className="animate-surgir rounded-3xl border border-dashed border-slate-300 p-8 text-center">
            <span className={`mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 ${cor}`}><Icone nome={tipo === "receita" ? "alta" : "baixa"} className="size-6" /></span>
            <p className="mt-3 font-semibold">Nada por aqui</p>
            <p className="mt-1 text-sm text-slate-500">{categoria ? `Nenhuma ${tipo} de ${categoria} em ${nomeDoMes}.` : `Nenhuma ${tipo} em ${nomeDoMes}.`}</p>
            <button type="button" className="botao-secundario mt-4" onClick={() => setNovo(true)}><Icone nome="mais" />Registrar {tipo}</button>
          </div>
          : <ul aria-label={`${tipo === "receita" ? "Receitas" : "Despesas"} de ${nomeDoMes}`} className="cartao divide-y divide-slate-100 py-1 sm:py-2">
            {consulta.lista.map((item, indice) => <li key={item.id} className={`flex animate-surgir items-center gap-3 py-3 transition-opacity ${excluindo === item.id ? "opacity-40" : ""}`} style={{ animationDelay: `${Math.min(indice, 10) * 35}ms` }}>
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${categoriaVisual(item.categoria).fundo}`}><Icone nome={categoriaVisual(item.categoria).icone} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.descricao}</p>
                <p className="truncate text-sm text-slate-500">{item.categoria} · <time dateTime={item.data.slice(0, 10)}>{formatarData(item.data).slice(0, 5)}</time></p>
              </div>
              <div className="flex shrink-0 flex-col items-end sm:flex-row sm:items-center sm:gap-2">
                <p className={`font-semibold tabular-nums ${tipo === "receita" ? "text-emerald-700" : "text-red-700"}`}>{tipo === "receita" ? "+" : "−"} {formatarMoeda(item.valor)}</p>
                <div className="-mr-2 flex">
                  <button type="button" className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-90 disabled:opacity-50 sm:size-11" disabled={excluindo !== undefined} title="Editar" aria-label={`Editar ${tipo}: ${item.descricao}`} onClick={() => { setEditando(item); setEditarAberto(true); }}><Icone nome="lapis" /></button>
                  <button type="button" className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-700 active:scale-90 disabled:opacity-50 sm:size-11" disabled={excluindo !== undefined} title="Excluir" aria-label={`Excluir ${tipo}: ${item.descricao}`} onClick={() => void excluir(item)}><Icone nome="lixeira" /></button>
                </div>
              </div>
            </li>)}
          </ul>}
      </div>}

      {/* Celular: botão fixo acima da barra de abas. */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 bg-gradient-to-t from-[#f6f8fb] from-60% px-4 pt-6 pb-3 lg:hidden">
        <button type="button" onClick={() => setNovo(true)} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-white shadow-lg transition active:scale-[0.97] ${tipo === "receita" ? "bg-emerald-600 shadow-emerald-600/25" : "bg-red-600 shadow-red-600/25"}`}>
          <Icone nome="mais" className="size-5" />Nova {tipo}
        </button>
      </div>

      <Folha aberta={novo} onFechar={() => setNovo(false)} titulo={<>Nova <span className={cor}>{tipo}</span></>}>
        <FormularioLancamento tipo={tipo} salvar={dados => api.salvar(dados)} onSalvo={() => setRevisao(valor => valor + 1)} />
      </Folha>
      <Folha aberta={editarAberto} onFechar={() => setEditarAberto(false)} titulo={<>Editar <span className={cor}>{tipo}</span></>}>
        {editando && <FormularioLancamento tipo={tipo}
          inicial={{ descricao: editando.descricao, valor: String(editando.valor).replace(".", ","), categoria: editando.categoria, data: editando.data.slice(0, 10) }}
          salvar={dados => api.salvar(dados, editando.id)} onSalvo={() => setRevisao(valor => valor + 1)} />}
      </Folha>
    </div>
  );
}
