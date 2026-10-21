<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Regras do MeuSaldo

- Trabalhar neste app (`controle_financeiro/meusaldo`) e no backend irmão
  `backend_meusaldo`; confirmar os diretórios antes de executar comandos.
- Preservar Next.js App Router, React, TypeScript, Tailwind e Express/Prisma/PostgreSQL.
- Seguir a decisão por feature: receita, despesa, saldo e sessao em `features/`.
  `app/` contém rotas pequenas e metadados; `shared/` apenas reutilizações reais.
- Server Components são o padrão. Usar `"use client"` somente quando necessário.
- Usar `next/link` e a camada HTTP compartilhada. Não colocar URLs da API na interface
  nem importar diretamente uma feature dentro de outra.
- Não criar pastas vazias, mocks permanentes, emojis ou bibliotecas por conveniência.
- A Fase 3 implementa autenticação e isolamento. Não avançar para
  Compose/Dockerfiles (Fase 4) sem solicitação do usuário.
- Toda consulta/operação financeira deve restringir usuarioId da sessão no backend;
  nunca confiar em proprietário enviado pelo cliente. Não armazenar tokens no storage.
- Usar os modelos e contratos em `shared/lib/financeiro.ts`; não somar dinheiro no frontend
  para substituir o saldo oficial da API. Datas são dias civis YYYY-MM-DD, exibidos em UTC.
- Testes com PostgreSQL devem usar um banco separado com nome terminado em `_test`.
  Não executar reset ou apagar registros reais. Seed somente por comando explícito.
- Preservar código válido, contratos HTTP, dados do banco e segredos locais.
- Não fazer commits, push, publicação ou hospedagem sem autorização explícita.
- Validar com `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` dentro deste app.
- Manter READMEs, `../ESTRUTURA.md` e `../ROTAS.md` coerentes com o código real.
- Registrar ADRs no `../README.md`, preservando datas comprovadas e justificando
  alternativas; relatórios em `../docs/FASE2.md` e `../docs/FASE3.md` distinguem
  evidências históricas do comportamento atual. Não duplicar ADRs no backend.
- Antes de commitar/enviar, revisar staged, segredos e `git diff --cached --check`.
  Ambientes privados, dependências, builds e saídas temporárias não são versionados.
