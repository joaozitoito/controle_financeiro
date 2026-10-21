"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PaginaFeature } from "@/shared/components/pagina-feature";
import { ErroHttp } from "@/shared/lib/http";
import { formatarData, formatarMoeda } from "@/shared/lib/financeiro";
import { carregarResumo } from "../api/saldo";

export function PaginaSaldo() {
  const [resumo, setResumo] = useState<Awaited<ReturnType<typeof carregarResumo>> | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    carregarResumo(controlador.signal).then(dados => {
      if (controlador.signal.aborted) return;
      setResumo(dados);
      setCarregando(false);
    }).catch((falha: unknown) => {
      if (controlador.signal.aborted) return;
      setErro(falha instanceof ErroHttp ? falha.message : "Não foi possível carregar o resumo.");
      setCarregando(false);
    });
    return () => controlador.abort();
  }, [revisao]);

  return (
    <PaginaFeature titulo="Resumo financeiro" descricao="Totais gerais de todos os seus lançamentos, sem filtro de período ou categoria.">
      <div className="flex flex-wrap gap-3">
        <Link href="/receitas#formulario" className="botao-primario">Cadastrar receita</Link>
        <Link href="/despesas#formulario" className="botao-secundario">Cadastrar despesa</Link>
        <button type="button" className="botao-secundario" disabled={carregando} onClick={() => { setCarregando(true); setErro(""); setRevisao(valor => valor + 1); }}>Atualizar resumo</button>
      </div>
      {carregando && <p role="status" className="text-sm text-slate-600">Carregando resumo…</p>}
      {erro && <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">{erro} Use “Atualizar resumo” para tentar novamente.</p>}
      {!carregando && !erro && resumo && <>
        <dl className="grid gap-4 sm:grid-cols-3">
          {([
            ["Saldo atual", resumo.totais.saldo, "text-slate-900"],
            ["Total de receitas", resumo.totais.totalReceitas, "text-emerald-800"],
            ["Total de despesas", resumo.totais.totalDespesas, "text-red-800"],
          ] as const).map(([label, valor, cor]) => <div key={label} className="min-w-0 rounded-lg border border-slate-200 bg-white p-5">
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className={`mt-2 break-words text-2xl font-semibold tabular-nums ${cor}`}>{formatarMoeda(valor)}</dd>
          </div>)}
        </dl>
        <section aria-labelledby="titulo-recentes" className="space-y-3">
          <h2 id="titulo-recentes" className="text-lg font-semibold">Lançamentos recentes</h2>
          {resumo.recentes.length === 0
            ? <p className="rounded-md border border-dashed border-slate-300 p-5 text-sm text-slate-600">Nenhum lançamento cadastrado. Comece por uma receita ou despesa.</p>
            : <ul aria-label="Lançamentos recentes" className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {resumo.recentes.map(item => <li key={`${item.tipo}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium [overflow-wrap:anywhere]">{item.descricao}</p>
                  <p className="mt-1 text-sm text-slate-600 [overflow-wrap:anywhere]">{item.tipo}: {item.categoria} / <time dateTime={item.data.slice(0, 10)}>{formatarData(item.data)}</time></p>
                </div>
                <p className={`font-semibold tabular-nums ${item.tipo === "Receita" ? "text-emerald-800" : "text-red-800"}`}>{item.tipo === "Receita" ? "+" : "−"} {formatarMoeda(item.valor)}</p>
              </li>)}
            </ul>}
        </section>
      </>}
    </PaginaFeature>
  );
}
