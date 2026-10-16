import { NextRequest, NextResponse } from 'next/server';
import { runBillingAutomation } from '@/lib/billing';

export const dynamic = 'force-dynamic';

// GET /api/cron/billing - Executado diariamente pela Vercel Cron (ver vercel.json).
// A Vercel envia "Authorization: Bearer <CRON_SECRET>" quando a variável CRON_SECRET está configurada.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const result = await runBillingAutomation({ minIntervalMs: 60_000, trigger: 'cron diário' });
    console.log('[Cron Billing]', JSON.stringify(result));
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[Cron Billing Error]:', error);
    return NextResponse.json({ error: 'Erro na automação financeira' }, { status: 500 });
  }
}
