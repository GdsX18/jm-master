import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';
import { buildFinanceWhere, effectiveStatus } from '@/lib/finance-query';
import { toNumber } from '@/lib/money';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = { ABERTO: 'Em aberto', ATRASADO: 'Vencida', PAGO: 'Pago', CANCELADO: 'Cancelado' };

// Célula CSV segura: aspas escapadas e sem fórmulas (=, +, -, @ no início viram texto no Excel)
function cell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

const dateBr = (d: Date | null) => (d ? d.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '');

// GET /api/finance/export?type=&status=&q= - CSV (separador ";" e BOM UTF-8 para abrir direto no Excel)
export async function GET(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const rows = await prisma.financialRecord.findMany({
    where: buildFinanceWhere(url),
    orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    include: { customer: { select: { name: true, document: true } } },
    take: 10000,
  });

  const isExpense = url.searchParams.get('type') === 'DESPESA';
  const header = ['Número', isExpense ? 'Fornecedor' : 'Cliente', 'CPF/CNPJ', 'Descrição', 'Categoria', 'Vencimento', 'Pagamento', 'Valor', 'Status', 'Forma de pagamento'];
  const lines = rows.map((r) => {
    const meta = (r.metadata as Record<string, unknown>) || {};
    return [
      r.invoiceNumber || r.id,
      isExpense ? meta.supplier || '' : r.customer?.name || meta.customer || '',
      r.customer?.document || '',
      r.description,
      r.category,
      dateBr(r.dueDate),
      dateBr(r.paymentDate),
      toNumber(r.amount).toFixed(2).replace('.', ','),
      STATUS_LABEL[effectiveStatus(r.status, r.dueDate)] || r.status,
      meta.method || '',
    ]
      .map(cell)
      .join(';');
  });

  const csv = '﻿' + [header.map(cell).join(';'), ...lines].join('\r\n');
  const filename = `${isExpense ? 'despesas' : 'faturas'}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
