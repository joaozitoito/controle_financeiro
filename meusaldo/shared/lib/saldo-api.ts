import { requisitar } from "./http";
import type { Totais } from "./financeiro";

export function consultarSaldo(signal?: AbortSignal) {
  return requisitar<Totais>("/saldo", { signal });
}
