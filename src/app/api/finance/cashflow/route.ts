import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';
import { readBilling } from '@/lib/billing';
import { addMonths, brazilToday, currentPeriod } from '@/lib/dates';
import { round2, toNumber } from '@/lib/money';

export const dynamic = 'force-dynamic';

const PAST_MONTHS = 6;
const FUTURE_MONTHS = 6;

interface MonthRow {
  month: string;
  type: string;
  total: unknown;
}

// GET /api/finance/cashflow - Fluxo de caixa (realizado × previsto), MRR e indicadores de receita recorrente
export async function GET() {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const now = currentPeriod();
    const firstMonth = addMonths(now, -(PAST_MONTHS - 1));
    const lastMonth = addMonths(now, FUTURE_MONTHS);
    const months: string[] = [];
    for (let m = firstMonth; m <= lastMonth; m = addMonths(m, 1)) months.push(m);

    const rangeStart = new Date(`${firstMonth}-01T00:00:00.000Z`);
    const rangeEnd = new Date(`${addMonths(lastMonth, 1)}-01T00:00:00.000Z`);

    const [realizedRows, openRows, customers, recurringInvoices, expenseCategories, overdueAgg, dueAgg] = await Promise.all([
      // Realizado: pagamentos pelo mês em que foram pagos (fuso de Brasília)
      prisma.$queryRaw<MonthRow[]>`
        SELECT to_char("paymentDate" AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS month, type, SUM(amount) AS total
        FROM financial_records
        WHERE status = 'PAGO' AND "paymentDate" >= ${rangeStart} AND "paymentDate" < ${rangeEnd}
        GROUP BY 1, 2`,
      // Previsto: em aberto pelo mês de vencimento (atrasados entram no mês atual)
      prisma.$queryRaw<MonthRow[]>`
        SELECT CASE WHEN to_char("dueDate", 'YYYY-MM') < ${now} THEN ${now} ELSE to_char("dueDate", 'YYYY-MM') END AS month,
               type, SUM(amount) AS total
        FROM financial_records
        WHERE status IN ('ABERTO', 'PENDENTE', 'ATRASADO') AND "dueDate" IS NOT NULL AND "dueDate" < ${rangeEnd}
        GROUP BY 1, 2`,
      prisma.customer.findMany({
        where: { status: 'ATIVO', data: { path: ['billing', 'enabled'], equals: true } },
        select: {
          id: true,
          name: true,
          data: true,
          groups: { where: { isActive: true }, orderBy: { name: 'asc' }, take: 1, select: { name: true } },
        },
      }),
      prisma.financialRecord.findMany({
        where: { type: 'RECEITA', metadata: { path: ['recurring'], equals: true } },
        select: { customerId: true, metadata: true },
      }),
      prisma.$queryRaw<{ category: string; total: unknown }[]>`
        SELECT category, SUM(amount) AS total FROM financial_records
        WHERE type = 'DESPESA' AND status <> 'CANCELADO' AND "dueDate" >= ${new Date(`${addMonths(now, -2)}-01T00:00:00.000Z`)}
          AND "dueDate" < ${new Date(`${addMonths(now, 1)}-01T00:00:00.000Z`)}
        GROUP BY category ORDER BY 2 DESC`,
      prisma.financialRecord.aggregate({
        where: {
          type: 'RECEITA',
          status: { in: ['ABERTO', 'PENDENTE', 'ATRASADO'] },
          dueDate: { lt: new Date(`${brazilToday()}T00:00:00.000Z`) },
        },
        _sum: { amount: true },
      }),
      prisma.financialRecord.aggregate({
        where: {
          type: 'RECEITA',
          status: { not: 'CANCELADO' },
          dueDate: { lt: new Date(`${brazilToday()}T00:00:00.000Z`), gte: new Date(`${addMonths(now, -12)}-01T00:00:00.000Z`) },
        },
        _sum: { amount: true },
      }),
    ]);

    const flow = Object.fromEntries(
      months.map((m) => [m, { month: m, receitaRealizada: 0, despesaRealizada: 0, receitaPrevista: 0, despesaPrevista: 0 }])
    );
    for (const row of realizedRows) {
      const bucket = flow[row.month];
      if (!bucket) continue;
      if (row.type === 'DESPESA') bucket.despesaRealizada += toNumber(row.total);
      else bucket.receitaRealizada += toNumber(row.total);
    }
    for (const row of openRows) {
      const bucket = flow[row.month];
      if (!bucket) continue;
      if (row.type === 'DESPESA') bucket.despesaPrevista += toNumber(row.total);
      else bucket.receitaPrevista += toNumber(row.total);
    }

    // Mensalidades futuras que ainda não viraram fatura entram como receita prevista
    const billedPeriods = new Set(
      recurringInvoices.map((r) => `${r.customerId}:${(r.metadata as Record<string, unknown> | null)?.period}`)
    );
    let mrr = 0;
    const byGroup: Record<string, { group: string; mrr: number; customers: number }> = {};
    for (const c of customers) {
      const billing = readBilling(c.data);
      if (!billing.enabled || billing.amount <= 0) continue;
      mrr += billing.amount;
      const groupName = c.groups[0]?.name || 'Sem grupo';
      byGroup[groupName] ??= { group: groupName, mrr: 0, customers: 0 };
      byGroup[groupName].mrr += billing.amount;
      byGroup[groupName].customers += 1;

      for (const m of months) {
        if (m < now || (billing.startPeriod && m < billing.startPeriod)) continue;
        if (!billedPeriods.has(`${c.id}:${m}`)) flow[m].receitaPrevista += billing.amount;
      }
    }

    const cashflow = months.map((m) => {
      const b = flow[m];
      const entradas = round2(b.receitaRealizada + (m >= now ? b.receitaPrevista : 0));
      const saidas = round2(b.despesaRealizada + (m >= now ? b.despesaPrevista : 0));
      return {
        month: m,
        isFuture: m > now,
        isCurrent: m === now,
        receitaRealizada: round2(b.receitaRealizada),
        despesaRealizada: round2(b.despesaRealizada),
        receitaPrevista: round2(b.receitaPrevista),
        despesaPrevista: round2(b.despesaPrevista),
        saldo: round2(entradas - saidas),
      };
    });

    const activeBillingCount = Object.values(byGroup).reduce((s, g) => s + g.customers, 0);
    const overdue = toNumber(overdueAgg._sum.amount);
    const due = toNumber(dueAgg._sum.amount);

    return NextResponse.json({
      success: true,
      cashflow,
      indicators: {
        mrr: round2(mrr),
        arr: round2(mrr * 12),
        activeBillingCount,
        ticketMedio: activeBillingCount ? round2(mrr / activeBillingCount) : 0,
        inadimplenciaPct: due > 0 ? round2((overdue / due) * 100) : 0,
      },
      byGroup: Object.values(byGroup)
        .map((g) => ({ ...g, mrr: round2(g.mrr), ticketMedio: round2(g.mrr / g.customers) }))
        .sort((a, b) => b.mrr - a.mrr),
      expenseCategories: expenseCategories.map((e) => ({ category: e.category, total: round2(toNumber(e.total)) })),
    });
  } catch (error) {
    console.error('[API Cashflow Error]:', error);
    return NextResponse.json({ error: 'Erro ao calcular o fluxo de caixa' }, { status: 500 });
  }
}
