import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Atualizando banco de dados no Supabase para remover menções a IA...');

  // 1. Atualizar posts do Blog
  const posts = await prisma.blogPost.findMany();
  for (const post of posts) {
    let updated = false;
    let newCategory = post.category;
    let newAuthorRole = post.authorRole;
    let newTitle = post.title;
    let newExcerpt = post.excerpt;

    if (post.category === 'Inteligência Artificial') {
      newCategory = 'Chatbots';
      updated = true;
    }

    if (post.authorRole && post.authorRole.includes('IA')) {
      newAuthorRole = post.authorRole.replace(/IA/g, 'Automação');
      updated = true;
    }

    if (post.title && post.title.includes('IA')) {
      newTitle = post.title.replace(/IA Generativa/g, 'Chatbots Automatizados').replace(/IA \+/g, 'Chatbot +').replace(/IA/g, 'Chatbot');
      updated = true;
    }

    if (post.excerpt && (post.excerpt.includes('IA') || post.excerpt.includes('inteligência artificial') || post.excerpt.includes('inteligência conversacional'))) {
      newExcerpt = post.excerpt
        .replace(/inteligência artificial/gi, 'chatbot automatizado')
        .replace(/inteligência conversacional/gi, 'chatbots modernos')
        .replace(/IA/g, 'Chatbot');
      updated = true;
    }

    if (updated) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          category: newCategory,
          authorRole: newAuthorRole,
          title: newTitle,
          excerpt: newExcerpt,
        },
      });
      console.log(`✅ Post atualizado: ${post.title} -> ${newTitle}`);
    }
  }

  // 2. Atualizar interações de CRM
  const crmInteractions = await prisma.crmInteraction.findMany();
  for (const item of crmInteractions) {
    if (item.title.includes('IA') || item.description.includes('IA') || item.description.includes('prompt')) {
      await prisma.crmInteraction.update({
        where: { id: item.id },
        data: {
          title: item.title.replace(/com IA/g, 'de Atendimento').replace(/IA/g, 'Chatbot'),
          description: item.description.replace(/prompt do agente/g, 'fluxo de mensagens').replace(/IA/g, 'Chatbot'),
        },
      });
      console.log(`✅ CRM Atualizado: ${item.title}`);
    }
  }

  console.log('🎉 Atualização de banco de dados concluída!');
}

main()
  .catch((e) => {
    console.error('Erro na atualização:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
