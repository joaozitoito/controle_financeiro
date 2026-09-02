# MeuSaldo

Sistema web de **controle financeiro pessoal**, desenvolvido como projeto acadêmico utilizando Next.js.

## 🎯 Objetivo

O MeuSaldo tem como objetivo auxiliar no controle das finanças pessoais, permitindo registrar receitas e despesas e acompanhar o saldo financeiro.

## 🚀 Funcionalidades

* Cadastro de receitas
* Cadastro de despesas
* Visualização do saldo

## 🏗️ Arquitetura

O projeto utiliza o padrão de organização **por feature**, agrupando os elementos relacionados a cada funcionalidade.

```text
app/
├── receitas/
├── despesas/
└── saldo/

features/
├── receita/
├── despesa/
└── saldo/
```

As rotas e páginas da aplicação são organizadas pelo **App Router do Next.js**, enquanto a pasta `features` concentra os elementos específicos de cada funcionalidade.

Mais detalhes sobre a organização do projeto no arquivo [ESTRUTURA.md](./ESTRUTURA.md).

## 🛠️ Tecnologias

* Next.js
* React
* TypeScript
* Tailwind CSS

## ▶️ Como executar

Instale as dependências:

```bash
npm install
```

Execute o projeto em modo de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:3000
```

## 📚 Projeto acadêmico

Projeto desenvolvido para a disciplina de **Arquitetura de Projeto**.
