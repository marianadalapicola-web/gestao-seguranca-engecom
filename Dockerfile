# syntax=docker/dockerfile:1
#
# Single-stage image: builds and runs both apps/api and apps/web from this
# monorepo. Keeps devDependencies in the final image (tsx + prisma CLI are
# needed at container start to run migrations and the one-time admin seed)
# — this trades a larger image for a much simpler, more reliable build.
#
# Debian slim, not Alpine: Prisma's query engine binary is libc-specific
# (glibc vs musl). Alpine (musl) needs its own engine binary plus OpenSSL,
# which the minimal Alpine image doesn't ship by default, and is a common
# cause of Prisma builds failing/crashing in Docker with no clear error.
# Debian slim avoids that whole class of failure.
FROM node:20-bookworm-slim
WORKDIR /app

# Prisma's engine needs OpenSSL at both generate time and runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/api apps/api
COPY apps/web apps/web

RUN npm run prisma:generate --workspace=apps/api
RUN npm run build --workspace=apps/api
RUN npm run build --workspace=apps/web

RUN mkdir -p apps/api/uploads

ENV NODE_ENV=production
EXPOSE 4000
WORKDIR /app/apps/api

# Applies pending migrations, seeds the first Administrator only if one
# doesn't already exist yet (see prisma/seed.ts), then starts the server.
CMD npx prisma migrate deploy && npm run prisma:seed && node dist/index.js
