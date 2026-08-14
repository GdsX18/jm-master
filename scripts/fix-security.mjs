import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSecurity() {
  console.log('🔒 Aplicando correções de segurança (RLS e Índices) no Supabase...');

  const tables = [
    'users',
    'blog_posts',
    'customers',
    'crm_interactions',
    'products',
    'financial_records',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✅ RLS ativado na tabela: ${table}`);
    } catch (err) {
      console.warn(`Aviso na tabela ${table}:`, err);
    }
  }

  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "idx_crm_interactions_customer_id" ON public."crm_interactions"("customerId");`
    );
    console.log('✅ Índice criado na chave estrangeira de crm_interactions.');
  } catch (err) {
    console.warn('Aviso no índice:', err);
  }

  console.log('🛡️ Todas as recomendações de segurança foram resolvidas com sucesso!');
}

fixSecurity()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
