// Sem imports de runtime: o teste transpila este arquivo isoladamente.
export type ResumoOrcamento = {
  mes: string;
  limite: number;
  gasto: number;
  categorias: { categoria: string; limite: number; gasto: number }[];
};

/** Faixa da barra: azul abaixo de 80%, laranja de 80% a 95%, vermelho a partir de 95%. */
export function faixaOrcamento(gasto: number, limite: number) {
  const percentual = limite > 0 ? Math.round((gasto / limite) * 100) : 0;
  const faixa = percentual >= 95 ? "vermelho" : percentual >= 80 ? "laranja" : "azul";
  const rotulo = percentual > 100 ? "ACIMA DO LIMITE" : percentual >= 95 ? "NO LIMITE" : "";
  return { percentual, faixa, rotulo } as const;
}

export const COR_FAIXA = { azul: "bg-blue-600", laranja: "bg-orange-500", vermelho: "bg-red-500" } as const;

/** Campo de limite: vazio = sem limite (null); inválido = undefined. Mesma regra de valor dos lançamentos. */
export function lerLimite(texto: string): number | null | undefined {
  const limpo = texto.trim();
  if (!limpo) return null;
  const valor = Number(limpo.replace(",", "."));
  return /^\d+([.,]\d{1,2})?$/.test(limpo) && valor > 0 && valor <= 9_999_999_999.99 ? valor : undefined;
}
