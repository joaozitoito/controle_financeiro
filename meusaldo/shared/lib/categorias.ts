import type { NomeIcone } from "@/shared/components/icone";

/** Lista fixa do formulário; registros antigos com texto livre caem em "Outros" no visual. */
export const CATEGORIAS = [
  { nome: "Trabalho", icone: "maleta", cor: "#10b981", fundo: "bg-emerald-50 text-emerald-600" },
  { nome: "Moradia", icone: "casa", cor: "#2563eb", fundo: "bg-blue-50 text-blue-600" },
  { nome: "Alimentação", icone: "carrinho", cor: "#8b5cf6", fundo: "bg-violet-50 text-violet-600" },
  { nome: "Transporte", icone: "carro", cor: "#f59e0b", fundo: "bg-amber-50 text-amber-600" },
  { nome: "Saúde", icone: "coracao", cor: "#f43f5e", fundo: "bg-rose-50 text-rose-600" },
  { nome: "Educação", icone: "livro", cor: "#06b6d4", fundo: "bg-cyan-50 text-cyan-600" },
  { nome: "Lazer e assinaturas", icone: "play", cor: "#f97316", fundo: "bg-orange-50 text-orange-600" },
  { nome: "Cartão de crédito", icone: "cartao", cor: "#ef4444", fundo: "bg-red-50 text-red-600" },
  { nome: "Outros", icone: "etiqueta", cor: "#94a3b8", fundo: "bg-slate-100 text-slate-600" },
] as const satisfies readonly { nome: string; icone: NomeIcone; cor: string; fundo: string }[];

export function categoriaVisual(nome: string) {
  const chave = nome.trim().toLocaleLowerCase("pt-BR");
  return CATEGORIAS.find(categoria => categoria.nome.toLocaleLowerCase("pt-BR") === chave) ?? CATEGORIAS[CATEGORIAS.length - 1];
}
