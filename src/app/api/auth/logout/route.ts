import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { actorOf, getCurrentUser } from '@/lib/session';
import { logAudit } from '@/lib/audit';

// Encerra a sessão: além de apagar o cookie, incrementa a versão da sessão do usuário,
// o que invalida o token mesmo que ele tenha sido copiado antes do logout
export async function POST() {
  const user = await getCurrentUser().catch(() => null);
  if (user) {
    await prisma.user
      .update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } })
      .catch((e) => console.error('[Auth Logout Error]:', e));
    await logAudit({ actor: actorOf(user), action: 'LOGOUT', entity: 'user', entityId: user.id, summary: `${user.name} saiu do painel` });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
