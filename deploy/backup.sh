#!/usr/bin/env bash
# Backup diário do banco e dos arquivos na VPS (o Supabase fazia isso sozinho; aqui é por nossa conta).
# Guarda os últimos KEEP_DAYS dias em backups/. Agendado pelo crontab (ver deploy/HOSTINGER.md).
# Copie a pasta backups/ para fora da VPS de vez em quando (Google Drive, outro servidor...).
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.production}"
KEEP_DAYS="${KEEP_DAYS:-14}"
env_value() { grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d= -f2- | tr -d '"'"'"; }
DB_USER="$(env_value POSTGRES_USER)"; DB_USER="${DB_USER:-jm}"
DB_NAME="$(env_value POSTGRES_DB)"; DB_NAME="${DB_NAME:-jm_master}"
STAMP="$(date +%Y%m%d-%H%M%S)"
COMPOSE="docker compose --env-file $ENV_FILE"

mkdir -p backups
$COMPOSE exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc -f "/backups/db-$STAMP.dump"
# Arquivos enviados pelo painel (volume "storage" do app)
$COMPOSE exec -T app tar -czf - -C /app storage > "backups/storage-$STAMP.tar.gz"

find backups -name 'db-*.dump' -mtime +"$KEEP_DAYS" -delete
find backups -name 'storage-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup ok: backups/db-$STAMP.dump e backups/storage-$STAMP.tar.gz"

# Restaurar o banco (CUIDADO: sobrescreve):
#   docker compose --env-file .env.production exec -T db pg_restore -U jm -d jm_master --clean --if-exists /backups/db-AAAAMMDD-HHMMSS.dump
