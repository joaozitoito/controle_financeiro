# MeuSaldo

Sistema acadêmico de controle financeiro pessoal em Next.js, React, TypeScript e
Tailwind CSS. A API usa Express, Prisma e PostgreSQL em repositório separado.
O objetivo é registrar receitas e despesas e acompanhar o saldo.

## Estado atual

A Fase 3 adiciona cadastro, login, sessão por cookie HttpOnly e dados isolados por
usuário. O CRUD, filtros, resumo e lançamentos recentes da Fase 2 foram preservados.
A Fase 4 adiciona Dockerfiles e Compose para desenvolvimento e produção local.
Uso local, sem publicação.

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

## Rodando com Docker

Requer Docker Desktop (WSL 2 no Windows) e os dois repositórios clonados como irmãos,
como acima. Não precisa de Node nem PostgreSQL instalados. Na pasta `controle_financeiro`:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Troque o marcador de POSTGRES_PASSWORD por uma senha só com letras e números.
docker compose up --build --watch
```

Abra `http://localhost:3000` e crie a conta em `/registro`. O compose sobe PostgreSQL 16,
API (3001) e frontend (3000) e aplica as migrações ao iniciar a API. Com `--watch`,
salvar arquivos em `meusaldo/app`, `features`, `shared`, `public` ou em
`backend_meusaldo/src` atualiza o container; mudar `package.json` ou `prisma/`
reconstrói a imagem. Os dados ficam no volume `meusaldo_dados` e sobrevivem ao
`docker compose down`. `docker compose down -v` apaga esse volume e os dados.

Produção local (imagens `prod`, sem código-fonte montado, usuário sem root):

```powershell
docker compose -f compose.prod.yaml up --build
```

Site em `http://localhost:8080`, API em `http://localhost:3001` (`GET /health`).
Um serviço `migrate` aplica as migrações e termina antes da API subir. O banco de
produção local usa outro volume (`meusaldo-prod_dados`). Dev e produção usam a
porta 3001 e não rodam ao mesmo tempo, nem junto com `npm run dev`.

| Arquivo | Papel |
| --- | --- |
| `compose.yaml` | Desenvolvimento: db, api (target dev) e web (target dev) |
| `compose.prod.yaml` | Produção local: db, migrate, api e web (target prod) |
| `compose.vps.yaml` | Soma ao prod na VPS: Caddy com HTTPS, API em `/api`, só portas 80/443 |
| `Caddyfile` | Proxy: `/api/*` para a API (sem o prefixo), o resto para o Next.js |
| `.env` (fora do Git) | `POSTGRES_PASSWORD` e, na VPS, `DOMINIO`; lido só pelo Compose |
| `meusaldo/Dockerfile` | dev (`next dev`), build e prod (`output: "standalone"`) |
| `../backend_meusaldo/Dockerfile` | dev (`tsx watch`), build (`tsc`) e prod (`node dist/server.js`) |

`NEXT_PUBLIC_API_URL` é gravada no bundle de produção como argumento de build;
ao mudar, rode de novo com `--build`. Em produção a API usa o cookie
`__Host-meusaldo_sessao` com `Secure`, aceito pelo navegador em `localhost`.
Para erros, comece por `docker compose logs -f api` (ou `web`, `db`).

## Deploy em VPS

