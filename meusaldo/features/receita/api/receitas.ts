import { requisitar } from "@/shared/lib/http";
import type { ApiLancamentos, Lancamento } from "@/shared/lib/financeiro";

export const receitasApi: ApiLancamentos = {
  listar: (categoria, signal) => requisitar<Lancamento[]>(`/receitas${categoria ? `?${new URLSearchParams({ categoria })}` : ""}`, { signal }),
  salvar: (dados, id) => requisitar<Lancamento>(id ? `/receitas/${id}` : "/receitas", { method: id ? "PUT" : "POST", body: JSON.stringify(dados) }),
  excluir: (id) => requisitar<void>(`/receitas/${id}`, { method: "DELETE" }),
};
