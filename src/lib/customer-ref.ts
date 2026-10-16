import prisma from './prisma';

// Cliente referenciado por id (cadastro) ou apenas por nome livre (avulso)
export async function resolveCustomerRef(
  customerId: unknown,
  customerName: unknown,
  options: { required?: boolean; fallbackName?: string } = {}
): Promise<{ id: string | null; name: string } | { error: string }> {
  if (typeof customerId === 'string' && customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, name: true } });
    if (!customer) return { error: 'Cliente selecionado não existe mais' };
    return { id: customer.id, name: customer.name };
  }
  const name = typeof customerName === 'string' ? customerName.trim().slice(0, 200) : '';
  if (!name) {
    if (options.required) return { error: 'Informe o cliente' };
    return { id: null, name: options.fallbackName || 'Cliente Geral' };
  }
  return { id: null, name };
}

// Lista paginada: lê page/pageSize da URL com limites seguros
export function readPagination(url: URL, defaultSize = 25, maxSize = 100) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const pageSize = Math.min(maxSize, Math.max(1, parseInt(url.searchParams.get('pageSize') || String(defaultSize), 10) || defaultSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
