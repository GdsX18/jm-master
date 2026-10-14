import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';

type Params = { params: Promise<{ id: string }> };

// GET /api/products/group-prices/[groupId] - Preços do grupo: [{ productId, price }]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requirePermission(['manageProducts', 'manageCrm']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const prices = await prisma.groupProductPrice.findMany({
      where: { groupId: id },
      select: { productId: true, price: true },
    });
    return NextResponse.json(prices);
  } catch (error) {
    console.error('[API Group Prices GET Error]:', error);
    return NextResponse.json({ message: 'Erro ao carregar preços' }, { status: 500 });
  }
}

// PUT /api/products/group-prices/[groupId] - Salvar tabela de preços { products: [{ productId, price }] }
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageProducts');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const items: { productId: string; price: number }[] = Array.isArray(body?.products)
      ? body.products
          .filter((p: any) => typeof p?.productId === 'string')
          .map((p: any) => ({ productId: p.productId, price: Number(p.price) }))
      : [];

    const group = await prisma.customerGroup.findUnique({ where: { id }, select: { id: true } });
    if (!group) return NextResponse.json({ message: 'Grupo não encontrado' }, { status: 404 });

    if (items.some((i) => Number.isNaN(i.price) || i.price < 0)) {
      return NextResponse.json({ message: 'Os preços devem ser valores válidos (R$ 0,00 ou mais)' }, { status: 400 });
    }

    // Produtos obrigatórios precisam ter preço definido no grupo
    const products = await prisma.product.findMany({ select: { id: true, name: true, features: true } });
    const validIds = new Set(products.map((p) => p.id));
    const provided = new Set(items.map((i) => i.productId));
    const missing = products.filter((p) => (p.features as any)?.isRequired && !provided.has(p.id));
    if (missing.length > 0) {
      return NextResponse.json(
        { message: `Defina o preço dos produtos obrigatórios: ${missing.map((p) => p.name).join(', ')}` },
        { status: 400 }
      );
    }

    const validItems = items.filter((i) => validIds.has(i.productId));

    await prisma.$transaction([
      prisma.groupProductPrice.deleteMany({
        where: { groupId: id, productId: { notIn: validItems.map((i) => i.productId) } },
      }),
      ...validItems.map((i) =>
        prisma.groupProductPrice.upsert({
          where: { groupId_productId: { groupId: id, productId: i.productId } },
          update: { price: Math.round(i.price * 100) / 100 },
          create: { groupId: id, productId: i.productId, price: Math.round(i.price * 100) / 100 },
        })
      ),
    ]);

    return NextResponse.json({ success: true, message: 'Tabela de preços salva com sucesso' });
  } catch (error) {
    console.error('[API Group Prices PUT Error]:', error);
    return NextResponse.json({ message: 'Erro ao salvar preços' }, { status: 500 });
  }
}
