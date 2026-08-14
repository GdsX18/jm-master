import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'users.json');

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE_PATH)) {
      fs.mkdirSync(path.dirname(USERS_FILE_PATH), { recursive: true });
      fs.writeFileSync(USERS_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const data = fs.readFileSync(USERS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler users.json:', error);
    return [];
  }
}

function writeUsers(users: any[]) {
  try {
    fs.mkdirSync(path.dirname(USERS_FILE_PATH), { recursive: true });
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar users.json:', error);
    return false;
  }
}

// GET /api/users - Listar usuários
export async function GET() {
  try {
    const users = readUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao obter usuários' }, { status: 500 });
  }
}

// POST /api/users - Criar ou Atualizar usuário
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, password, role, isBlocked, permissions, prohibitions } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 });
    }

    const users = readUsers();
    const existingIndex = users.findIndex((u: any) => u.id === id || u.email.toLowerCase() === email.toLowerCase());

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Atualização
      const existingUser = users[existingIndex];
      users[existingIndex] = {
        ...existingUser,
        name,
        email: email.toLowerCase(),
        password: password !== undefined && password !== '' && password !== '********' ? password : existingUser.password,
        role: role || existingUser.role,
        isBlocked: isBlocked !== undefined ? isBlocked : existingUser.isBlocked,
        permissions: permissions || existingUser.permissions,
        prohibitions: prohibitions || existingUser.prohibitions,
        updatedAt: now,
      };
      writeUsers(users);
      return NextResponse.json({ success: true, user: users[existingIndex] });
    } else {
      // Novo usuário
      const newUser = {
        id: id || `usr_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: password || '123456',
        role: role || 'Criador de Blog',
        isBlocked: isBlocked || false,
        permissions: permissions || {},
        prohibitions: prohibitions || {},
        createdAt: now,
        updatedAt: now,
      };
      users.push(newUser);
      writeUsers(users);
      return NextResponse.json({ success: true, user: newUser });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao salvar usuário' }, { status: 500 });
  }
}

// DELETE /api/users?id=... - Excluir usuário
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const users = readUsers();
    const filtered = users.filter((u: any) => u.id !== id);

    if (filtered.length === users.length) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    writeUsers(filtered);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao excluir usuário' }, { status: 500 });
  }
}
