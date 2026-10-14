import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';
import { CUSTOMER_INCLUDE, findDocumentOwner, mapCustomer, parseCustomerBody } from '@/lib/customers';

// GET /api/customers - Listar clientes (também usado no Financeiro e no CRM para seleção)
export async function GET() {
  const auth = await requirePermission(['manageCrm', 'manageFinance']);
  if (auth instanceof NextResponse) return auth;

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: CUSTOMER_INCLUDE,
    });
    return NextResponse.json(customers.map(mapCustomer));
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

    const owner = await findDocumentOwner(parsed.documentDigits);
    if (owner) {
      return NextResponse.json({ message: `CPF/CNPJ já cadastrado para "${owner.name}"` }, { status: 409 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: parsed.name,
        company: parsed.name,
        email: parsed.contacts[0]?.email || null,
        phone: parsed.contacts[0]?.phone || null,
        status: parsed.isActive ? 'ATIVO' : 'INATIVO',
        data: parsed.data,
        groups: { connect: parsed.groupIds.map((id) => ({ id })) },
      },
      include: CUSTOMER_INCLUDE,
    });

    return NextResponse.json({ ...mapCustomer(customer), message: 'Cliente cadastrado com sucesso' });
  } catch (error) {
    console.error('[API Customers POST Error]:', error);
    return NextResponse.json({ message: 'Erro ao criar cliente' }, { status: 500 });
  }
}
