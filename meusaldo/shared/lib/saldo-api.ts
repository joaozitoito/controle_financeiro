import { requisitar } from "./http";
import type { Totais } from "./financeiro";

/** Saldo oficial de todo o período ou, com mes (YYYY-MM), só daquele mês. */
export function consultarSaldo(signal?: AbortSignal, mes?: string) {
  return requisitar<Totais>(mes ? `/saldo?mes=${mes}` : "/saldo", { signal });
}
