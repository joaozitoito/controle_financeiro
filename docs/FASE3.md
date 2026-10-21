# Fase 3 — autenticação e isolamento

Este relatório registra a implementação e a validação da Fase 3. A finalização
acadêmica das Fases 1–3, também em 21/10/2026, harmonizou os documentos e autorizou
separadamente commits e push normal dos dois repositórios existentes. As restrições
de Git citadas no relato abaixo pertencem à execução original da implementação.
Os [ADRs](../README.md#decisões) são a fonte única das decisões; os READMEs atuais
contêm o preparo de um clone limpo e usam somente marcadores nos ambientes de exemplo.

## Plano e decisões

Execução inline com Superpowers e Ponytail, preservando as alterações das Fases 1/2
no workspace solicitado. Sem novo projeto, reset, commits, push, publicação ou Fase 4.
O pedido já autoriza execução contínua das decisões reversíveis; não haverá nova
rodada de aprovação do plano. A arquitetura existente continua como base.

- [x] Persistência: contar registros antes de migrar; adicionar Usuario e Sessao,
  relações obrigatórias e índices. A migração aborta transacionalmente se houver
  registros antigos sem dono. Não atribuir registros ao primeiro cadastro.
- [x] Backend: Argon2id (19 MiB, 2 iterações, paralelismo 1), e-mail normalizado,
  sessão aleatória de 256 bits por uma hora, só SHA-256 do token no banco;
  cookie HttpOnly/SameSite=Lax/host-only/Secure em produção. Cadastro, login,
  GET /auth/me e logout revogável. Limite de tentativas com biblioteca mantida.
- [x] Autorização: todas as rotas financeiras exigem sessão; filtrar pelo usuário
  da sessão em cada operação Prisma, inclusive update/delete, filtros e agregados.
  IDs de outra conta retornam 404; usuarioId/userId enviados pelo cliente não autorizam nada.
- [x] Segurança: custom header em mutações, allowlist exata de Origin/CORS com
  credentials, rejeitar Fetch Metadata cross-site, no-store e logs sem segredos.
- [x] Testes primeiro: preservar CRUD monetário autenticado; acrescentar cadastro,
  erros, cookie, expiração, revogação, CSRF, rate limit e duas contas independentes.
- [x] Frontend: feature sessao com Context, /login e /registro; cookies no cliente
  HTTP; tratamento central de 401, proteção sem renderizar dados privados antes
  de validar sessão, restauração e expiração, limpeza ao sair/trocar de conta.
- [x] Verificação: build/lint/tipos/suites, Brave via Playwright com contas somente
  em banco controlado; isolamento por chamadas diretas e telas em 360/768/1280 px.
  Revisão visual proporcional e revisão final de segurança/código.

## Inspeção antes da migração

- Diretórios confirmados: controle_financeiro/meusaldo e backend_meusaldo, sob
  C:/Users/joao/Desktop/frameworkweb/MeuSaldo-workspace.
- Os dois repositórios estavam na branch main com mudanças não commitadas das
  Fases 1/2; foram preservadas. Nenhum checkout/reset/commit/push foi executado.
- Banco de desenvolvimento consultado: 0 receitas e 0 despesas sem proprietário.
- Sessões de teste usarão base exclusiva com nome terminado em _test.
- Dependências justificadas: argon2 e express-rate-limit; sem framework de autenticação.

## Referências técnicas

- OWASP Password Storage: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP CSRF (custom headers + CORS/Origin): https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- OWASP Session Management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

## Resultados

Validação realizada em 21/10/2026, Windows/PowerShell, Node 24.20.0, npm 11.19.0.

| Verificação executada | Resultado |
| --- | --- |
| Frontend `npm test` | 20/20 aprovados; inclui os 13 testes anteriores |
| Frontend `npm run lint` | aprovado |
| Frontend `npm run typecheck` | aprovado |
| Frontend `npm run build` | aprovado; /login, /registro e páginas financeiras |
| Backend `npm test` | 9/9 aprovados; inclui os 5 testes anteriores |
| Backend `npm run test:integration` | 20/20 aprovados; CRUD anterior adaptado à sessão |
| Backend `npm run build` | aprovado, executado também pelas suites |
| Backend lint | não há script configurado; não foi declarado aprovado |
| `npx prisma validate` | schema válido |
| `npx prisma migrate status` | três migrações aplicadas; desenvolvimento atualizado |
| Brave + Playwright MCP | fluxos abaixo aprovados |

Total automatizado: **49 testes**. Os roteiros no navegador são verificações
adicionais; não entram nesse número. Não houve teste pulado ou enfraquecimento
das regras monetárias para acomodar autenticação.

### Arquitetura entregue

- `Usuario`: id, nome, email normalizado/único, senhaHash Argon2id, criadoEm,
  atualizadoEm. `Sessao`: tokenHash como chave, usuarioId, criadoEm e expiraEm;
  remoção de usuário elimina suas sessões. Lançamentos têm usuarioId obrigatório,
  FK com Restrict para não apagar lançamentos por cascata e índice por usuário/data/id.
- `backend_meusaldo/src/auth`: validação, senha, sessão/cookie e CSRF.
  `src/rotas/auth.ts`: POST /auth/registro, POST /auth/login, GET /auth/me,
  POST /auth/logout. Respostas só incluem usuário público e expiração.
- As rotas existentes continuam independentes para receitas/despesas. Cada query
  Prisma usa usuarioId da sessão; updates/deletes restringem id e usuarioId na
  própria operação. Filtros, totais e dados usados para recentes têm o mesmo escopo.
- `features/sessao`: API, validação, formulário de login/cadastro, Context,
  cabeçalho e proteção. `app/login` e `app/registro` compõem a feature; layout
  continua Server Component e envolve as telas com provider/proteção.
- HTTP central envia cookies e header próprio; 401 invalida a sessão, com controle
  de ciclo para respostas antigas. Conteúdo privado não monta na verificação inicial.
  Logout/expiração/troca de identidade descartam os componentes financeiros.
  Revalidar a mesma conta oculta e bloqueia o conteúdo sem perder o rascunho.

### Banco e preservação

A contagem antes da migração foi zero receitas/zero despesas; por isso foi possível
adicionar proprietário obrigatório diretamente. A nova migração bloqueia escritores
na transação e aborta integralmente se encontrar qualquer registro financeiro antigo.
O teste cria um schema próprio, demonstra esse bloqueio sem perda/atribuição e
aplica a migração com sucesso quando o schema está vazio.

Nenhum reset, truncate, recriação de tabela ou associação automática foi usado.
Se outro banco contiver dados antigos sem dono, será necessária uma estratégia
de vinculação autorizada pelo responsável antes de migrar; não tentar contornar
essa proteção. As migrações anteriores foram preservadas nesta fase.

Contas E2E existiram somente em `meusaldo_test`. A API foi iniciada temporariamente
com DATABASE_URL apontando a essa base por variável do processo, sem sobrescrever
o .env de desenvolvimento. Ao terminar, foram removidos somente os três usuários
criados pelo roteiro (incluindo uma tentativa inicial da ferramenta), seus registros
e suas sessões. Conferência final da base de testes: zero usuários/receitas/despesas.
Cookies, contextos extras e credenciais em memória do roteiro foram descartados.
A API voltou ao banco de desenvolvimento, sem contas ou lançamentos de demonstração.

### Evidências Brave/Playwright

- Brave confirmado por navigator.brave.isBrave(). Acesso anônimo a /saldo levou
  ao login sem cartões financeiros. Cadastro mostrou sucesso e validações por
  campo, incluindo confirmação de senha. Login incorreto mostrou mensagem genérica.
- Conta A autenticou, recarregou mantendo sessão e navegou pelas três telas.
  Cadastro pela interface: receita 125,90 e despesa 25,90; saldo oficial 100,00.
  Cookie real HttpOnly, SameSite=Lax, Path=/, sem Domain; Secure desativado apenas
  no HTTP local. localStorage e sessionStorage permaneceram vazios.
- Logout bloqueou /saldo direto; replay do cookie revogado retornou 401.
  A conta B começou com listas/totais vazios, sem os dados de A. Seus lançamentos
  de 40,00 e 5,00 produziram saldo 35,00, enquanto A permaneceu em 100,00.
- Com duas sessões independentes, 12 chamadas diretas GET/PUT/DELETE contra IDs
  da outra conta (receita e despesa, nos dois sentidos) retornaram 404. Os recentes
  da interface B continham somente seus dois lançamentos.
- Regressão do CRUD B: editar receita, filtrar categoria sem resultados, limpar
  filtro, cancelar exclusão e depois confirmar exclusão. Saldo resultante -5,00.
  Logout em uma aba removeu dados e rascunho da outra. Novo login voltou à rota
  financeira solicitada.
- Expiração real forçada somente na sessão da fixture B no banco de teste:
  Atualizar resumo recebeu 401, removeu os dados e levou ao login.
- Login e cadastro em 360/768/1280 px: sem overflow horizontal, labels associadas,
  autocomplete apropriado e campos/botão de 44 px. Tab percorreu e-mail, senha e
  submit; Enter validou o formulário e focou o primeiro campo inválido do login.
  As seis capturas foram inspecionadas visualmente, sem credenciais:
  [login 360](evidencias/fase3-login-360.png), [cadastro 360](evidencias/fase3-registro-360.png),
  [login 768](evidencias/fase3-login-768.png), [cadastro 768](evidencias/fase3-registro-768.png),
  [login 1280](evidencias/fase3-login-1280.png), [cadastro 1280](evidencias/fase3-registro-1280.png).

### Revisão e correções verificadas

Uma revisão independente do código identificou dois problemas P2, ambos corrigidos:

1. Revalidação da mesma sessão desmontava o formulário. O roteiro Playwright
   reproduziu a perda do rascunho antes da correção e confirmou sua preservação
   depois. Durante a consulta, a árvore fica hidden/inert; só uma mudança de
   identidade, expiração ou falha real descarta o estado.
2. Um 401 atrasado podia remover o cookie de um login novo. Novo teste de integração
   falhou antes da correção, passou depois e entrou na suite completa de 20.
   Respostas 401 não enviam mais Set-Cookie de remoção; logout explícito mantém
   revogação e limpeza. Um contexto separado no Brave confirmou consulta antiga
   401 seguida de sessão nova ainda válida (200).

Não restaram achados importantes ou menores da revisão. A revisão visual manteve
tipografia, cores e controles existentes; sem reconstruir telas financeiras.

### Executar e repetir

1. Iniciar PostgreSQL; neste ambiente: `docker start meusaldo-fase2-postgres`.
2. Em backend_meusaldo, preservar/configurar .env com DATABASE_URL e CORS_ORIGINS.
   Em instalação nova: npm ci; npm run prisma:generate; npm run db:migrate.
   Depois npm run build e npm start (ou npm run dev).
3. Em controle_financeiro/meusaldo, configurar .env.local conforme .env.example
   sem sobrescrever ambiente existente. npm ci; npm run dev, ou npm run build e npm start.
4. Abrir http://localhost:3000, cadastrar a própria conta e fazer login. Não há
   usuário/senha padrão. Usar localhost nos dois serviços locais.
5. Frontend: npm test; npm run lint; npm run typecheck; npm run build.
   Backend: npm test; npm run test:integration (exige .env.test e base exclusiva _test).
   As suites criam e limpam somente suas próprias fixtures. Para repetir E2E,
   apontar a API temporariamente à mesma base controlada, sem criar contas de teste em dev.

### Ferramentas e limites

Superpowers: plano proporcional, TDD de regras críticas, diagnóstico, verificação
e uma revisão independente ao final. Ponytail: reaproveitamento da arquitetura,
sem framework de autenticação. Frontend Design, Impeccable e Web Design Guidelines:
identidade existente, estados de formulário, semântica, foco e responsividade.
Playwright MCP: fluxos reais no Brave, PostgreSQL de teste e capturas verificadas.
Graphify e Emil não foram necessários: relações pequenas/claras e sem necessidade
de animação nova. Sites e ferramentas de publicação não foram usados.

- Rate limit em memória atende a uma instância; reiniciar zera contadores.
  Antes de escalar, configurar armazenamento compartilhado e proxy confiável.
- Produção HTTPS, proxy, múltiplas instâncias e dispositivos físicos não foram
  validados. O teste confirmou os atributos Secure/__Host- do cookie de produção,
  sem alegar validação de uma implantação HTTPS.
- Sem recuperação/validação de e-mail, 2FA, login social, administração de sessões
  ou expurgo periódico global de sessões expiradas. Esses itens não fazem parte desta fase.
- Rascunhos continuam locais à página, sem persistência após recarga/navegação;
  logout, troca de conta, expiração ou falha de validação de sessão descartam-nos.
- Sem commit, push, publicação ou avanço à Fase 4. Nenhum bloqueio restante.

### Verificação para a finalização acadêmica — 21/10/2026

Executadas novamente no estado destinado ao Git: frontend npm test (20/20), lint,
typecheck e build aprovados; backend npm test (9/9), test:integration (20/20), build
TypeScript e prisma validate aprovados. Os testes integrados usam exclusivamente
a base `_test`, sem reset ou limpeza de dados preexistentes. Não houve mudança
funcional nesta finalização. O backend continua sem script de lint.

As evidências Brave acima pertencem à implementação já concluída; não se alega
uma nova rodada E2E nesta revisão de documentação. As capturas versionadas são
somente das telas públicas vazias. Revisão pré-commit abrange arquivos candidatos,
ignore de ambientes/builds e buscas por credenciais/segredos, antes de staged e commit.
Na revisão dos candidatos, não houve correspondência com valores secretos dos
ambientes privados nem tokens/chaves/cookies concretos; as duas URLs de banco
versionáveis contêm somente marcadores. Os literais de senha nos testes unitários
validam regras/hash e não pertencem às contas E2E, cujas credenciais eram aleatórias.
O envio de código ao GitHub não publica a aplicação nem inicia a Fase 4.
