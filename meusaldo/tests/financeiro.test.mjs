import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const fonte = await readFile(new URL('../shared/lib/financeiro.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { validarFormulario, formatarMoeda, formatarData } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const valido = { descricao: ' Salário ', valor: '1250,90', categoria: ' Trabalho ', data: '2026-10-21' };

test('formulário converte vírgula/ponto sem perder centavos e normaliza texto', () => {
  assert.deepEqual(validarFormulario(valido), { dados: { descricao: 'Salário', valor: 1250.9, categoria: 'Trabalho', data: '2026-10-21' }, campos: {} });
  assert.equal(validarFormulario({ ...valido, valor: '0.10' }).dados.valor, 0.1);
});
test('formulário rejeita limites monetários, frações de centavo e formatos ambíguos', () => {
  for (const valor of ['', '0', '-1', 'Infinity', '1,001', '1.250,90', '10000000000', '1e2']) {
    assert.ok(validarFormulario({ ...valido, valor }).campos.valor, valor);
  }
});
test('formulário rejeita campos incompletos e dias inexistentes', () => {
  const resultado = validarFormulario({ descricao: 'ab', valor: '10', categoria: '', data: '2026-02-30' });
  assert.equal(resultado.dados, undefined);
  assert.deepEqual(Object.keys(resultado.campos).sort(), ['categoria', 'data', 'descricao']);
  assert.equal(validarFormulario({ ...valido, data: '2024-02-29' }).dados.data, '2024-02-29');
});
test('formata BRL e preserva o dia UTC mesmo em fuso brasileiro', () => {
  assert.equal(formatarMoeda(1250.9).replace(/\s/g, ' '), 'R$ 1.250,90');
  assert.equal(formatarMoeda(-0.1).replace(/\s/g, ' '), '-R$ 0,10');
  assert.equal(formatarData('2026-10-21T00:00:00.000Z'), '21/10/2026');
});
