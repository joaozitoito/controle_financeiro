import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

async function modulo(caminho, trocas = {}) {
  const fonte = await readFile(new URL(caminho, import.meta.url), 'utf8');
  let { outputText } = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  for (const [de, para] of Object.entries(trocas)) outputText = outputText.replace(`"${de}"`, JSON.stringify(para));
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}

const urlPeriodo = await modulo('../shared/lib/periodo.ts');
const { deslocarMes, deslocarDia, diasEntre, hojeLocal, nomeMes } = await import(urlPeriodo);
const { situacaoConta, totaisContas, sobraPrevista } = await import(await modulo('../shared/lib/contas.ts', { './periodo': urlPeriodo }));

const hoje = '2026-12-03';
const conta = (vencimento, pagaEm = null) => ({ vencimento: `${vencimento}T00:00:00.000Z`, pagaEm });

test('períodos: meses, dias civis e nomes em português', () => {
  assert.equal(deslocarMes('2026-01', -1), '2025-12');
  assert.equal(deslocarMes('2026-12', 1), '2027-01');
  assert.equal(deslocarDia('2026-12-28', 7), '2027-01-04');
  assert.equal(diasEntre('2026-12-03', '2026-12-05T00:00:00.000Z'), 2);
  assert.equal(diasEntre('2026-12-03', '2026-11-30'), -3);
  assert.equal(diasEntre('2026-03-28', '2026-03-30'), 2);
  assert.equal(hojeLocal(new Date(2026, 0, 9, 23, 59)), '2026-01-09');
  assert.equal(nomeMes('2026-03'), 'Março de 2026');
  assert.equal(nomeMes('2026-03', true), 'Mar');
});

test('vence em X dias e cores: até 2 vermelho, até 5 laranja, depois neutro', () => {
  assert.deepEqual(situacaoConta(conta('2026-12-03'), hoje), { texto: 'vence hoje', tom: 'vermelho' });
  assert.deepEqual(situacaoConta(conta('2026-12-04'), hoje), { texto: 'vence em 1 dia', tom: 'vermelho' });
  assert.deepEqual(situacaoConta(conta('2026-12-05'), hoje), { texto: 'vence em 2 dias', tom: 'vermelho' });
  assert.deepEqual(situacaoConta(conta('2026-12-06'), hoje), { texto: 'vence em 3 dias', tom: 'laranja' });
  assert.deepEqual(situacaoConta(conta('2026-12-08'), hoje), { texto: 'vence em 5 dias', tom: 'laranja' });
  assert.deepEqual(situacaoConta(conta('2026-12-09'), hoje), { texto: 'vence em 6 dias', tom: 'neutro' });
});

test('vencida fica vermelha com "vencida"; paga mostra a data do pagamento', () => {
  assert.deepEqual(situacaoConta(conta('2026-12-02'), hoje), { texto: 'vencida · venceu há 1 dia', tom: 'vermelho' });
  assert.deepEqual(situacaoConta(conta('2026-11-28'), hoje), { texto: 'vencida · venceu há 5 dias', tom: 'vermelho' });
  assert.deepEqual(situacaoConta(conta('2026-11-28', '2026-12-01T15:30:00.000Z'), hoje), { texto: 'paga em 01/12', tom: 'paga' });
});

test('totais pago × aberto e sobra prevista em centavos', () => {
  const totais = totaisContas([{ valor: 0.1, pagaEm: '2026-12-01T00:00:00.000Z' }, { valor: 0.2, pagaEm: null }, { valor: 0.1, pagaEm: null }]);
  assert.deepEqual(totais, { pago: 0.1, aberto: 0.3, percentualPago: 25 });
  assert.deepEqual(totaisContas([]), { pago: 0, aberto: 0, percentualPago: 0 });
  assert.equal(sobraPrevista(9800, 6550, 3950.01), -700.01);
  assert.equal(sobraPrevista(0.3, 0.1, 0.1), 0.1);
});
