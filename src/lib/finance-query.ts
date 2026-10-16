import { Prisma } from '@prisma/client';
import { brazilToday } from './dates';

// Regras de status/filtro do Financeiro, compartilhadas entre a listagem e a exportação CSV.
// "ATRASADO" não é gravado: é calculado (em aberto + vencimento anterior a hoje).

export const OPEN_STATUSES = ['ABERTO', 'PENDENTE', 'ATRASADO'];

export function todayStart() {
  return new Date(`${brazilToday()}T00:00:00.000Z`);
}

export function effectiveStatus(status: string, dueDate: Date | null): string {
  if (!OPEN_STATUSES.includes(status)) return status;
  if (dueDate && dueDate.toISOString().slice(0, 10) < brazilToday()) return 'ATRASADO';
  return 'ABERTO';
}

export function statusWhere(status: string | null): Prisma.FinancialRecordWhereInput {
  const today = todayStart();
  switch (status) {
    case 'ABERTO':
      return { status: { in: OPEN_STATUSES }, OR: [{ dueDate: null }, { dueDate: { gte: today } }] };
    case 'ATRASADO':
      return { status: { in: OPEN_STATUSES }, dueDate: { lt: today } };
    case 'PAGO':
    case 'CANCELADO':
      return { status };
    default:
      return {};
  }
}

export function buildFinanceWhere(url: URL): Prisma.FinancialRecordWhereInput {
  const type = url.searchParams.get('type') === 'DESPESA' ? 'DESPESA' : 'RECEITA';
  const q = url.searchParams.get('q')?.trim();
  return {
    type,
    ...statusWhere(url.searchParams.get('status')),
    ...(q
      ? {
          AND: [
            {
              OR: [
                { description: { contains: q, mode: 'insensitive' } },
                { invoiceNumber: { contains: q, mode: 'insensitive' } },
                { category: { contains: q, mode: 'insensitive' } },
                { customer: { name: { contains: q, mode: 'insensitive' } } },
                { metadata: { path: ['customer'], string_contains: q } },
                { metadata: { path: ['supplier'], string_contains: q } },
              ],
            },
          ],
        }
      : {}),
  };
}
