"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Icone } from "@/shared/components/icone";
import { ErroHttp } from "@/shared/lib/http";
import { formatarData, formatarMoeda } from "@/shared/lib/financeiro";
import { carregarResumo } from "../api/saldo";
import { deslocarMes, nomeMes, variacao } from "../lib/painel";
import { categoriaVisual } from "@/shared/lib/categorias";
import { GraficoLinha, GraficoRosca } from "./graficos";

const PERIODOS = [12, 6, 3] as const;

function mesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function Cartao({ titulo, subtitulo, acao, className = "", children }: { titulo: string; subtitulo?: string; acao?: ReactNode; className?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="font-semibold text-slate-900">{titulo}</h2>
          {subtitulo && <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

function Variacao({ valor, inverter = false, sufixo }: { valor: number | null; inverter?: boolean; sufixo: string }) {
  if (valor === null) return <p className="text-xs text-slate-500">sem base {sufixo}</p>;
  const bom = inverter ? valor <= 0 : valor >= 0;
  return (
    <p className="text-xs text-slate-500">
      <span className={`mr-1.5 rounded-md px-1.5 py-0.5 font-semibold ${bom ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
        {valor >= 0 ? "+" : ""}{valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
      </span>
      {sufixo}
    </p>
  );
}

export function PaginaSaldo() {
  const [painel, setPainel] = useState<Awaited<ReturnType<typeof carregarResumo>> | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [revisao, setRevisao] = useState(0);
  const [mes, setMes] = useState(mesAtual);
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>(12);
  const [filtro, setFiltro] = useState<"todos" | "receita" | "despesa">("todos");

  useEffect(() => {
    const controlador = new AbortController();
    carregarResumo(mes, controlador.signal).then(resposta => {
      if (controlador.signal.aborted) return;
      setPainel(resposta);
      setCarregando(false);
    }).catch((falha: unknown) => {
      if (controlador.signal.aborted) return;
      setErro(falha instanceof ErroHttp ? falha.message : "Não foi possível carregar o resumo.");
      setCarregando(false);
    });
    return () => controlador.abort();
  }, [mes, revisao]);

  function recarregar(proximoMes = mes) {
    setCarregando(true);
    setErro("");
    setMes(proximoMes);
    setRevisao(valor => valor + 1);
  }
  const nomeAnterior = nomeMes(deslocarMes(mes, -1)).split(" ")[0].toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Visão geral</h1>
          <p className="mt-1 text-sm text-slate-500">{nomeMes(mes)} · dados da sua conta</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm">
            <button type="button" className="grid size-11 place-items-center rounded-l-xl text-slate-600 hover:bg-slate-50" aria-label="Mês anterior" onClick={() => recarregar(deslocarMes(mes, -1))}><Icone nome="anterior" /></button>
            <p aria-live="polite" className="min-w-24 text-center text-sm font-medium">{nomeMes(mes, true)} {mes.slice(0, 4)}</p>
            <button type="button" className="grid size-11 place-items-center rounded-r-xl text-slate-600 hover:bg-slate-50" aria-label="Próximo mês" onClick={() => recarregar(deslocarMes(mes, 1))}><Icone nome="proximo" /></button>
          </div>
          <button type="button" className="botao-secundario rounded-xl" disabled={carregando} onClick={() => recarregar()}>Atualizar</button>
          <Link href="/receitas#formulario" className="botao-secundario gap-1.5 rounded-xl"><Icone nome="mais" />Receita</Link>
          <Link href="/despesas#formulario" className="botao-primario gap-1.5 rounded-xl"><Icone nome="mais" />Despesa</Link>
        </div>
      </div>

      {carregando && <p role="status" className="text-sm text-slate-600">Carregando resumo…</p>}
      {erro && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">{erro} Use “Atualizar” para tentar novamente.</p>}

      {!carregando && !erro && painel && <>
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {([
            ["Saldo em conta", formatarMoeda(painel.totais.saldo), "carteira", "#2563eb", "bg-blue-50 text-blue-600", painel.historico.map(item => item.saldoAcumulado), <p key="s" className="text-xs text-slate-500">saldo oficial, todos os lançamentos</p>],
            ["Receitas do mês", formatarMoeda(painel.receitas), "alta", "#10b981", "bg-emerald-50 text-emerald-600", painel.historico.map(item => item.receitas), <Variacao key="r" valor={variacao(painel.receitas, painel.anterior.receitas)} sufixo={`vs. ${nomeAnterior}`} />],
            ["Despesas do mês", formatarMoeda(painel.despesas), "baixa", "#ef4444", "bg-red-50 text-red-600", painel.historico.map(item => item.despesas), <Variacao key="d" inverter valor={variacao(painel.despesas, painel.anterior.despesas)} sufixo={`vs. ${nomeAnterior}`} />],
            ["Sobra do mês", formatarMoeda(painel.sobra), "alvo", "#8b5cf6", "bg-violet-50 text-violet-600", painel.historico.map(item => item.saldo), <p key="o" className="text-xs text-slate-500">{painel.receitas > 0 ? `${Math.round((painel.sobra / painel.receitas) * 100)}% das receitas` : "sem receitas no mês"}</p>],
          ] as const).map(([rotulo, valor, icone, cor, estilo, serie, rodape]) => (
            <div key={rotulo} className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <dt className="flex items-center justify-between text-sm text-slate-600">
                {rotulo}
                <span className={`grid size-8 place-items-center rounded-lg ${estilo}`}><Icone nome={icone} /></span>
              </dt>
              <dd className="mt-3 space-y-2">
                <p className="break-words text-2xl font-bold tabular-nums tracking-tight">{valor}</p>
                {rodape}
                <GraficoLinha valores={serie} cor={cor} className="h-10 w-full" />
              </dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-4 lg:grid-cols-3">
          <Cartao
            titulo="Evolução do saldo"
            subtitulo={`Saldo ao fim de cada mês, últimos ${periodo} meses`}
            className="lg:col-span-2"
            acao={<div role="group" aria-label="Período" className="flex rounded-lg bg-slate-100 p-1">
              {PERIODOS.map(opcao => <button key={opcao} type="button" aria-pressed={periodo === opcao} onClick={() => setPeriodo(opcao)} className={`min-h-11 rounded-md px-3 text-xs font-semibold ${periodo === opcao ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{opcao}M</button>)}
            </div>}
          >
            {(() => {
              const serie = painel.historico.slice(-periodo);
              const delta = variacao(serie.at(-1)!.saldoAcumulado, serie[0].saldoAcumulado);
              return <>
                <div className="flex flex-wrap items-baseline gap-3">
                  <p className="text-3xl font-bold tabular-nums tracking-tight">{formatarMoeda(painel.saldoFimDoMes)}</p>
                  <Variacao valor={delta} sufixo={`em ${periodo} meses`} />
                </div>
                <GraficoLinha valores={serie.map(item => item.saldoAcumulado)} cor="#2563eb" className="mt-4 h-48 w-full" rotulo={`Saldo de ${formatarMoeda(serie[0].saldoAcumulado)} em ${nomeMes(serie[0].mes)} para ${formatarMoeda(serie.at(-1)!.saldoAcumulado)} em ${nomeMes(serie.at(-1)!.mes)}`} />
                <ol className="mt-2 flex justify-between text-xs text-slate-400" aria-hidden="true">
                  {serie.map(item => <li key={item.mes} className={item.mes === mes ? "font-semibold text-blue-600" : ""}>{nomeMes(item.mes, true)}</li>)}
                </ol>
              </>;
            })()}
          </Cartao>

          <Cartao titulo="Gastos por categoria" subtitulo={`${nomeMes(mes)} · ${painel.categorias.length} categoria(s)`}>
            {painel.categorias.length === 0
              ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">Nenhuma despesa neste mês.</p>
              : <>
                <div className="relative mx-auto size-44">
                  <GraficoRosca className="size-44" fatias={painel.categorias.map(categoria => ({ valor: categoria.valor, cor: categoriaVisual(categoria.nome).cor }))} />
                  <div className="absolute inset-0 grid place-content-center text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total gasto</p>
                    <p className="font-bold tabular-nums">{formatarMoeda(painel.despesas)}</p>
                  </div>
                </div>
                <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {painel.categorias.map(categoria => <li key={categoria.nome} className="flex min-w-0 gap-2">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: categoriaVisual(categoria.nome).cor }} aria-hidden="true" />
                    <span className="min-w-0"><span className="block truncate text-slate-600">{categoria.nome}</span><span className="font-semibold tabular-nums">{formatarMoeda(categoria.valor)}</span></span>
                  </li>)}
                </ul>
              </>}
          </Cartao>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Cartao
            titulo="Lançamentos recentes"
            subtitulo={`Movimentos de ${nomeMes(mes).toLowerCase()}`}
            className="lg:col-span-2"
            acao={<div role="group" aria-label="Filtrar lançamentos" className="flex gap-1">
              {([["todos", "Todos"], ["receita", "Entradas"], ["despesa", "Saídas"]] as const).map(([valor, rotulo]) => <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)} className={`min-h-11 rounded-lg px-3 text-xs font-medium ${filtro === valor ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}>{rotulo}</button>)}
            </div>}
          >
            {(() => {
              const lista = painel.recentes.filter(item => filtro === "todos" || item.tipo === filtro);
              if (lista.length === 0) return <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">Nenhum lançamento neste mês.</p>;
              return <>
                <ul aria-label="Lançamentos recentes" className="divide-y divide-slate-100">
                  {lista.slice(0, 6).map(item => <li key={`${item.tipo}-${item.id}`} className="flex items-center gap-3 py-3">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${categoriaVisual(item.categoria).fundo}`}><Icone nome={categoriaVisual(item.categoria).icone} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.descricao}</p>
                      <p className="truncate text-sm text-slate-500">{item.categoria} · <time dateTime={item.data.slice(0, 10)}>{formatarData(item.data)}</time></p>
                    </div>
                    <p className={`shrink-0 font-semibold tabular-nums ${item.tipo === "receita" ? "text-emerald-700" : "text-slate-900"}`}>{item.tipo === "receita" ? "+" : "−"} {formatarMoeda(item.valor)}</p>
                  </li>)}
                </ul>
                <div className="mt-3 flex flex-wrap justify-center gap-4 border-t border-slate-100 pt-4 text-sm font-medium text-blue-700">
                  <Link href="/receitas" className="hover:underline">Ver todas as receitas</Link>
                  <Link href="/despesas" className="hover:underline">Ver todas as despesas</Link>
                </div>
              </>;
            })()}
          </Cartao>

          <Cartao titulo="Fluxo do mês" subtitulo="Entradas e saídas por semana">
            {(() => {
              const maximo = Math.max(...painel.semanas.flatMap(semana => [semana.entradas, semana.saidas]), 1);
              return <>
                <p className="mb-3 flex gap-4 text-xs text-slate-500" aria-hidden="true">
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-blue-600" />Entradas</span>
                  <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-red-500" />Saídas</span>
                </p>
                <ul className="flex h-48 items-end justify-around gap-2">
                  {painel.semanas.map((semana, indice) => <li key={indice} className="flex h-full flex-1 flex-col items-center gap-2" aria-label={`Semana ${indice + 1}: entradas ${formatarMoeda(semana.entradas)}, saídas ${formatarMoeda(semana.saidas)}`}>
                    <div className="flex w-full flex-1 items-end justify-center gap-1" aria-hidden="true">
                      <span className="w-3 rounded-t bg-blue-600" style={{ height: `${(semana.entradas / maximo) * 100}%` }} />
                      <span className="w-3 rounded-t bg-red-500" style={{ height: `${(semana.saidas / maximo) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-400" aria-hidden="true">S{indice + 1}</span>
                  </li>)}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">Sobra do mês</span>
                  <span className={`font-bold tabular-nums ${painel.sobra >= 0 ? "text-emerald-700" : "text-red-700"}`}>{painel.sobra >= 0 ? "+ " : ""}{formatarMoeda(painel.sobra)}</span>
                </div>
              </>;
            })()}
          </Cartao>
        </div>
      </>}
    </div>
  );
}
