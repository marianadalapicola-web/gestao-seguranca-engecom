# Publicando o ENGECOM — Gestão de Segurança

Este repositório já está pronto para deploy: existe um `Dockerfile` na raiz que builda a
API e o frontend juntos e sobe **um único serviço** (a API serve o build do React), mais
um `railway.json` com a configuração de build/healthcheck. Você só precisa de uma conta
de hospedagem e de um banco PostgreSQL.

Recomendo o **Railway** por ser o caminho mais simples (Postgres + deploy do Dockerfile
no mesmo projeto, plano gratuito para começar, depois ~US$5/mês). Passo a passo abaixo.
No fim há uma alternativa com Render.

## 1. Criar o projeto no Railway

1. Crie uma conta em https://railway.app (pode entrar com a conta do GitHub).
2. **New Project → Deploy from GitHub repo** → autorize o Railway a acessar
   `marianadalapicola-web/gestao-seguranca-engecom` e selecione o repositório.
3. Quando o Railway perguntar a branch, selecione
   `claude/engecom-safety-management-system-jxmvl1` (ou `main`, depois que o PR for
   mergeado).
4. O Railway vai detectar o `Dockerfile` na raiz automaticamente (o `railway.json`
   já aponta para ele) e criar um serviço.

## 2. Adicionar o PostgreSQL

1. Nesse mesmo projeto, clique em **New → Database → Add PostgreSQL**.
2. O Railway cria o banco e expõe a variável `DATABASE_URL` automaticamente dentro do
   projeto — você vai referenciá-la no serviço da aplicação no próximo passo.

## 3. Configurar as variáveis de ambiente do serviço da aplicação

Abra o serviço criado a partir do repositório → aba **Variables** → adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Clique em "Add Reference" e selecione a `DATABASE_URL` do Postgres criado no passo 2 |
| `JWT_ACCESS_SECRET` | Uma string aleatória longa (gere com `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Outra string aleatória longa, diferente da anterior |
| `NODE_ENV` | `production` |
| `WEB_APP_URL` | A URL pública que o Railway vai gerar para este serviço (passo 5) — pode preencher depois e reimplantar |
| `ADMIN_SEED_EMAIL` | O e-mail real do primeiro administrador, ex.: `admin@engecom.com.br` |
| `ADMIN_SEED_PASSWORD` | Uma senha forte definida por vocês — **não deixe o valor padrão do repositório** |
| `ADMIN_SEED_NAME` | Nome do administrador, ex.: `Administrador ENGECOM` |

`PORT` não precisa ser definida — o Railway injeta a própria e o servidor já lê
`process.env.PORT`.

## 4. Volume para as evidências anexadas (importante)

Os anexos (evidências de DDS, inspeções, desvios etc.) são salvos em disco em
`apps/api/uploads`. Sem um volume, esses arquivos são perdidos a cada novo deploy.

No serviço da aplicação → aba **Settings → Volumes** → **New Volume** → monte em:

```
/app/apps/api/uploads
```

## 5. Gerar o domínio público

No serviço → aba **Settings → Networking → Generate Domain**. O Railway cria algo como
`https://engecom-seguranca-production.up.railway.app`. Copie essa URL e cole na variável
`WEB_APP_URL` (passo 3), depois clique em **Redeploy**.

## 6. Deploy e primeiro acesso

O Railway builda a imagem Docker e, ao subir, o próprio container executa nesta ordem
(veja o `CMD` no `Dockerfile`):

1. `prisma migrate deploy` — aplica o schema no banco novo;
2. o seed — cria **apenas** o usuário Administrador (nenhum dado de negócio fictício);
3. inicia o servidor, que também serve o frontend já compilado.

Acesse a URL gerada, entre com o e-mail/senha definidos em `ADMIN_SEED_EMAIL` /
`ADMIN_SEED_PASSWORD` e troque a senha pela tela **Meu Perfil** assim que possível.

## Solução de problemas

**Build falha em "Build image" sem detalhes.** Confirme, no serviço do Railway, em
**Settings → Source**, que o **Root Directory está vazio/`/`** (raiz do repositório) —
se estiver apontando para `apps/api` ou `apps/web`, o Railway não encontra o
`Dockerfile` da raiz e tenta detectar o build sozinho, o que falha nesse monorepo.
Confirme também em **Settings → Build** que o builder está como **Dockerfile**
(o `railway.json` já configura isso, mas um serviço criado antes desse arquivo existir
pode ter ficado com Nixpacks selecionado manualmente).

Se o build passar mas o container reiniciar em loop logo depois, veja os *Deploy Logs*
(não os *Build Logs*) — geralmente é `DATABASE_URL` ausente/errada ou as migrations
ainda não tendo sido aplicadas.

## Alternativa: Render

O mesmo `Dockerfile` funciona no Render:

1. **New → Web Service** → conecte o repositório → Render detecta o Dockerfile.
2. **New → PostgreSQL** (o plano gratuito do Render expira em 90 dias; para uso
   contínuo, escolha um plano pago desde o início).
3. Nas variáveis de ambiente do Web Service, defina as mesmas da tabela acima,
   apontando `DATABASE_URL` para o Postgres criado.
4. Em **Disks**, adicione um disco persistente montado em `/app/apps/api/uploads`
   (equivalente ao volume do Railway).
5. Render expõe a porta pela variável `PORT` automaticamente, já compatível.

## Segurança antes de divulgar a URL

- Troque a senha do Administrador assim que logar pela primeira vez.
- `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` precisam ser únicos e nunca reaproveitados
  de um ambiente de desenvolvimento.
- A recuperação de senha por e-mail não está conectada a um provedor real neste
  ambiente (ver README principal) — enquanto isso não for configurado, resets de senha
  precisam ser feitos pelo Administrador diretamente pela tela de Usuários.
