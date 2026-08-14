import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/finance - Listar registros financeiros e métricas
export async function GET() {
  try {
    const records = await prisma.financialRecord.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Calcular métricas reais
    let receitaRecebida = 0;
    let aReceber = 0;
    let inadimplencia = 0;
    let mrr = 0;
    let openCount = 0;
    let overdueCount = 0;

    for (const r of records) {
      const val = Number(r.amount) || 0;
      mrr += val;

      if (r.status === 'PAGO') {
        receitaRecebida += val;
      } else if (r.status === 'ATRASADO') {
        inadimplencia += val;
        overdueCount++;
      } else if (r.status === 'ABERTO' || r.status === 'PENDENTE') {
        aReceber += val;
        openCount++;
      }
    }

    return NextResponse.json({
      success: true,
      records,
      metrics: {
        receitaRecebida,
        aReceber,
        inadimplencia,
        mrr,
        openCount,
        overdueCount,
        totalCount: records.length,
      },
    });
  } catch (error: any) {
    console.error('[API Finance GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao carregar dados financeiros' }, { status: 500 });
  }
}

// POST /api/finance - Criar nova fatura / registro financeiro
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, description, customer, amount, status, dueDate, paymentDate, method, category } = body;

    if (!description || !amount) {
      return NextResponse.json({ error: 'Descrição/Cliente e valor são obrigatórios' }, { status: 400 });
    }

    const numAmount = parseFloat(String(amount).replace(',', '.'));
    if (isNaN(numAmount) || numAmount < 0) {
      return NextResponse.json({ error: 'Valor financeiro inválido' }, { status: 400 });
    }

    const record = await prisma.financialRecord.create({
      data: {
        description: description || customer || 'Fatura de Serviço',
        amount: numAmount,
        type: 'RECEITA',
        category: category || 'Mensalidade',
        status: status || 'ABERTO',
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        paymentDate: status === 'PAGO' ? (paymentDate ? new Date(paymentDate) : new Date()) : null,
        metadata: {
          invoiceId: id || `INV-${Date.now().toString().slice(-6)}`,
          customer: customer || description,
          method: method || 'Boleto / Pix',
        },
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('[API Finance POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao criar registro financeiro' }, { status: 500 });
  }
}

// PATCH /api/finance - Atualizar status da fatura
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID e status são obrigatórios' }, { status: 400 });
    }

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        status,
        paymentDate: status === 'PAGO' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('[API Finance PATCH Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar registro' }, { status: 500 });
  }
}

// DELETE /api/finance - Excluir fatura
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await prisma.financialRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Registro financeiro excluído' });
  } catch (error: any) {
    console.error('[API Finance DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir registro' }, { status: 500 });
  }
}
