#!/usr/bin/env bash
# Copia os DADOS do Supabase para o PostgreSQL da VPS.
# A estrutura vem das migrations (prisma migrate deploy), então o banco novo fica idêntico ao histórico
# do repositório; aqui só entram as linhas. _prisma_migrations não é copiada (o migrate deploy já a cria).
#
# Uso (na VPS, na pasta do projeto, com a stack de pé):
#   SOURCE_DATABASE_URL="postgresql://postgres.xxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
#     bash scripts/migrate/copy-database.sh
#
# SOURCE_DATABASE_URL = DIRECT_URL do Supabase (porta 5432, modo sessão). Não use a URL do pooler 6543.
set -euo pipefail

: "${SOURCE_DATABASE_URL:?defina SOURCE_DATABASE_URL com a conexão direta do Supabase}"
ENV_FILE="${ENV_FILE:-.env.production}"
env_value() { grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d= -f2- | tr -d '"'"'"; }
DB_USER="$(env_value POSTGRES_USER)"; DB_USER="${DB_USER:-jm}"
DB_NAME="$(env_value POSTGRES_DB)"; DB_NAME="${DB_NAME:-jm_master}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="backups/supabase-data-$STAMP.dump"
COMPOSE="docker compose --env-file $ENV_FILE"

mkdir -p backups

echo "1/4 Backup completo do Supabase (guardado em backups/, por segurança)..."
docker run --rm -v "$PWD/backups:/backups" postgres:17 \
  pg_dump "$SOURCE_DATABASE_URL" --schema=public --no-owner --no-privileges -Fc -f "/backups/supabase-full-$STAMP.dump"

echo "2/4 Exportando só os dados..."
docker run --rm -v "$PWD/backups:/backups" postgres:17 \
  pg_dump "$SOURCE_DATABASE_URL" --schema=public --data-only --no-owner --no-privileges \
  --exclude-table=public._prisma_migrations -Fc -f "/$DUMP"

echo "3/4 Garantindo a estrutura no banco novo (migrations)..."
$COMPOSE run --rm migrate

ROWS=$($COMPOSE exec -T db psql -U "$DB_USER" -d "$DB_NAME" -tAc \
  "SELECT coalesce(sum(n_live_tup),0) FROM pg_stat_user_tables WHERE relname <> '_prisma_migrations'")
if [ "${ROWS// /}" != "0" ] && [ "${FORCE:-}" != "1" ]; then
  echo "O banco novo já tem dados (~$ROWS linhas). Para sobrescrever, rode de novo com FORCE=1." >&2
  echo "(FORCE=1 apaga TODAS as linhas das tabelas do app antes de importar.)" >&2
  exit 1
fi
if [ "${FORCE:-}" = "1" ]; then
  echo "   FORCE=1: limpando as tabelas do banco novo..."
  $COMPOSE exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "
    DO \$\$ DECLARE t record; BEGIN
      FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations' LOOP
        EXECUTE format('TRUNCATE TABLE public.%I CASCADE', t.tablename);
      END LOOP;
    END \$\$;"
fi

echo "4/4 Importando os dados..."
# --disable-triggers: desliga as FKs durante a carga (a ordem das tabelas deixa de importar)
$COMPOSE exec -T db pg_restore -U "$DB_USER" -d "$DB_NAME" --data-only --disable-triggers \
  --no-owner --no-privileges --exit-on-error "/$DUMP"

echo
echo "Pronto. Confira com:"
echo "  $COMPOSE run --rm -e SOURCE_DATABASE_URL=\"\$SOURCE_DATABASE_URL\" migrate node scripts/migrate/compare-databases.mjs"
