# MeuSaldo — frontend

MVP acadêmico em Next.js 16.3.4, React 19.2.8, TypeScript e Tailwind CSS 4.
Usa App Router e organização por feature.

## Funcionalidades das Fases 2 e 3

- Receitas e despesas: listar, cadastrar, editar, excluir com confirmação e filtrar por categoria exata.
- Resumo: saldo oficial, totais gerais e os oito lançamentos mais recentes.
- Valores em BRL, datas sem deslocamento de fuso, validação local e erros da API por campo.
- Carregamento, listas vazias, sucesso, erro e tentativa de recarregar sem apagar o formulário.
- Navegação com rota ativa, 404, teclado e layout adaptável ao celular.
- Cadastro, login, identificação da conta, restauração de sessão, expiração e logout.
- Dados financeiros privados por usuário, com autorização efetiva na API.

Nenhum dado financeiro é armazenado em localStorage ou inventado pela interface.
Conta nova exibe estado vazio. Esta aplicação é de uso local.

## Executar

Requer Node.js 20.9+ e npm. Os repositórios devem ser irmãos:

```text
MeuSaldo-workspace/
├── controle_financeiro/meusaldo/  # frontend, porta 3000
└── backend_meusaldo/             # API, porta 3001
```

Dentro de `controle_financeiro/meusaldo`:

```powershell
npm ci
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Não sobrescreva um arquivo de ambiente já configurado. Inicie também PostgreSQL e
API conforme o [README do backend](https://github.com/joaozitoito/backend_meusaldo#executar).
O roteiro de clone dos dois repositórios está no [README principal](../README.md#executar).
Abra `http://localhost:3000`; a raiz leva a `/saldo`.
O build usa fontes do sistema, sem baixar fontes externas.

`NEXT_PUBLIC_API_URL` é a base pública da API, padrão `http://localhost:3001`.
Variáveis `NEXT_PUBLIC_` ficam no bundle: não contêm segredos. Após alterar, reinicie
o dev server ou refaça o build. O CORS no backend precisa aceitar a origem exata do
frontend, inclusive host e porta.

## Uso

Crie uma conta em `/registro` (nome, e-mail e senha de 12–128 caracteres), confirme a
senha e entre em `/login`. Sem sessão, as páginas financeiras redirecionam ao login.
O cabeçalho mostra a conta atual e o botão Sair. A sessão dura uma hora e é restaurada
após recarregar. Nenhum token ou senha fica em localStorage/sessionStorage.

Na página de receitas ou despesas, preencha descrição (3–100 caracteres), valor,
categoria (até 60 caracteres) e data. O valor aceita vírgula ou ponto decimal, até
duas casas, sem ponto de milhar: `1250,90`. Limite por lançamento: R$ 9.999.999.999,99.

Editar preenche o mesmo formulário; “Cancelar edição” descarta essa edição.
Excluir pede confirmação no navegador. O filtro usa o nome exato da categoria.
Os totais mostrados são gerais, inclusive com filtro ativo. As listas são ordenadas
por data decrescente e, em empates, pelo ID.

Após salvar/excluir, lista e totais são recarregados. Se essa recarga falhar, a
mensagem de sucesso da gravação permanece e a consulta oferece “Tentar novamente”.
O resumo consulta os dados ao entrar na página e também tem atualização manual.

Rascunhos existem somente na página atual: são preservados após falhas de envio,
mas não após recarregar ou sair da página. Não há retry automático de gravações.
Revalidar a mesma sessão ao voltar à aba preserva o rascunho, ocultando e bloqueando
a tela durante a verificação. Logout, expiração, erro de sessão ou troca de conta
descartam os componentes financeiros e seus dados.

## Arquitetura e cliente HTTP

As páginas do App Router compõem features. As APIs de receitas/despesas usam
`requisitar`; o componente compartilhado contém o fluxo comum dos formulários/listas.
O resumo compõe suas consultas sem importar outra feature. O layout permanece
Server Component; telas interativas e navegação usam Client Components.

`shared/lib/http.ts` preserva a implementação da Fase 1: base por ambiente, headers JSON,
cache desabilitado, resposta 204 sem corpo, `ErroHttp` com status/mensagem/campos,
falha de conexão com status 0 e cancelamento via AbortSignal. Tipos genéricos não
substituem validação de esquema em runtime.

A feature `sessao` integra `/auth/registro`, `/auth/login`, `/auth/me` e `/auth/logout`.
`SessaoProvider` coordena a sessão, um timer de expiração e comunicação entre abas.
`ProtecaoSessao` impede montar dados privados antes da confirmação e usa a identidade
como chave. O HTTP envia cookies (`credentials: include`) e X-MeuSaldo-Request: 1
em mutações; 401 dispara invalidação central, sem redirects em cada chamada.
Respostas antigas não invalidam um ciclo de sessão mais recente.

## Testes e build

```powershell
npm test
npm run lint
npm run typecheck
npm run build
npm start
```

Os 20 testes incluem os 13 anteriores e sete de cookies, CSRF, 401, validação de
acesso e retorno seguro. Usam o runner do Node e TypeScript
já instalados, sem biblioteca adicional.

Os testes integrados e de migração ficam no backend. Os fluxos reais foram
verificados no Brave via Playwright MCP; evidências e limites estão em
[FASE2.md](../docs/FASE2.md) e [FASE3.md](../docs/FASE3.md).

## Documentação

[Decisões](../README.md) · [Estrutura](../ESTRUTURA.md) · [Rotas](../ROTAS.md) · [AGENTS](./AGENTS.md)
