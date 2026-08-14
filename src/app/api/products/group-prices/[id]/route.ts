import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products/group-prices/[id] - Obter preços definidos para um grupo
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params;
    const setting = await prisma.siteSetting.findUnique({ where: { id: 'default' } });

    let groupPrices: any[] = [];
    if (setting?.customBodyScript && setting.customBodyScript.startsWith('PRICES_JSON:')) {
      try {
        const allPrices = JSON.parse(setting.customBodyScript.replace('PRICES_JSON:', ''));
        groupPrices = allPrices[groupId] || [];
      } catch {}
    }

    return NextResponse.json(groupPrices);
  } catch (error: any) {
    console.error('[API Group Prices GET Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao carregar preços' }, { status: 500 });
  }
}

// PUT /api/products/group-prices/[id] - Salvar preços para o grupo
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: groupId } = await params;
    const body = await req.json();
    const { products } = body; // array de { productId, price }

    let setting = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
    let allPrices: Record<string, any[]> = {};

    if (setting?.customBodyScript && setting.customBodyScript.startsWith('PRICES_JSON:')) {
      try {
        allPrices = JSON.parse(setting.customBodyScript.replace('PRICES_JSON:', ''));
      } catch {}
    }

    allPrices[groupId] = products || [];

    await prisma.siteSetting.upsert({
      where: { id: 'default' },
      update: { customBodyScript: `PRICES_JSON:${JSON.stringify(allPrices)}` },
      create: { id: 'default', customBodyScript: `PRICES_JSON:${JSON.stringify(allPrices)}` },
    });

    return NextResponse.json({ success: true, message: 'Preços salvos com sucesso' });
  } catch (error: any) {
    console.error('[API Group Prices PUT Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao salvar preços' }, { status: 500 });
  }
}
