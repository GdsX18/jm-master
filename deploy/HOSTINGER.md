# Migração para a VPS da Hostinger

Hoje: **Vercel** (site + painel + API + cron) e **Supabase** (PostgreSQL + Storage).
Destino: **uma VPS** com Docker rodando PostgreSQL 17, o app Next.js e o Caddy (HTTPS automático).

O código já funciona nos dois mundos. Quem decide é a variável `STORAGE_DRIVER`
(`supabase` na Vercel, `local` na VPS) e a `DATABASE_URL`. A Vercel continua no ar, intocada,
até a troca do DNS. Se algo der errado, basta voltar o DNS.

## O que já está pronto no repositório

| Arquivo | Para quê |
|---|---|
| `Dockerfile` | Imagem de produção (Next standalone, Node 22, TZ=UTC como na Vercel) |
| `docker-compose.yml` | `db` (Postgres 17), `app`, `caddy`, e `migrate` (Prisma CLI + scripts) |
| `deploy/Caddyfile` | Proxy + certificado Let's Encrypt + redirect do www |
| `.env.production.example` | Modelo das variáveis da VPS |
| `src/lib/storage.ts` | Arquivos no Supabase **ou** no disco (`/files/...`, links assinados para documentos) |
| `src/app/api/health` | Healthcheck (Docker / monitor externo) |
| `scripts/migrate/copy-database.sh` | Copia os dados do Supabase → Postgres da VPS |
| `scripts/migrate/storage-from-supabase.mjs` | Copia os arquivos do Storage → disco |
| `scripts/migrate/rewrite-storage-urls.mjs` | Troca as URLs `supabase.co/...` gravadas no banco por `/files/...` |
| `scripts/migrate/compare-databases.mjs` | Confere a contagem de linhas origem × destino |
| `deploy/backup.sh` | Backup diário do banco e dos arquivos |

As migrations (`prisma/migrations`) são PostgreSQL puro e rodam igual fora do Supabase.

---

## 1. Contratar e preparar a VPS

- Plano: **KVM 2** (2 vCPU / 8 GB) é o confortável; o `next build` precisa de uns 2 GB de RAM.
  KVM 1 (4 GB) aguenta, mas o build fica lento.
- Sistema: template **Ubuntu 24.04 com Docker** (ou Ubuntu puro + `curl -fsSL https://get.docker.com | sh`).
- Firewall da Hostinger (hPanel → VPS → Firewall): libere só **22, 80 e 443**.

```bash
ssh root@IP_DA_VPS
adduser deploy && usermod -aG docker deploy   # usuário sem root para o dia a dia
su - deploy
git clone <URL_DO_REPOSITORIO> jm-master && cd jm-master
cp .env.production.example .env.production && nano .env.production
```

No `.env.production`:
- `DOMAIN`: o domínio **sem www** (`jmmaster.com.br`). O site sobe em `www.` e o domínio sem www redireciona para ele.
- `POSTGRES_PASSWORD`: `openssl rand -hex 24`.
- `AUTH_SECRET` e `CRON_SECRET`: **copie os mesmos da Vercel**. Com o mesmo `AUTH_SECRET`, ninguém é deslogado.
- `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: os do Supabase, só enquanto durar a migração.

## 2. Ensaio (com a Vercel ainda no ar)

```bash
C="docker compose --env-file .env.production"

$C up -d db                         # 1. banco
$C run --rm migrate                 # 2. estrutura (prisma migrate deploy)

# 3. dados: use a DIRECT_URL do Supabase (porta 5432, modo sessão)
SOURCE_DATABASE_URL="postgresql://postgres.xxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
  bash scripts/migrate/copy-database.sh

# 4. confere
$C run --rm -e SOURCE_DATABASE_URL="..." migrate node scripts/migrate/compare-databases.mjs

# 5. arquivos (imagens do blog + documentos de clientes)
$C run --rm migrate node scripts/migrate/storage-from-supabase.mjs

# 6. URLs no banco (sem --apply só mostra; hoje são ~18 linhas: capas e SEO dos posts)
$C run --rm migrate node scripts/migrate/rewrite-storage-urls.mjs
$C run --rm migrate node scripts/migrate/rewrite-storage-urls.mjs --apply

