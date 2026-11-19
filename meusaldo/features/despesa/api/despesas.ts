import { requisitar } from "@/shared/lib/http";
import type { ApiLancamentos, Lancamento } from "@/shared/lib/financeiro";

export const despesasApi: ApiLancamentos = {
  listar: (filtro, signal) => requisitar<Lancamento[]>(`/despesas?${new URLSearchParams(Object.entries(filtro).filter((par): par is [string, string] => Boolean(par[1])))}`, { signal }),
  salvar: (dados, id) => requisitar<Lancamento>(id ? `/despesas/${id}` : "/despesas", { method: id ? "PUT" : "POST", body: JSON.stringify(dados) }),
  excluir: (id) => requisitar<void>(`/despesas/${id}`, { method: "DELETE" }),
};
