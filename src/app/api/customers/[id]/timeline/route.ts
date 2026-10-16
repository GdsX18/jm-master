import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';
import { toNumber } from '@/lib/money';

type Params = { params: Promise<{ id: string }> };

export interface TimelineEvent {
  id: string;
  kind: 'crm' | 'audit' | 'invoice' | 'proposal' | 'lead';
  title: string;
  description: string;
  actor: string;
  type?: string;
  at: string;
}

// GET /api/customers/[id]/timeline - Linha do tempo unificada do cliente:
// atendimentos do CRM + alterações (auditoria) + faturas + propostas + leads de origem
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const [interactions, audits, invoices, proposals, leads] = await Promise.all([
      prisma.crmInteraction.findMany({ where: { customerId: id }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.auditLog.findMany({
        where: { entityId: id, entity: { in: ['customer', 'billing'] } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.financialRecord.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, invoiceNumber: true, description: true, amount: true, status: true, dueDate: true, createdAt: true, type: true },
      }),
      prisma.proposal.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, number: true, title: true, status: true, createdByName: true, createdAt: true, recurringTotal: true, oneTimeTotal: true },
      }),
      prisma.lead.findMany({
        where: { customerId: id },
        select: { id: true, name: true, source: true, stage: true, createdAt: true, interest: true },
      }),
    ]);

    const brl = (v: unknown) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNumber(v));

    const events: TimelineEvent[] = [
      ...interactions.map((i) => ({
        id: `crm-${i.id}`,
        kind: 'crm' as const,
        title: i.title,
        description: i.description,
        actor: i.operator,
        type: i.type,
        at: i.createdAt.toISOString(),
      })),
      ...audits.map((a) => ({
        id: `audit-${a.id}`,
        kind: 'audit' as const,
        title: a.summary,
        description: '',
        actor: a.userName,
        type: a.action,
        at: a.createdAt.toISOString(),
      })),
      ...invoices.map((f) => ({
        id: `inv-${f.id}`,
        kind: 'invoice' as const,
        title: `${f.type === 'DESPESA' ? 'Despesa' : 'Fatura'} ${f.invoiceNumber || ''} — ${brl(f.amount)}`,
        description: `${f.description} · status ${f.status}${f.dueDate ? ` · vence ${f.dueDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}` : ''}`,
        actor: 'Financeiro',
        type: f.status,
        at: f.createdAt.toISOString(),
      })),
      ...proposals.map((p) => ({
        id: `prop-${p.id}`,
        kind: 'proposal' as const,
        title: `Proposta ${p.number} — ${p.title}`,
        description: `Status ${p.status} · mensal ${brl(p.recurringTotal)} · único ${brl(p.oneTimeTotal)}`,
        actor: p.createdByName || 'Comercial',
        type: p.status,
        at: p.createdAt.toISOString(),
      })),
      ...leads.map((l) => ({
        id: `lead-${l.id}`,
        kind: 'lead' as const,
        title: `Lead de origem: ${l.name}`,
        description: `${l.source === 'SITE' ? 'Veio pelo site' : 'Cadastrado manualmente'}${l.interest ? ` · interesse: ${l.interest}` : ''}`,
        actor: 'Funil de vendas',
        type: l.stage,
        at: l.createdAt.toISOString(),
      })),
    ].sort((a, b) => b.at.localeCompare(a.at));

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('[API Customer Timeline Error]:', error);
    return NextResponse.json({ message: 'Erro ao carregar a linha do tempo' }, { status: 500 });
  }
}
