# ENGECOM — Gestão de Segurança

Sistema corporativo de Gestão de Segurança do Trabalho da ENGECOM. Aplicação real, com
banco de dados, autenticação, permissões aplicadas no backend, cálculos, formulários,
filtros, dashboards e auditoria — não é um protótipo visual.

## Stack

- **Backend**: Node.js + TypeScript + Express + Prisma ORM + PostgreSQL. JWT (access +
  refresh) em cookies httpOnly, bcrypt, matriz de permissões única
  (`apps/api/src/config/permissions.ts`) aplicada via middleware em toda rota.
- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4 + React Router + TanStack
  Query + React Hook Form + Zod + Recharts.
- **Monorepo**: npm workspaces (`apps/api`, `apps/web`).

## Estrutura

```
apps/api    Express + Prisma + PostgreSQL (porta 4000)
apps/web    React + Vite (porta 5173, proxy /api -> :4000)
```

## Como rodar localmente

### 1. Banco de dados

É necessário um PostgreSQL acessível. Ajuste `apps/api/.env` (copie de `.env.example`)
com a `DATABASE_URL` correta.

```bash
cd apps/api
cp .env.example .env   # edite as credenciais/segredos
npm install
npx prisma migrate deploy   # aplica as migrations
npm run prisma:seed         # cria o primeiro usuário Administrador
```

O seed **não cria nenhum dado de negócio fictício** — apenas o usuário administrador,
usando `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` do `.env` (padrão:
`admin@engecom.com.br` / `ChangeMe123!`). Altere a senha padrão assim que possível pela
tela "Meu Perfil".

### 2. Backend

```bash
cd apps/api
npm run dev   # http://localhost:4000
```

### 3. Frontend

```bash
cd apps/web
npm install
npm run dev   # http://localhost:5173
```

Acesse `http://localhost:5173` e faça login com o usuário administrador criado pelo seed.

### Build de produção

```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

## Perfis de acesso (RBAC)

A matriz de permissões vive em **um único lugar** no backend
(`apps/api/src/config/permissions.ts`) e é a fonte da verdade tanto para o middleware
`authorize()` (que bloqueia toda requisição não autorizada, retornando 403) quanto para o
que o frontend recebe em `/api/auth/me` e usa apenas para *esconder* controles que o
usuário não pode usar. Ocultar um botão no frontend nunca é, sozinho, controle de acesso
neste sistema — toda rota valida a permissão de novo no servidor.

| Perfil | Acesso |
|---|---|
| **Administrador** | Total, incluindo Gestão de Usuários, Auditoria e Configurações. |
| **Engenheira de Segurança** | Total, **exceto** Gestão de Usuários e Auditoria (não aparecem no menu e a API retorna 403 mesmo em acesso direto). |
| **Técnico de Segurança** | Cria/edita rituais, DDS, inspeções, desvios e planos de ação; leitura em incidentes, direito de recusa e inspeções gerenciais; sem exclusão, sem administração. |
| **Liderança** | Cria/edita DDS e rituais; leitura de indicadores/IDS/planos de ação; sem acesso a desvios, incidentes, direito de recusa, inspeções gerenciais, usuários, auditoria ou configurações. |

## Módulos implementados (ponta a ponta: banco → API → permissão → UI)

Dashboard, IDS, Rituais, DDS, Inspeções, Desvios, Incidentes, Direito de Recusa,
Inspeção Gerencial/Cruzada (com pontuação ponderada automática), Planos de Ação (com
alertas automáticos de vencimento/próximo do vencimento), Indicadores, Relatórios
(exportação Excel/CSV/PDF), Notificações, Gestão de Usuários, Auditoria, Configurações
(obras/setores/fórmula do IDS/avisos administrativos), Perfil e Busca Global.

Todo CRUD é real: persistido em PostgreSQL via Prisma, validado no backend com Zod,
com paginação/filtro/ordenação server-side, log de auditoria automático em toda
criação/edição/exclusão/alteração de status, e evidências anexadas via upload real em
disco com download protegido por permissão.

## Limitações conhecidas (documentadas, não escondidas)

- **Fórmula do IDS**: a especificação pediu para não inventar uma fórmula definitiva.
  A estrutura (`IdsConfig` com pesos em JSON versionado, `IdsRecord` com histórico
  mensal) está pronta para receber os critérios oficiais da ENGECOM sem precisar
  remodelar o banco. Até lá, os resultados mensais são lançados manualmente pela tela
  de IDS.
- **Recuperação de senha**: não há provedor de e-mail configurado neste ambiente. O
  fluxo gera um token real no banco (`PasswordResetToken`, com expiração e uso único),
  mas o link é retornado na resposta da API / logado no console do servidor em vez de
  enviado por e-mail. Trocar por um provedor real (SMTP, SES, etc.) é um ponto de
  extensão isolado em `apps/api/src/modules/auth/controller.ts` (`forgotPassword`).
- **Diretório de pessoas**: existe um endpoint `GET /api/users/directory` (nome + perfil,
  sem dados sensíveis) acessível a qualquer usuário autenticado, necessário para que
  Técnicos e Lideranças possam selecionar um "responsável" nos formulários operacionais
  sem precisar da permissão de Gestão de Usuários.

## Dados de exemplo

Nenhum. O sistema não vem com registros fictícios de rituais, DDS, desvios etc. — apenas
o usuário Administrador do seed. Telas vazias mostram mensagens como "Não há registros
para este período" com um atalho para criar o primeiro registro, em vez de dados falsos.
