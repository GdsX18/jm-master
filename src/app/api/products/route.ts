import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { firstZodError, mapProduct, productInputSchema } from '@/lib/products';
import { logAudit } from '@/lib/audit';

// GET /api/products - Listar produtos do catálogo
export async function GET() {
  const auth = await requirePermission(['manageProducts', 'manageCrm']);
  if (auth instanceof NextResponse) return auth;

  try {
    const products = await prisma.product.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'asc' }] });
    return NextResponse.json(products.map(mapProduct));
  } catch (error) {
    console.error('[API Products GET Error]:', error);
    return NextResponse.json({ message: 'Erro ao carregar produtos' }, { status: 500 });
  }
}

// POST /api/products - Cadastrar novo produto
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageProducts');
  if (auth instanceof NextResponse) return auth;

  try {
    const parsed = productInputSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ message: firstZodError(parsed.error) }, { status: 400 });
    const input = parsed.data;

    const product = await prisma.product.create({
      data: {
        name: input.name,
        price: input.price,
        description: input.description,
        category: input.category || null,
        active: input.active,
        recurring: input.recurring,
        features: { isRequired: input.isRequired },
      },
    });

    await logAudit({
      actor: actorOf(auth),
      action: 'CREATE',
      entity: 'product',
      entityId: product.id,
      summary: `Produto "${product.name}" cadastrado`,
    });

    return NextResponse.json(mapProduct(product));
  } catch (error) {
    console.error('[API Products POST Error]:', error);
    return NextResponse.json({ message: 'Erro ao criar produto' }, { status: 500 });
  }
}
