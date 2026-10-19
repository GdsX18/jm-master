import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { removeObjects } from '@/lib/storage';
import { actorOf, requirePermission } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { CUSTOMER_DOCS_BUCKET } from '@/lib/customers';

// DELETE /api/customers/[id]/documents/[docId]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, docId } = await params;
    const document = await prisma.customerDocument.findFirst({ where: { id: docId, customerId: id } });
    if (!document) return NextResponse.json({ message: 'Documento não encontrado' }, { status: 404 });

    await removeObjects(CUSTOMER_DOCS_BUCKET, [document.storagePath]).catch((error) =>
      console.warn('[Customer Document Delete] Arquivo não removido do Storage:', error.message)
    );

    await prisma.customerDocument.delete({ where: { id: docId } });
    await logAudit({
      actor: actorOf(auth),
      action: 'DELETE',
      entity: 'customer',
      entityId: id,
      summary: `Documento "${document.name}" removido do cliente`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Customer Document DELETE Error]:', error);
    return NextResponse.json({ message: 'Erro ao excluir documento' }, { status: 500 });
  }
}
