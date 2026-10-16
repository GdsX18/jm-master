import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { actorOf, requirePermission, type CurrentUser } from '@/lib/session';
import { PERMISSION_KEYS, SUPER_ADMIN_ROLE, effectivePermissions, isValidRole, type Permissions } from '@/lib/permissions';
import { diffFields, logAudit } from '@/lib/audit';
import { EMAIL_REGEX } from '@/lib/validators';

// Nunca devolver o hash de senha para o navegador
const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  isBlocked: true,
  permissions: true,
  prohibitions: true,
  createdAt: true,
  updatedAt: true,
} as const;

const MIN_PASSWORD_LENGTH = 8;

function sanitizePermissions(value: unknown) {
  const result: Record<string, boolean> = {};
  if (value && typeof value === 'object') {
    for (const key of PERMISSION_KEYS) {
      const v = (value as Record<string, unknown>)[key];
      if (typeof v === 'boolean') result[key] = v;
    }
  }
  return result;
}

async function countActiveSuperAdmins(excludeId?: string) {
  return prisma.user.count({
    where: { role: SUPER_ADMIN_ROLE, isBlocked: false, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
}

// Só um Super administrador pode criar, editar ou atribuir o perfil de Super administrador
function canManageTarget(actor: CurrentUser, targetRole: string | undefined) {
  return actor.role === SUPER_ADMIN_ROLE || targetRole !== SUPER_ADMIN_ROLE;
}

// Quem não é Super administrador não pode conceder a outro usuário uma permissão que ele mesmo não tem
function grantedBeyondActor(actor: CurrentUser, before: Permissions | null, after: Permissions): string[] {
  if (actor.role === SUPER_ADMIN_ROLE) return [];
  return PERMISSION_KEYS.filter((k) => after[k] && !before?.[k] && !actor.permissions[k]);
}

// GET /api/users - Listar usuários
export async function GET() {
  const auth = await requirePermission('manageUsers');
  if (auth instanceof NextResponse) return auth;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: PUBLIC_USER_FIELDS,
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('[API Users GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao obter usuários' }, { status: 500 });
  }
}

// POST /api/users - Criar (sem id) ou atualizar (com id) usuário
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageUsers');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, name, email, password, role, isBlocked, permissions, prohibitions } = body;

    if (!name || !email || typeof name !== 'string' || typeof email !== 'string') {
      return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }

    if (role !== undefined && !isValidRole(role)) {
      return NextResponse.json({ error: 'Perfil de acesso inválido' }, { status: 400 });
    }

    const newPassword =
      typeof password === 'string' && password.trim() !== '' && password !== '********' ? password.trim() : null;

    if (newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` },
        { status: 400 }
      );
    }

    const existingUser = id ? await prisma.user.findUnique({ where: { id } }) : null;

    if (id && !existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const emailOwner = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (emailOwner && emailOwner.id !== existingUser?.id) {
      return NextResponse.json({ error: 'Já existe um usuário com este e-mail' }, { status: 409 });
    }

    if (existingUser) {
      const nextRole = role ?? existingUser.role;
      const nextBlocked = typeof isBlocked === 'boolean' ? isBlocked : existingUser.isBlocked;
      const nextPermissions = permissions !== undefined ? sanitizePermissions(permissions) : (existingUser.permissions as object);
      const nextProhibitions = prohibitions !== undefined ? sanitizePermissions(prohibitions) : (existingUser.prohibitions as object);
      const isSelf = existingUser.id === auth.id;

      if (!canManageTarget(auth, existingUser.role) || !canManageTarget(auth, nextRole)) {
        return NextResponse.json({ error: 'Apenas um Super administrador pode alterar Super administradores' }, { status: 403 });
      }
      if (isSelf && nextRole !== existingUser.role) {
        return NextResponse.json({ error: 'Você não pode alterar o seu próprio perfil de acesso' }, { status: 403 });
      }
      if (isSelf && nextBlocked) {
        return NextResponse.json({ error: 'Você não pode bloquear a sua própria conta' }, { status: 403 });
      }
      // Compara já normalizado (mesma ordem de chaves, só booleanos)
      const permissionsChanged =
        JSON.stringify(sanitizePermissions(nextPermissions)) !== JSON.stringify(sanitizePermissions(existingUser.permissions)) ||
        JSON.stringify(sanitizePermissions(nextProhibitions)) !== JSON.stringify(sanitizePermissions(existingUser.prohibitions));
      if (isSelf && permissionsChanged && auth.role !== SUPER_ADMIN_ROLE) {
        return NextResponse.json({ error: 'Você não pode alterar as suas próprias permissões' }, { status: 403 });
      }

      const before = effectivePermissions(existingUser.role, existingUser.permissions, existingUser.prohibitions);
      const after = effectivePermissions(nextRole, nextPermissions, nextProhibitions);
      const beyond = grantedBeyondActor(auth, before, after);
      if (beyond.length > 0) {
        return NextResponse.json(
          { error: 'Você não pode conceder permissões que o seu próprio perfil não possui' },
          { status: 403 }
        );
      }

      const losesSuperAdmin =
        existingUser.role === SUPER_ADMIN_ROLE && !existingUser.isBlocked && (nextRole !== SUPER_ADMIN_ROLE || nextBlocked);
      if (losesSuperAdmin && (await countActiveSuperAdmins(existingUser.id)) === 0) {
        return NextResponse.json({ error: 'O sistema precisa ter pelo menos um Super administrador ativo' }, { status: 409 });
      }

      // Senha, perfil, bloqueio ou permissões alterados: encerra as sessões abertas desse usuário
      // (a própria sessão de quem edita a si mesmo é preservada: só muda a senha)
      const endSessions = !isSelf && (!!newPassword || nextRole !== existingUser.role || nextBlocked || permissionsChanged);

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: newPassword ? await hashPassword(newPassword) : existingUser.password,
          role: nextRole,
          isBlocked: nextBlocked,
          permissions: nextPermissions,
          prohibitions: nextProhibitions,
          ...(endSessions ? { sessionVersion: { increment: 1 } } : {}),
        },
        select: PUBLIC_USER_FIELDS,
      });

      const changes = diffFields(existingUser as unknown as Record<string, unknown>, {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isBlocked: updatedUser.isBlocked,
        permissions: updatedUser.permissions,
        prohibitions: updatedUser.prohibitions,
      });
      await logAudit({
        actor: actorOf(auth),
        action: 'UPDATE',
        entity: 'user',
        entityId: updatedUser.id,
        summary: `Usuário ${updatedUser.name} atualizado${newPassword ? ' (senha redefinida)' : ''}`,
        changes: { ...changes, ...(newPassword ? { password: 'redefinida' } : {}) },
      });

      return NextResponse.json({ success: true, user: updatedUser, passwordChanged: !!newPassword });
    }

    // Novo usuário
    if (!newPassword) {
      return NextResponse.json({ error: 'Defina uma senha para o novo usuário' }, { status: 400 });
    }

    const newRole = role ?? 'Criador de Blog';
    if (!canManageTarget(auth, newRole)) {
      return NextResponse.json({ error: 'Apenas um Super administrador pode criar Super administradores' }, { status: 403 });
    }

    const newPermissions = sanitizePermissions(permissions);
    const newProhibitions = sanitizePermissions(prohibitions);
    if (grantedBeyondActor(auth, null, effectivePermissions(newRole, newPermissions, newProhibitions)).length > 0) {
      return NextResponse.json(
        { error: 'Você não pode criar um usuário com permissões que o seu próprio perfil não possui' },
        { status: 403 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: await hashPassword(newPassword),
        role: newRole,
        isBlocked: !!isBlocked,
        permissions: newPermissions,
        prohibitions: newProhibitions,
      },
      select: PUBLIC_USER_FIELDS,
    });

    await logAudit({
      actor: actorOf(auth),
      action: 'CREATE',
      entity: 'user',
      entityId: newUser.id,
      summary: `Usuário ${newUser.name} (${newUser.role}) criado`,
    });

    return NextResponse.json({ success: true, user: newUser, passwordChanged: true });
  } catch (error) {
    console.error('[API Users POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao salvar usuário' }, { status: 500 });
  }
}

// DELETE /api/users?id=... - Excluir usuário
export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('manageUsers');
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }
    if (id === auth.id) {
      return NextResponse.json({ error: 'Você não pode excluir a sua própria conta' }, { status: 403 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    if (!canManageTarget(auth, target.role)) {
      return NextResponse.json({ error: 'Apenas um Super administrador pode excluir Super administradores' }, { status: 403 });
    }
    if (target.role === SUPER_ADMIN_ROLE && !target.isBlocked && (await countActiveSuperAdmins(target.id)) === 0) {
      return NextResponse.json({ error: 'O sistema precisa ter pelo menos um Super administrador ativo' }, { status: 409 });
    }

    await prisma.user.delete({ where: { id } });
    await logAudit({
      actor: actorOf(auth),
      action: 'DELETE',
      entity: 'user',
      entityId: id,
      summary: `Usuário ${target.name} (${target.email}) excluído`,
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('[API Users DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  }
}
