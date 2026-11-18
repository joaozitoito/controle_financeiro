import { requisitar } from "@/shared/lib/http";
import type { ResumoOrcamento } from "@/shared/lib/orcamento";
export { consultarOrcamentos } from "@/shared/lib/orcamentos-api";

/** Substitui todos os limites do mês; categorias fora da lista ficam sem limite. */
export function salvarOrcamentos(mes: string, categorias: { categoria: string; limite: number }[]) {
  return requisitar<ResumoOrcamento>(`/orcamentos?mes=${mes}`, { method: "PUT", body: JSON.stringify({ categorias }) });
}
