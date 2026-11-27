# Publicando de graça: Vercel + Render + Supabase

Esta é a alternativa 100% gratuita ao Railway, sem precisar de cartão de crédito em
lugar nenhum. Usa três serviços, cada um cuidando de uma parte:

| Parte | Serviço | Por quê |
|---|---|---|
| Frontend (React) | **Vercel** | Plano grátis permanente, sem cartão |
| API (Node/Express) | **Render** | Plano grátis permanente, sem cartão — mas "dorme" após 15 min sem uso |
| Banco de dados (PostgreSQL) | **Supabase** | Plano grátis permanente, sem cartão |
| Arquivos (fotos de perfil, anexos) | **Supabase Storage** | Mesma conta do banco — plano grátis, sem cartão |

> O Cloudflare R2 também tem plano grátis para arquivos, mas pede cartão de crédito
> como verificação de conta mesmo sem cobrar nada — por isso a rota abaixo usa o
> Supabase para tudo (banco + arquivos) e evita o Cloudflare por completo.

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

## 2. Armazenamento de arquivos (Supabase Storage)

Usa o mesmo projeto Supabase da seção 1 — não precisa criar outra conta.

1. No painel do seu projeto Supabase, vá em **Storage** (menu lateral) → **Create a new
   bucket**.
2. Nome do bucket: `engecom-uploads` (pode ser outro nome, só anote). Deixe como
   **privado** (não marque "Public bucket") — o sistema nunca acessa os arquivos por URL
   pública direta, sempre passa pela API, então não precisa disso.
3. Ainda em **Storage**, procure a aba/seção **S3 Connection** (ou **Configuration** —
   o nome pode variar um pouco conforme a versão do painel).
4. Essa tela mostra o **Endpoint** (algo como
   `https://<ref-do-projeto>.storage.supabase.co/storage/v1/s3`) e a **Region** (ex.:
   `us-east-1` — vai ser a mesma região que você escolheu ao criar o projeto). Anote os
   dois.
5. Clique em **New access key** (ou **Create access key**) para gerar um par de chaves.
   A tela vai mostrar, **uma única vez**, estes valores — copie para um lugar seguro:
   - **Access Key ID**
   - **Secret Access Key**

Esses valores + o nome do bucket são os `S3_*` que vamos usar no Render (seção 3). Se
algum nome de menu estiver um pouco diferente do descrito aqui, procure por "S3" dentro
de **Storage** — é sempre ali que essas chaves ficam.

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
   | `S3_ENDPOINT` | O Endpoint do Supabase Storage (seção 2) |
   | `S3_REGION` | A Region mostrada no Supabase Storage (seção 2), ex.: `us-east-1` |
   | `S3_BUCKET` | `engecom-uploads` (ou o nome que você usou) |
   | `S3_ACCESS_KEY_ID` | Access Key ID do Supabase (seção 2) |
   | `S3_SECRET_ACCESS_KEY` | Secret Access Key do Supabase (seção 2) |
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
`S3_*` no Render estão exatamente como o Supabase mostrou (um espaço a mais já quebra, e
o Endpoint precisa terminar em `/storage/v1/s3`).

**Login parece funcionar mas desloga sozinho.** Confirme `COOKIE_SAME_SITE=none` no
Render e que a URL da Vercel em `WEB_APP_URL` está exatamente igual (sem barra no final).

**Build falha no Render.** Veja os *logs* do deploy — o mesmo `Dockerfile` do Railway é
usado, então os erros mais comuns são os mesmos do `DEPLOY.md`.
