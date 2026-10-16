import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { BLOG_ONLY_ROLE, SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { hashPassword, isPasswordHashed, verifyPassword } from '@/lib/password';
import { clientIp, isRateLimited, resetRateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

// Limite de tentativas por IP e por e-mail, compartilhado entre instâncias (tabela rate_limits)
const MAX_ATTEMPTS_PER_IP = 20;
const MAX_ATTEMPTS_PER_EMAIL = 8;
const WINDOW_MS = 15 * 60 * 1000;

const INVALID_CREDENTIALS = 'E-mail ou senha inválidos';
const TOO_MANY = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (await isRateLimited(`login:ip:${ip}`, MAX_ATTEMPTS_PER_IP, WINDOW_MS)) {
      return NextResponse.json({ error: TOO_MANY }, { status: 429 });
    }

    const { email, password } = await req.json();

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    if (await isRateLimited(`login:email:${cleanEmail}`, MAX_ATTEMPTS_PER_EMAIL, WINDOW_MS)) {
      return NextResponse.json({ error: TOO_MANY }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !(await verifyPassword(cleanPassword, user.password))) {
      await logAudit({
        actor: { id: user?.id, name: user?.name || cleanEmail, email: cleanEmail },
        action: 'LOGIN_FAILED',
        entity: 'user',
        entityId: user?.id,
        summary: `Tentativa de login falhou para ${cleanEmail}`,
        ip,
      });
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'Este usuário está bloqueado pelo administrador' }, { status: 403 });
    }

    // Migração automática de senha legada (texto puro) para hash
    if (!isPasswordHashed(user.password)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(cleanPassword) },
      });
    }

    await resetRateLimit(`login:email:${cleanEmail}`);
    await logAudit({
      actor: { id: user.id, name: user.name, email: user.email },
      action: 'LOGIN',
      entity: 'user',
      entityId: user.id,
      summary: `${user.name} entrou no painel`,
      ip,
    });

    const redirectUrl = user.role === BLOG_ONLY_ROLE ? '/painel/blog' : '/painel';

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        prohibitions: user.prohibitions,
      },
      redirectUrl,
    });

    response.cookies.set(
      SESSION_COOKIE,
      await createSessionToken(user.id, user.role, user.sessionVersion),
      sessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return NextResponse.json({ error: 'Erro ao processar autenticação' }, { status: 500 });
  }
}
