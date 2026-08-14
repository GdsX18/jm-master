import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'E-mail não encontrado no sistema' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'Este usuário está bloqueado pelo administrador' }, { status: 403 });
    }

    // Validação de senha
    if (user.password && user.password !== password.trim()) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    // Define destino baseado no perfil
    const redirectUrl = user.role === 'Criador de Blog' ? '/painel/blog' : '/painel';

    return NextResponse.json({
      success: true,
      token: `token_${user.id}_${Date.now()}`,
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
  } catch (error: any) {
    console.error('[Auth Login Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar autenticação' }, { status: 500 });
  }
}
