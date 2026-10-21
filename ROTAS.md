# Rotas e demonstração

| Rota | Comportamento |
| --- | --- |
| `/` | Redireciona temporariamente (307) para /saldo |
| `/login` | Acesso público; e-mail, senha e retorno interno seguro |
| `/registro` | Acesso público; nome, e-mail, senha e confirmação |
| `/saldo` | Totais gerais oficiais, lançamentos recentes e acesso aos cadastros |
| `/receitas` | Listar, cadastrar, editar, excluir e filtrar receitas |
| `/despesas` | Listar, cadastrar, editar, excluir e filtrar despesas |
| URL inexistente | 404 com link para o resumo |

Todas usam o layout compartilhado, menu ativo com aria-current, título próprio
com sufixo MeuSaldo e idioma pt-BR. As três páginas financeiras exigem sessão;
visitantes seguem para /login?retorno=..., sem montar o conteúdo privado.
Conta autenticada em /login ou /registro segue para o destino financeiro seguro.

## API Express (porta 3001)

| Rotas | Métodos |
| --- | --- |
| /receitas e /despesas | GET com ?categoria= opcional; POST |
| /receitas/:id e /despesas/:id | GET, PUT e DELETE |
| /saldo | GET de totalReceitas, totalDespesas e saldo |
| /auth/registro | POST público; cria conta (201), campos inválidos (400), duplicado (409) |
| /auth/login | POST público; cria sessão (200), credenciais incorretas (401), limite (429) |
| /auth/me | GET autenticado; usuário público e expiração (200), inválida (401) |
| /auth/logout | POST autenticado; revoga token e remove cookie (204) |

As páginas Next.js não substituem esses endpoints. Métodos, payloads e status
estão no README do backend. A comunicação usa NEXT_PUBLIC_API_URL.
Toda rota financeira retorna 401 sem sessão e restringe dados ao seu proprietário.
IDs inexistentes ou pertencentes a outra conta retornam 404. As mutações exigem
X-MeuSaldo-Request: 1; cookies são enviados pelo navegador com credentials: include.

## Demonstração com dados reais

1. Preparar PostgreSQL, executar as migrações e iniciar API e frontend.
2. Abrir a raiz, criar conta e fazer login. Conferir o resumo vazio da nova conta.
3. Cadastrar receita de 100,10 e despesa de 25,80 com descrição, categoria e data.
4. Recarregar as páginas: os registros continuam persistidos.
5. Editar receita para 125,90 e despesa para 25,90: o saldo fica R$ 100,00.
6. Filtrar por categoria exata e limpar o filtro. Totais gerais não são filtrados.
7. Cancelar uma exclusão; confirmar que o registro continua. Depois excluir ambos.
8. Conferir listas vazias e saldo zerado após excluir os últimos registros.
9. Testar formulário incompleto, teclado, URL direta, voltar e endereço inexistente.
10. Sair, criar outra conta e conferir que listas, filtros, recentes e totais são independentes.
11. Recarregar para restaurar a sessão; sair e confirmar bloqueio de /saldo.

Executar esse roteiro somente com registros próprios de demonstração; não apagar dados reais.
Os fluxos financeiros foram verificados na Fase 2 e repetidos com sessão na Fase 3.
Evidências históricas: [FASE2](docs/FASE2.md) e [FASE3](docs/FASE3.md).
