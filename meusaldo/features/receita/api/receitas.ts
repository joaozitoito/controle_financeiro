import { requisitar } from "@/shared/lib/http";
import type { ApiLancamentos, Lancamento } from "@/shared/lib/financeiro";

export const receitasApi: ApiLancamentos = {
  listar: (filtro, signal) => requisitar<Lancamento[]>(`/receitas?${new URLSearchParams(Object.entries(filtro).filter((par): par is [string, string] => Boolean(par[1])))}`, { signal }),
  salvar: (dados, id) => requisitar<Lancamento>(id ? `/receitas/${id}` : "/receitas", { method: id ? "PUT" : "POST", body: JSON.stringify(dados) }),
  excluir: (id) => requisitar<void>(`/receitas/${id}`, { method: "DELETE" }),
};
