import { requisitar } from "@/shared/lib/http";
import type { ApiLancamentos, Lancamento } from "@/shared/lib/financeiro";

export const despesasApi: ApiLancamentos = {
  listar: (categoria, signal) => requisitar<Lancamento[]>(`/despesas${categoria ? `?${new URLSearchParams({ categoria })}` : ""}`, { signal }),
  salvar: (dados, id) => requisitar<Lancamento>(id ? `/despesas/${id}` : "/despesas", { method: id ? "PUT" : "POST", body: JSON.stringify(dados) }),
  excluir: (id) => requisitar<void>(`/despesas/${id}`, { method: "DELETE" }),
};