Na VPS o mesmo `compose.prod.yaml` sobe junto com `compose.vps.yaml`, que põe o Caddy
na frente: ele emite e renova o certificado HTTPS sozinho (Let's Encrypt) e manda
`https://DOMINIO/api/*` para a API e o resto para o site. Site e API no mesmo endereço
evitam CORS entre domínios, e o cookie de sessão `Secure` funciona. API, frontend e
banco não publicam portas; só 80 e 443 ficam abertas.

**Antes:** um servidor Linux com acesso SSH e um domínio (ou subdomínio) com registro
DNS tipo **A** apontando para o IP da VPS. As portas 80 e 443 precisam estar livres e
liberadas no firewall do provedor. Sem domínio não há certificado e o login não funciona.

**Primeira vez**, no servidor:

```bash
curl -fsSL https://get.docker.com | sh          # instala Docker e Compose (Ubuntu/Debian)
mkdir -p ~/meusaldo && cd ~/meusaldo
git clone https://github.com/joaozitoito/controle_financeiro.git
git clone https://github.com/joaozitoito/backend_meusaldo.git
cd controle_financeiro
cp .env.example .env
nano .env   # POSTGRES_PASSWORD forte (só letras e números) e DOMINIO=seu.dominio.com.br
docker compose -f compose.prod.yaml -f compose.vps.yaml up -d --build
```

Abra `https://seu.dominio.com.br` e crie a conta em `/registro`. O primeiro acesso pode
levar alguns segundos enquanto o certificado é emitido (`docker compose -f compose.prod.yaml
-f compose.vps.yaml logs -f caddy` mostra o andamento).

**Atualizar** depois de um merge:

```bash
cd ~/meusaldo/backend_meusaldo && git pull
cd ../controle_financeiro && git pull
docker compose -f compose.prod.yaml -f compose.vps.yaml up -d --build
```

As migrações rodam sozinhas (serviço `migrate`) antes da API subir. Os dados ficam no
volume `meusaldo-prod_dados` e os certificados em `meusaldo-prod_caddy_data`; nunca use
`down -v` na VPS.

**Backup do banco** (gera um arquivo no servidor; copie para fora dele):

```bash
docker compose -f compose.prod.yaml -f compose.vps.yaml exec -T db pg_dump -U meusaldo meusaldo > backup-$(date +%F).sql
```

**Servidor compartilhado.** Se o professor já tiver um proxy ocupando 80/443 e indicar
uma porta, não use `compose.vps.yaml`: mantenha o `compose.prod.yaml`, troque
`127.0.0.1:8080:3000` pela porta indicada e peça que o proxy dele encaminhe `/api` para
a API do mesmo jeito que o `Caddyfile` faz.

**Testar o modo VPS na própria máquina:** com `DOMINIO=localhost` no `.env`, o mesmo
comando sobe em `https://localhost` com certificado local (o navegador avisa que não é
confiável). Se a porta 80/443 estiver bloqueada no Windows, use um domínio de teste com
porta (`DOMINIO=localhost:8443`) e um override que publique `8443:8443` no Caddy.

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

### Decisão 7 - Conta conjunta por titular e tempo real com SSE

**Data:** 18/11/2026
**Contexto:** Duas pessoas precisam registrar e acompanhar as mesmas finanças, vendo na
hora o que a outra altera, sem enfraquecer a autorização por dono da Decisão 6.
**Decisão:** Um usuário pode ter um titular (`Usuario.titularId`). A sessão calcula o dono
efetivo (`titularId ?? id`) e todas as rotas financeiras usam esse dono em vez do ID do
cliente. O vínculo nasce de um código de convite de uso único, válido por 24h, guardado só
como hash; a entrada roda em transação Serializable e limita a duas pessoas. As alterações
bem-sucedidas são enviadas por Server-Sent Events (`GET /eventos`) a quem vê o mesmo dono;
o frontend recarrega as telas em silêncio e avisa quem alterou.
**Consequências:** Nenhuma tabela financeira mudou e os dados existentes continuam válidos.
Enquanto vinculado, o membro não vê os próprios dados (voltam ao sair) e o que cria fica
com o titular. Os assinantes ficam em memória: com mais de uma instância da API seria
preciso um barramento comum (por exemplo LISTEN/NOTIFY do PostgreSQL).
**Alternativa Descartada:** Carteiras separadas (pessoal + conjunta com seletor) trocariam
`usuarioId` por `carteiraId` em todas as tabelas e rotas. WebSocket exigiria biblioteca e
protocolo próprio para um fluxo que só vai do servidor ao navegador. Polling periódico
atrasaria o aviso e geraria tráfego constante.
