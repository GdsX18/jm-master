// Valores monetários: gravados como DECIMAL(12,2) no banco e expostos como number nas APIs.

// Aceita Prisma.Decimal, number, string ("1.234,56" ou "1234.56") e null
export function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const raw = String(value).trim();
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Valor positivo com 2 casas, ou null se inválido
export function parsePositiveAmount(value: unknown): number | null {
  const num = round2(toNumber(value));
  return num > 0 ? num : null;
}

export function formatBRL(value: unknown): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNumber(value));
}
