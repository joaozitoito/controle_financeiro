import { requisitar } from "./http";
import type { Conta } from "./contas";

/** Disparado após cadastrar, editar, pagar ou excluir conta, para o badge da navegação se atualizar. */
export const EVENTO_CONTAS_ALTERADAS = "meusaldo:contas-alteradas";

export function listarContas(filtros: { status?: "aberta" | "paga"; mes?: string; ate?: string }, signal?: AbortSignal) {
  const consulta = new URLSearchParams(Object.entries(filtros).filter((entrada): entrada is [string, string] => Boolean(entrada[1])));
  return requisitar<Conta[]>(`/contas${consulta.size ? `?${consulta}` : ""}`, { signal });
}
