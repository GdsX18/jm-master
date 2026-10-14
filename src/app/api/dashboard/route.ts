import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  label: string;
  ok: boolean;
  detail: string;
}

async function check(label: string, fn: () => Promise<string>): Promise<HealthCheck> {
  try {
    return { label, ok: true, detail: await fn() };
  } catch (error) {
    return { label, ok: false, detail: error instanceof Error ? error.message : 'Falha na verificação' };
  }
}

// GET /api/dashboard - Indicadores reais do banco + verificação das integrações
export async function GET() {
  const auth = await requirePermission();
  if (auth instanceof NextResponse) return auth;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      publishedCount,
      blogCount,
      customerCount,
      activeCustomerCount,
      groupCount,
      productCount,
      openInvoices,
      newLeads,
    ] = await Promise.all([
      prisma.blogPost.count({ where: { status: 'published' } }),
      prisma.blogPost.count(),
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ATIVO' } }),
      prisma.customerGroup.count(),
      prisma.product.count(),
      prisma.financialRecord.count({ where: { status: { in: ['ABERTO', 'PENDENTE', 'ATRASADO'] } } }),
      prisma.crmInteraction.count({ where: { operator: 'Site', createdAt: { gte: sevenDaysAgo } } }),
    ]);

    const health = await Promise.all([
      check('Banco de dados (Supabase PostgreSQL)', async () => {
        await prisma.$queryRaw`SELECT 1`;
        return 'Conectado';
      }),
      check('Armazenamento de arquivos (Supabase Storage)', async () => {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Chave de serviço não configurada');
        const { error } = await supabaseAdmin.storage.from('blog-images').list('', { limit: 1 });
        if (error) throw new Error(error.message);
        return 'Conectado';
      }),
      check('Tags de rastreamento (GTM / Pixels)', async () => {
        const s = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
        const configured = [s?.gtmId, s?.gaId, s?.metaPixelId, s?.tiktokPixelId, s?.customHeaderScript].some(
          (v) => !!v?.trim()
        );
        if (!configured) throw new Error('Nenhuma tag configurada');
        return 'Configuradas';
      }),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        blogCount,
        publishedCount,
        draftCount: blogCount - publishedCount,
        customerCount,
        activeCustomerCount,
        groupCount,
        productCount,
        openInvoices,
        newLeads,
      },
      health,
    });
  } catch (error) {
    console.error('[API Dashboard Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar indicadores' }, { status: 500 });
  }
}
