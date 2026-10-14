import { Prisma } from '@prisma/client';
import prisma from './prisma';

// Configuração de cobrança recorrente, guardada em Customer.data.billing
export interface BillingConfig {
  enabled: boolean;
  amount: number;
  dueDay: number; // 1 a 28 (evita meses sem dia 29/30/31)
  description: string;
  method: string;
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
    amount: Math.max(0, Number(raw.amount) || 0),
    dueDay,
    description: typeof raw.description === 'string' && raw.description.trim() ? raw.description.trim() : DEFAULT_BILLING.description,
    method: typeof raw.method === 'string' && raw.method ? raw.method : DEFAULT_BILLING.method,
  };
}

export function brazilToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
}

export function currentPeriod(): string {
  return brazilToday().slice(0, 7); // YYYY-MM
}

export async function nextInvoiceNumber(): Promise<string> {
  const year = brazilToday().slice(0, 4);
  const prefix = `INV-${year}-`;
  const last = await prisma.financialRecord.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });
  const lastSeq = last?.invoiceNumber ? parseInt(last.invoiceNumber.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;
}

// Cria a fatura tentando de novo se dois processos gerarem o mesmo número ao mesmo tempo
export async function createInvoiceWithNumber(data: Omit<Prisma.FinancialRecordUncheckedCreateInput, 'invoiceNumber'>) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.financialRecord.create({ data: { ...data, invoiceNumber: await nextInvoiceNumber() } });
    } catch (error) {
      const conflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      if (!conflict || attempt >= 4) throw error;
    }
  }
}

// Soma da tabela de preços do(s) grupo(s) do cliente — sugestão de valor mensal
export async function suggestedAmountForCustomer(customerId: string): Promise<number> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { groups: { select: { prices: { select: { price: true } } } } },
  });
  const group = customer?.groups[0];
  if (!group) return 0;
  return Math.round(group.prices.reduce((sum, p) => sum + p.price, 0) * 100) / 100;
}

// Gera as faturas recorrentes do mês. Idempotente: nunca cria duas faturas do mesmo cliente no mesmo mês.
export async function generateRecurringInvoices(period = currentPeriod()) {
  const customers = await prisma.customer.findMany({
    where: { status: 'ATIVO', data: { path: ['billing', 'enabled'], equals: true } },
    select: { id: true, name: true, data: true },
  });

  let created = 0;
  let skipped = 0;
  const createdInvoices: string[] = [];

  for (const customer of customers) {
    const billing = readBilling(customer.data);
    if (!billing.enabled || billing.amount <= 0) {
      skipped++;
      continue;
    }

    const existing = await prisma.financialRecord.findFirst({
      where: {
        customerId: customer.id,
        AND: [
          { metadata: { path: ['period'], equals: period } },
          { metadata: { path: ['recurring'], equals: true } },
        ],
      },
      select: { id: true },
    });
    if (existing) {
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

const brl = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const dateBr = (date: Date | null) => (date ? date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-');

// Registra no CRM, uma única vez, cada fatura que venceu sem pagamento
export async function logOverdueInvoices() {
  const today = new Date(`${brazilToday()}T00:00:00.000Z`);
  const candidates = await prisma.financialRecord.findMany({
    where: {
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
          operator: 'Sistema (automático)',
          customerId: invoice.customerId,
          customerName: invoice.customer?.name || 'Cliente',
          title: `Fatura ${invoice.invoiceNumber} vencida`,
          description: `A fatura ${invoice.invoiceNumber} de ${brl(invoice.amount)} venceu em ${dateBr(invoice.dueDate)} e não consta como paga.`,
          date: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
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
  if (!invoice?.customerId) return;
  await prisma.crmInteraction.create({
    data: {
      operator,
      customerId: invoice.customerId,
      customerName: invoice.customer?.name || 'Cliente',
      title: `Pagamento recebido — ${invoice.invoiceNumber}`,
      description: `Fatura ${invoice.invoiceNumber} de ${brl(invoice.amount)} (vencimento ${dateBr(invoice.dueDate)}) marcada como paga.`,
      date: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      type: 'COBRANCA',
    },
  });
}

// Rotina completa (cron diário e abertura do Financeiro)
export async function runBillingAutomation() {
  const generation = await generateRecurringInvoices();
  const overdue = await logOverdueInvoices();
  return { ...generation, ...overdue };
}