# 7. app + HTTPS
$C up -d --build
```

Antes de mexer no DNS, teste pelo IP. No seu computador, adicione ao arquivo `hosts`
(`C:\Windows\System32\drivers\etc\hosts`) a linha `IP_DA_VPS www.jmmaster.com.br`
e abra o site. O certificado só sai depois do DNS; até lá aceite o aviso do navegador.
Confira: login no painel, um post com imagem, upload de imagem, download de documento de cliente,
dashboard (o quadro de saúde deve mostrar "PostgreSQL" e "disco do servidor" verdes). Depois remova a linha do `hosts`.

## 3. Virada (minutos de janela)

1. Avise a equipe para não usar o painel por ~15 min.
2. Recopie o que mudou desde o ensaio:
   ```bash
   FORCE=1 SOURCE_DATABASE_URL="..." bash scripts/migrate/copy-database.sh
   $C run --rm migrate node scripts/migrate/storage-from-supabase.mjs        # só baixa o que falta
   $C run --rm migrate node scripts/migrate/rewrite-storage-urls.mjs --apply
   $C run --rm -e SOURCE_DATABASE_URL="..." migrate node scripts/migrate/compare-databases.mjs
   $C up -d --build app     # rebuilda para o blog/sitemap pré-renderizados pegarem os dados finais
   ```
3. **DNS** (onde o domínio estiver registrado): registro `A` de `@` e de `www` → IP da VPS
   (apague os registros da Vercel). Reduza o TTL para 300 um dia antes.
4. Assim que o DNS propagar, o Caddy emite o certificado sozinho (`$C logs -f caddy`).
5. **Na Vercel**: desative o Cron (ou remova o projeto) para a cobrança não rodar duas vezes.

**Voltar atrás:** aponte o DNS de novo para a Vercel. O Supabase não foi alterado.
Só o que for criado na VPS depois da virada não volta junto.

## 4. Cron e backup (crontab da VPS)

`crontab -e` como usuário `deploy`:

```cron
CRON_TZ=UTC
# Cobrança recorrente: mesmo horário do vercel.json (09:00 UTC = 06:00 em Brasília)
0 9 * * * curl -fsS -H "Authorization: Bearer SEU_CRON_SECRET" https://www.jmmaster.com.br/api/cron/billing > /dev/null
# Backup diário do banco + arquivos (guarda 14 dias em ~/jm-master/backups)
30 3 * * * bash /home/deploy/jm-master/deploy/backup.sh >> /home/deploy/backup.log 2>&1
```

Na Hostinger não há backup automático do banco como no Supabase.
Copie a pasta `backups/` para fora da VPS de tempos em tempos (ou ative os snapshots semanais da VPS no hPanel).

## 5. Dia a dia depois da migração

**Publicar uma versão nova:**
```bash
cd ~/jm-master && git pull
$C run --rm migrate      # aplica migrations novas (se houver)
$C up -d --build app
```

**Criar migration nova (no seu computador):** igual a hoje, `npx prisma migrate dev --name descricao`,
contra um Postgres local ou o de desenvolvimento. Commit da pasta `prisma/migrations` e, na VPS, o `migrate` acima.
Tabela nova: o RLS (`scripts/fix-security.mjs`) só importa enquanto o Supabase existir. Fora dele é inofensivo e pode continuar.

**Logs:** `$C logs -f app` · **Status:** `$C ps` · **psql:** `$C exec db psql -U jm jm_master`

**Acessar o banco do seu PC (DBeaver/TablePlus):** túnel SSH `ssh -L 5432:127.0.0.1:5432 deploy@IP_DA_VPS`
e conecte em `localhost:5432`. A porta não fica exposta na internet.

## 6. Depois de uns 30 dias estável

- Remova `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` do `.env.production`.
- Faça um último backup e pause/exclua o projeto no Supabase e na Vercel.
- Opcional: tirar `**.supabase.co` de `images.remotePatterns` no `next.config.mjs`.
