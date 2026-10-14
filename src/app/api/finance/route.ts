import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';

// Status gravados no banco. "ATRASADO" é calculado: em aberto + vencimento anterior a hoje.
const STORED_STATUSES = ['ABERTO', 'PAGO', 'CANCELADO'] as const;
type StoredStatus = (typeof STORED_STATUSES)[number];

function isStoredStatus(value: unknown): value is StoredStatus {
  return typeof value === 'string' && (STORED_STATUSES as readonly string[]).includes(value);
}

// Datas de vencimento são dias do calendário: gravamos ao meio-dia UTC para não "voltar" um dia no fuso do Brasil
function parseDueDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseAmount(value: unknown): number | null {
  const num = parseFloat(String(value ?? '').replace(',', '.'));
  if (Number.isNaN(num) || num <= 0) return null;
  return Math.round(num * 100) / 100;
}

function todayInBrazil(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
}

function effectiveStatus(status: string, dueDate: Date | null): string {
  const open = status === 'ABERTO' || status === 'PENDENTE' || status === 'ATRASADO';
  if (!open) return status;
  if (dueDate && dueDate.toISOString().slice(0, 10) < todayInBrazil()) return 'ATRASADO';
  return 'ABERTO';
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.financialRecord.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });
  const lastSeq = last?.invoiceNumber ? parseInt(last.invoiceNumber.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;
}

async function resolveCustomer(customerId: unknown, customerName: unknown) {
  if (typeof customerId === 'string' && customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, name: true } });
    if (!customer) return { error: 'Cliente selecionado não existe mais' };
    return { id: customer.id, name: customer.name };
  }
  const name = typeof customerName === 'string' ? customerName.trim() : '';
  if (!name) return { error: 'Informe o cliente da fatura' };
  return { id: null, name };
}

function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

// GET /api/finance - Listar registros financeiros e métricas
export async function GET() {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const rows = await prisma.financialRecord.findMany({
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
      include: { customer: { select: { id: true, name: true } } },
    });

    let receitaRecebida = 0;
    let aReceber = 0;
    let inadimplencia = 0;
    let totalFaturado = 0;
    let openCount = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let canceledCount = 0;

    const records = rows.map((r) => {
      const status = effectiveStatus(r.status, r.dueDate);
      const val = Number(r.amount) || 0;
      const metadata = (r.metadata as Record<string, unknown>) || {};

      if (status !== 'CANCELADO') totalFaturado += val;
      if (status === 'PAGO') {
        receitaRecebida += val;
        paidCount++;
      } else if (status === 'ATRASADO') {
        inadimplencia += val;
        overdueCount++;
      } else if (status === 'ABERTO') {
        aReceber += val;
        openCount++;
      } else if (status === 'CANCELADO') {
        canceledCount++;
      }

      return {
        ...r,
        status,
        invoiceNumber: r.invoiceNumber || (metadata.invoiceId as string) || r.id.slice(0, 10),
        customerName: r.customer?.name || (metadata.customer as string) || r.description,
        method: (metadata.method as string) || 'Boleto / Pix',
      };
    });

    return NextResponse.json({
      success: true,
      records,
      metrics: {
        receitaRecebida,
        aReceber,
        inadimplencia,
        totalFaturado,
        openCount,
        overdueCount,
        paidCount,
        canceledCount,
        totalCount: records.length,
      },
    });
  } catch (error) {
    console.error('[API Finance GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados financeiros' }, { status: 500 });
  }
}

// POST /api/finance - Criar nova fatura (número gerado no servidor)
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { customerId, customer, description, amount, status, dueDate, method, category } = body;

    const customerRef = await resolveCustomer(customerId, customer);
    if ('error' in customerRef) return NextResponse.json({ error: customerRef.error }, { status: 400 });

    const numAmount = parseAmount(amount);
    if (numAmount === null) return NextResponse.json({ error: 'Informe um valor maior que zero' }, { status: 400 });

    const due = parseDueDate(dueDate);
    if (!due) return NextResponse.json({ error: 'Data de vencimento inválida' }, { status: 400 });

    const finalStatus: StoredStatus = isStoredStatus(status) ? status : 'ABERTO';

    // Tenta de novo se dois cadastros simultâneos gerarem o mesmo número
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const record = await prisma.financialRecord.create({
          data: {
            invoiceNumber: await nextInvoiceNumber(),
            description: (typeof description === 'string' && description.trim()) || 'Fatura de Serviço',
            amount: numAmount,
            type: 'RECEITA',
            category: (typeof category === 'string' && category.trim()) || 'Mensalidade',
            status: finalStatus,
            dueDate: due,
            paymentDate: finalStatus === 'PAGO' ? new Date() : null,
            customerId: customerRef.id,
            metadata: {
              customer: customerRef.name,
              method: (typeof method === 'string' && method) || 'Boleto / Pix',
              createdBy: auth.email,
            },
          },
        });
        return NextResponse.json({ success: true, record });
      } catch (error) {
        const isUniqueConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!isUniqueConflict || attempt === 2) throw error;
      }
    }
    return NextResponse.json({ error: 'Não foi possível gerar o número da fatura' }, { status: 500 });
  } catch (error) {
    console.error('[API Finance POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao criar registro financeiro' }, { status: 500 });
  }
}

// PUT /api/finance - Editar fatura existente
export async function PUT(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, customerId, customer, description, amount, dueDate, method, status } = body;

    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    const existing = await prisma.financialRecord.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 });

    const customerRef = await resolveCustomer(customerId, customer);
    if ('error' in customerRef) return NextResponse.json({ error: customerRef.error }, { status: 400 });

    const numAmount = parseAmount(amount);
    if (numAmount === null) return NextResponse.json({ error: 'Informe um valor maior que zero' }, { status: 400 });

    const due = parseDueDate(dueDate);
    if (!due) return NextResponse.json({ error: 'Data de vencimento inválida' }, { status: 400 });

    const nextStatus: StoredStatus = isStoredStatus(status) ? status : (existing.status as StoredStatus);
    const metadata = (existing.metadata as Record<string, unknown>) || {};

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        description: (typeof description === 'string' && description.trim()) || existing.description,
        amount: numAmount,
        dueDate: due,
        status: nextStatus,
        paymentDate: nextStatus === 'PAGO' ? existing.paymentDate || new Date() : null,
        customerId: customerRef.id,
        metadata: {
          ...metadata,
          customer: customerRef.name,
          method: (typeof method === 'string' && method) || metadata.method || 'Boleto / Pix',
          updatedBy: auth.email,
        },
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('[API Finance PUT Error]:', error);
    return NextResponse.json({ error: 'Erro ao atualizar fatura' }, { status: 500 });
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

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        status,
        paymentDate: status === 'PAGO' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    if (isNotFound(error)) return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 });
    console.error('[API Finance PATCH Error]:', error);
    return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 });
  }
}

// DELETE /api/finance - Excluir fatura
export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await prisma.financialRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Registro financeiro excluído' });
  } catch (error) {
    if (isNotFound(error)) return NextResponse.json({ error: 'Fatura não encontrada' }, { status: 404 });
    console.error('[API Finance DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir registro' }, { status: 500 });
  }
}
