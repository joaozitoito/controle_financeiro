import { requisitar } from "@/shared/lib/http";

export type Usuario = { id: number; nome: string; email: string };
export type Sessao = { usuario: Usuario; expiraEm: string };

export const sessaoApi = {
  consultar: (signal?: AbortSignal) => requisitar<Sessao>("/auth/me", { signal }),
  entrar: (email: string, senha: string) => requisitar<Sessao>("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) }),
  registrar: (nome: string, email: string, senha: string) => requisitar<{ usuario: Usuario }>("/auth/registro", { method: "POST", body: JSON.stringify({ nome, email, senha }) }),
  sair: () => requisitar<void>("/auth/logout", { method: "POST" }),
};
