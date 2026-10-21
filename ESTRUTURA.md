# Estrutura do projeto

O App Router define rotas pequenas; as features concentram a apresentação e o
acesso à API de seu domínio. Código efetivamente reutilizado fica em shared.
Os nomes singulares receita, despesa e saldo preservam a decisão original.

```text
controle_financeiro/
├── .gitignore
├── README.md
├── ESTRUTURA.md
├── ROTAS.md
├── docs/FASE2.md
├── docs/FASE3.md
└── meusaldo/
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx
    │   ├── not-found.tsx
    │   ├── receitas/page.tsx
    │   ├── despesas/page.tsx
    │   ├── login/page.tsx
    │   ├── registro/page.tsx
    │   └── saldo/page.tsx
    ├── features/
    │   ├── receita/
    │   │   ├── api/receitas.ts
    │   │   └── components/pagina-receitas.tsx
    │   ├── despesa/
    │   │   ├── api/despesas.ts
    │   │   └── components/pagina-despesas.tsx
    │   ├── sessao/
    │   │   ├── api/sessao.ts
    │   │   ├── lib/validacao.ts
    │   │   └── components/ # provider, proteção, cabeçalho e formulário
    │   └── saldo/
    │       ├── api/saldo.ts
    │       └── components/pagina-saldo.tsx
    ├── shared/
    │   ├── components/
    │   │   ├── navegacao.tsx
    │   │   ├── pagina-feature.tsx
    │   │   └── gerenciador-lancamentos.tsx
    │   └── lib/
    │       ├── http.ts
    │       ├── financeiro.ts
    │       └── saldo-api.ts
    ├── tests/
    │   ├── http.test.mjs
    │   ├── sessao.test.mjs
    │   └── financeiro.test.mjs
    ├── public/
    ├── .env.example
    ├── AGENTS.md
    ├── README.md
    ├── package.json
    ├── package-lock.json
    └── tsconfig.json
```

## Responsabilidades

- app: roteamento, metadados, cabeçalho e composição; layout preservado como Server Component.
- features: telas e endpoints específicos. Não há importação direta entre features.
- gerenciador-lancamentos: formulário, edição, confirmação de exclusão, filtro e
  estados de consulta compartilhados entre receitas/despesas. Recebe uma API tipada.
- financeiro: tipos do contrato, validação do formulário e formatação BRL/data.
- saldo-api: consulta oficial de totais reutilizada pelas listas e pelo resumo.
- sessao: cadastro/login, Context, restauração, expiração e logout; proteção das
  páginas no layout e invalidação central ao receber 401. Sem credenciais no storage.
- http: transporte e erros da Fase 1, cookies com credentials e header CSRF em mutações.
- tests: transporte e regras de formulário; fixtures só em testes.

As listas/formulários usam estado local; só a sessão tem Context global. Não há cache de dados financeiros
no navegador, React Router ou biblioteca de componentes. O resumo usa GET /saldo
para os totais; as listagens apenas fornecem os registros recentes.
A camada de API contém URLs e fetch não aparece em componentes visuais.
As decisões arquiteturais ficam somente nos [ADRs do README](README.md#decisões);
este mapa descreve a estrutura atual. `.gitignore` protege ambientes locais também
fora de `meusaldo/`; a pasta do app exclui dependências, builds e caches.

## Backend irmão

Express mantém as rotas existentes em src/rotas. validacao.ts valida e normaliza
os corpos; financeiro.ts serializa Decimal para manter o JSON numérico existente.
Prisma acessa PostgreSQL. Migrations estão em prisma/migrations, seed é explícito
e os testes de API/migração usam banco separado com sufixo _test.
auth/ contém validação, Argon2id, cookies/sessões e CSRF; rotas/auth.ts expõe
cadastro/login/me/logout. Usuario e Sessao se relacionam aos lançamentos no Prisma.
O middleware exige sessão e todas as consultas financeiras restringem usuarioId.
