# Fase 2 — plano e registro de validação

Este é o registro histórico da Fase 2. O estado atual inclui a autenticação e o
isolamento implementados na [Fase 3](FASE3.md). Os 25 testes abaixo são o resultado
daquela etapa; a verificação consolidada das Fases 1–3 executou 49 testes aprovados.
Use os READMEs atuais para instalar/executar e os [ADRs](../README.md#decisões)
como fonte única das decisões. A finalização acadêmica autorizou posteriormente
os commits e pushes dos dois repositórios, sem deploy.

Objetivo: MVP financeiro acadêmico com Next.js → API Express → PostgreSQL real.
Escopo fornecido pelo usuário: CRUD de receitas/despesas, filtro por categoria,
saldo oficial, estados de interface, testes e documentação. Sem autenticação,
Dockerfiles/Compose, commits, push, bibliotecas de UI ou reorganização geral.

Execução inline com Superpowers (planejamento, TDD e verificação) e Ponytail.
O pedido autoriza executar sem uma nova rodada de aprovação do planejamento.
O workspace atual e as alterações da Fase 1 serão preservados, sem criar worktree.

## Tarefas verificáveis

- [x] Persistência/API: testes de validação primeiro; manter endpoints, payload numérico
  e status. Trocar Float por Decimal(12,2) com migração transacional que rejeita dados
  incompatíveis sem arredondá-los. PostgreSQL local dedicado; banco de teste separado.
  Remover seed automático, preservar seed como comando opcional. Testar CRUD real,
  filtro, 400/404, datas inválidas, centavos, saldo negativo e exclusão do último item.
- [x] Frontend: manter features e `requisitar`; APIs específicas por feature e tipos,
  validação/formatação compartilhados. Um componente financeiro reutilizado para as
  duas listas/formulários. Testar conversão de valores/datas, erros de campos e limites.
  Resumo obtém totais de GET /saldo e lançamentos das duas listagens, sem importar features.
- [x] Integração: testar no Brave via Playwright, com banco isolado de demonstração vazio.
  Criar/editar/excluir ambos os tipos; recarregar e verificar saldo no backend/banco.
  Conferir confirmação, foco inválido, filtro sem resultados, falha da API e 360 px.
- [x] Revisão/documentação: Impeccable e Web Design Guidelines em uma revisão proporcional;
  build, lint, tipagem e suites completas. Registrar comandos/resultados e limitações.

## Riscos e decisões

- A migração deve falhar se um banco antigo contiver valores com mais de dois centavos,
  fora do limite ou não finitos; a regularização desses dados exige decisão humana.
- Contrato continua enviando valores numéricos JSON; aritmética dos totais usa Decimal
  no backend. Limite de entrada: 9.999.999.999,99 por lançamento.
- Sem sessão nesta fase: aplicação apenas local, sem publicar ou expor dados.
- Datas são dias civis YYYY-MM-DD, persistidas em UTC e exibidas sem deslocamento local.
- Evitar submissões duplicadas e mensagens falsas de falha depois de uma gravação bem-sucedida.

## Registro

- Inspeção: frontend/backend corretos, alterações da Fase 1 preservadas; nenhum `.env`
  de banco existente no backend. Docker 29.9.1 disponível após autorização do sandbox.

## Resultados finais — 21/10/2026

| Verificação | Comando/evidência | Resultado |
| --- | --- | --- |
| Frontend | npm test | 13 aprovados, 0 reprovados; preservados os 9 HTTP da Fase 1 |
| Frontend lint | npm run lint | passou |
| Frontend tipos | npm run typecheck | passou |
| Frontend produção | npm run build e npm start | passou; aplicação servida localmente |
| Backend unitário/build | npm test | 5 aprovados, 0 reprovados; tsc passou |
| Backend integração | npm run test:integration | 7 aprovados, 0 reprovados com PostgreSQL real |
| Prisma | prisma validate / migrate status | schema válido; banco atualizado |
| Backend lint | inspeção de scripts | não existe script; não declarado como aprovado |
| Git | git diff --check nos dois repositórios | sem erros de whitespace |

Total automatizado: 25 testes aprovados, nenhum reprovado na execução final.
Falhas intermediárias de reprodução e do teste de migração foram corrigidas e
reexecutadas; não há teste ignorado para obter a aprovação.

### Fluxos reais no Brave via Playwright MCP

Confirmado com navigator.brave.isBrave(). Foram exercitados:

- Cadastro, consulta, edição e exclusão de receitas e despesas pela interface.
- Persistência após recarga; conferência SQL direta de numeric e data no PostgreSQL.
- Receita 125,90 e despesa 25,90 produziram saldo oficial e visual de R$ 100,00.
- Filtro sem resultados, limpar filtro e preservação dos totais gerais.
- Cancelar e confirmar exclusão; remover últimos registros; saldo negativo e zero.
- Formulário incompleto, aria-invalid e foco no primeiro campo inválido.
- Resposta 400 por campo injetada somente no teste de transporte visual; dados e foco
  preservados. O 400 real da API também está coberto pela suite de integração.
- API realmente desligada: falha de envio preservou os campos; consulta exibiu erro
  e retry. Ao religar, retry recuperou os dados persistidos.
- Corrigida corrida de foco após 400: efeito aguarda reabilitar os inputs; teste repetido três vezes.
- Telas a 360 px e 1280 px, sem overflow horizontal; controles/menu com altura mínima 44 px.
- 404 e retorno ao resumo preservados. Reinício da API compilada manteve banco vazio,
  comprovando ausência de seed automático. Build de produção também foi aberto no navegador.

As transações E2E foram criadas e excluídas apenas no PostgreSQL dedicado desta execução.
O banco de desenvolvimento terminou vazio; não foi executado seed nem reset.
O teste de migração criou/removeu somente seu schema isolado na base _test.
A migração foi refinada com lock antes da entrega; os checksums dos dois bancos
novos desta execução foram alinhados após conferir que a única diferença era a linha
LOCK TABLE. Nenhum histórico ou dado de banco anterior foi tocado.

### Revisão visual e de código

Frontend Design orientou a extensão da identidade da Fase 1: azul discreto, tipografia
existente, formulário direto e listas que empilham no celular. Impeccable foi usado
para contexto/detector e inspeção de screenshots; Web Design Guidelines da Vercel
foi usado na mesma revisão de semântica, foco, labels, estados e responsividade.
Ajustes: foco pós-envio, campos sem autocomplete indevido, nomes de inputs e alvos de toque.
O detector em gerenciador-lancamentos.tsx apontou apenas border-accent-on-rounded:
tratamento herdado da Fase 1 e preservado conforme o briefing, sem prejuízo funcional observado.
Não se declara certificação WCAG nem teste em aparelho físico.

Uma revisão independente read-only via subagente Superpowers não encontrou problemas
relevantes no escopo acadêmico local. Os testes de migração pendentes naquela revisão
passaram posteriormente. Nenhum arquivo foi alterado pelo revisor.

### Ferramentas e decisões proporcionais

Usados: Superpowers (contexto, plano inline, TDD, diagnóstico, verificação e revisão),
Ponytail, Frontend Design, Impeccable, Web Design Guidelines, Playwright MCP/Brave,
Prisma, runner de testes do Node e Docker apenas para o PostgreSQL isolado.
Graphify foi dispensado: a árvore pequena e os imports já esclareceram as dependências.
Skills de Emil/motion não foram necessárias; nenhuma animação foi adicionada.
Sites, publicação, hospedagem, autenticação e Compose/Dockerfiles não foram usados.

Decisões: reaproveitar workspace/alterações da Fase 1; manter payloads numéricos;
compartilhar o formulário/lista entre dois domínios; seed explícito; nenhuma nova
biblioteca de aplicação. Planejamento e execução seguiram inline conforme a autorização
para prosseguir sem novas aprovações. Nenhum commit ou push foi feito.

### Limites e próximas fases

Fase 2 concluída no ambiente local verificado. Naquele momento, autenticação,
usuários e isolamento eram pendências; foram concluídos e validados na [Fase 3](FASE3.md).
Não há validação de implantação como serviço financeiro em produção.
Rascunhos não sobrevivem a navegação/recarga. Paginação, sincronização entre abas,
idempotência de gravações e testes de carga não fazem parte desta entrega.
Listas completas são buscadas para compor os oito lançamentos recentes; considerar
endpoint paginado quando o volume deixar de ser acadêmico. Totais de contas muito
acima da precisão segura de centavos do JSON numérico exigiriam contrato decimal em texto.
Mobile foi verificado por viewport emulado no Brave, sem celular físico/leitor de tela.
