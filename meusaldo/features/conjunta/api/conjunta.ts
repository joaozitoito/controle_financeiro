import { requisitar } from "@/shared/lib/http";

type Parceiro = { id: number; nome: string; email: string };
export type EstadoConjunta =
  | { papel: "individual"; parceiro: null; conviteExpiraEm: string | null }
  | { papel: "titular" | "membro"; parceiro: Parceiro; conviteExpiraEm: null };

export const conjuntaApi = {
  consultar: (signal?: AbortSignal) => requisitar<EstadoConjunta>("/conjunta", { signal }),
  convidar: () => requisitar<{ codigo: string; conviteExpiraEm: string }>("/conjunta/convite", { method: "POST" }),
  entrar: (codigo: string) => requisitar<EstadoConjunta>("/conjunta/entrar", { method: "POST", body: JSON.stringify({ codigo }) }),
  sair: () => requisitar<void>("/conjunta/sair", { method: "POST" }),
};
