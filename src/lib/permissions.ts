// Modelo de permissões compartilhado entre servidor (APIs) e painel (menu/telas).

export const PERMISSION_KEYS = [
  'manageBlog',
  'manageUsers',
  'manageCrm',
  'manageFinance',
  'manageProducts',
  'createCampaign',
  'executeDispatches',
  'manageTriggers',
  'surveyManagement',
  'structuralManagement',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type Permissions = Record<PermissionKey, boolean>;

export const ROLES = [
  'Super administrador',
  'Administrador',
  'Supervisor',
  'Operador',
  'Criador de Blog',
] as const;

export type UserRole = (typeof ROLES)[number];

export const SUPER_ADMIN_ROLE: UserRole = 'Super administrador';

export const EMPTY_PERMISSIONS: Permissions = {
  manageBlog: false,
  manageUsers: false,
  manageCrm: false,
  manageFinance: false,
  manageProducts: false,
  createCampaign: false,
  executeDispatches: false,
  manageTriggers: false,
  surveyManagement: false,
  structuralManagement: false,
};

const ALL_PERMISSIONS: Permissions = Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true])) as Permissions;

export const ROLE_DEFAULTS: Record<UserRole, { permissions: Permissions; prohibitions: Permissions }> = {
  'Super administrador': {
    permissions: ALL_PERMISSIONS,
    prohibitions: EMPTY_PERMISSIONS,
  },
  Administrador: {
    permissions: { ...ALL_PERMISSIONS, manageUsers: false },
    prohibitions: { ...EMPTY_PERMISSIONS, manageUsers: true },
  },
  Supervisor: {
    permissions: { ...ALL_PERMISSIONS, manageUsers: false, manageFinance: false, structuralManagement: false },
    prohibitions: { ...EMPTY_PERMISSIONS, manageUsers: true, manageFinance: true },
  },
  Operador: {
    permissions: { ...EMPTY_PERMISSIONS, manageCrm: true, executeDispatches: true, surveyManagement: true },
    prohibitions: {
      ...EMPTY_PERMISSIONS,
      manageBlog: true,
      manageUsers: true,
      manageFinance: true,
      manageProducts: true,
      manageTriggers: true,
    },
  },
  'Criador de Blog': {
    permissions: { ...EMPTY_PERMISSIONS, manageBlog: true },
    prohibitions: { ...ALL_PERMISSIONS, manageBlog: false },
  },
};

export function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && (ROLES as readonly string[]).includes(role);
}

function toPermissions(value: unknown): Partial<Permissions> {
  if (!value || typeof value !== 'object') return {};
  const result: Partial<Permissions> = {};
  for (const key of PERMISSION_KEYS) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === 'boolean') result[key] = v;
  }
  return result;
}

// Permissões efetivas: padrão do perfil + ajustes do usuário − proibições.
// O Super administrador sempre tem acesso total (evita travar o sistema).
export function effectivePermissions(role: string, permissions: unknown, prohibitions: unknown): Permissions {
  if (role === SUPER_ADMIN_ROLE) return { ...ALL_PERMISSIONS };

  const defaults = isValidRole(role) ? ROLE_DEFAULTS[role].permissions : EMPTY_PERMISSIONS;
  const result: Permissions = { ...defaults, ...toPermissions(permissions) };
  const blocked = toPermissions(prohibitions);
  for (const key of PERMISSION_KEYS) {
    if (blocked[key]) result[key] = false;
  }
  return result;
}

// Permissão necessária para cada tela do painel (o dashboard é livre para qualquer usuário logado)
export const PAGE_PERMISSIONS: Record<string, PermissionKey> = {
  '/painel/blog': 'manageBlog',
  '/painel/users': 'manageUsers',
  '/painel/crm': 'manageCrm',
  '/painel/customers': 'manageCrm',
  '/painel/finance': 'manageFinance',
  '/painel/products': 'manageProducts',
};

export function permissionForPath(pathname: string): PermissionKey | undefined {
  const match = Object.keys(PAGE_PERMISSIONS).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  return match ? PAGE_PERMISSIONS[match] : undefined;
}
