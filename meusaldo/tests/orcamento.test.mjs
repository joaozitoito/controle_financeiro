import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const fonte = await readFile(new URL('../shared/lib/orcamento.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { faixaOrcamento, lerLimite } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('faixa do orçamento: azul < 80%, laranja 80–95%, vermelho ≥ 95%, rótulo no limite e acima', () => {
  assert.deepEqual(faixaOrcamento(79.4, 100), { percentual: 79, faixa: 'azul', rotulo: '' });
  assert.deepEqual(faixaOrcamento(2380, 2600), { percentual: 92, faixa: 'laranja', rotulo: '' });
  assert.deepEqual(faixaOrcamento(95, 100), { percentual: 95, faixa: 'vermelho', rotulo: 'NO LIMITE' });
  assert.deepEqual(faixaOrcamento(150, 100), { percentual: 150, faixa: 'vermelho', rotulo: 'ACIMA DO LIMITE' });
  assert.equal(faixaOrcamento(10, 0).percentual, 0);
});

test('limite digitado: vazio é sem limite, vírgula ou ponto com até 2 casas, inválido é undefined', () => {
  assert.equal(lerLimite('  '), null);
  assert.equal(lerLimite('2600,5'), 2600.5);
  assert.equal(lerLimite('40.25'), 40.25);
  for (const texto of ['0', '-1', '1.234,56', '1,001', 'abc', '99999999999']) assert.equal(lerLimite(texto), undefined, texto);
});
