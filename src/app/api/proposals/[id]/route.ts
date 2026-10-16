import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { PROPOSAL_INCLUDE, computeTotals, mapProposal, parseValidUntil, proposalSchema } from '@/lib/proposals';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

// GET /api/proposals/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({ where: { id }, include: PROPOSAL_INCLUDE });
  if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
  return NextResponse.json({ success: true, proposal: mapProposal(proposal) });
}

// PUT /api/proposals/[id] - Editar (somente rascunho ou enviada)
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const current = await prisma.proposal.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    if (current.status === 'ACEITA' || current.status === 'RECUSADA') {
      return NextResponse.json({ error: 'Propostas aceitas ou recusadas não podem ser editadas. Duplique para criar uma nova versão.' }, { status: 409 });
    }

    const parsed = proposalSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 });
    const input = parsed.data;
    const totals = computeTotals(input.items, input.discount);

    await prisma.$transaction([
      prisma.proposalItem.deleteMany({ where: { proposalId: id } }),
      prisma.proposal.update({
        where: { id },
        data: {
          title: input.title,
          leadId: input.leadId || null,
          customerId: input.customerId || null,
          validUntil: parseValidUntil(input.validUntil),
          notes: input.notes || null,
          discount: totals.discount,
          dueDay: input.dueDay,
          oneTimeTotal: totals.oneTimeTotal,
          recurringTotal: totals.recurringTotal,
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
        },
      }),
    ]);

    await logAudit({
      actor: actorOf(auth),
      action: 'UPDATE',
      entity: 'proposal',
      entityId: id,
      summary: `Proposta ${current.number} editada`,
    });

    const full = await prisma.proposal.findUniqueOrThrow({ where: { id }, include: PROPOSAL_INCLUDE });
    return NextResponse.json({ success: true, proposal: mapProposal(full) });
  } catch (error) {
    console.error('[API Proposal PUT Error]:', error);
    return NextResponse.json({ error: 'Erro ao salvar proposta' }, { status: 500 });
  }
}

// DELETE /api/proposals/[id] - Excluir (propostas aceitas ficam como histórico)
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const current = await prisma.proposal.findUnique({ where: { id }, select: { number: true, status: true, title: true } });
    if (!current) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    if (current.status === 'ACEITA') {
      return NextResponse.json({ error: 'Propostas aceitas não podem ser excluídas (geraram cobrança).' }, { status: 409 });
    }
    await prisma.proposal.delete({ where: { id } });
    await logAudit({
      actor: actorOf(auth),
      action: 'DELETE',
      entity: 'proposal',
      entityId: id,
      summary: `Proposta ${current.number} excluída (${current.title})`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Proposal DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir proposta' }, { status: 500 });
  }
}
