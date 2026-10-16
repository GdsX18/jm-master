import { Prisma } from '@prisma/client';
import prisma from './prisma';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS'
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD'
  | 'CONVERT'
  | 'GENERATE';

export type AuditEntity =
  | 'user'
  | 'customer'
  | 'group'
  | 'product'
  | 'prices'
  | 'invoice'
  | 'billing'
  | 'post'
  | 'category'
  | 'media'
  | 'settings'
  | 'lead'
  | 'proposal'
  | 'crm'
  | 'document'
  | 'note';

export interface AuditActor {
  id?: string | null;
  name: string;
  email?: string | null;
}

export const SYSTEM_ACTOR: AuditActor = { name: 'Sistema (automático)' };

interface AuditInput {
  actor: AuditActor;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  summary: string;
  changes?: Record<string, unknown> | null;
  ip?: string | null;
}

// Nunca deixa a auditoria derrubar a operação principal
export async function logAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.actor.id || null,
        userName: input.actor.name,
        userEmail: input.actor.email || null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId || null,
        summary: input.summary.slice(0, 500),
        changes: input.changes ? (JSON.parse(JSON.stringify(input.changes)) as Prisma.InputJsonValue) : Prisma.DbNull,
        ip: input.ip || null,
      },
    });
  } catch (error) {
    console.error('[Audit Error]:', error);
  }
}

const SECRET_FIELDS = new Set(['password', 'passwordHash', 'sessionVersion']);

function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object' && 'toNumber' in value) return (value as { toNumber: () => number }).toNumber();
  return value;
}

// Diferença campo a campo entre o antes e o depois (só chaves presentes em "after")
export function diffFields(before: Record<string, unknown> | null | undefined, after: Record<string, unknown>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (SECRET_FIELDS.has(key)) continue;
    const from = normalize(before?.[key]);
    const to = normalize(after[key]);
    if (JSON.stringify(from) !== JSON.stringify(to)) changes[key] = { from, to };
  }
  return changes;
}
