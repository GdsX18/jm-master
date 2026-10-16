import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';
import { brazilToday } from '@/lib/dates';
import { OPEN_STAGES } from '@/lib/leads';

export const dynamic = 'force-dynamic';

// GET /api/notifications - Alertas internos do painel (contadores do menu), conforme as permissões
export async function GET() {
  const auth = await requirePermission();
  if (auth instanceof NextResponse) return auth;

  try {
    const now = new Date();
    const [newLeads, dueFollowUps, overdueInvoices, draftProposals] = await Promise.all([
      auth.permissions.manageCrm ? prisma.lead.count({ where: { stage: 'NOVO' } }) : 0,
      auth.permissions.manageCrm
        ? prisma.lead.count({
            where: { stage: { in: OPEN_STAGES }, nextActionAt: { lte: now }, OR: [{ ownerId: auth.id }, { ownerId: null }] },
          })
        : 0,
      auth.permissions.manageFinance
        ? prisma.financialRecord.count({
            where: {
              type: 'RECEITA',
              status: { in: ['ABERTO', 'PENDENTE', 'ATRASADO'] },
              dueDate: { lt: new Date(`${brazilToday()}T00:00:00.000Z`) },
            },
          })
        : 0,
      auth.permissions.manageCrm ? prisma.proposal.count({ where: { status: 'ENVIADA' } }) : 0,
    ]);

    return NextResponse.json({
      success: true,
      badges: {
        '/painel/crm': newLeads + dueFollowUps,
        '/painel/finance': overdueInvoices,
        '/painel/proposals': draftProposals,
      },
      newLeads,
      dueFollowUps,
      overdueInvoices,
      openProposals: draftProposals,
    });
  } catch (error) {
    console.error('[API Notifications Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar alertas' }, { status: 500 });
  }
}
