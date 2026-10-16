import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { firstZodError, mapProduct, productInputSchema } from '@/lib/products';
import { diffFields, logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

// PUT /api/products/[id] - Atualizar produto (campos ausentes mantêm o valor atual)
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageProducts');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ message: 'Produto não encontrado' }, { status: 404 });

    const body = await req.json();
    const merged = {
      ...mapProduct(current),
      ...Object.fromEntries(Object.entries(body ?? {}).filter(([, v]) => v !== undefined)),
    };
    const parsed = productInputSchema.safeParse(merged);
    if (!parsed.success) return NextResponse.json({ message: firstZodError(parsed.error) }, { status: 400 });
    const input = parsed.data;

    const data = {
      name: input.name,
      price: input.price,
      description: input.description,
      category: input.category || null,
      active: input.active,
      recurring: input.recurring,
    };
    const updated = await prisma.product.update({
      where: { id },
      data: { ...data, features: { ...((current.features as object) || {}), isRequired: input.isRequired } },
    });

    await logAudit({
      actor: actorOf(auth),
      action: 'UPDATE',
      entity: 'product',
      entityId: id,
      summary: `Produto "${updated.name}" atualizado`,
      changes: diffFields({ ...mapProduct(current) }, { ...data, category: data.category || '', isRequired: input.isRequired }),
    });

    return NextResponse.json(mapProduct(updated));
  } catch (error) {
    console.error('[API Products PUT Error]:', error);
    return NextResponse.json({ message: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Excluir produto (preços nas tabelas dos grupos saem junto)
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageProducts');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const inProposals = await prisma.proposalItem.count({ where: { productId: id, proposal: { status: { in: ['RASCUNHO', 'ENVIADA'] } } } });
    if (inProposals > 0) {
      return NextResponse.json(
        { message: `O produto está em ${inProposals} proposta(s) em andamento. Inative-o em vez de excluir.` },
        { status: 409 }
      );
    }
    const removed = await prisma.product.delete({ where: { id } });
    await logAudit({
      actor: actorOf(auth),
      action: 'DELETE',
      entity: 'product',
      entityId: id,
      summary: `Produto "${removed.name}" excluído`,
    });
    return NextResponse.json({ success: true, message: 'Produto excluído com sucesso' });
  } catch (error) {
    if (isNotFound(error)) return NextResponse.json({ message: 'Produto não encontrado' }, { status: 404 });
    console.error('[API Products DELETE Error]:', error);
    return NextResponse.json({ message: 'Erro ao excluir produto' }, { status: 500 });
  }
}
