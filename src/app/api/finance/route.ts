import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { createInvoiceWithNumber, logPayment } from '@/lib/billing';
import { parseCalendarDate } from '@/lib/dates';
import { OPEN_STATUSES, buildFinanceWhere, effectiveStatus, todayStart } from '@/lib/finance-query';
import { parsePositiveAmount, round2, toNumber } from '@/lib/money';
import { resolveCustomerRef, readPagination } from '@/lib/customer-ref';
import { diffFields, logAudit } from '@/lib/audit';

// Status gravados no banco. "ATRASADO" é calculado: em aberto + vencimento anterior a hoje.
const STORED_STATUSES = ['ABERTO', 'PAGO', 'CANCELADO'] as const;
type StoredStatus = (typeof STORED_STATUSES)[number];
const TYPES = ['RECEITA', 'DESPESA'] as const;
type RecordType = (typeof TYPES)[number];

function isStoredStatus(value: unknown): value is StoredStatus {
  return typeof value === 'string' && (STORED_STATUSES as readonly string[]).includes(value);
}

function readType(value: unknown): RecordType {
  return value === 'DESPESA' ? 'DESPESA' : 'RECEITA';
}

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

async function sumAmount(where: Prisma.FinancialRecordWhereInput) {
  const result = await prisma.financialRecord.aggregate({ where, _sum: { amount: true }, _count: true });
  return { total: round2(toNumber(result._sum.amount)), count: result._count };
}

// Indicadores sobre TODOS os registros (independem da página/filtro da lista)
async function computeMetrics() {
  const today = todayStart();
  const [paid, open, overdue, canceled, expPaid, expOpen, expOverdue] = await Promise.all([
    sumAmount({ type: 'RECEITA', status: 'PAGO' }),
    sumAmount({ type: 'RECEITA', status: { in: OPEN_STATUSES }, OR: [{ dueDate: null }, { dueDate: { gte: today } }] }),
    sumAmount({ type: 'RECEITA', status: { in: OPEN_STATUSES }, dueDate: { lt: today } }),
    sumAmount({ type: 'RECEITA', status: 'CANCELADO' }),
    sumAmount({ type: 'DESPESA', status: 'PAGO' }),
    sumAmount({ type: 'DESPESA', status: { in: OPEN_STATUSES }, OR: [{ dueDate: null }, { dueDate: { gte: today } }] }),
    sumAmount({ type: 'DESPESA', status: { in: OPEN_STATUSES }, dueDate: { lt: today } }),
  ]);

  return {
    receitaRecebida: paid.total,
    aReceber: open.total,
    inadimplencia: overdue.total,
    totalFaturado: round2(paid.total + open.total + overdue.total),
    paidCount: paid.count,
    openCount: open.count,
    overdueCount: overdue.count,
    canceledCount: canceled.count,
    totalCount: paid.count + open.count + overdue.count + canceled.count,
    despesasPagas: expPaid.total,
    despesasAPagar: round2(expOpen.total + expOverdue.total),
    despesasVencidas: expOverdue.total,
    saldoRealizado: round2(paid.total - expPaid.total),
  };
}

// GET /api/finance?type=RECEITA|DESPESA&status=&q=&page=&pageSize= - Lista paginada + indicadores
export async function GET(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const { page, pageSize, skip, take } = readPagination(url);
    const where = buildFinanceWhere(url);

    const [rows, total, metrics] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        include: { customer: { select: { id: true, name: true, phone: true } } },
        skip,
        take,
      }),
      prisma.financialRecord.count({ where }),
      computeMetrics(),
    ]);

    const records = rows.map((r) => {
      const metadata = (r.metadata as Record<string, unknown>) || {};
      return {
        ...r,
        amount: toNumber(r.amount),
        status: effectiveStatus(r.status, r.dueDate),
        invoiceNumber: r.invoiceNumber || (metadata.invoiceId as string) || r.id.slice(0, 10),
        customerName: r.customer?.name || (metadata.customer as string) || (metadata.supplier as string) || r.description,
        supplier: (metadata.supplier as string) || '',
        method: (metadata.method as string) || 'Boleto / Pix',
        customerPhone: r.customer?.phone || null,
        recurring: metadata.recurring === true,
      };
    });

    return NextResponse.json({ success: true, records, total, page, pageSize, metrics });
  } catch (error) {
    console.error('[API Finance GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados financeiros' }, { status: 500 });
  }
}

// POST /api/finance - Criar fatura (receita) ou despesa (número gerado no servidor)
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { customerId, customer, description, amount, status, dueDate, method, category, supplier } = body;
    const type = readType(body.type);

    const customerRef = await resolveCustomerRef(customerId, customer, { required: type === 'RECEITA', fallbackName: '' });
    if ('error' in customerRef) return NextResponse.json({ error: 'Informe o cliente da fatura' }, { status: 400 });

    const numAmount = parsePositiveAmount(amount);
    if (numAmount === null) return NextResponse.json({ error: 'Informe um valor maior que zero' }, { status: 400 });

    const due = parseCalendarDate(dueDate);
    if (!due) return NextResponse.json({ error: 'Data de vencimento inválida' }, { status: 400 });

    const finalStatus: StoredStatus = isStoredStatus(status) ? status : 'ABERTO';
    const supplierName = typeof supplier === 'string' ? supplier.trim().slice(0, 200) : '';

    const record = await createInvoiceWithNumber({
      description:
        (typeof description === 'string' && description.trim()) || (type === 'DESPESA' ? 'Despesa' : 'Fatura de Serviço'),
      amount: numAmount,
      type,
      category: (typeof category === 'string' && category.trim()) || (type === 'DESPESA' ? 'Outras despesas' : 'Mensalidade'),
      status: finalStatus,
      dueDate: due,
      paymentDate: finalStatus === 'PAGO' ? new Date() : null,
      customerId: customerRef.id,
      metadata: {
        customer: customerRef.name,
        ...(supplierName ? { supplier: supplierName } : {}),
        method: (typeof method === 'string' && method) || 'Boleto / Pix',
        createdBy: auth.email,
      },
    });

    await logAudit({
      actor: actorOf(auth),
      action: 'CREATE',
      entity: 'invoice',
      entityId: record.id,
      summary: `${type === 'DESPESA' ? 'Despesa' : 'Fatura'} ${record.invoiceNumber} criada (${record.description})`,
      changes: { amount: numAmount, status: finalStatus, dueDate: dueDate },
    });

    return NextResponse.json({ success: true, record: { ...record, amount: toNumber(record.amount) } });
  } catch (error) {
    console.error('[API Finance POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao criar registro financeiro' }, { status: 500 });
  }
}

