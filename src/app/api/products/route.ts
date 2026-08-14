import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products - Listar produtos do catálogo
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Mapear para o formato esperado pelo frontend
    const mapped = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
      isRequired: (p.features as any)?.isRequired ?? false,
      active: p.active,
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('[API Products GET Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao carregar produtos' }, { status: 500 });
  }
}

// POST /api/products - Cadastrar novo produto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, isRequired, price, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'O nome do produto é obrigatório' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        price: Number(price) || 0,
        description: description || '',
        active: true,
        features: { isRequired: !!isRequired },
      },
    });

    return NextResponse.json({
      id: product.id,
      name: product.name,
      isRequired: !!isRequired,
      price: product.price,
    });
  } catch (error: any) {
    console.error('[API Products POST Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao criar produto' }, { status: 500 });
  }
}
