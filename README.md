# MeuSaldo

Sistema acadêmico de controle financeiro pessoal em Next.js, React, TypeScript e
Tailwind CSS. A API usa Express, Prisma e PostgreSQL em repositório separado.
O objetivo é registrar receitas e despesas e acompanhar o saldo.

## Estado atual

A Fase 3 adiciona cadastro, login, sessão por cookie HttpOnly e dados isolados por
usuário. O CRUD, filtros, resumo e lançamentos recentes da Fase 2 foram preservados.
Compose/Dockerfiles continuam fora desta fase. Uso local, sem publicação.

## Executar

Requer Node.js 20.9+ com npm e PostgreSQL. Em uma pasta nova, clone os dois
repositórios existentes como irmãos:

```powershell
mkdir MeuSaldo-workspace
cd MeuSaldo-workspace
git clone https://github.com/joaozitoito/controle_financeiro.git
git clone https://github.com/joaozitoito/backend_meusaldo.git
```

```text
MeuSaldo-workspace/
├── controle_financeiro/meusaldo/
└── backend_meusaldo/
```

Primeiro configure o PostgreSQL e inicie a API seguindo o
[README do backend](https://github.com/joaozitoito/backend_meusaldo#executar).
Depois, a partir deste repositório:

```powershell
cd meusaldo
npm ci
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Abra `http://localhost:3000`. Para consultar ou gravar dados, mantenha também a API
na porta 3001 e o PostgreSQL ligados. Crie a própria conta em `/registro` e entre
em `/login`; não existe conta ou senha padrão. Veja os comandos de verificação no
[README do app](./meusaldo/README.md#testes-e-build).

## Documentação

- [Frontend: configuração, execução e validação](./meusaldo/README.md)
- [Estrutura e convenções](./ESTRUTURA.md)
- [Mapa de rotas e demonstração](./ROTAS.md)
- [Plano, validação e limites da Fase 2](./docs/FASE2.md)
- [Autenticação, migração e evidências da Fase 3](./docs/FASE3.md)

## Decisões

ADRs das Fases 1, 2 e 3, no formato da disciplina de Frameworks Web: contexto,
decisão, consequências e alternativa descartada. A data original da Decisão 1
consta no README versionado no commit `0a93d72`, de 02/09/2026. As demais datas
registram a formalização ou revisão verificada em 21/10/2026; não representam
uma data presumida de adoção inicial das tecnologias.

### Decisão 1 - Organização do código

**Data:** 02/09/2026
**Revisão:** 21/10/2026, preservando a decisão original.
**Contexto:** O projeto precisa de uma estrutura organizada de forma simples para poder separar as responsabilidades da aplicação.
**Decisão:** Organizar cada feature separando API, lógica de negócio e componentes, mantendo essas responsabilidades em pastas próprias. `receita`, `despesa`, `saldo` e `sessao` agrupam seu domínio; `app` compõe as rotas e `shared` contém somente reutilizações reais. Isso mantém mudanças de uma funcionalidade próximas entre si.
**Consequências:** Cada parte da feature fica separada por responsabilidade, facilitando a manutenção e evolução do projeto. O gerenciador financeiro e o transporte HTTP compartilhados evitam duplicação sem criar dependência direta entre features.
**Alternativa Descartada:** Agrupar todo o código por tipo de arquivo sem considerar a separação das responsabilidades da feature. Essa organização espalharia uma mesma alteração funcional por pastas globais e tornaria menos claros os limites do domínio.

### Decisão 2 - Separar frontend Next.js e backend Express

**Data:** 21/10/2026
**Contexto:** O frontend Next.js e a API Express já existem em repositórios distintos.
As três fases devem evoluir esse trabalho sem reconstruir a aplicação.
**Decisão:** Manter Next.js App Router para páginas/layout e Express para validação,
autorização e persistência. O navegador consome a API HTTP. Essa separação reaproveita
os contratos existentes e mantém a autoridade sobre dados privados no backend.
**Consequências:** São dois processos locais (3000/3001) e duas instalações; CORS e
cookies precisam de configuração coerente. O layout permanece Server Component;
formulários, navegação e sessão usam Client Components. Não há servidor Next paralelo
implementando as mesmas rotas financeiras.
**Alternativa Descartada:** Mover a API para Route Handlers do Next.js exigiria
reescrever o backend Express existente. Migrar para Vite/React Router trocaria uma
stack funcional sem resolver uma necessidade das três fases.

### Decisão 3 - Comunicação HTTP configurável

**Data:** 21/10/2026
**Contexto:** O navegador acessará a API Express, cujo CORS estava configurado para Vite.
**Decisão:** Centralizar `fetch` em `shared/lib/http.ts`, configurar a URL por
`NEXT_PUBLIC_API_URL` e permitir origens explícitas via `CORS_ORIGINS` no backend.
**Consequências:** URL por ambiente, preservação de erros de campos e dados sem cache.
O consumo real foi conectado na Fase 2. Na Fase 3, o mesmo cliente passou a enviar
cookies e header CSRF; um 401 invalida a sessão de forma central, sem redirects em
cada chamada. A base pública não pode conter segredos.
**Alternativa Descartada:** URLs/fetch espalhados nos componentes duplicariam
tratamento de erros e sessão. CORS com curinga não atende ao envio de cookies com
credentials nem à restrição explícita de origens exigida pelo fluxo adotado.

### Decisão 4 - PostgreSQL, Prisma e centavos exatos

**Data:** 21/10/2026
**Contexto:** O backend já utiliza PostgreSQL e Prisma. O schema original usava Float,
inadequado para somar valores monetários sem tratar a aproximação binária.
**Decisão:** Preservar PostgreSQL/Prisma e usar Decimal(12,2) no banco e Prisma Decimal
na aritmética do saldo. Migrações SQL versionadas mantêm restrições e relações
verificáveis. O JSON continua numérico para preservar o contrato existente.
**Consequências:** Migração transacional recusa dados incompatíveis sem arredondá-los;
novos lançamentos aceitam até R$ 9.999.999.999,99. Há dependência de um PostgreSQL real,
inclusive nos testes integrados. Totais além de centavos seguros do JSON exigiriam
outro contrato. Seed é explícito para não repovoar dados removidos.
**Alternativa Descartada:** Manter Float exigiria tratar erros de aproximação nas
somas. Substituir por SQLite/MySQL ou armazenamento do navegador alteraria uma
persistência já existente e as garantias/testes PostgreSQL sem necessidade do escopo.

### Decisão 5 - Autenticação com Argon2id e sessão opaca revogável

**Data:** 21/10/2026
**Contexto:** A Fase 3 exige login real, senha protegida, sessão persistente e logout
efetivo; não há necessidade de autenticação distribuída ou provedor externo.
**Decisão:** Usar Argon2id com salt individual e parâmetros explícitos (19456 KiB,
2 iterações, paralelismo 1), conforme a referência técnica registrada em
[FASE3.md](./docs/FASE3.md#referências-técnicas). Gerar token opaco de 256 bits em
cookie HttpOnly e armazenar somente seu hash SHA-256 no PostgreSQL, com validade
fixa de uma hora. O hash rápido é usado no token aleatório, nunca na senha.
**Consequências:** A senha não é recuperável pelo sistema; o backend verifica seu
hash. Logout revoga a sessão no banco. Cookie host-only, SameSite=Lax e Secure em
produção HTTPS reduzem exposição; mutações exigem header próprio e CORS/Origin
exatos contra CSRF. Cada sessão exige consulta ao banco. Context coordena o frontend
sem guardar tokens no storage. Rate limit em memória atende somente a uma instância.
**Alternativa Descartada:** JWT sem estado complicaria a revogação imediata exigida
pelo logout; adicionar blacklist/refresh tokens não simplificaria este backend único.
Guardar credenciais/tokens em localStorage exporia o segredo ao JavaScript da página.
Hash simples de senha com SHA-256 não oferece o custo de memória/trabalho do Argon2id.

### Decisão 6 - Propriedade obrigatória e autorização por usuário

**Data:** 21/10/2026
**Contexto:** Conhecer o ID de um lançamento ou alterar uma requisição não pode dar
acesso aos dados de outra conta. Os registros da Fase 2 poderiam existir sem dono.
**Decisão:** Relacionar Receita/Despesa a Usuario por FK obrigatória e usar usuarioId
obtido exclusivamente da sessão em toda consulta, filtro, agregado, update e delete.
Restringir proprietário na própria operação Prisma evita depender de uma verificação
anterior em memória. IDs alheios retornam 404. A migração aborta se houver dados
antigos; a base inspecionada estava vazia, permitindo a relação obrigatória direta.
**Consequências:** Saldo e recentes são privados por conta. FK Restrict impede apagar
lançamentos ao remover usuário. Outra base com dados sem dono precisa de vinculação
expressamente autorizada. No frontend, logout/expiração/troca de conta descartam o
estado financeiro, e a verificação inicial não monta conteúdo privado.
**Alternativa Descartada:** Filtrar somente na interface deixa a API vulnerável a
requisições diretas. Confiar em usuarioId do cliente permite forjar propriedade.
Atribuir registros antigos ao primeiro cadastro não comprova quem é o dono e pode
expor dados privados.
