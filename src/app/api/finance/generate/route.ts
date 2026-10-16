import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/session';
import { runBillingAutomation } from '@/lib/billing';

// POST /api/finance/generate[?auto=1] - Gera as faturas recorrentes do mês e registra as vencidas.
// auto=1: chamado ao abrir o Financeiro; roda no máximo a cada 6 h (o cron diário cobre o resto).
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageFinance');
  if (auth instanceof NextResponse) return auth;

  try {
    const auto = new URL(req.url).searchParams.get('auto') === '1';
    const result = await runBillingAutomation({
      minIntervalMs: auto ? 6 * 60 * 60 * 1000 : 30_000,
      trigger: auto ? 'abertura do Financeiro' : `manual por ${auth.name}`,
    });
    if (result.skippedRun && !auto) {
      return NextResponse.json({ error: 'A automação acabou de rodar. Aguarde alguns segundos.' }, { status: 429 });
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[API Finance Generate Error]:', error);
    return NextResponse.json({ error: 'Erro ao gerar faturas' }, { status: 500 });
  }
}
