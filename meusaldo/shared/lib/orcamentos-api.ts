import { requisitar } from "./http";
import type { ResumoOrcamento } from "./orcamento";

export function consultarOrcamentos(mes: string, signal?: AbortSignal) {
  return requisitar<ResumoOrcamento>(`/orcamentos?mes=${mes}`, { signal });
}
