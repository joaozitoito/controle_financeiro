"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Folha } from "@/shared/components/folha";
import { Esqueleto } from "@/shared/components/esqueleto";
import { ValorAnimado } from "@/shared/components/valor-animado";
import { Icone } from "@/shared/components/icone";
import { ErroHttp } from "@/shared/lib/http";
import { formatarData, formatarMoeda } from "@/shared/lib/financeiro";
import { carregarResumo } from "../api/saldo";
import { variacao } from "../lib/painel";
import { deslocarMes, diasEntre, hojeLocal, mesAtual, nomeMes } from "@/shared/lib/periodo";
import { categoriaVisual } from "@/shared/lib/categorias";
import { situacaoConta, totaisContas } from "@/shared/lib/contas";
import { COR_FAIXA, faixaOrcamento } from "@/shared/lib/orcamento";
import { SeletorMes } from "@/shared/components/seletor-mes";
import { COR_TOM, DataQuadrada } from "@/shared/components/data-quadrada";
import { GraficoLinha, GraficoRosca } from "./graficos";
import { ouvirAlteracoes } from "@/shared/lib/tempo-real";

const PERIODOS = [12, 6, 3] as const;

function Cartao({ titulo, subtitulo, acao, className = "", atraso = 0, children }: { titulo: string; subtitulo?: string; acao?: ReactNode; className?: string; atraso?: number; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`cartao animate-surgir ${className}`} style={{ animationDelay: `${atraso}ms` }}>
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

export function PaginaSaldo({ saudacao, novaReceita, novaDespesa }: { saudacao?: ReactNode; novaReceita: ReactNode; novaDespesa: ReactNode }) {
  const [lancando, setLancando] = useState<"receita" | "despesa" | null>(null);
  const [ultimo, setUltimo] = useState<"receita" | "despesa">("receita");
  const abrir = (tipo: "receita" | "despesa") => { setUltimo(tipo); setLancando(tipo); };
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

  // Recarga silenciosa quando os dados mudam (aqui ou na conta conjunta).
  useEffect(() => ouvirAlteracoes(() => setRevisao(valor => valor + 1)), []);

  function recarregar(proximoMes = mes) {
    setCarregando(true);
    setErro("");
    setMes(proximoMes);
    setRevisao(valor => valor + 1);
  }
  const nomeAnterior = nomeMes(deslocarMes(mes, -1)).split(" ")[0].toLowerCase();
  const hoje = hojeLocal();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{saudacao}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Visão geral</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorMes mes={mes} onMudar={recarregar} />
          <button type="button" className="botao-secundario hidden gap-1.5 lg:inline-flex" onClick={() => abrir("receita")}><Icone nome="mais" />Receita</button>
          <button type="button" className="botao-primario hidden gap-1.5 lg:inline-flex" onClick={() => abrir("despesa")}><Icone nome="mais" />Despesa</button>
        </div>
      </div>

      {/* Atalhos fixos no celular, acima da barra de abas. */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 grid grid-cols-2 gap-3 bg-gradient-to-t from-[#f6f8fb] from-60% px-4 pt-6 pb-3 lg:hidden">
        <button type="button" onClick={() => abrir("receita")} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-semibold text-white shadow-lg shadow-emerald-600/25 transition active:scale-[0.97]"><Icone nome="mais" className="size-5" />Entrada</button>
        <button type="button" onClick={() => abrir("despesa")} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 font-semibold text-white shadow-lg shadow-red-600/25 transition active:scale-[0.97]"><Icone nome="menos" className="size-5" />Saída</button>
      </div>

      <Folha aberta={lancando !== null} onFechar={() => setLancando(null)} titulo={ultimo === "receita" ? <>Nova <span className="text-emerald-600">receita</span></> : <>Nova <span className="text-red-600">despesa</span></>}>
        {ultimo === "receita" ? novaReceita : novaDespesa}
      </Folha>

      {carregando && !painel && <Esqueleto rotulo="Carregando resumo…" blocos={["h-52", "h-32", "h-72"]} />}
      {erro && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">{erro} <button type="button" className="font-semibold underline" onClick={() => recarregar()}>Tentar novamente</button></p>}

      {!erro && painel && <>

        <section aria-labelledby="titulo-saldo" className="relative animate-surgir overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-xl shadow-blue-900/15 sm:p-8">
          <h2 id="titulo-saldo" className="text-sm font-medium text-blue-100">Saldo em conta</h2>
          <p className="mt-1 break-words text-[2.75rem] leading-tight font-extrabold tracking-tight tabular-nums sm:text-6xl"><ValorAnimado valor={painel.totais.saldo} /></p>
          {(() => {
            const delta = variacao(painel.saldoFimDoMes, painel.anterior.saldoAcumulado);
            return delta !== null && <p className="mt-2 text-sm text-blue-100">
              <span className="mr-1.5 rounded-lg bg-white/15 px-2 py-0.5 font-semibold text-white">{delta >= 0 ? "+" : ""}{delta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
              vs. fim de {nomeAnterior}
            </p>;
          })()}
          <p className="mt-6 flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-white/15 pt-4 text-sm text-blue-100">
            <span>Sobra prevista em {nomeMes(mes).split(" ")[0].toLowerCase()}</span>
            <strong className="font-semibold tabular-nums text-white"><ValorAnimado valor={painel.sobraPrevista} /></strong>
          </p>
        </section>

        <dl className="grid grid-cols-2 gap-3 sm:gap-4">
          {([
            ["Receitas", painel.receitas, "alta", "bg-emerald-50 text-emerald-600", "text-emerald-600", <Variacao key="r" valor={variacao(painel.receitas, painel.anterior.receitas)} sufixo={`vs. ${nomeAnterior}`} />],
            ["Despesas", painel.despesas, "baixa", "bg-red-50 text-red-600", "text-red-600", <Variacao key="d" inverter valor={variacao(painel.despesas, painel.anterior.despesas)} sufixo={`vs. ${nomeAnterior}`} />],
          ] as const).map(([rotulo, valor, icone, estiloIcone, corValor, rodape], indice) => (
            <div key={rotulo} className="cartao animate-surgir p-4 sm:p-6" style={{ animationDelay: `${80 + indice * 60}ms` }}>
              <dt className="flex items-center gap-2.5 text-sm text-slate-500">
                <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${estiloIcone}`}><Icone nome={icone} /></span>
                {rotulo}
              </dt>
              <dd className="mt-3 space-y-1.5">
                <p className={`break-words text-xl font-bold tracking-tight tabular-nums sm:text-3xl ${corValor}`}><ValorAnimado valor={valor} /></p>
                {rodape}
              </dd>
            </div>
          ))}
        </dl>

        {painel.alertas.length > 0 && (() => {
          const vencidas = painel.alertas.filter(conta => diasEntre(hoje, conta.vencimento) < 0).length;
          const total = totaisContas(painel.alertas).aberto;
          return <section aria-labelledby="titulo-alerta-contas" className="flex animate-surgir flex-col gap-4 rounded-3xl border border-red-200 bg-red-50/70 p-4 [animation-delay:200ms] sm:p-5 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-red-600"><Icone nome="alerta" className="size-5" /></span>
              <div className="min-w-0">
                <h2 id="titulo-alerta-contas" className="font-semibold text-red-800">
                  {painel.alertas.length} {painel.alertas.length === 1 ? "conta vence" : "contas vencem"} nos próximos 7 dias
                </h2>
                <p className="text-sm text-red-700/80">{formatarMoeda(total)} a pagar{vencidas ? `, incluindo ${vencidas} já vencida${vencidas > 1 ? "s" : ""}` : ""}.</p>
              </div>
            </div>
            <ul className="hidden flex-wrap gap-2 sm:flex" aria-label="Próximos vencimentos">
              {painel.alertas.slice(0, 3).map(conta => <li key={conta.id} className="rounded-xl border border-red-100 bg-white px-3 py-1.5 text-xs">
                <span className="block font-semibold uppercase text-red-600">{formatarData(conta.vencimento).slice(0, 5)}</span>
                <span className="font-medium">{conta.descricao}</span> <span className="tabular-nums text-red-600">{formatarMoeda(conta.valor)}</span>
              </li>)}
            </ul>
            <Link href="/contas" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50">Revisar contas<Icone nome="proximo" /></Link>
          </section>;
        })()}

        <div className="grid gap-4 lg:grid-cols-3">
          <Cartao atraso={300}
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
                <GraficoLinha suave valores={serie.map(item => item.saldoAcumulado)} cor="#2563eb" className="mt-4 h-48 w-full" rotulo={`Saldo de ${formatarMoeda(serie[0].saldoAcumulado)} em ${nomeMes(serie[0].mes)} para ${formatarMoeda(serie.at(-1)!.saldoAcumulado)} em ${nomeMes(serie.at(-1)!.mes)}`} />
                <ol className="mt-2 flex justify-between text-xs text-slate-400" aria-hidden="true">
                  {serie.map(item => <li key={item.mes} className={item.mes === mes ? "font-semibold text-blue-600" : ""}>{nomeMes(item.mes, true)}</li>)}
                </ol>
              </>;
            })()}
          </Cartao>

          <Cartao atraso={360}
            titulo="Contas a pagar"
            subtitulo={`${painel.contas.filter(conta => !conta.pagaEm).length} em aberto · ${nomeMes(mes).toLowerCase()}`}
            acao={<Link href="/contas" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-blue-700 hover:underline">Ver todas<Icone nome="proximo" /></Link>}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-3xl font-bold tabular-nums tracking-tight">{formatarMoeda(painel.totaisDeContas.aberto)}</p>
              <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-red-600">PENDENTES</span>
            </div>
            {painel.contas.some(conta => !conta.pagaEm)
              ? <ul className="mt-3 divide-y divide-slate-100">
                {painel.contas.filter(conta => !conta.pagaEm).slice(0, 4).map(conta => {
                  const { texto, tom } = situacaoConta(conta, hoje);
                  return <li key={conta.id} className="flex items-center gap-3 py-2.5">
                    <DataQuadrada data={conta.vencimento} tom={tom} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{conta.descricao}</p>
                      <p className={`text-sm ${COR_TOM[tom]}`}>{texto}</p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{formatarMoeda(conta.valor)}</p>
                  </li>;
                })}
              </ul>
              : <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Nenhuma conta em aberto neste mês.</p>}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-red-100" role="progressbar" aria-label="Contas pagas no mês" aria-valuenow={painel.totaisDeContas.percentualPago} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full origin-left animate-crescer-x rounded-full bg-blue-600 transition-[width] duration-700" style={{ width: `${painel.totaisDeContas.percentualPago}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>Pago <strong className="tabular-nums text-slate-700">{formatarMoeda(painel.totaisDeContas.pago)}</strong></span>
              <span>Em aberto <strong className="tabular-nums text-slate-700">{formatarMoeda(painel.totaisDeContas.aberto)}</strong></span>
            </div>
          </Cartao>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Cartao atraso={420} titulo="Gastos por categoria" subtitulo={`${nomeMes(mes)} · ${painel.categorias.length} categoria(s)`}>
            {painel.categorias.length === 0
              ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">Nenhuma despesa neste mês.</p>
              : <>
                <div className="relative mx-auto size-44">
                  <GraficoRosca className="size-44 animate-rosca" fatias={painel.categorias.map(categoria => ({ valor: categoria.valor, cor: categoriaVisual(categoria.nome).cor }))} />
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

          <Cartao atraso={480}
            titulo="Orçamento por categoria"
            subtitulo={painel.orcamento.limite > 0 ? `${formatarMoeda(painel.orcamento.gasto)} de ${formatarMoeda(painel.orcamento.limite)} planejados` : nomeMes(mes)}
            acao={<Link href="/planejamento" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-blue-700 hover:underline">{painel.orcamento.limite > 0 ? "Ajustar" : "Definir limites"}<Icone nome="proximo" /></Link>}
          >
            {painel.orcamento.limite > 0 ? (() => {
              const geral = faixaOrcamento(painel.orcamento.gasto, painel.orcamento.limite);
              const sobra = painel.orcamento.limite - painel.orcamento.gasto;
              return <>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">{geral.percentual}% usado</span>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Uso do orçamento do mês" aria-valuenow={Math.min(geral.percentual, 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`h-full origin-left animate-crescer-x rounded-full transition-[width] duration-700 ${COR_FAIXA[geral.faixa]}`} style={{ width: `${Math.min(geral.percentual, 100)}%` }} />
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  {painel.orcamento.categorias.slice(0, 5).map(item => {
                    const faixa = faixaOrcamento(item.gasto, item.limite);
                    return <li key={item.categoria}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-slate-700">{item.categoria}{faixa.rotulo && <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wider ${faixa.faixa === "vermelho" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}>{faixa.rotulo}</span>}</span>
                        <span className="tabular-nums text-slate-500"><strong className="text-slate-800">{formatarMoeda(item.gasto)}</strong> / {formatarMoeda(item.limite)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                        <div className={`h-full origin-left animate-crescer-x rounded-full transition-[width] duration-700 ${COR_FAIXA[faixa.faixa]}`} style={{ width: `${Math.min(faixa.percentual, 100)}%` }} />
                      </div>
                    </li>;
                  })}
                </ul>
                <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  {sobra >= 0 ? `Sobram ${formatarMoeda(sobra)} de limite em ${nomeMes(mes).toLowerCase()}.` : `${formatarMoeda(-sobra)} acima do planejado em ${nomeMes(mes).toLowerCase()}.`}
                </p>
              </>;
            })() : <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">Nenhum limite definido para este mês. Use “Definir limites” para planejar os gastos por categoria.</p>}
          </Cartao>

          {/* Celular: recentes primeiro. Desktop: order-last deixa Fluxo antes dos lançamentos (Fluxo não tem foco). */}
          <Cartao atraso={540}
            titulo="Lançamentos recentes"
            subtitulo={`Movimentos de ${nomeMes(mes).toLowerCase()}`}
            className="order-first lg:order-last"
            acao={<div role="group" aria-label="Filtrar lançamentos" className="flex gap-1">
              {([["todos", "Todos"], ["receita", "Entradas"], ["despesa", "Saídas"]] as const).map(([valor, rotulo]) => <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)} className={`min-h-11 rounded-lg px-3 text-xs font-medium ${filtro === valor ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}>{rotulo}</button>)}
            </div>}
          >
            {(() => {
              const lista = painel.recentes.filter(item => filtro === "todos" || item.tipo === filtro);
              if (lista.length === 0) return <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">Nenhum lançamento neste mês.</p>;
              return <>
                <ul aria-label="Lançamentos recentes" className="divide-y divide-slate-100">
                  {lista.slice(0, 6).map(item => <li key={`${item.tipo}-${item.id}`} className="flex animate-surgir items-center gap-3 py-3">
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

          <Cartao atraso={600} titulo="Fluxo do mês" subtitulo="Entradas e saídas por semana">
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
                      <span className="w-3 origin-bottom animate-crescer-y rounded-t bg-blue-600 transition-[height] duration-700" style={{ height: `${(semana.entradas / maximo) * 100}%` }} />
                      <span className="w-3 origin-bottom animate-crescer-y rounded-t bg-red-500 transition-[height] delay-75 duration-700" style={{ height: `${(semana.saidas / maximo) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-400" aria-hidden="true">S{indice + 1}</span>
                  </li>)}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">Sobra do mês</span>
                  <span className={`font-bold tabular-nums ${painel.saldoDoMes >= 0 ? "text-emerald-700" : "text-red-700"}`}>{painel.saldoDoMes >= 0 ? "+ " : ""}{formatarMoeda(painel.saldoDoMes)}</span>
                </div>
              </>;
            })()}
          </Cartao>
        </div>
      </>}
      <div className="h-16 lg:hidden" aria-hidden="true" />
    </div>
  );
}
