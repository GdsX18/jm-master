import prisma from './prisma';

// Limite de tentativas guardado no banco: vale para todas as instâncias da Vercel.
// Retorna true quando o limite foi excedido.
export async function isRateLimited(key: string, max: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO rate_limits ("key", "count", "resetAt")
      VALUES (${key}, 1, ${new Date(now.getTime() + windowMs)})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN rate_limits."resetAt" < ${now} THEN 1 ELSE rate_limits."count" + 1 END,
        "resetAt" = CASE WHEN rate_limits."resetAt" < ${now} THEN EXCLUDED."resetAt" ELSE rate_limits."resetAt" END
      RETURNING "count"`;
    return (rows[0]?.count ?? 0) > max;
  } catch (error) {
    // Falha no limitador não pode derrubar o login/formulário
    console.error('[RateLimit Error]:', error);
    return false;
  }
}

export async function resetRateLimit(key: string) {
  await prisma.rateLimit.deleteMany({ where: { key } }).catch(() => {});
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}
