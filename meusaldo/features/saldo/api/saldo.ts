import { requisitar } from "@/shared/lib/http";
import { consultarSaldo } from "@/shared/lib/saldo-api";
import type { Lancamento } from "@/shared/lib/financeiro";
import { montarPainel, type ItemPainel } from "../lib/painel";

export type ResumoMensal = { mes: string; receitas: number; despesas: number; saldo: number; saldoAcumulado: number };

export async function carregarResumo(mes: string, signal?: AbortSignal) {
  const [totais, historico, receitas, despesas] = await Promise.all([
    consultarSaldo(signal),
    requisitar<ResumoMensal[]>(`/saldo/mensal?meses=12&ate=${mes}`, { signal }),
    requisitar<Lancamento[]>(`/receitas?mes=${mes}`, { signal }),
    requisitar<Lancamento[]>(`/despesas?mes=${mes}`, { signal }),
  ]);
  const itens: ItemPainel[] = [
    ...receitas.map(item => ({ ...item, tipo: "receita" as const })),
    ...despesas.map(item => ({ ...item, tipo: "despesa" as const })),
  ];
  const [anterior, atual] = historico.slice(-2);
  return { totais, historico, anterior, receitas: atual.receitas, despesas: atual.despesas, sobra: atual.saldo, saldoFimDoMes: atual.saldoAcumulado, ...montarPainel(itens, mes) };
}
