import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { requirePermission } from '@/lib/session';
import {
  CUSTOMER_DOCS_BUCKET,
  CUSTOMER_INCLUDE,
  findDocumentOwner,
  mapCustomer,
  parseCustomerBody,
} from '@/lib/customers';

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id }, include: CUSTOMER_INCLUDE });
    if (!customer) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }
    return NextResponse.json(mapCustomer(customer));
  } catch (error) {
    console.error('[API Customer GET Error]:', error);
    return NextResponse.json({ message: 'Erro ao buscar cliente' }, { status: 500 });
  }
}

// PUT /api/customers/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const parsed = parseCustomerBody(await req.json());
    if ('error' in parsed) return NextResponse.json({ message: parsed.error }, { status: 400 });

    const current = await prisma.customer.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }

    const owner = await findDocumentOwner(parsed.documentDigits, id);
    if (owner) {
      return NextResponse.json({ message: `CPF/CNPJ já cadastrado para "${owner.name}"` }, { status: 409 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: parsed.name,
        company: parsed.name,
        email: parsed.contacts[0]?.email || null,
        phone: parsed.contacts[0]?.phone || null,
        status: parsed.isActive ? 'ATIVO' : 'INATIVO',
        data: { ...((current.data as object) || {}), ...parsed.data },
        groups: { set: parsed.groupIds.map((groupId) => ({ id: groupId })) },
      },
      include: CUSTOMER_INCLUDE,
    });

    return NextResponse.json({ success: true, customer: mapCustomer(updated) });
  } catch (error) {
    console.error('[API Customer PUT Error]:', error);
    return NextResponse.json({ message: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

// DELETE /api/customers/[id] — remove também os arquivos do Storage
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { documents: { select: { storagePath: true } } },
    });
    if (!customer) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }

    if (customer.documents.length > 0) {
      await supabaseAdmin.storage.from(CUSTOMER_DOCS_BUCKET).remove(customer.documents.map((d) => d.storagePath));
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('[API Customer DELETE Error]:', error);
    return NextResponse.json({ message: 'Erro ao excluir cliente' }, { status: 500 });
  }
}
