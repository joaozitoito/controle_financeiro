import { requisitar } from "@/shared/lib/http";
import { consultarSaldo } from "@/shared/lib/saldo-api";
import type { Lancamento } from "@/shared/lib/financeiro";
import { listarContas } from "@/shared/lib/contas-api";
import { sobraPrevista, totaisContas } from "@/shared/lib/contas";
import { deslocarDia, hojeLocal } from "@/shared/lib/periodo";
import { montarPainel, type ItemPainel } from "../lib/painel";

export type ResumoMensal = { mes: string; receitas: number; despesas: number; saldo: number; saldoAcumulado: number };

export async function carregarResumo(mes: string, signal?: AbortSignal) {
  const [totais, historico, receitas, despesas, contas, alertas] = await Promise.all([
    consultarSaldo(signal),
    requisitar<ResumoMensal[]>(`/saldo/mensal?meses=12&ate=${mes}`, { signal }),
    requisitar<Lancamento[]>(`/receitas?mes=${mes}`, { signal }),
    requisitar<Lancamento[]>(`/despesas?mes=${mes}`, { signal }),
    listarContas({ mes }, signal),
    // Alerta independe do mês exibido: abertas até daqui a 7 dias, incluindo as já vencidas.
    listarContas({ status: "aberta", ate: deslocarDia(hojeLocal(), 7) }, signal),
  ]);
  const itens: ItemPainel[] = [
    ...receitas.map(item => ({ ...item, tipo: "receita" as const })),
    ...despesas.map(item => ({ ...item, tipo: "despesa" as const })),
  ];
  const [anterior, atual] = historico.slice(-2);
  const totaisDeContas = totaisContas(contas);
  return {
    totais, historico, anterior, contas, alertas, totaisDeContas,
    receitas: atual.receitas, despesas: atual.despesas, saldoDoMes: atual.saldo, saldoFimDoMes: atual.saldoAcumulado,
    sobraPrevista: sobraPrevista(atual.receitas, atual.despesas, totaisDeContas.aberto),
    ...montarPainel(itens, mes),
  };
}
