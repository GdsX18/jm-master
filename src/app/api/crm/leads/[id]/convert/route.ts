import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';
import { LEAD_INCLUDE, mapLead } from '@/lib/lead-mapper';
import { convertLead } from '@/lib/lead-convert';

type Params = { params: Promise<{ id: string }> };

// POST /api/crm/leads/[id]/convert { customerId? }
// Converte o lead em cliente: cria o cadastro com os dados do lead (ou vincula a um cliente existente),
// marca o lead como "Ganho" e leva o histórico do CRM e as propostas para o cliente.
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    if (lead.customerId) return NextResponse.json({ error: 'Este lead já foi convertido em cliente' }, { status: 409 });

    const result = await convertLead(lead, typeof body.customerId === 'string' ? body.customerId : null, auth);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });

    const updated = await prisma.lead.findUniqueOrThrow({ where: { id }, include: LEAD_INCLUDE });
    return NextResponse.json({ success: true, lead: mapLead(updated), customerId: result.customerId });
  } catch (error) {
    console.error('[API Lead Convert Error]:', error);
    return NextResponse.json({ error: 'Erro ao converter lead' }, { status: 500 });
  }
}
