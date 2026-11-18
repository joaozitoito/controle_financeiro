import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const fonte = await readFile(new URL('../features/saldo/lib/painel.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { montarPainel, variacao } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

let id = 0;
const item = (tipo, valor, data, categoria = 'Geral') => ({ id: ++id, tipo, valor, data: `${data}T00:00:00.000Z`, categoria, descricao: 'x', criadoEm: `${data}T10:00:00.000Z` });

test('variação percentual sem base quando o anterior é zero', () => {
  assert.equal(variacao(10, 0), null);
  assert.equal(variacao(150, 100), 50);
});

test('recentes ordenados por data e categorias somadas em centavos', () => {
  const itens = [item('despesa', 0.1, '2026-11-02'), item('despesa', 0.2, '2026-11-03'), item('receita', 5, '2026-11-30')];
  const painel = montarPainel(itens, '2026-11');
  assert.deepEqual(painel.categorias, [{ nome: 'Geral', valor: 0.3 }]);
  assert.equal(painel.recentes[0].data.slice(0, 10), '2026-11-30');
  assert.equal(painel.semanas.length, 5);
  assert.equal(painel.semanas[4].entradas, 5);
});

test('agrupa categorias (top 5 + Outras) e semanas do mês', () => {
  const itens = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((categoria, i) => item('despesa', 70 - i * 10, '2026-02-0' + (i + 1), categoria));
  itens.push(item('receita', 5, '2026-02-28'));
  const painel = montarPainel(itens, '2026-02');
  assert.deepEqual(painel.categorias.map(c => c.nome), ['A', 'B', 'C', 'D', 'E', 'Outras']);
  assert.equal(painel.categorias.at(-1).valor, 20 + 10);
  assert.equal(painel.semanas.length, 4);
  assert.equal(painel.semanas[0].saidas, 70 + 60 + 50 + 40 + 30 + 20 + 10);
  assert.equal(painel.semanas[3].entradas, 5);
});
