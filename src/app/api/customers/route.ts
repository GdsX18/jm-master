import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/customers - Listar clientes
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        interactions: true,
      },
    });

    // Mapear para o formato do frontend
    const mapped = customers.map((c) => {
      const data = (c.data as any) || {};
      return {
        id: c.id,
        name: c.name,
        document: data.document || '',
        street: data.street || '',
        number: data.number || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        code: data.code || '',
        type: data.type || 'POS_PAGO',
        groupId: data.groupId || 'grp-padrao',
        groupName: data.groupName || 'Tabela Padrão',
        cutoffDay: data.cutoffDay || 1,
        gracePeriod: data.gracePeriod || 5,
        isActive: c.status === 'ATIVO',
        contacts: data.contacts || [],
        products: data.products || [],
        documents: data.documents || [],
        notes: data.notes || [],
        createdAt: c.createdAt.toISOString(),
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('[API Customers GET Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao carregar clientes' }, { status: 500 });
  }
}

// POST /api/customers - Cadastrar cliente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      document,
      street,
      number,
      city,
      state,
      zipCode,
      code,
      type,
      groupId,
      groupName,
      cutoffDay,
      gracePeriod,
      contacts,
      products,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'Razão social / Nome é obrigatório' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        company: name.trim(),
        email: contacts?.[0]?.email || '',
        phone: contacts?.[0]?.phone || '',
        status: 'ATIVO',
        data: {
          document,
          street,
          number,
          city,
          state,
          zipCode,
          code,
          type: type || 'POS_PAGO',
          groupId,
          groupName,
          cutoffDay,
          gracePeriod,
          contacts: contacts || [],
          products: products || [],
          documents: [],
          notes: [],
        },
      },
    });

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      message: 'Cliente cadastrado com sucesso',
    });
  } catch (error: any) {
    console.error('[API Customers POST Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao criar cliente' }, { status: 500 });
  }
}
