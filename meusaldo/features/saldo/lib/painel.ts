// Sem imports de runtime: o teste transpila este arquivo isoladamente.
export type ItemPainel = {
  id: number;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  criadoEm: string;
  tipo: "receita" | "despesa";
};

/** Contas em centavos inteiros para não acumular erro de ponto flutuante. */
const centavos = (valor: number) => Math.round(valor * 100);

export function variacao(atual: number, anterior: number): number | null {
  return anterior === 0 ? null : ((atual - anterior) / Math.abs(anterior)) * 100;
}

/** Agrupa os lançamentos de um único mês (já filtrados pela API com ?mes=). */
export function montarPainel(itens: ItemPainel[], mes: string) {
  const porCategoria = new Map<string, number>();
  for (const item of itens) {
    if (item.tipo === "despesa") porCategoria.set(item.categoria, (porCategoria.get(item.categoria) ?? 0) + centavos(item.valor));
  }
  const ordenadas = [...porCategoria].sort((a, b) => b[1] - a[1]);
  const categorias = ordenadas.slice(0, 5).map(([nome, valor]) => ({ nome, valor: valor / 100 }));
  const restante = ordenadas.slice(5).reduce((total, [, valor]) => total + valor, 0);
  if (restante) categorias.push({ nome: "Outras", valor: restante / 100 });

  const diasNoMes = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0)).getUTCDate();
  const semanas = Array.from({ length: Math.ceil(diasNoMes / 7) }, () => ({ entradas: 0, saidas: 0 }));
  for (const item of itens) {
    const semana = semanas[Math.ceil(Number(item.data.slice(8, 10)) / 7) - 1];
    if (item.tipo === "receita") semana.entradas += centavos(item.valor);
    else semana.saidas += centavos(item.valor);
  }

  return {
    categorias,
    semanas: semanas.map(semana => ({ entradas: semana.entradas / 100, saidas: semana.saidas / 100 })),
    recentes: [...itens].sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm) || b.id - a.id),
  };
}
