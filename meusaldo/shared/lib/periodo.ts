// Sem imports de runtime: os testes transpilam este arquivo isoladamente.
const NOMES_MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIA_MS = 86_400_000;

/** Dia civil local do navegador em YYYY-MM-DD. */
export function hojeLocal(agora = new Date()): string {
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
}

export function mesAtual(): string {
  return hojeLocal().slice(0, 7);
}

export function deslocarMes(mes: string, delta: number): string {
  const dia = new Date(`${mes}-01T00:00:00.000Z`);
  dia.setUTCMonth(dia.getUTCMonth() + delta);
  return dia.toISOString().slice(0, 7);
}

export function deslocarDia(dia: string, delta: number): string {
  return new Date(Date.parse(`${dia}T00:00:00.000Z`) + delta * DIA_MS).toISOString().slice(0, 10);
}

/** Diferença em dias civis entre duas datas YYYY-MM-DD (ou ISO), positiva quando "ate" é depois de "de". */
export function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(`${ate.slice(0, 10)}T00:00:00.000Z`) - Date.parse(`${de.slice(0, 10)}T00:00:00.000Z`)) / DIA_MS);
}

export function nomeMes(mes: string, curto = false): string {
  const nome = NOMES_MESES[Number(mes.slice(5, 7)) - 1];
  return curto ? nome.slice(0, 3) : `${nome} de ${mes.slice(0, 4)}`;
}
