// Confere a cópia: compara a quantidade de linhas de cada tabela entre o banco antigo e o novo.
//
// Precisa de: SOURCE_DATABASE_URL (Supabase, conexão direta/sessão) e DATABASE_URL (banco novo).
// Uso na VPS:  docker compose --env-file .env.production run --rm -e SOURCE_DATABASE_URL="..." migrate node scripts/migrate/compare-databases.mjs
import { PrismaClient } from '@prisma/client';

const sourceUrl = process.env.SOURCE_DATABASE_URL;
if (!sourceUrl || !process.env.DATABASE_URL) {
  console.error('Defina SOURCE_DATABASE_URL (Supabase) e DATABASE_URL (banco novo).');
  process.exit(1);
}

const source = new PrismaClient({ datasourceUrl: sourceUrl });
const target = new PrismaClient();
const q = (name) => `"${name.replace(/"/g, '""')}"`;

async function counts(db) {
  const tables = await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  const result = {};
  for (const { tablename } of tables) {
    const [{ count }] = await db.$queryRawUnsafe(`SELECT count(*)::int AS count FROM public.${q(tablename)}`);
    result[tablename] = count;
  }
  return result;
}

const [before, after] = await Promise.all([counts(source), counts(target)]);
let mismatches = 0;
for (const table of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
  const ok = before[table] === after[table];
  if (!ok) mismatches++;
  console.log(`${ok ? '✓' : '✗'} ${table.padEnd(28)} origem: ${String(before[table] ?? '—').padStart(6)}   destino: ${String(after[table] ?? '—').padStart(6)}`);
}

console.log(mismatches ? `\n⚠ ${mismatches} tabela(s) com diferença.` : '\nTudo igual. ✅');
await Promise.all([source.$disconnect(), target.$disconnect()]);
process.exit(mismatches ? 1 : 0);
