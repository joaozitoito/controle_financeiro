# Estrutura do Projeto

## Padrão de arquitetura

O projeto utiliza o padrão **por feature**, organizando as funcionalidades do sistema em módulos independentes. As rotas e telas seguem a estrutura do **App Router do Next.js**.

## Árvore do projeto

```text
meusaldo/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── receitas/
│   │   └── page.tsx
│   ├── despesas/
│   │   └── page.tsx
│   └── saldo/
│       └── page.tsx
│
├── features/
│   ├── receita/
│   ├── despesa/
│   └── saldo/
│
├── public/
│
├── ESTUTURA.md
├── README.md
├── package.json
├── tsconfig.json
└── next.config.ts
```

## Papel de cada pasta e arquivo

* **app/** — Contém as rotas e páginas da aplicação, seguindo o App Router do Next.js.
* **app/layout.tsx** — Layout principal compartilhado pela aplicação.
* **app/page.tsx** — Página inicial do sistema.
* **app/receitas/** — Rota e tela de receitas.
* **app/despesas/** — Rota e tela de despesas.
* **app/saldo/** — Rota e tela de saldo.
* **features/** — Agrupa as funcionalidades do sistema seguindo o padrão por feature.
* **features/receita/** — Contém os elementos relacionados à funcionalidade de receitas.
* **features/despesa/** — Contém os elementos relacionados à funcionalidade de despesas.
* **features/saldo/** — Contém os elementos relacionados à funcionalidade de saldo.
* **public/** — Armazena arquivos estáticos, como imagens e ícones.
* **README.md** — Documentação geral do projeto.
* **ESTRUTURA.md** — Documenta a organização e o padrão arquitetural utilizado.
* **package.json** — Contém as dependências e os scripts do projeto.
* **tsconfig.json** — Configura o TypeScript.
* **next.config.ts** — Contém configurações específicas do Next.js.
