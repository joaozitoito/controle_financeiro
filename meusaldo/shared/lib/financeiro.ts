export type Lancamento = {
  id: number;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  criadoEm: string;
};
export type DadosLancamento = Pick<Lancamento, "descricao" | "valor" | "categoria" | "data">;
export type FormularioLancamento = Omit<DadosLancamento, "valor"> & { valor: string };
export type Totais = { totalReceitas: number; totalDespesas: number; saldo: number };
export type ApiLancamentos = {
  listar: (categoria: string, signal?: AbortSignal) => Promise<Lancamento[]>;
  salvar: (dados: DadosLancamento, id?: number) => Promise<Lancamento>;
  excluir: (id: number) => Promise<void>;
};

export function validarFormulario(formulario: FormularioLancamento): { dados?: DadosLancamento; campos: Record<string, string> } {
  const campos: Record<string, string> = {};
  const descricao = formulario.descricao.trim();
  const categoria = formulario.categoria.trim();
  const textoValor = formulario.valor.trim();
  const valor = Number(textoValor.replace(",", "."));
  if (descricao.length < 3 || descricao.length > 100) campos.descricao = "Use de 3 a 100 caracteres na descrição.";
  if (!categoria || categoria.length > 60) campos.categoria = "Informe uma categoria com até 60 caracteres.";
  if (!/^\d+([.,]\d{1,2})?$/.test(textoValor) || !Number.isFinite(valor) || valor <= 0 || valor > 9_999_999_999.99) {
    campos.valor = "Informe um valor positivo de até 9.999.999.999,99, sem separador de milhar.";
  }
  const data = formulario.data;
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(data) && !data.startsWith("0000-") ? new Date(`${data}T00:00:00.000Z`) : new Date(NaN);
  if (Number.isNaN(dia.getTime()) || dia.toISOString().slice(0, 10) !== data) campos.data = "Informe uma data válida.";
  if (Object.keys(campos).length) return { campos };
  return { dados: { descricao, valor, categoria, data }, campos };
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

export function formatarData(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${data.slice(0, 10)}T00:00:00.000Z`));
}
