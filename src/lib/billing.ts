import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { brazilToday, currentPeriod, addMonths, formatDateBr, formatDateTimeBr } from './dates';
import { formatBRL, round2, toNumber } from './money';
import { SYSTEM_ACTOR, logAudit } from './audit';

export { brazilToday, currentPeriod };

// Configuração de cobrança recorrente, guardada em Customer.data.billing
export interface BillingConfig {
  enabled: boolean;
  amount: number;
  dueDay: number; // 1 a 28 (evita meses sem dia 29/30/31)
  description: string;
  method: string;
  // Primeiro mês (YYYY-MM) a ser faturado. Ativar depois do vencimento começa no mês seguinte,
  // em vez de gerar na hora uma fatura já vencida.
  startPeriod?: string;
}

export const DEFAULT_BILLING: BillingConfig = {
  enabled: false,
  amount: 0,
  dueDay: 10,
  description: 'Mensalidade Plataforma & WhatsApp API',
  method: 'Boleto / Pix',
};

export function readBilling(data: unknown): BillingConfig {
  const raw = (data as Record<string, any>)?.billing || {};
  const dueDay = Math.min(28, Math.max(1, parseInt(raw.dueDay, 10) || DEFAULT_BILLING.dueDay));
  return {
    enabled: raw.enabled === true,
    amount: Math.max(0, round2(toNumber(raw.amount))),
    dueDay,
    description: typeof raw.description === 'string' && raw.description.trim() ? raw.description.trim() : DEFAULT_BILLING.description,
    method: typeof raw.method === 'string' && raw.method ? raw.method : DEFAULT_BILLING.method,
    startPeriod: typeof raw.startPeriod === 'string' && /^\d{4}-\d{2}$/.test(raw.startPeriod) ? raw.startPeriod : undefined,
  };
}

// Mês em que a cobrança recém-ativada começa: este mês se o vencimento ainda não passou, senão o próximo
export function firstBillingPeriod(dueDay: number): string {
  const today = brazilToday();
  const day = Number(today.slice(8, 10));
  return day <= dueDay ? currentPeriod() : addMonths(currentPeriod(), 1);
}

export async function nextSequence(prefix: string, model: 'invoice' | 'proposal'): Promise<string> {
  const last =
    model === 'invoice'
      ? await prisma.financialRecord.findFirst({
          where: { invoiceNumber: { startsWith: prefix } },
          orderBy: { invoiceNumber: 'desc' },
          select: { invoiceNumber: true },
        })
      : await prisma.proposal.findFirst({
          where: { number: { startsWith: prefix } },
          orderBy: { number: 'desc' },
          select: { number: true },
        });
  const value = last ? ('invoiceNumber' in last ? last.invoiceNumber : last.number) : null;
  const lastSeq = value ? parseInt(value.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;
}

export async function nextInvoiceNumber(): Promise<string> {
  return nextSequence(`INV-${brazilToday().slice(0, 4)}-`, 'invoice');
}

export function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

// Cria a fatura tentando de novo se dois processos gerarem o mesmo número ao mesmo tempo
export async function createInvoiceWithNumber(data: Omit<Prisma.FinancialRecordUncheckedCreateInput, 'invoiceNumber'>) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.financialRecord.create({ data: { ...data, invoiceNumber: await nextInvoiceNumber() } });
    } catch (error) {
      if (!isUniqueConflict(error) || attempt >= 4) throw error;
    }
  }
}

// Tabela de preços do grupo do cliente — sugestão de valor mensal.
// Com vários grupos, usa o primeiro grupo ativo em ordem alfabética (determinístico);
// soma só produtos ativos e recorrentes.
export async function suggestedAmountForCustomer(customerId: string): Promise<number> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      groups: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
        take: 1,
        select: { prices: { where: { product: { active: true, recurring: true } }, select: { price: true } } },
      },
    },
  });
  const group = customer?.groups[0];
  if (!group) return 0;
  return round2(group.prices.reduce((sum, p) => sum + toNumber(p.price), 0));
}

// Trava simples no banco: só uma execução da automação por vez (e no máximo uma a cada "minIntervalMs")
export async function tryAcquireRun(key: string, minIntervalMs: number): Promise<boolean> {
  const threshold = new Date(Date.now() - minIntervalMs);
  const rows = await prisma.$queryRaw<{ key: string }[]>`
    INSERT INTO app_state ("key", "value", "updatedAt")
    VALUES (${key}, ${JSON.stringify({ startedAt: new Date().toISOString() })}::jsonb, NOW())
    ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
    WHERE app_state."updatedAt" < ${threshold}
    RETURNING "key"`;
  return rows.length > 0;
}

