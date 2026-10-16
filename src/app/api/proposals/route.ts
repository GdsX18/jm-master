import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { readPagination } from '@/lib/customer-ref';
import {
  PROPOSAL_INCLUDE,
  computeTotals,
  createProposalWithNumber,
  isProposalStatus,
  mapProposal,
  parseValidUntil,
  proposalSchema,
} from '@/lib/proposals';
import { round2, toNumber } from '@/lib/money';
import { formatDateTimeBr } from '@/lib/dates';
import { logAudit } from '@/lib/audit';

// GET /api/proposals?status=&q=&leadId=&customerId=&page=&pageSize=
export async function GET(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const { page, pageSize, skip, take } = readPagination(url);
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q')?.trim();
    const leadId = url.searchParams.get('leadId');
    const customerId = url.searchParams.get('customerId');

    const where: Prisma.ProposalWhereInput = {
      ...(isProposalStatus(status) ? { status } : {}),
      ...(leadId ? { leadId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(q
        ? {
            OR: [
              { number: { contains: q, mode: 'insensitive' } },
              { title: { contains: q, mode: 'insensitive' } },
              { customer: { name: { contains: q, mode: 'insensitive' } } },
              { lead: { name: { contains: q, mode: 'insensitive' } } },
              { lead: { company: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [rows, total, grouped] = await Promise.all([
      prisma.proposal.findMany({ where, include: PROPOSAL_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.proposal.count({ where }),
      prisma.proposal.groupBy({ by: ['status'], _count: true, _sum: { recurringTotal: true, oneTimeTotal: true } }),
    ]);

    const summary = Object.fromEntries(
      grouped.map((g) => [
        g.status,
        { count: g._count, recurring: round2(toNumber(g._sum.recurringTotal)), oneTime: round2(toNumber(g._sum.oneTimeTotal)) },
      ])
    );

    return NextResponse.json({ success: true, proposals: rows.map(mapProposal), total, page, pageSize, summary });
  } catch (error) {
    console.error('[API Proposals GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar propostas' }, { status: 500 });
  }
}

// POST /api/proposals - Criar proposta (rascunho)
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const parsed = proposalSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 });
    const input = parsed.data;

    const lead = input.leadId ? await prisma.lead.findUnique({ where: { id: input.leadId }, select: { id: true, name: true, customerId: true } }) : null;
    if (input.leadId && !lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 400 });
    const customerId = input.customerId || lead?.customerId || null;
    if (customerId && !(await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } }))) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 400 });
    }

    const totals = computeTotals(input.items, input.discount);
    const proposal = await createProposalWithNumber({
      title: input.title,
      leadId: lead?.id || null,
      customerId,
      validUntil: parseValidUntil(input.validUntil),
      notes: input.notes || null,
      discount: totals.discount,
      dueDay: input.dueDay,
      oneTimeTotal: totals.oneTimeTotal,
      recurringTotal: totals.recurringTotal,
      createdByName: auth.name,
      items: {
        create: input.items.map((item, index) => ({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          recurring: item.recurring,
          position: index,
        })),
      },
    });

    await prisma.crmInteraction.create({
      data: {
        operator: `${auth.name} (${auth.role})`,
        leadId: lead?.id || null,
        customerId,
        customerName: lead?.name || null,
        title: `Proposta ${proposal.number} criada`,
        description: `${input.title} — mensalidade R$ ${totals.recurringTotal.toFixed(2).replace('.', ',')}${
          totals.oneTimeTotal ? ` + R$ ${totals.oneTimeTotal.toFixed(2).replace('.', ',')} único` : ''
        }`,
        date: formatDateTimeBr(),
        type: 'COMERCIAL',
      },
    });

    await logAudit({
      actor: actorOf(auth),
      action: 'CREATE',
      entity: 'proposal',
      entityId: proposal.id,
      summary: `Proposta ${proposal.number} criada (${input.title})`,
    });

    const full = await prisma.proposal.findUniqueOrThrow({ where: { id: proposal.id }, include: PROPOSAL_INCLUDE });
    return NextResponse.json({ success: true, proposal: mapProposal(full) });
  } catch (error) {
    console.error('[API Proposals POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao criar proposta' }, { status: 500 });
  }
}
