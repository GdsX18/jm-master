import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { formatDateTimeBr } from '@/lib/dates';
import { resolveCustomerRef, readPagination } from '@/lib/customer-ref';
import { logAudit } from '@/lib/audit';

const TYPES = ['COMERCIAL', 'SUPORTE', 'REUNIAO', 'NPS', 'COBRANCA', 'LEAD', 'OUTROS'] as const;

function isType(value: unknown): value is (typeof TYPES)[number] {
  return typeof value === 'string' && (TYPES as readonly string[]).includes(value);
}

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

// GET /api/crm?customerId=&leadId=&type=&q=&page=&pageSize= - Linha do tempo paginada + contagem por tipo
export async function GET(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const { page, pageSize, skip, take } = readPagination(url, 30);
    const customerId = url.searchParams.get('customerId');
    const leadId = url.searchParams.get('leadId');
    const type = url.searchParams.get('type');
    const q = url.searchParams.get('q')?.trim();

    const base: Prisma.CrmInteractionWhereInput = {
      ...(customerId ? { customerId } : {}),
      ...(leadId ? { leadId } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { customerName: { contains: q, mode: 'insensitive' } },
              { operator: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const where: Prisma.CrmInteractionWhereInput = { ...base, ...(isType(type) ? { type } : {}) };

    const [interactions, total, byType] = await Promise.all([
      prisma.crmInteraction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true } }, lead: { select: { id: true, name: true, stage: true } } },
        skip,
        take,
      }),
      prisma.crmInteraction.count({ where }),
      prisma.crmInteraction.groupBy({ by: ['type'], where: base, _count: true }),
    ]);

    return NextResponse.json({
      success: true,
      interactions,
      total,
      page,
      pageSize,
      counts: Object.fromEntries(byType.map((t) => [t.type, t._count])),
    });
  } catch (error) {
    console.error('[API CRM GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar interações' }, { status: 500 });
  }
}

// POST /api/crm - Registrar interação (responsável = usuário logado)
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { customerId, customerName, title, description, type, leadId } = body;

    if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 });
    }

    const lead =
      typeof leadId === 'string' && leadId
        ? await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, name: true, company: true, customerId: true } })
        : null;
    if (leadId && !lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 400 });

    const customer = await resolveCustomerRef(customerId || lead?.customerId, customerName || (lead ? lead.company || lead.name : ''));
    if ('error' in customer) return NextResponse.json({ error: customer.error }, { status: 400 });

    const interaction = await prisma.crmInteraction.create({
      data: {
        operator: `${auth.name} (${auth.role})`,
        customerName: customer.name,
        customerId: customer.id,
        leadId: lead?.id || null,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 5000),
        date: formatDateTimeBr(),
        type: isType(type) ? type : 'COMERCIAL',
      },
    });

    return NextResponse.json({ success: true, interaction });
  } catch (error) {
    console.error('[API CRM POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao registrar interação' }, { status: 500 });
  }
}

// PUT /api/crm - Editar interação
export async function PUT(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, customerId, customerName, title, description, type } = body;

    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 });
    }

    const customer = await resolveCustomerRef(customerId, customerName);
    if ('error' in customer) return NextResponse.json({ error: customer.error }, { status: 400 });

    const before = await prisma.crmInteraction.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });

    const interaction = await prisma.crmInteraction.update({
      where: { id },
      data: {
        customerName: customer.name,
        customerId: customer.id,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 5000),
        type: isType(type) ? type : undefined,
      },
    });

    await logAudit({
      actor: actorOf(auth),
      action: 'UPDATE',
      entity: 'crm',
      entityId: id,
      summary: `Atendimento "${before.title}" editado`,
      changes: { before: { title: before.title, description: before.description } },
    });

    return NextResponse.json({ success: true, interaction });
  } catch (error) {
    if (isNotFound(error)) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    console.error('[API CRM PUT Error]:', error);
    return NextResponse.json({ error: 'Erro ao atualizar interação' }, { status: 500 });
  }
}

// DELETE /api/crm?id= - Excluir interação
export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const removed = await prisma.crmInteraction.delete({ where: { id } });
    // O conteúdo excluído fica na auditoria (rastreabilidade)
    await logAudit({
      actor: actorOf(auth),
      action: 'DELETE',
      entity: 'crm',
      entityId: id,
      summary: `Atendimento "${removed.title}" excluído (${removed.customerName || 'sem cliente'})`,
      changes: { title: removed.title, description: removed.description, operator: removed.operator, type: removed.type },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isNotFound(error)) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    console.error('[API CRM DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir interação' }, { status: 500 });
  }
}