// Gera as faturas recorrentes do mês. Idempotente: nunca cria duas faturas do mesmo cliente no mesmo mês.
export async function generateRecurringInvoices(period = currentPeriod()) {
  const customers = await prisma.customer.findMany({
    where: { status: 'ATIVO', data: { path: ['billing', 'enabled'], equals: true } },
    select: { id: true, name: true, data: true },
  });

  const existing = await prisma.financialRecord.findMany({
    where: {
      customerId: { in: customers.map((c) => c.id) },
      AND: [{ metadata: { path: ['period'], equals: period } }, { metadata: { path: ['recurring'], equals: true } }],
    },
    select: { customerId: true },
  });
  const alreadyBilled = new Set(existing.map((r) => r.customerId));

  let created = 0;
  let skipped = 0;
  const createdInvoices: string[] = [];

  for (const customer of customers) {
    const billing = readBilling(customer.data);
    const notStarted = billing.startPeriod && period < billing.startPeriod;
    if (!billing.enabled || billing.amount <= 0 || notStarted || alreadyBilled.has(customer.id)) {
      skipped++;
      continue;
    }

    const dueDate = new Date(`${period}-${String(billing.dueDay).padStart(2, '0')}T12:00:00.000Z`);
    const [year, month] = period.split('-');
    const record = await createInvoiceWithNumber({
      description: `${billing.description} — ${month}/${year}`,
      amount: billing.amount,
      type: 'RECEITA',
      category: 'Mensalidade',
      status: 'ABERTO',
      dueDate,
      customerId: customer.id,
      metadata: {
        customer: customer.name,
        method: billing.method,
        period,
        recurring: true,
        createdBy: 'Automático',
      },
    });
    created++;
    createdInvoices.push(record.invoiceNumber || record.id);
  }

  return { period, created, skipped, createdInvoices };
}

// Registra no CRM, uma única vez, cada fatura que venceu sem pagamento
export async function logOverdueInvoices() {
  const today = new Date(`${brazilToday()}T00:00:00.000Z`);
  const candidates = await prisma.financialRecord.findMany({
    where: {
      type: 'RECEITA',
      status: { in: ['ABERTO', 'PENDENTE', 'ATRASADO'] },
      dueDate: { lt: today },
      customerId: { not: null },
    },
    include: { customer: { select: { id: true, name: true } } },
  });
  // Filtro em código: no SQL, "NOT path = true" também descarta faturas sem o campo (NULL)
  const overdue = candidates.filter((r) => (r.metadata as Record<string, unknown> | null)?.overdueLogged !== true);

  for (const invoice of overdue) {
    await prisma.$transaction([
      prisma.crmInteraction.create({
        data: {
          operator: SYSTEM_ACTOR.name,
          customerId: invoice.customerId,
          customerName: invoice.customer?.name || 'Cliente',
          title: `Fatura ${invoice.invoiceNumber} vencida`,
          description: `A fatura ${invoice.invoiceNumber} de ${formatBRL(invoice.amount)} venceu em ${formatDateBr(invoice.dueDate)} e não consta como paga.`,
          date: formatDateTimeBr(),
          type: 'COBRANCA',
        },
      }),
      prisma.financialRecord.update({
        where: { id: invoice.id },
        data: { metadata: { ...((invoice.metadata as object) || {}), overdueLogged: true } },
      }),
    ]);
  }

  return { overdueLogged: overdue.length };
}

// Registra no CRM o pagamento de uma fatura
export async function logPayment(invoiceId: string, operator: string) {
  const invoice = await prisma.financialRecord.findUnique({
    where: { id: invoiceId },
    include: { customer: { select: { name: true } } },
  });
  if (!invoice?.customerId || invoice.type !== 'RECEITA') return;
  await prisma.crmInteraction.create({
    data: {
      operator,
      customerId: invoice.customerId,
      customerName: invoice.customer?.name || 'Cliente',
      title: `Pagamento recebido — ${invoice.invoiceNumber}`,
      description: `Fatura ${invoice.invoiceNumber} de ${formatBRL(invoice.amount)} (vencimento ${formatDateBr(invoice.dueDate)}) marcada como paga.`,
      date: formatDateTimeBr(),
      type: 'COBRANCA',
    },
  });
}

// Rotina completa (cron diário, botão "Gerar agora" e abertura do Financeiro).
// "minIntervalMs" evita execuções simultâneas/repetidas entre instâncias.
export async function runBillingAutomation(options: { minIntervalMs?: number; trigger?: string } = {}) {
  const acquired = await tryAcquireRun('billing-automation', options.minIntervalMs ?? 60_000);
  if (!acquired) return { skippedRun: true as const };

  const generation = await generateRecurringInvoices();
  const overdue = await logOverdueInvoices();

  if (generation.created > 0) {
    await logAudit({
      actor: SYSTEM_ACTOR,
      action: 'GENERATE',
      entity: 'invoice',
      summary: `${generation.created} fatura(s) recorrente(s) gerada(s) para ${generation.period}${options.trigger ? ` (${options.trigger})` : ''}`,
      changes: { invoices: generation.createdInvoices },
    });
  }
  return { skippedRun: false as const, ...generation, ...overdue };
}
