import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import { actorOf, requirePermission } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { clientIp, isRateLimited } from '@/lib/rate-limit';

const MIN_PASSWORD_LENGTH = 8;

// POST /api/auth/password { currentPassword, newPassword } — qualquer usuário logado troca a própria senha.
// Encerra as outras sessões (incrementa sessionVersion) e renova o cookie desta.
export async function POST(req: NextRequest) {
  const auth = await requirePermission();
  if (auth instanceof NextResponse) return auth;

  try {
    if (await isRateLimited(`password:${auth.id}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'Informe a senha atual e a nova senha' }, { status: 400 });
    }
    const next = newPassword.trim();
    if (next.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!user || !(await verifyPassword(currentPassword.trim(), user.password))) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
    }
    if (await verifyPassword(next, user.password)) {
      return NextResponse.json({ error: 'A nova senha precisa ser diferente da atual' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(next), sessionVersion: { increment: 1 } },
      select: { id: true, role: true, sessionVersion: true },
    });

    await logAudit({
      actor: actorOf(auth),
      action: 'PASSWORD',
      entity: 'user',
      entityId: user.id,
      summary: `${auth.name} alterou a própria senha`,
      ip: clientIp(req),
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      SESSION_COOKIE,
      await createSessionToken(updated.id, updated.role, updated.sessionVersion),
      sessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error('[Auth Password Error]:', error);
    return NextResponse.json({ error: 'Erro ao alterar a senha' }, { status: 500 });
  }
}
