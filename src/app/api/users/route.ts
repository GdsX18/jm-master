import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/users - Listar usuários do Supabase
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('[API Users GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao obter usuários' }, { status: 500 });
  }
}

// POST /api/users - Criar ou Atualizar usuário no Supabase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, password, role, isBlocked, permissions, prohibitions } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verifica se usuário já existe por ID ou E-mail
    let existingUser = null;
    if (id) {
      existingUser = await prisma.user.findUnique({ where: { id } });
    }
    if (!existingUser) {
      existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    }

    if (existingUser) {
      // Atualização
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          email: cleanEmail,
          password: password !== undefined && password !== '' && password !== '********' ? password : existingUser.password,
          role: role || existingUser.role,
          isBlocked: isBlocked !== undefined ? isBlocked : existingUser.isBlocked,
          permissions: permissions !== undefined ? permissions : existingUser.permissions,
          prohibitions: prohibitions !== undefined ? prohibitions : existingUser.prohibitions,
        },
      });

      return NextResponse.json({ success: true, user: updatedUser });
    } else {
      // Novo usuário
      const newUser = await prisma.user.create({
        data: {
          id: id || undefined,
          name,
          email: cleanEmail,
          password: password || '123456',
          role: role || 'Criador de Blog',
          isBlocked: isBlocked || false,
          permissions: permissions || {},
          prohibitions: prohibitions || {},
        },
      });

      return NextResponse.json({ success: true, user: newUser });
    }
  } catch (error: any) {
    console.error('[API Users POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao salvar usuário' }, { status: 500 });
  }
}

// DELETE /api/users?id=... - Excluir usuário do Supabase
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('[API Users DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Erro ao excluir usuário' }, { status: 500 });
  }
}
