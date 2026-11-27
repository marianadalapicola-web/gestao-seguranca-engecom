# Publicando de graça: Vercel + Render + Supabase + Cloudflare R2

Esta é a alternativa 100% gratuita ao Railway, sem precisar de cartão de crédito em
lugar nenhum. Usa quatro serviços, cada um cuidando de uma parte:

| Parte | Serviço | Por quê |
|---|---|---|
| Frontend (React) | **Vercel** | Plano grátis permanente, sem cartão |
| API (Node/Express) | **Render** | Plano grátis permanente, sem cartão — mas "dorme" após 15 min sem uso |
| Banco de dados (PostgreSQL) | **Supabase** | Plano grátis permanente, sem cartão |
| Arquivos (fotos de perfil, anexos) | **Cloudflare R2** | Plano grátis até 10GB, sem cartão |

**Importante sobre o "dormir":** no plano grátis do Render, o servidor desliga sozinho
depois de ~15 minutos sem receber nenhuma requisição. Quando alguém abre o sistema
depois disso, a primeira tela demora de 30 a 50 segundos para carregar (ele está
"acordando"). Depois disso fica rápido normalmente, até dormir de novo. Isso é uma
limitação do plano grátis, não um bug.

Siga as seções na ordem — cada uma te dá um valor que a próxima etapa vai pedir.

## 1. Banco de dados (Supabase)

1. Crie uma conta em https://supabase.com (pode entrar com GitHub).
2. **New Project**. Dê um nome (ex.: `engecom-seguranca`), crie uma senha forte para o
   banco **e guarde essa senha** — vai precisar dela já já.
3. Escolha a região mais próxima do Brasil disponível (ex.: `South America (São Paulo)`
   se aparecer, senão `US East`).
4. Espere o projeto terminar de ser criado (1-2 minutos).
5. Vá em **Project Settings → Database → Connection string** → aba **URI**. Copie essa
   string — algo como:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
6. Troque `[YOUR-PASSWORD]` pela senha que você criou no passo 2. **Guarde essa URL
   completa** — é o valor de `DATABASE_URL` que vamos usar no Render (seção 3).

## 2. Armazenamento de arquivos (Cloudflare R2)

1. Crie uma conta em https://dash.cloudflare.com/sign-up.
2. No menu lateral, **R2 Object Storage** → **Create bucket**.
3. Nome do bucket: `engecom-uploads` (pode ser outro nome, só anote). Região: **Automatic**.
4. Clique em **Create**.
5. Ainda em R2, vá em **Manage R2 API Tokens** (ou **{} API** no canto) → **Create API
   Token**.
   - Permissions: **Object Read & Write**.
   - Specify bucket: selecione o bucket criado no passo 3.
   - Clique em **Create API Token**.
6. A tela vai mostrar, **uma única vez**, estes valores — copie todos para um lugar
   seguro:
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint** (algo como `https://<account-id>.r2.cloudflarestorage.com`)

Esses três valores + o nome do bucket são os `S3_*` que vamos usar no Render (seção 3).

## 3. API (Render)

1. Crie uma conta em https://render.com (pode entrar com GitHub).
2. **New → Web Service** → conecte o repositório
   `marianadalapicola-web/gestao-seguranca-engecom`.
3. Configurações do serviço:
   - **Name**: `engecom-api` (ou outro nome)
   - **Branch**: `claude/engecom-safety-management-system-jxmvl1` (ou `main`)
   - **Root Directory**: deixe em branco (raiz do repositório)
   - **Runtime**: **Docker** (o Render detecta o `Dockerfile` automaticamente)
   - **Instance Type**: **Free**
4. Em **Environment Variables**, adicione:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | A string completa da Supabase (seção 1) |
   | `JWT_ACCESS_SECRET` | Uma string aleatória longa — gere em https://generate-secret.vercel.app/32 |
   | `JWT_REFRESH_SECRET` | Outra string aleatória longa, diferente da anterior |
   | `NODE_ENV` | `production` |
   | `STORAGE_DRIVER` | `s3` |
   | `S3_ENDPOINT` | O Endpoint da Cloudflare (seção 2) |
   | `S3_REGION` | `auto` |
   | `S3_BUCKET` | `engecom-uploads` (ou o nome que você usou) |
   | `S3_ACCESS_KEY_ID` | Access Key ID da Cloudflare (seção 2) |
   | `S3_SECRET_ACCESS_KEY` | Secret Access Key da Cloudflare (seção 2) |
   | `WEB_APP_URL` | Por enquanto deixe `http://localhost:5173` — voltamos aqui na seção 4 |
   | `COOKIE_SAME_SITE` | `none` |
   | `ADMIN_SEED_EMAIL` | O e-mail real do primeiro administrador |
   | `ADMIN_SEED_PASSWORD` | Uma senha forte definida por vocês |
   | `ADMIN_SEED_NAME` | Nome do administrador |

5. Clique em **Create Web Service**. O Render builda a imagem Docker e sobe — isso
   demora alguns minutos na primeira vez.
6. Quando terminar, copie a URL pública que o Render gerou, tipo
   `https://engecom-api.onrender.com`.

**Atenção a uma pegadinha do plano grátis:** o Render free **não tem disco persistente**
— por isso configuramos `STORAGE_DRIVER=s3` acima. Se essas variáveis `S3_*` não forem
preenchidas corretamente, o upload de fotos/anexos vai falhar com erro 500.

## 4. Frontend (Vercel)

Siga exatamente o `VERCEL_DEPLOY.md` deste repositório, com uma diferença: em
**Environment Variables**, use:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | `https://engecom-api.onrender.com/api` (a URL do Render, passo 3.6, + `/api`) |

Depois do deploy, copie a URL que a Vercel gerou (ex.: `https://engecom-seguranca.vercel.app`).

## 5. Fechar o ciclo: conectar o Render ao domínio da Vercel

Volte no Render → seu serviço → **Environment** → edite `WEB_APP_URL` para a URL da
Vercel do passo 4 (ex.: `https://engecom-seguranca.vercel.app`) → salve. O Render reinicia
o serviço sozinho.

## 6. Primeiro acesso

Acesse a URL da Vercel. Se o Render estiver "dormindo", a primeira tela demora um pouco
(veja aviso no topo deste arquivo) — espere, não recarregue freneticamente. Entre com o
e-mail/senha definidos em `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` e troque a senha pela
tela **Meu Perfil**.

## Migrando os dados que já existem no Railway (opcional)

Se o Railway antigo ainda tiver dados reais (obras, DDS, desvios etc. já cadastrados) que
você quer manter, isso precisa de um `pg_dump`/`pg_restore` entre os dois bancos. Essa
etapa pode exigir ajuda direta — me avise quando chegar nela com as duas connection
strings (Railway e Supabase) à mão e eu te guio.

## Problemas comuns

**"Erro ao enviar foto/anexo" (500) depois do deploy.** Confira se as 5 variáveis
`S3_*` no Render estão exatamente como a Cloudflare mostrou (um espaço a mais já quebra).

**Login parece funcionar mas desloga sozinho.** Confirme `COOKIE_SAME_SITE=none` no
Render e que a URL da Vercel em `WEB_APP_URL` está exatamente igual (sem barra no final).

**Build falha no Render.** Veja os *logs* do deploy — o mesmo `Dockerfile` do Railway é
usado, então os erros mais comuns são os mesmos do `DEPLOY.md`.
