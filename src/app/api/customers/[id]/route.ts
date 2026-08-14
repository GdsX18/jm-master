import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/customers/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const c = await prisma.customer.findUnique({
      where: { id },
      include: { interactions: true },
    });

    if (!c) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }

    const data = (c.data as any) || {};
    return NextResponse.json({
      id: c.id,
      name: c.name,
      document: data.document || '',
      street: data.street || '',
      number: data.number || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: data.zipCode || '',
      code: data.code || '',
      type: data.type || 'POS_PAGO',
      groupId: data.groupId || 'grp-padrao',
      groupName: data.groupName || 'Tabela Padrão',
      cutoffDay: data.cutoffDay || 1,
      gracePeriod: data.gracePeriod || 5,
      isActive: c.status === 'ATIVO',
      contacts: data.contacts || [],
      products: data.products || [],
      documents: data.documents || [],
      notes: data.notes || [],
      createdAt: c.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[API Customer GET Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao buscar cliente' }, { status: 500 });
  }
}

// PUT /api/customers/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const current = await prisma.customer.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }

    const currentData = (current.data as any) || {};
    const updatedData = {
      ...currentData,
      ...body,
    };

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name ? body.name.trim() : current.name,
        company: body.name ? body.name.trim() : current.company,
        data: updatedData,
      },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    console.error('[API Customer PUT Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Cliente excluído com sucesso' });
  } catch (error: any) {
    console.error('[API Customer DELETE Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao excluir cliente' }, { status: 500 });
  }
}
