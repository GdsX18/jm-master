import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando registros falsos/mock de CRM e Financeiro no Supabase...');

  const deletedCrm = await prisma.crmInteraction.deleteMany({});
  console.log(`✅ ${deletedCrm.count} interações de teste/falsas removidas do CRM.`);

  const deletedFinance = await prisma.financialRecord.deleteMany({});
  console.log(`✅ ${deletedFinance.count} registros de teste/falsos removidos do Financeiro.`);

  console.log('✨ Banco de dados limpo e pronto para uso real!');
}

main()
  .catch((e) => {
    console.error('Erro ao limpar banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
