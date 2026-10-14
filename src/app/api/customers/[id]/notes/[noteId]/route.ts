import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';

// DELETE /api/customers/[id]/notes/[noteId]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, noteId } = await params;
    const result = await prisma.customerNote.deleteMany({ where: { id: noteId, customerId: id } });
    if (result.count === 0) return NextResponse.json({ message: 'Observação não encontrada' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Customer Note DELETE Error]:', error);
    return NextResponse.json({ message: 'Erro ao excluir observação' }, { status: 500 });
  }
}
