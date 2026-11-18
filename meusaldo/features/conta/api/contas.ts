import { requisitar } from "@/shared/lib/http";
import type { DadosLancamento, Lancamento } from "@/shared/lib/financeiro";
import type { Conta } from "@/shared/lib/contas";
export { listarContas } from "@/shared/lib/contas-api";

export type DadosConta = Omit<DadosLancamento, "data"> & { vencimento: string };

export const contasApi = {
  salvar: (dados: DadosConta, id?: number) => requisitar<Conta>(id ? `/contas/${id}` : "/contas", { method: id ? "PUT" : "POST", body: JSON.stringify(dados) }),
  excluir: (id: number) => requisitar<void>(`/contas/${id}`, { method: "DELETE" }),
  pagar: (id: number) => requisitar<{ conta: Conta; despesa: Lancamento }>(`/contas/${id}/pagar`, { method: "POST" }),
};
