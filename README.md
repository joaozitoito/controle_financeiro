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

## Decisões

### Decisão 1 - Organização do código

**Data:** 02/09/2026
**Contexto:** O projeto precisa de uma estrutura organizada de forma simples para poder separar as responsabilidades da aplicação.
**Decisão:** Organizar cada feature separando API, lógica de negócio e componentes, mantendo essas responsabilidades em pastas próprias.
**Consequências:** Cada parte da feature fica separada por responsabilidade, facilitando a manutenção e evolução do projeto.
**Alternativa Descartada:** Agrupar todo o código por tipo de arquivo sem considerar a separação das responsabilidades da feature.
