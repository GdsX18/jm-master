import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/products/[id] - Atualizar produto
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, isRequired, price, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'Nome do produto é obrigatório' }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        price: price !== undefined ? Number(price) : undefined,
        description: description !== undefined ? description : undefined,
        features: { isRequired: !!isRequired },
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      isRequired: !!isRequired,
      price: updated.price,
    });
  } catch (error: any) {
    console.error('[API Products PUT Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao atualizar produto' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Excluir produto
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Produto excluído com sucesso' });
  } catch (error: any) {
    console.error('[API Products DELETE Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao excluir produto' }, { status: 500 });
  }
}
