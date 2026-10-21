import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Usa o compilador já instalado, sem adicionar um runner ou alterar o código fonte.
const fonte = await readFile(new URL("../shared/lib/http.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(fonte, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { requisitar, ErroHttp, EVENTO_SESSAO_INVALIDA, novoCicloSessao } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

function ambiente(t, url) {
  const anterior = process.env.NEXT_PUBLIC_API_URL;
  if (url === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = url;
  t.after(() => {
    if (anterior === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = anterior;
  });
}

test("GET usa a base local, JSON e cache desabilitado", async (t) => {
  ambiente(t);
  t.mock.method(globalThis, "fetch", async (url, opcoes) => {
    assert.equal(url, "http://localhost:3001/saldo");
    assert.equal(opcoes.headers.get("Accept"), "application/json");
    assert.equal(opcoes.headers.has("Content-Type"), false);
    assert.equal(opcoes.cache, "no-store");
    return Response.json({ saldo: 25 });
  });
  assert.deepEqual(await requisitar("/saldo"), { saldo: 25 });
});

test("env com prefixo e barra final, body JSON e headers personalizados", async (t) => {
  ambiente(t, "http://localhost:4567/api/");
  t.mock.method(globalThis, "fetch", async (url, opcoes) => {
    assert.equal(url, "http://localhost:4567/api/receitas?categoria=Salario");
    assert.equal(opcoes.method, "POST");
    assert.equal(opcoes.body, '{"valor":10}');
    assert.equal(opcoes.headers.get("Content-Type"), "application/json");
    assert.equal(opcoes.headers.get("X-Teste"), "preservado");
    return Response.json({ id: 1 }, { status: 201 });
  });
  assert.deepEqual(await requisitar("/receitas?categoria=Salario", {
    method: "POST", body: JSON.stringify({ valor: 10 }), headers: { "X-Teste": "preservado" },
  }), { id: 1 });
});

test("204 não tenta interpretar JSON", async (t) => {
  ambiente(t);
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 204 }));
  assert.equal(await requisitar("/receitas/1", { method: "DELETE" }), undefined);
});

test("400 preserva erro e mensagens de campos válidas", async (t) => {
  ambiente(t);
  t.mock.method(globalThis, "fetch", async () => Response.json({
    erro: "Dados inválidos.", campos: { valor: "Informe um valor positivo.", invalido: 12 },
  }, { status: 400 }));
  await assert.rejects(requisitar("/receitas"), (erro) => {
    assert.ok(erro instanceof ErroHttp);
    assert.equal(erro.status, 400);
    assert.equal(erro.message, "Dados inválidos.");
    assert.deepEqual(erro.campos, { valor: "Informe um valor positivo." });
    return true;
  });
});

test("404 preserva o status e usa mensagem segura sem payload esperado", async (t) => {
  ambiente(t);
  t.mock.method(globalThis, "fetch", async () => Response.json(null, { status: 404 }));
  await assert.rejects(requisitar("/receitas/999"), (erro) => {
    assert.equal(erro.status, 404);
    assert.deepEqual(erro.campos, {});
    return true;
  });
});

test("resposta não JSON gera erro controlado sem expor HTML", async (t) => {
  ambiente(t);
  t.mock.method(globalThis, "fetch", async () => new Response("<html>erro interno</html>", { status: 502 }));
  await assert.rejects(requisitar("/saldo"), (erro) => {
    assert.equal(erro.status, 502);
    assert.equal(erro.message, "A API retornou uma resposta inválida.");
    return true;
  });
});

test("falha de conexão resulta em status zero", async (t) => {
  ambiente(t);
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("fetch failed"); });
  await assert.rejects(requisitar("/saldo"), (erro) => {
    assert.ok(erro instanceof ErroHttp);
    assert.equal(erro.status, 0);
    return true;
  });
});

test("cancelamento mantém o erro original e encaminha o signal", async (t) => {
  ambiente(t);
  const controlador = new AbortController();
  controlador.abort();
  t.mock.method(globalThis, "fetch", async (_url, opcoes) => {
    assert.equal(opcoes.signal, controlador.signal);
    throw controlador.signal.reason;
  });
  await assert.rejects(requisitar("/saldo", { signal: controlador.signal }),
    (erro) => erro === controlador.signal.reason);
});

test("configuração inválida falha antes de acessar a rede", async (t) => {
  ambiente(t, "ftp://localhost:3001");
  const transporte = t.mock.method(globalThis, "fetch", async () => Response.json({}));
  await assert.rejects(requisitar("/saldo"), /NEXT_PUBLIC_API_URL/);
  assert.equal(transporte.mock.callCount(), 0);
});

test('envia cookies e exige header de proteção em mutações', async (t) => {
  ambiente(t);
  t.mock.method(globalThis, 'fetch', async (_url, opcoes) => {
    assert.equal(opcoes.credentials, 'include');
    assert.equal(opcoes.headers.get('X-MeuSaldo-Request'), '1');
    return Response.json({ id:1 });
  });
  await requisitar('/receitas', { method:'POST', body:JSON.stringify({ valor:10 }), credentials:'omit' });
});

function janela(t) {
  const antiga = globalThis.window;
  globalThis.window = new EventTarget();
  t.after(() => { if(antiga === undefined) delete globalThis.window; else globalThis.window = antiga; });
  return globalThis.window;
}
test('401 financeiro avisa a sessão uma vez; login incorreto não dispara expiração', async (t) => {
  ambiente(t);
  let eventos = 0;
  janela(t).addEventListener(EVENTO_SESSAO_INVALIDA, () => eventos++);
  t.mock.method(globalThis,'fetch', async () => Response.json({ erro:'Não autorizado' }, { status:401 }));
  await assert.rejects(requisitar('/saldo'), erro => erro.status === 401);
  assert.equal(eventos,1);
  await assert.rejects(requisitar('/auth/login', {method:'POST'}), erro => erro.status === 401);
  assert.equal(eventos,1);
});
test('401 atrasado de uma sessão anterior não invalida a nova conta', async (t) => {
  ambiente(t);
  let eventos = 0;
  janela(t).addEventListener(EVENTO_SESSAO_INVALIDA, () => eventos++);
  let responder;
  t.mock.method(globalThis,'fetch', () => new Promise(resolve => { responder = resolve; }));
  const antiga = requisitar('/saldo');
  novoCicloSessao();
  responder(Response.json({ erro:'Sessão anterior expirada' }, { status:401 }));
  await assert.rejects(antiga, erro => erro.status === 401);
  assert.equal(eventos,0);
});

test('401 sem JSON também invalida a sessão sem expor o corpo inesperado', async (t) => {
  ambiente(t);
  let eventos = 0;
  janela(t).addEventListener(EVENTO_SESSAO_INVALIDA, () => eventos++);
  t.mock.method(globalThis,'fetch', async () => new Response('<html>Negado</html>', {status:401}));
  await assert.rejects(requisitar('/saldo'), erro => erro.status === 401);
  assert.equal(eventos,1);
});
