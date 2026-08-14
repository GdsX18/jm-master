import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/crm - Listar histórico de interações do CRM
export async function GET() {
  try {
    const interactions = await prisma.crmInteraction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });
    return NextResponse.json({ success: true, interactions });
  } catch (error: any) {
    console.error('[API CRM GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao carregar interações' }, { status: 500 });
  }
}

// POST /api/crm - Criar nova interação na linha do tempo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operator, customerName, title, description, date, type, badge, customerId } = body;

    if (!title || !description || !operator) {
      return NextResponse.json({ error: 'Operador, título e descrição são obrigatórios' }, { status: 400 });
    }

    const interaction = await prisma.crmInteraction.create({
      data: {
        operator,
        customerName: customerName || 'Cliente Geral',
        title,
        description,
        date: date || 'Hoje',
        type: type || 'COMERCIAL',
        badge: badge || 'bg-orange-500/10 text-[#E85D26] border border-orange-500/20',
        customerId: customerId || undefined,
      },
    });

    return NextResponse.json({ success: true, interaction });
  } catch (error: any) {
    console.error('[API CRM POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao registrar interação' }, { status: 500 });
  }
}
