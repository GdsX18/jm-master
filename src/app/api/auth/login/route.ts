import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { BLOG_ONLY_ROLE, SESSION_COOKIE, createSessionToken, sessionCookieOptions } from '@/lib/auth';
import { hashPassword, isPasswordHashed, verifyPassword } from '@/lib/password';

// Limite simples de tentativas por IP (best-effort: vale por instância)
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

const INVALID_CREDENTIALS = 'E-mail ou senha inválidos';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !(await verifyPassword(cleanPassword, user.password))) {
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

    response.cookies.set(SESSION_COOKIE, await createSessionToken(user.id, user.role), sessionCookieOptions());
    return response;
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return NextResponse.json({ error: 'Erro ao processar autenticação' }, { status: 500 });
  }
}
