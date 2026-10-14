import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from './prisma';
import { SESSION_COOKIE, verifySessionToken } from './auth';
import { effectivePermissions, type PermissionKey, type Permissions } from './permissions';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Permissions;
}

// Usuário da sessão, sempre conferido no banco: bloqueio, exclusão ou troca de perfil valem na hora
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const session = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, name: true, email: true, role: true, isBlocked: true, permissions: true, prohibitions: true },
  });
  if (!user || user.isBlocked) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: effectivePermissions(user.role, user.permissions, user.prohibitions),
  };
}

// Uso nas rotas: const auth = await requirePermission('manageCrm'); if (auth instanceof NextResponse) return auth;
// Com uma lista de chaves, basta ter qualquer uma delas
export async function requirePermission(key?: PermissionKey | PermissionKey[]): Promise<CurrentUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
  }
  const keys = key === undefined ? [] : Array.isArray(key) ? key : [key];
  if (keys.length > 0 && !keys.some((k) => user.permissions[k])) {
    return NextResponse.json({ error: 'Você não tem permissão para esta ação.' }, { status: 403 });
  }
  return user;
}
