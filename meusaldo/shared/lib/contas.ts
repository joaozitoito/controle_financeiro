import { diasEntre } from "./periodo";

// Import relativo de propósito: o teste troca "./periodo" pelo módulo transpilado.
export type Conta = {
  id: number;
  descricao: string;
  valor: number;
  categoria: string;
  vencimento: string;
  pagaEm: string | null;
  criadoEm: string;
};

export type Tom = "vermelho" | "laranja" | "neutro" | "paga";

const centavos = (valor: number) => Math.round(valor * 100);
const plural = (dias: number) => `${dias} ${dias === 1 ? "dia" : "dias"}`;

/** Texto e cor do prazo: até 2 dias vermelho, até 5 laranja; vencida em vermelho. */
export function situacaoConta(conta: Pick<Conta, "vencimento" | "pagaEm">, hoje: string): { texto: string; tom: Tom } {
  if (conta.pagaEm) return { texto: `paga em ${conta.pagaEm.slice(8, 10)}/${conta.pagaEm.slice(5, 7)}`, tom: "paga" };
  const dias = diasEntre(hoje, conta.vencimento);
  if (dias < 0) return { texto: `vencida · venceu há ${plural(-dias)}`, tom: "vermelho" };
  const texto = dias === 0 ? "vence hoje" : `vence em ${plural(dias)}`;
  return { texto, tom: dias <= 2 ? "vermelho" : dias <= 5 ? "laranja" : "neutro" };
}

/** Totais pago × em aberto de uma lista de contas, somados em centavos. */
export function totaisContas(contas: Pick<Conta, "valor" | "pagaEm">[]) {
  let pago = 0;
  let aberto = 0;
  for (const conta of contas) {
    if (conta.pagaEm) pago += centavos(conta.valor);
    else aberto += centavos(conta.valor);
  }
  return { pago: pago / 100, aberto: aberto / 100, percentualPago: pago + aberto ? Math.round((pago / (pago + aberto)) * 100) : 0 };
}

/** Receitas do mês − despesas do mês − contas em aberto do mês. */
export function sobraPrevista(receitas: number, despesas: number, contasAbertas: number): number {
  return (centavos(receitas) - centavos(despesas) - centavos(contasAbertas)) / 100;
}
