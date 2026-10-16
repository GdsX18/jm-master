// Datas no fuso de Brasília — compartilhado entre servidor e painel.

export const BR_TIMEZONE = 'America/Sao_Paulo';

// YYYY-MM-DD de hoje no Brasil
export function brazilToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: BR_TIMEZONE });
}

// YYYY-MM do mês corrente no Brasil
export function currentPeriod(): string {
  return brazilToday().slice(0, 7);
}

// YYYY-MM somando meses a um período
export function addMonths(period: string, months: number): string {
  const [y, m] = period.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Datas de vencimento são dias do calendário: gravamos ao meio-dia UTC para não "voltar" um dia no fuso do Brasil
export function parseCalendarDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTimeBr(date: Date = new Date()): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BR_TIMEZONE,
  });
}

export function formatDateBr(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
