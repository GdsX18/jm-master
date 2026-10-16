import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { actorOf, requirePermission } from '@/lib/session';
import {
  CUSTOMER_DOCS_BUCKET,
  CUSTOMER_DETAIL_INCLUDE,
  findDocumentOwner,
  mapCustomerDetail,
  parseCustomerBody,
} from '@/lib/customers';
import { isUniqueConflict } from '@/lib/billing';
import { diffFields, logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id }, include: CUSTOMER_DETAIL_INCLUDE });
    if (!customer) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }
    return NextResponse.json(mapCustomerDetail(customer));
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

    const current = await prisma.customer.findUnique({ where: { id }, include: { groups: { select: { id: true, name: true } } } });
    if (!current) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }

    const owner = await findDocumentOwner(parsed.columns.documentDigits, id);
    if (owner) {
      return NextResponse.json({ message: `CPF/CNPJ já cadastrado para "${owner.name}"` }, { status: 409 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...parsed.columns,
        // Preserva o restante do JSON (ex.: configuração de cobrança recorrente)
        data: { ...((current.data as object) || {}), contacts: parsed.contacts },
        groups: { set: parsed.groupIds.map((groupId) => ({ id: groupId })) },
      },
      include: CUSTOMER_DETAIL_INCLUDE,
    });

    const changes = diffFields(
      { ...current, groups: current.groups.map((g) => g.name).sort(), contacts: (current.data as any)?.contacts || [] },
      { ...parsed.columns, groups: updated.groups.map((g) => g.name).sort(), contacts: parsed.contacts }
    );
    delete changes.company;
    if (Object.keys(changes).length > 0) {
      await logAudit({
        actor: actorOf(auth),
        action: 'UPDATE',
        entity: 'customer',
        entityId: id,
        summary: `Cliente "${updated.name}" atualizado (${Object.keys(changes).join(', ')})`,
        changes,
      });
    }

    return NextResponse.json({ success: true, customer: mapCustomerDetail(updated) });
  } catch (error) {
    if (isUniqueConflict(error)) {
      return NextResponse.json({ message: 'CPF/CNPJ já cadastrado para outro cliente' }, { status: 409 });
    }
    console.error('[API Customer PUT Error]:', error);
    return NextResponse.json({ message: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

// DELETE /api/customers/[id] — remove também os arquivos do Storage.
// O histórico do CRM, leads, propostas e faturas são mantidos (vínculo fica vazio, nome preservado).
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

    const openInvoices = await prisma.financialRecord.count({
      where: { customerId: id, type: 'RECEITA', status: { in: ['ABERTO', 'PENDENTE', 'ATRASADO'] } },
    });
    if (openInvoices > 0) {
      return NextResponse.json(
        { message: `O cliente tem ${openInvoices} fatura(s) em aberto. Receba ou cancele antes de excluir — ou apenas inative o cadastro.` },
        { status: 409 }
      );
    }

    if (customer.documents.length > 0) {
      const { error } = await supabaseAdmin.storage
        .from(CUSTOMER_DOCS_BUCKET)
        .remove(customer.documents.map((d) => d.storagePath));
      if (error) console.warn('[Customer Delete] Arquivos não removidos do Storage:', error.message);
    }

    await prisma.customer.delete({ where: { id } });
    await logAudit({
      actor: actorOf(auth),
      action: 'DELETE',
      entity: 'customer',
      entityId: id,
      summary: `Cliente "${customer.name}" excluído (${customer.documents.length} documento(s) removido(s))`,
      changes: { document: customer.document, city: customer.city },
    });
    return NextResponse.json({ success: true, message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('[API Customer DELETE Error]:', error);
    return NextResponse.json({ message: 'Erro ao excluir cliente' }, { status: 500 });
  }
}
