import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { logAudit } from '@/lib/audit';

// GET /api/products/groups - Listar grupos de clientes / tabelas de preço
export async function GET() {
  const auth = await requirePermission(['manageProducts', 'manageCrm']);
  if (auth instanceof NextResponse) return auth;

  try {
    const groups = await prisma.customerGroup.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        isActive: true,
        _count: { select: { customers: true, prices: true } },
        customers: { where: { status: 'ATIVO' }, select: { id: true } },
      },
    });
    return NextResponse.json(
      groups.map((g) => ({
        id: g.id,
        name: g.name,
        isActive: g.isActive,
        customerCount: g._count.customers,
        activeCustomerCount: g.customers.length,
        priceCount: g._count.prices,
      }))
    );
  } catch (error) {
    console.error('[API Groups GET Error]:', error);
    return NextResponse.json({ message: 'Erro ao carregar grupos' }, { status: 500 });
  }
}

// POST /api/products/groups - Criar novo grupo
export async function POST(req: NextRequest) {
  const auth = await requirePermission(['manageProducts', 'manageCrm']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { name } = await req.json();
    const cleanName = typeof name === 'string' ? name.trim().slice(0, 120) : '';
    if (!cleanName) {
      return NextResponse.json({ message: 'O nome do grupo é obrigatório' }, { status: 400 });
    }

    const duplicate = await prisma.customerGroup.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
    });
    if (duplicate) {
      return NextResponse.json({ message: 'Já existe um grupo com este nome' }, { status: 409 });
    }

    const group = await prisma.customerGroup.create({ data: { name: cleanName } });
    await logAudit({
      actor: actorOf(auth),
      action: 'CREATE',
      entity: 'group',
      entityId: group.id,
      summary: `Grupo "${group.name}" criado`,
    });
    return NextResponse.json({
      id: group.id,
      name: group.name,
      isActive: group.isActive,
      customerCount: 0,
      activeCustomerCount: 0,
      priceCount: 0,
    });
  } catch (error) {
    console.error('[API Groups POST Error]:', error);
    return NextResponse.json({ message: 'Erro ao criar grupo' }, { status: 500 });
  }
}

// DELETE /api/products/groups?id= - Excluir grupo (vínculos e preços saem junto)
export async function DELETE(req: NextRequest) {
  const auth = await requirePermission(['manageProducts', 'manageCrm']);
  if (auth instanceof NextResponse) return auth;

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'ID do grupo é obrigatório' }, { status: 400 });
    }

    const group = await prisma.customerGroup.findUnique({ where: { id }, select: { name: true } });
    if (!group) {
      return NextResponse.json({ message: 'Grupo não encontrado' }, { status: 404 });
    }
    await prisma.customerGroup.delete({ where: { id } });
    await logAudit({
      actor: actorOf(auth),
      action: 'DELETE',
      entity: 'group',
      entityId: id,
      summary: `Grupo "${group.name}" excluído`,
    });
    return NextResponse.json({ success: true, message: 'Grupo excluído com sucesso' });
  } catch (error) {
    console.error('[API Groups DELETE Error]:', error);
    return NextResponse.json({ message: 'Erro ao excluir grupo' }, { status: 500 });
  }
}
