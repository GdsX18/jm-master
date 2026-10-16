// Garante RLS em TODAS as tabelas do schema public (inclusive as criadas depois).
// O app usa o Prisma (role dona das tabelas, que ignora RLS); sem policies, a API REST
// do Supabase com a chave anônima não lê nem grava nada.
// Uso: node scripts/fix-security.mjs   (rode após criar tabelas novas)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSecurity() {
  const tables = await prisma.$queryRaw`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;

  for (const { tablename, rowsecurity } of tables) {
    if (rowsecurity) {
      console.log(`✓ ${tablename} (RLS já ativo)`);
      continue;
    }
    await prisma.$executeRawUnsafe(`ALTER TABLE public."${tablename.replace(/"/g, '""')}" ENABLE ROW LEVEL SECURITY;`);
    console.log(`✅ RLS ativado: ${tablename}`);
  }

  const policies = await prisma.$queryRaw`SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'`;
  if (policies.length > 0) {
    console.warn('⚠️  Existem policies no schema public — confira se nenhuma libera acesso à chave anônima:', policies);
  }
}

fixSecurity()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
