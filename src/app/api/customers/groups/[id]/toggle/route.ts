import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { logAudit } from '@/lib/audit';

// PUT /api/customers/groups/[id]/toggle - Ativar/desativar grupo
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(['manageCrm', 'manageProducts']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const group = await prisma.customerGroup.findUnique({ where: { id } });
    if (!group) return NextResponse.json({ message: 'Grupo não encontrado' }, { status: 404 });

    const updated = await prisma.customerGroup.update({
      where: { id },
      data: { isActive: !group.isActive },
    });
    await logAudit({
      actor: actorOf(auth),
      action: 'STATUS',
      entity: 'group',
      entityId: id,
      summary: `Grupo "${group.name}" ${updated.isActive ? 'ativado' : 'desativado'}`,
    });
    return NextResponse.json({ success: true, isActive: updated.isActive });
  } catch (error) {
    console.error('[API Group Toggle Error]:', error);
    return NextResponse.json({ message: 'Erro ao alterar status do grupo' }, { status: 500 });
  }
}
