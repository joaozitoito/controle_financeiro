import { urlApi } from "./http";

/** Stream SSE das alterações; o cookie de sessão vai junto. */
export function abrirEventos(): EventSource {
  return new EventSource(`${urlApi()}/eventos`, { withCredentials: true });
}

/** Disparado quando alguém (você ou a outra pessoa da conta conjunta) altera os dados. */
export const EVENTO_DADOS_ALTERADOS = "meusaldo:dados-alterados";

export type EventoTempoReal = {
  tipo: "dados" | "conjunta";
  recurso?: string;
  autor: { id: number; nome: string };
};

/** Registra a recarga silenciosa de uma tela; devolve a limpeza para o useEffect. */
export function ouvirAlteracoes(recarregar: () => void): () => void {
  window.addEventListener(EVENTO_DADOS_ALTERADOS, recarregar);
  return () => window.removeEventListener(EVENTO_DADOS_ALTERADOS, recarregar);
}

const RECURSOS: Record<string, string> = {
  receitas: "as receitas",
  despesas: "as despesas",
  contas: "as contas a pagar",
  orcamentos: "o planejamento",
};

export function descreverEvento(evento: EventoTempoReal): string {
  if (evento.tipo === "conjunta") return `${evento.autor.nome} alterou a conta conjunta.`;
  return `${evento.autor.nome} atualizou ${RECURSOS[evento.recurso ?? ""] ?? "os dados"}.`;
}
