import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import {
  CUSTOMER_DETAIL_INCLUDE,
  CUSTOMER_LIST_SELECT,
  findDocumentOwner,
  mapCustomerDetail,
  mapCustomerListItem,
  parseCustomerBody,
} from '@/lib/customers';
import { readPagination } from '@/lib/customer-ref';
import { onlyDigits } from '@/lib/validators';
import { isUniqueConflict } from '@/lib/billing';
import { logAudit } from '@/lib/audit';

// GET /api/customers
//   ?minimal=1                → [{ id, name, phone, isActive }] para seletores (Financeiro, CRM, Propostas)
//   ?q=&status=&type=&groupId=&page=&pageSize= → lista paginada + indicadores
export async function GET(req: NextRequest) {
  const auth = await requirePermission(['manageCrm', 'manageFinance']);
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);

    if (url.searchParams.get('minimal') === '1') {
      const customers = await prisma.customer.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, phone: true, email: true, status: true },
      });
      return NextResponse.json(customers.map((c) => ({ ...c, isActive: c.status === 'ATIVO' })));
    }

    const { page, pageSize, skip, take } = readPagination(url);
    const q = url.searchParams.get('q')?.trim();
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const groupId = url.searchParams.get('groupId');
    const digits = q ? onlyDigits(q) : '';

    const where: Prisma.CustomerWhereInput = {
      ...(status === 'ATIVO' || status === 'INATIVO' ? { status } : {}),
      ...(type === 'PRE_PAGO' || type === 'POS_PAGO' ? { type } : {}),
      ...(groupId === 'none' ? { groups: { none: {} } } : groupId ? { groups: { some: { id: groupId } } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { code: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { city: { contains: q, mode: 'insensitive' } },
              ...(digits.length >= 3 ? [{ documentDigits: { contains: digits } }, { phone: { contains: digits } }] : []),
            ],
          }
        : {}),
    };

    const [rows, total, totalAll, active, prePaid, inGroups] = await Promise.all([
      prisma.customer.findMany({ where, orderBy: { name: 'asc' }, select: CUSTOMER_LIST_SELECT, skip, take }),
      prisma.customer.count({ where }),
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ATIVO' } }),
      prisma.customer.count({ where: { type: 'PRE_PAGO' } }),
      prisma.customer.count({ where: { groups: { some: {} } } }),
    ]);

    return NextResponse.json({
      customers: rows.map(mapCustomerListItem),
      total,
      page,
      pageSize,
      stats: { total: totalAll, active, prePaid, postPaid: totalAll - prePaid, inGroups },
    });
  } catch (error) {
    console.error('[API Customers GET Error]:', error);
    return NextResponse.json({ message: 'Erro ao carregar clientes' }, { status: 500 });
  }
}

// POST /api/customers - Cadastrar cliente
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const parsed = parseCustomerBody(await req.json());
    if ('error' in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

    const owner = await findDocumentOwner(parsed.columns.documentDigits);
    if (owner) {
      return NextResponse.json({ message: `CPF/CNPJ já cadastrado para "${owner.name}"` }, { status: 409 });
    }

    const customer = await prisma.customer.create({
      data: {
        ...parsed.columns,
        data: { contacts: parsed.contacts },
        groups: { connect: parsed.groupIds.map((id) => ({ id })) },
      },
      include: CUSTOMER_DETAIL_INCLUDE,
    });

    await logAudit({
      actor: actorOf(auth),
      action: 'CREATE',
      entity: 'customer',
      entityId: customer.id,
      summary: `Cliente "${customer.name}" cadastrado`,
    });

    return NextResponse.json({ ...mapCustomerDetail(customer), message: 'Cliente cadastrado com sucesso' });
  } catch (error) {
    if (isUniqueConflict(error)) {
      return NextResponse.json({ message: 'CPF/CNPJ já cadastrado para outro cliente' }, { status: 409 });
    }
    console.error('[API Customers POST Error]:', error);
    return NextResponse.json({ message: 'Erro ao criar cliente' }, { status: 500 });
  }
}
