# Imagem de produção para a VPS (Hostinger). Ver deploy/HOSTINGER.md.
#   deps    → node_modules completo
#   tools   → Prisma CLI + scripts/ (serviço "migrate" do docker-compose; não builda o Next)
#   builder → next build
#   runner  → imagem final, só o standalone

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS tools
COPY scripts ./scripts

FROM deps AS builder
COPY . .
# O build pré-renderiza blog, sitemap e tags de rastreamento lendo o banco (como na Vercel).
# O docker-compose passa a URL do Postgres da VPS; o valor fica só neste estágio, não na imagem final.
ARG DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
RUN DATABASE_URL="$DATABASE_URL" DIRECT_URL="$DATABASE_URL" npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# TZ=UTC mantém o mesmo comportamento de datas da Vercel (o código converte para o fuso de Brasília onde precisa)
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 TZ=UTC PORT=3000 HOSTNAME=0.0.0.0 \
    STORAGE_DRIVER=local STORAGE_DIR=/app/storage

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Engine do Prisma: o rastreamento do standalone nem sempre a inclui
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma/client ./node_modules/@prisma/client

RUN mkdir -p /app/storage && chown node:node /app/storage
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
