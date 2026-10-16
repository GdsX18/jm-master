import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { firstBillingPeriod, readBilling, suggestedAmountForCustomer } from '@/lib/billing';
import { round2, toNumber } from '@/lib/money';
import { diffFields, logAudit } from '@/lib/audit';

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
        groups: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          take: 1,
          select: {
            name: true,
            prices: { where: { product: { active: true, recurring: true } }, select: { price: true } },
          },
        },
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
        suggestedAmount: c.groups[0] ? round2(c.groups[0].prices.reduce((sum, p) => sum + toNumber(p.price), 0)) : 0,
        billing: readBilling(c.data),
      })),
    });
  } catch (error) {
    console.error('[API Recurring GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar cobranças recorrentes' }, { status: 500 });
  }
}

// PUT /api/finance/recurring - Salvar configuração { customerId, billing: {...}, useGroupPrice? }
export async function PUT(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const { customerId, billing, useGroupPrice } = await req.json();
    if (!customerId) return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 });

    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { name: true, data: true } });
    if (!customer) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const previous = readBilling(customer.data);
    const config = readBilling({ billing: { ...billing, startPeriod: undefined } });
    if (useGroupPrice) {
      config.amount = await suggestedAmountForCustomer(customerId);
    }
    if (config.enabled && config.amount <= 0) {
      return NextResponse.json({ error: 'Informe um valor mensal maior que zero para ativar a cobrança' }, { status: 400 });
    }

    // Primeiro mês faturado: definido ao ativar; mantido enquanto continuar ativa
    if (config.enabled) {
      config.startPeriod = previous.enabled && previous.startPeriod ? previous.startPeriod : firstBillingPeriod(config.dueDay);
    }

    await updateBilling(customerId, customer.data, config);

    await logAudit({
      actor: actorOf(auth),
      action: 'UPDATE',
      entity: 'billing',
      entityId: customerId,
      summary: `Cobrança recorrente de ${customer.name} ${config.enabled ? 'ativa' : 'desativada'}`,
      changes: diffFields(previous as unknown as Record<string, unknown>, config as unknown as Record<string, unknown>),
    });

    return NextResponse.json({ success: true, billing: config });
  } catch (error) {
    console.error('[API Recurring PUT Error]:', error);
    return NextResponse.json({ error: 'Erro ao salvar cobrança recorrente' }, { status: 500 });
  }
}

async function updateBilling(customerId: string, data: unknown, config: object) {
  await prisma.customer.update({
    where: { id: customerId },
    data: { data: { ...((data as object) || {}), billing: { ...config } } },
  });
}
