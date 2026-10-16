import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { round2, toNumber } from '@/lib/money';
import { logAudit } from '@/lib/audit';

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
    return NextResponse.json(prices.map((p) => ({ productId: p.productId, price: toNumber(p.price) })));
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
          .map((p: any) => ({ productId: p.productId, price: toNumber(p.price) }))
      : [];

    const group = await prisma.customerGroup.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!group) return NextResponse.json({ message: 'Grupo não encontrado' }, { status: 404 });

    if (items.some((i) => Number.isNaN(i.price) || i.price < 0)) {
      return NextResponse.json({ message: 'Os preços devem ser valores válidos (R$ 0,00 ou mais)' }, { status: 400 });
    }

    // Produtos obrigatórios (e ativos) precisam ter preço definido no grupo
    const products = await prisma.product.findMany({ select: { id: true, name: true, features: true, active: true } });
    const validIds = new Set(products.map((p) => p.id));
    const provided = new Set(items.map((i) => i.productId));
    const missing = products.filter((p) => p.active && (p.features as any)?.isRequired && !provided.has(p.id));
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
          update: { price: round2(i.price) },
          create: { groupId: id, productId: i.productId, price: round2(i.price) },
        })
      ),
    ]);

    await logAudit({
      actor: actorOf(auth),
      action: 'UPDATE',
      entity: 'prices',
      entityId: id,
      summary: `Tabela de preços do grupo "${group.name}" salva (${validItems.length} produto(s))`,
      changes: Object.fromEntries(
        validItems.map((i) => [products.find((p) => p.id === i.productId)?.name || i.productId, round2(i.price)])
      ),
    });

    return NextResponse.json({ success: true, message: 'Tabela de preços salva com sucesso' });
  } catch (error) {
    console.error('[API Group Prices PUT Error]:', error);
    return NextResponse.json({ message: 'Erro ao salvar preços' }, { status: 500 });
  }
}
