# Publicando o frontend na Vercel

A Vercel hospeda **apenas o frontend** (`apps/web`) deste projeto. O backend (API +
PostgreSQL + upload de evidências) continua no Railway/Render — veja `DEPLOY.md`. A
Vercel não é um ambiente adequado para o backend como ele está hoje: ele roda um
servidor de longa duração com um job periódico em background (alertas de planos de
ação) e salva evidências em disco local, o que não é compatível com o modelo
serverless/efêmero da Vercel sem reescrever essas partes para um storage externo e um
cron job gerenciado pela própria Vercel.

Pré-requisito: o backend já publicado em algum lugar (Railway, Render etc.), com uma
URL pública em HTTPS.

## 1. Criar o projeto na Vercel

1. Em https://vercel.com → **Add New → Project** → importe o repositório
   `marianadalapicola-web/gestao-seguranca-engecom`.
2. Em **Configure Project**, defina:
   - **Root Directory**: `apps/web` (obrigatório — é um monorepo, a Vercel precisa
     saber que só essa pasta é o projeto a ser buildado).
   - **Framework Preset**: Vite (a Vercel detecta automaticamente ao ver o
     Root Directory apontando para um projeto Vite).
   - **Build Command** / **Output Directory**: deixe os padrões detectados
     (`npm run build` / `dist`) — já são os corretos para este projeto.

## 2. Variável de ambiente

Em **Settings → Environment Variables** do projeto na Vercel, adicione:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | URL pública do backend + `/api`, ex.: `https://engecom-api-production.up.railway.app/api` |

Sem essa variável o frontend tentaria chamar `/api` no próprio domínio da Vercel, que
não tem backend nenhum.

## 3. Ajustar o backend para aceitar o domínio da Vercel

No serviço do backend (Railway/Render), atualize as variáveis de ambiente:

| Variável | Valor |
|---|---|
| `WEB_APP_URL` | A URL que a Vercel gerar para este projeto, ex.: `https://engecom-seguranca.vercel.app` (pode ter mais de uma, separadas por vírgula, se for usar também um domínio próprio) |
| `COOKIE_SAME_SITE` | `none` — necessário para o cookie de sessão funcionar entre domínios diferentes (frontend na Vercel, API no Railway) |

Redeploy o backend depois de mudar essas variáveis.

> **Por que isso é necessário:** com frontend e backend em domínios diferentes, o
> navegador só envia o cookie de sessão em requisições entre sites se `SameSite=None`
> (e sempre com `Secure`, ou seja, HTTPS — já garantido tanto na Vercel quanto no
> Railway). Sem isso, o login pareceria funcionar mas a sessão nunca persistiria.

## 4. Deploy

Clique em **Deploy**. A Vercel builda e publica o frontend. As rotas do React Router
(ex.: `/dashboard`, `/rituais`) já têm o rewrite configurado em `apps/web/vercel.json`
para não darem 404 ao recarregar a página ou acessar o link direto.

## Limitações desta configuração

- **Preview deployments** da Vercel (URLs geradas por branch/PR, tipo
  `engecom-git-feature-x.vercel.app`) não terão login funcional a menos que também
  sejam adicionados em `WEB_APP_URL` no backend — a lista de origens permitidas é
  fixa, não um wildcard, por segurança.
- Domínio customizado: se você apontar um domínio próprio na Vercel, adicione-o também
  em `WEB_APP_URL` no backend (pode ter vários, separados por vírgula).

## Desenvolvimento local (não muda)

Continua igual: `npm run dev` em `apps/web` sem `VITE_API_URL` definida usa o proxy do
Vite para `http://localhost:4000`, como sempre. Essas mudanças só afetam o build de
produção quando as variáveis são explicitamente definidas.
