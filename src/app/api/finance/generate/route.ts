import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/session';
import { runBillingAutomation } from '@/lib/billing';

// POST /api/finance/generate - Rodar agora a geração de faturas do mês e o registro de vencidas
export async function POST() {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const result = await runBillingAutomation();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[API Finance Generate Error]:', error);
    return NextResponse.json({ error: 'Erro ao gerar faturas' }, { status: 500 });
  }
}
