import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { STORAGE_LABEL, checkStorage } from '@/lib/storage';
import { requirePermission } from '@/lib/session';
import { brazilToday } from '@/lib/dates';
import { round2, toNumber } from '@/lib/money';
import { readBilling } from '@/lib/billing';
import { OPEN_STAGES, STALE_DAYS } from '@/lib/leads';

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

// Publicado = "published", ou "scheduled" cuja data já chegou
const LIVE_POST = {
  OR: [{ status: 'published' }, { status: 'scheduled', publishedAt: { lte: new Date() } }],
};

// GET /api/dashboard - Indicadores reais do banco + verificação das integrações.
// Blocos sensíveis (financeiro, funil) só vêm para quem tem a permissão correspondente.
export async function GET() {
  const auth = await requirePermission();
  if (auth instanceof NextResponse) return auth;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const staleBefore = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);
    const today = new Date(`${brazilToday()}T00:00:00.000Z`);

    const [publishedCount, scheduledCount, blogCount, customerCount, activeCustomerCount, groupCount, productCount] =
      await Promise.all([
        prisma.blogPost.count({ where: LIVE_POST }),
        prisma.blogPost.count({ where: { status: 'scheduled', publishedAt: { gt: now } } }),
        prisma.blogPost.count(),
        prisma.customer.count(),
        prisma.customer.count({ where: { status: 'ATIVO' } }),
        prisma.customerGroup.count(),
        prisma.product.count({ where: { active: true } }),
      ]);

    const metrics: Record<string, number> = {
      blogCount,
      publishedCount,
      scheduledCount,
      draftCount: blogCount - publishedCount - scheduledCount,
      customerCount,
      activeCustomerCount,
      groupCount,
      productCount,
    };

    let finance: Record<string, number> | null = null;
    if (auth.permissions.manageFinance) {
      const [open, overdue, receivedMonth, billingCustomers] = await Promise.all([
        prisma.financialRecord.aggregate({
          where: { type: 'RECEITA', status: { in: ['ABERTO', 'PENDENTE', 'ATRASADO'] }, OR: [{ dueDate: null }, { dueDate: { gte: today } }] },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.financialRecord.aggregate({
          where: { type: 'RECEITA', status: { in: ['ABERTO', 'PENDENTE', 'ATRASADO'] }, dueDate: { lt: today } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.financialRecord.aggregate({
          where: {
            type: 'RECEITA',
            status: 'PAGO',
            paymentDate: { gte: new Date(`${brazilToday().slice(0, 7)}-01T03:00:00.000Z`) },
          },
          _sum: { amount: true },
        }),
        prisma.customer.findMany({
          where: { status: 'ATIVO', data: { path: ['billing', 'enabled'], equals: true } },
          select: { data: true },
        }),
      ]);
      finance = {
        openInvoices: open._count + overdue._count,
        aReceber: round2(toNumber(open._sum.amount)),
        overdueCount: overdue._count,
        inadimplencia: round2(toNumber(overdue._sum.amount)),
        recebidoMes: round2(toNumber(receivedMonth._sum.amount)),
        mrr: round2(billingCustomers.reduce((s, c) => s + readBilling(c.data).amount, 0)),
      };
    }

    let funnel: Record<string, number> | null = null;
    let followUps: { id: string; name: string; company: string; nextAction: string; nextActionAt: string | null; stage: string }[] = [];
    if (auth.permissions.manageCrm) {
      const [newLeads, newLeads7d, openLeads, staleLeads, wonMonth, pipeline, dueFollowUps] = await Promise.all([
        prisma.lead.count({ where: { stage: 'NOVO' } }),
        prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.lead.count({ where: { stage: { in: OPEN_STAGES } } }),
        prisma.lead.count({ where: { stage: { in: OPEN_STAGES }, stageChangedAt: { lt: staleBefore } } }),
        prisma.lead.count({ where: { stage: 'GANHO', stageChangedAt: { gte: new Date(`${brazilToday().slice(0, 7)}-01T03:00:00.000Z`) } } }),
        prisma.lead.aggregate({ where: { stage: { in: OPEN_STAGES } }, _sum: { estimatedValue: true } }),
        prisma.lead.findMany({
          where: {
            stage: { in: OPEN_STAGES },
            nextActionAt: { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
            OR: [{ ownerId: auth.id }, { ownerId: null }],
          },
          orderBy: { nextActionAt: 'asc' },
          take: 6,
          select: { id: true, name: true, company: true, nextAction: true, nextActionAt: true, stage: true },
        }),
      ]);
      funnel = {
        newLeads,
        newLeads7d,
        openLeads,
        staleLeads,
        wonMonth,
        pipelineValue: round2(toNumber(pipeline._sum.estimatedValue)),
      };
      followUps = dueFollowUps.map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company || '',
        nextAction: l.nextAction || 'Retornar contato',
        nextActionAt: l.nextActionAt?.toISOString() || null,
        stage: l.stage,
      }));
    }

    const health = await Promise.all([
      check('Banco de dados (PostgreSQL)', async () => {
        const started = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        return `Conectado (${Date.now() - started} ms)`;
      }),
      check(STORAGE_LABEL, checkStorage),
      check('Tags de rastreamento (GTM / Pixels)', async () => {
        const s = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
        const configured = [
          s?.gtmId && 'GTM',
          s?.gaId && 'GA4',
          s?.metaPixelId && 'Meta',
          s?.tiktokPixelId && 'TikTok',
          s?.customHeaderScript?.trim() && 'Scripts',
        ].filter(Boolean);
        if (configured.length === 0) throw new Error('Nenhuma tag configurada');
        return configured.join(', ');
      }),
      check('Automação financeira (cron diário)', async () => {
        if (!process.env.CRON_SECRET) throw new Error('CRON_SECRET não configurado');
        const state = await prisma.appState.findUnique({ where: { key: 'billing-automation' } });
        if (!state) return 'Configurada (ainda não executou)';
        const hours = Math.round((now.getTime() - state.updatedAt.getTime()) / 3_600_000);
        if (hours > 30) throw new Error(`Última execução há ${hours} h`);
        return `Última execução há ${hours} h`;
      }),
    ]);

    return NextResponse.json({ success: true, metrics, finance, funnel, followUps, health });
  } catch (error) {
    console.error('[API Dashboard Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar indicadores' }, { status: 500 });
  }
}
