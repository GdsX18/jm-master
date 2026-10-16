// Formatação e máscaras usadas nas telas do painel.

export function formatBRL(value: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

// Datas de calendário (vencimentos) são gravadas ao meio-dia UTC
export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime())
    ? '-'
    : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function relativeTime(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `há ${days} dia${days > 1 ? 's' : ''}`;
  return formatDate(d.toISOString());
}

export function maskDocument(value: string) {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return clean
    .substring(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function maskZipCode(value: string) {
  return value.replace(/\D/g, '').substring(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

export function maskPhone(value: string) {
  const clean = value.replace(/\D/g, '').substring(0, 11);
  return clean.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2');
}

// "1.234,56" / "1234.56" → 1234.56
export function parseMoney(value: string | number): number {
  if (typeof value === 'number') return value;
  const raw = value.trim();
  if (!raw) return 0;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

export function monthLabel(period: string) {
  const [y, m] = period.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).replace('.', '');
}

export function todayISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

export function whatsappLink(phone: string | null | undefined, text: string) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const full = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}
