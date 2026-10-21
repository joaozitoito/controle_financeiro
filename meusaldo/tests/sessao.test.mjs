import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const fonte = await readFile(new URL('../features/sessao/lib/validacao.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(fonte, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { validarFormularioSessao, destinoSeguro } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const formulario = { nome:'Pessoa de teste', email:' pessoa@example.test ', senha:'Senha temporária longa!', confirmacao:'Senha temporária longa!' };

test('cadastro válido e login preservam formato de senha e validam os campos necessários', () => {
  assert.deepEqual(validarFormularioSessao('registro', formulario), {});
  assert.deepEqual(validarFormularioSessao('login', { ...formulario, nome:'', confirmacao:'' }), {});
});
test('cadastro exige nome, e-mail, senha longa e confirmação coincidente', () => {
  const erros = validarFormularioSessao('registro', { nome:'a', email:'inválido', senha:'curta', confirmacao:'outra' });
  assert.deepEqual(Object.keys(erros).sort(), ['confirmacao','email','nome','senha']);
  assert.ok(validarFormularioSessao('registro', { ...formulario, senha:' '.repeat(15) }).senha);
  assert.ok(validarFormularioSessao('login', { ...formulario, senha:'' }).senha);
});
test('retorno aceita apenas rotas financeiras internas e recusa redirecionamento externo', () => {
  for(const destino of [null,'https://atacante.example','//atacante.example','javascript:alert(1)','/login','/saldo/../login','/\\atacante.example','%2F%2Fatacante.example']) assert.equal(destinoSeguro(destino),'/saldo');
  assert.equal(destinoSeguro('/receitas?categoria=Trabalho#formulario'),'/receitas?categoria=Trabalho#formulario');
  assert.equal(destinoSeguro('/despesas'),'/despesas');
});
