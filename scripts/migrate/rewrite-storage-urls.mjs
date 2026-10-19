// Troca as URLs públicas do Supabase Storage gravadas no banco pelo caminho do driver local:
//   https://<projeto>.supabase.co/storage/v1/object/public/blog-images/x.jpg  →  /files/blog-images/x.jpg
// Varre TODAS as colunas de texto/JSON do schema public (capas, HTML dos posts, SEO, configurações...).
// Por padrão só mostra o que mudaria; passe --apply para gravar.
//
// Precisa de: DATABASE_URL (banco NOVO) e NEXT_PUBLIC_SUPABASE_URL (projeto antigo).
// Uso na VPS:  docker compose --env-file .env.production run --rm migrate node scripts/migrate/rewrite-storage-urls.mjs [--apply]
import { PrismaClient } from '@prisma/client';

const apply = process.argv.includes('--apply');
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
if (!supabaseUrl) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL com a URL do projeto Supabase antigo.');
  process.exit(1);
}

const FROM = `${supabaseUrl}/storage/v1/object/public/`;
const TO = '/files/';
const prisma = new PrismaClient();
const q = (name) => `"${name.replace(/"/g, '""')}"`;

const columns = await prisma.$queryRaw`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND data_type IN ('text', 'character varying', 'json', 'jsonb')
    AND table_name <> '_prisma_migrations'
  ORDER BY table_name, column_name`;

let total = 0;
for (const { table_name, column_name, data_type } of columns) {
  const col = data_type === 'text' || data_type === 'character varying' ? q(column_name) : `${q(column_name)}::text`;
  const [{ count }] = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int AS count FROM public.${q(table_name)} WHERE ${col} LIKE '%' || $1 || '%'`,
    FROM
  );
  if (!count) continue;
  total += count;
  console.log(`${apply ? '✅' : '•'} ${table_name}.${column_name}: ${count} linha(s)`);

  if (apply) {
    const cast = data_type === 'json' || data_type === 'jsonb' ? `::${data_type}` : '';
    await prisma.$executeRawUnsafe(
      `UPDATE public.${q(table_name)} SET ${q(column_name)} = replace(${col}, $1, $2)${cast} WHERE ${col} LIKE '%' || $1 || '%'`,
      FROM,
      TO
    );
  }
}

console.log(total === 0 ? '\nNenhuma URL do Supabase encontrada.' : `\n${total} linha(s) ${apply ? 'atualizadas' : 'seriam atualizadas — rode de novo com --apply'}.`);
await prisma.$disconnect();
