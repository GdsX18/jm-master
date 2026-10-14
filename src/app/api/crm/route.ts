import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';

const TYPES = ['COMERCIAL', 'SUPORTE', 'REUNIAO', 'NPS', 'COBRANCA', 'LEAD', 'OUTROS'] as const;

function formatDate(date: Date) {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

async function resolveCustomer(customerId: unknown, customerName: unknown) {
  if (typeof customerId === 'string' && customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, name: true } });
    if (!customer) return { error: 'Cliente selecionado não existe mais' };
    return { id: customer.id, name: customer.name };
  }
  const name = typeof customerName === 'string' ? customerName.trim() : '';
  return { id: null, name: name || 'Cliente Geral' };
}

// GET /api/crm[?customerId=] - Histórico de interações
export async function GET(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const customerId = new URL(req.url).searchParams.get('customerId');
    const interactions = await prisma.crmInteraction.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ success: true, interactions });
  } catch (error) {
    console.error('[API CRM GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar interações' }, { status: 500 });
  }
}

// POST /api/crm - Registrar interação (responsável = usuário logado)
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { customerId, customerName, title, description, type } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 });
    }

    const customer = await resolveCustomer(customerId, customerName);
    if ('error' in customer) return NextResponse.json({ error: customer.error }, { status: 400 });

    const interaction = await prisma.crmInteraction.create({
      data: {
        operator: `${auth.name} (${auth.role})`,
        customerName: customer.name,
        customerId: customer.id,
        title: title.trim(),
        description: description.trim(),
        date: formatDate(new Date()),
        type: TYPES.includes(type) ? type : 'COMERCIAL',
      },
    });

    return NextResponse.json({ success: true, interaction });
  } catch (error) {
    console.error('[API CRM POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao registrar interação' }, { status: 500 });
  }
}

// PUT /api/crm - Editar interação
export async function PUT(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, customerId, customerName, title, description, type } = body;

    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 });
    }

    const customer = await resolveCustomer(customerId, customerName);
    if ('error' in customer) return NextResponse.json({ error: customer.error }, { status: 400 });

    const interaction = await prisma.crmInteraction.update({
      where: { id },
      data: {
        customerName: customer.name,
        customerId: customer.id,
        title: title.trim(),
        description: description.trim(),
        type: TYPES.includes(type) ? type : undefined,
      },
    });

    return NextResponse.json({ success: true, interaction });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }
    console.error('[API CRM PUT Error]:', error);
    return NextResponse.json({ error: 'Erro ao atualizar interação' }, { status: 500 });
  }
}

// DELETE /api/crm?id= - Excluir interação
export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await prisma.crmInteraction.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }
    console.error('[API CRM DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir interação' }, { status: 500 });
  }
}
