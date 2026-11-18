import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// O import de ./http só é usado por abrirEventos, que este teste não chama.
const fonte = (await readFile(new URL('../shared/lib/tempo-real.ts', import.meta.url), 'utf8')).replace(/^import .*\n/m, '');
const { outputText } = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { descreverEvento } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('descreverEvento: diz quem alterou e o quê, com texto genérico para recurso desconhecido', () => {
  const autor = { id: 2, nome: 'Ana' };
  assert.equal(descreverEvento({ tipo: 'dados', recurso: 'despesas', autor }), 'Ana atualizou as despesas.');
  assert.equal(descreverEvento({ tipo: 'dados', recurso: 'orcamentos', autor }), 'Ana atualizou o planejamento.');
  assert.equal(descreverEvento({ tipo: 'dados', recurso: 'outra', autor }), 'Ana atualizou os dados.');
  assert.equal(descreverEvento({ tipo: 'conjunta', autor }), 'Ana alterou a conta conjunta.');
});
