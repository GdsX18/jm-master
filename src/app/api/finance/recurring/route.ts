import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';
import { readBilling, suggestedAmountForCustomer } from '@/lib/billing';

// GET /api/finance/recurring - Clientes com sua configuração de cobrança recorrente
export async function GET() {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        phone: true,
        data: true,
        groups: { select: { name: true, prices: { select: { price: true } } } },
      },
    });

    return NextResponse.json({
      success: true,
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        isActive: c.status === 'ATIVO',
        phone: c.phone,
        groupName: c.groups[0]?.name || null,
        suggestedAmount: c.groups[0]
          ? Math.round(c.groups[0].prices.reduce((sum, p) => sum + p.price, 0) * 100) / 100
          : 0,
        billing: readBilling(c.data),
      })),
    });
  } catch (error) {
    console.error('[API Recurring GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar cobranças recorrentes' }, { status: 500 });
  }
}

// PUT /api/finance/recurring - Salvar configuração { customerId, billing: {...} }
export async function PUT(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const { customerId, billing, useGroupPrice } = await req.json();
    if (!customerId) return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { data: true } });
    if (!customer) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const config = readBilling({ billing });
    if (useGroupPrice) {
      config.amount = await suggestedAmountForCustomer(customerId);
    }
    if (config.enabled && config.amount <= 0) {
      return NextResponse.json({ error: 'Informe um valor mensal maior que zero para ativar a cobrança' }, { status: 400 });
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: { data: { ...((customer.data as object) || {}), billing: { ...config } } },
    });

    return NextResponse.json({ success: true, billing: config });
  } catch (error) {
    console.error('[API Recurring PUT Error]:', error);
    return NextResponse.json({ error: 'Erro ao salvar cobrança recorrente' }, { status: 500 });
  }
}
