import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';

// POST /api/customers/[id]/notes - Registrar observação no cliente
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { content } = await req.json();
    const text = typeof content === 'string' ? content.trim() : '';
    if (!text) return NextResponse.json({ message: 'Escreva a observação' }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!customer) return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });

    const note = await prisma.customerNote.create({
      data: { customerId: id, content: text.slice(0, 5000), userEmail: auth.email },
    });
    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error('[API Customer Notes POST Error]:', error);
    return NextResponse.json({ message: 'Erro ao salvar observação' }, { status: 500 });
  }
}
