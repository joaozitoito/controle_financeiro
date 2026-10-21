import { requisitar } from "@/shared/lib/http";
import { consultarSaldo } from "@/shared/lib/saldo-api";
import type { Lancamento } from "@/shared/lib/financeiro";

export async function carregarResumo(signal?: AbortSignal) {
  const [totais, receitas, despesas] = await Promise.all([
    consultarSaldo(signal), requisitar<Lancamento[]>("/receitas", { signal }), requisitar<Lancamento[]>("/despesas", { signal }),
  ]);
  const recentes = [
    ...receitas.map(item => ({ ...item, tipo: "Receita" as const })),
    ...despesas.map(item => ({ ...item, tipo: "Despesa" as const })),
  ].sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm) || b.id - a.id).slice(0, 8);
  return { totais, recentes };
}
