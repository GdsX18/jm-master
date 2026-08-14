import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando sincronização e importação de dados para o Supabase...');

  // 1. Importar Usuários
  const usersPath = path.join(__dirname, '..', 'src', 'data', 'users.json');
  if (fs.existsSync(usersPath)) {
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    console.log(`👤 Importando ${usersData.length} usuários...`);
    for (const u of usersData) {
      await prisma.user.upsert({
        where: { email: u.email.toLowerCase() },
        update: {
          name: u.name,
          password: u.password || 'admin',
          role: u.role || 'Criador de Blog',
          isBlocked: !!u.isBlocked,
          permissions: u.permissions || {},
          prohibitions: u.prohibitions || {},
        },
        create: {
          id: u.id,
          name: u.name,
          email: u.email.toLowerCase(),
          password: u.password || 'admin',
          role: u.role || 'Criador de Blog',
          isBlocked: !!u.isBlocked,
          permissions: u.permissions || {},
          prohibitions: u.prohibitions || {},
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
        },
      });
    }
    console.log('✅ Usuários importados com sucesso!');
  }

  // 2. Importar Posts do Blog
  const postsPath = path.join(__dirname, '..', 'src', 'data', 'custom-posts.json');
  if (fs.existsSync(postsPath)) {
    const postsData = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
    console.log(`📝 Importando ${postsData.length} posts do blog...`);
    for (const p of postsData) {
      await prisma.blogPost.upsert({
        where: { slug: p.slug },
        update: {
          title: p.title,
          excerpt: p.excerpt || '',
          content: p.content || [],
          contentHtml: p.contentHtml || null,
          category: p.category || 'WhatsApp API',
          date: p.date || 'Hoje',
          readTime: p.readTime || '4 min',
          coverImage: p.coverImage || '/images/blog/whatsapp-thumb.jpg',
          coverImageAlt: p.coverImageAlt || p.title,
          authorName: p.author?.name || 'JM MASTER GROUP',
          authorRole: p.author?.role || 'Especialistas em Mensageria & IA',
          authorAvatar: p.author?.avatar || '/logos/Icone.png',
          featured: !!p.featured,
          status: p.status || 'published',
          tags: p.tags || [],
          seo: p.seo || null,
          faqs: p.faqs || null,
        },
        create: {
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt || '',
          content: p.content || [],
          contentHtml: p.contentHtml || null,
          category: p.category || 'WhatsApp API',
          date: p.date || 'Hoje',
          readTime: p.readTime || '4 min',
          coverImage: p.coverImage || '/images/blog/whatsapp-thumb.jpg',
          coverImageAlt: p.coverImageAlt || p.title,
          authorName: p.author?.name || 'JM MASTER GROUP',
          authorRole: p.author?.role || 'Especialistas em Mensageria & IA',
          authorAvatar: p.author?.avatar || '/logos/Icone.png',
          featured: !!p.featured,
          status: p.status || 'published',
          tags: p.tags || [],
          seo: p.seo || null,
          faqs: p.faqs || null,
        },
      });
    }
    console.log('✅ Posts do Blog importados com sucesso!');
  }

  // 3. Inserir dados iniciais de CRM / Timeline se vazios
  const countCrm = await prisma.crmInteraction.count();
  if (countCrm === 0) {
    console.log('🤝 Populando timeline inicial de CRM...');
    await prisma.crmInteraction.createMany({
      data: [
        {
          operator: 'João Moreira (Admin)',
          customerName: 'ABC Indústria & Comércio S/A',
          title: 'Alinhamento de Integração WhatsApp API',
          description: 'Reunião técnica realizada para definir webhooks e integração com sistema ERP interno. Templates de cobrança aprovados na Meta.',
          date: 'Hoje às 16:45',
          type: 'REUNIAO',
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        },
        {
          operator: 'Adrielly de Campos (Super Admin)',
          customerName: 'Global Logistics Brasil Ltda',
          title: 'Upgrade de Plano para Enterprise Cloud',
          description: 'Cliente solicitou liberação de mais 10 atendentes simultâneos no fluxo de rastreamento de entregas. Contrato aditado.',
          date: 'Hoje às 14:10',
          type: 'COMERCIAL',
          badge: 'bg-orange-500/10 text-[#E85D26] border border-orange-500/20',
        },
        {
          operator: 'Amanda Santos (Supervisor)',
          customerName: 'Apex Soluções em Tecnologia',
          title: 'Suporte Técnico: Configuração de Chatbot com IA',
          description: 'Ajuste de prompt do agente de primeiro contato para triagem de leads qualificados. TMA reduzido para 45 segundos.',
          date: 'Ontem às 18:30',
          type: 'SUPORTE',
          badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
        },
      ],
    });
    console.log('✅ CRM inicial populado com sucesso!');
  }

  console.log('🎉 Migração concluída com 100% de sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
