import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando dados de teste do Supabase...');

  await prisma.siteSetting.upsert({
    where: { id: 'default' },
    update: { customHeaderScript: '', customBodyScript: '' },
    create: { id: 'default', customHeaderScript: '', customBodyScript: '' },
  });
  console.log('✅ Grupos e preços antigos limpos do banco de dados.');
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
