import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { LEAD_INCLUDE, leadSchema, mapLead } from '@/lib/lead-mapper';
import { isLeadStage, stageLabel } from '@/lib/leads';
import { formatDateTimeBr } from '@/lib/dates';
import { toNumber } from '@/lib/money';
import { diffFields, logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

// GET /api/crm/leads/[id] - Lead com histórico de interações e propostas
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      ...LEAD_INCLUDE,
      interactions: { orderBy: { createdAt: 'desc' }, take: 100 },
      proposals: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, number: true, title: true, status: true, recurringTotal: true, oneTimeTotal: true, createdAt: true },
      },
    },
  });
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });

  return NextResponse.json({
    success: true,
    lead: mapLead(lead),
    interactions: lead.interactions,
    proposals: lead.proposals.map((p) => ({ ...p, recurringTotal: toNumber(p.recurringTotal), oneTimeTotal: toNumber(p.oneTimeTotal) })),
  });
}

// PUT /api/crm/leads/[id]
//   { stage, position, lostReason? } → mover no quadro (arrastar e soltar)
//   { ...campos }                    → editar dados do lead
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const current = await prisma.lead.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });

    const body = await req.json();
    const isMove =
      body &&
      typeof body === 'object' &&
      'stage' in body &&
      Object.keys(body).every((k) => ['stage', 'position', 'lostReason'].includes(k));

    let data: Record<string, unknown>;
    if (isMove) {
      if (!isLeadStage(body.stage)) return NextResponse.json({ error: 'Estágio inválido' }, { status: 400 });
      data = {
        stage: body.stage,
        position: typeof body.position === 'number' && Number.isFinite(body.position) ? body.position : current.position,
        ...(body.stage === 'PERDIDO' && typeof body.lostReason === 'string'
          ? { lostReason: body.lostReason.trim().slice(0, 300) || null }
          : {}),
      };
    } else {
      const parsed = leadSchema.safeParse({
        ...current,
        nextActionAt: current.nextActionAt?.toISOString() ?? null,
        ...body,
      });
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 });
      }
      const input = parsed.data;
      const nextActionAt = input.nextActionAt ? new Date(input.nextActionAt) : null;
      data = {
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        company: input.company || null,
        interest: input.interest || null,
        message: input.message || null,
        source: input.source,
        stage: input.stage,
        estimatedValue: input.estimatedValue,
        ownerId: input.ownerId || null,
        nextAction: input.nextAction || null,
        nextActionAt: nextActionAt && !Number.isNaN(nextActionAt.getTime()) ? nextActionAt : null,
        lostReason: typeof body.lostReason === 'string' ? body.lostReason.trim().slice(0, 300) || null : current.lostReason,
      };
    }

    const stageChanged = data.stage !== undefined && data.stage !== current.stage;
    const lead = await prisma.lead.update({
      where: { id },
      data: { ...data, ...(stageChanged ? { stageChangedAt: new Date() } : {}) },
      include: LEAD_INCLUDE,
    });

    // Mudança de estágio entra na linha do tempo do CRM automaticamente
    if (stageChanged) {
      await prisma.crmInteraction.create({
        data: {
          operator: `${auth.name} (${auth.role})`,
          leadId: id,
          customerId: lead.customerId,
          customerName: lead.company ? `${lead.name} (${lead.company})` : lead.name,
          title: `Funil: ${stageLabel(current.stage)} → ${stageLabel(lead.stage)}`,
          description:
            lead.stage === 'PERDIDO' && lead.lostReason
              ? `Motivo da perda: ${lead.lostReason}`
              : `Lead movido para "${stageLabel(lead.stage)}".`,
          date: formatDateTimeBr(),
          type: 'COMERCIAL',
        },
      });
    }

    if (!isMove || stageChanged) {
      const changes = diffFields(current as unknown as Record<string, unknown>, data);
      delete changes.position;
      if (Object.keys(changes).length > 0) {
        await logAudit({
          actor: actorOf(auth),
          action: stageChanged ? 'STATUS' : 'UPDATE',
          entity: 'lead',
          entityId: id,
          summary: stageChanged
            ? `Lead "${lead.name}": ${stageLabel(current.stage)} → ${stageLabel(lead.stage)}`
            : `Lead "${lead.name}" atualizado`,
          changes,
        });
      }
    }

    return NextResponse.json({ success: true, lead: mapLead(lead) });
  } catch (error) {
    console.error('[API Lead PUT Error]:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lead' }, { status: 500 });
  }
}

// DELETE /api/crm/leads/[id] - Excluir lead (o histórico do CRM é mantido, sem o vínculo)
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const lead = await prisma.lead.findUnique({ where: { id }, select: { name: true } });
    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    await prisma.lead.delete({ where: { id } });
    await logAudit({ actor: actorOf(auth), action: 'DELETE', entity: 'lead', entityId: id, summary: `Lead "${lead.name}" excluído` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Lead DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir lead' }, { status: 500 });
  }
}