// PUT /api/finance - Editar registro existente
export async function PUT(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, customerId, customer, description, amount, dueDate, method, status, category, supplier } = body;

    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const existing = await prisma.financialRecord.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });

    const customerRef = await resolveCustomerRef(customerId, customer, {
      required: existing.type === 'RECEITA',
      fallbackName: '',
    });
    if ('error' in customerRef) return NextResponse.json({ error: 'Informe o cliente da fatura' }, { status: 400 });

    const numAmount = parsePositiveAmount(amount);
    if (numAmount === null) return NextResponse.json({ error: 'Informe um valor maior que zero' }, { status: 400 });

    const due = parseCalendarDate(dueDate);
    if (!due) return NextResponse.json({ error: 'Data de vencimento inválida' }, { status: 400 });

    const nextStatus: StoredStatus = isStoredStatus(status) ? status : (existing.status as StoredStatus);
    const metadata = (existing.metadata as Record<string, unknown>) || {};
    const supplierName = typeof supplier === 'string' ? supplier.trim().slice(0, 200) : (metadata.supplier as string) || '';

    const data = {
      description: (typeof description === 'string' && description.trim()) || existing.description,
      amount: numAmount,
      dueDate: due,
      status: nextStatus,
      category: (typeof category === 'string' && category.trim()) || existing.category,
      paymentDate: nextStatus === 'PAGO' ? existing.paymentDate || new Date() : null,
      customerId: customerRef.id,
    };

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        ...data,
        metadata: {
          ...metadata,
          customer: customerRef.name,
          ...(supplierName ? { supplier: supplierName } : {}),
          method: (typeof method === 'string' && method) || metadata.method || 'Boleto / Pix',
          updatedBy: auth.email,
        },
      },
    });

    if (nextStatus === 'PAGO' && existing.status !== 'PAGO') {
      await logPayment(id, `${auth.name} (${auth.role})`).catch((e) => console.error('[Finance CRM log Error]:', e));
    }

    await logAudit({
      actor: actorOf(auth),
      action: 'UPDATE',
      entity: 'invoice',
      entityId: id,
      summary: `${existing.type === 'DESPESA' ? 'Despesa' : 'Fatura'} ${existing.invoiceNumber} editada`,
      changes: diffFields(existing as unknown as Record<string, unknown>, data),
    });

    return NextResponse.json({ success: true, record: { ...record, amount: toNumber(record.amount) } });
  } catch (error) {
    console.error('[API Finance PUT Error]:', error);
    return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 });
  }
}

// PATCH /api/finance - Alterar apenas o status (pagar, reabrir, cancelar)
export async function PATCH(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !isStoredStatus(status)) {
      return NextResponse.json({ error: 'ID e um status válido (ABERTO, PAGO, CANCELADO) são obrigatórios' }, { status: 400 });
    }

    const previous = await prisma.financialRecord.findUnique({
      where: { id },
      select: { status: true, invoiceNumber: true, type: true },
    });
    if (!previous) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        status,
        paymentDate: status === 'PAGO' ? new Date() : null,
      },
    });

    if (status === 'PAGO' && previous.status !== 'PAGO') {
      await logPayment(id, `${auth.name} (${auth.role})`).catch((e) => console.error('[Finance CRM log Error]:', e));
    }

    await logAudit({
      actor: actorOf(auth),
      action: 'STATUS',
      entity: 'invoice',
      entityId: id,
      summary: `${previous.type === 'DESPESA' ? 'Despesa' : 'Fatura'} ${previous.invoiceNumber}: ${previous.status} → ${status}`,
    });

    return NextResponse.json({ success: true, record: { ...record, amount: toNumber(record.amount) } });
  } catch (error) {
    if (isNotFound(error)) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    console.error('[API Finance PATCH Error]:', error);
    return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 });
  }
}

// DELETE /api/finance?id= - Excluir registro
export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const removed = await prisma.financialRecord.delete({ where: { id } });

    await logAudit({
      actor: actorOf(auth),
      action: 'DELETE',
      entity: 'invoice',
      entityId: id,
      summary: `${removed.type === 'DESPESA' ? 'Despesa' : 'Fatura'} ${removed.invoiceNumber} excluída (${removed.description})`,
      changes: { amount: toNumber(removed.amount), status: removed.status },
    });

    return NextResponse.json({ success: true, message: 'Registro financeiro excluído' });
  } catch (error) {
    if (isNotFound(error)) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    console.error('[API Finance DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir registro' }, { status: 500 });
  }
}
