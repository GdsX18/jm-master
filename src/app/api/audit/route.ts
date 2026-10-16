import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';
import { readPagination } from '@/lib/customer-ref';

export const dynamic = 'force-dynamic';

// GET /api/audit?entity=&action=&userId=&q=&from=&to=&page=&pageSize= - Trilha de auditoria
// Acesso: quem gerencia usuários (administração do sistema)
export async function GET(req: NextRequest) {
  const auth = await requirePermission('manageUsers');
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const { page, pageSize, skip, take } = readPagination(url, 50, 200);
    const entity = url.searchParams.get('entity');
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');
    const q = url.searchParams.get('q')?.trim();
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    const where: Prisma.AuditLogWhereInput = {
      ...(entity ? { entity } : {}),
      ...(action ? { action } : {}),
      ...(userId ? { userId } : {}),
      ...(q
        ? {
            OR: [
              { summary: { contains: q, mode: 'insensitive' } },
              { userName: { contains: q, mode: 'insensitive' } },
              { userEmail: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? { gte: new Date(`${from}T03:00:00.000Z`) } : {}),
              ...(to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? { lt: new Date(new Date(`${to}T03:00:00.000Z`).getTime() + 86_400_000) } : {}),
            },
          }
        : {}),
    };

    const [logs, total, users] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.auditLog.count({ where }),
      prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);

    return NextResponse.json({ success: true, logs, total, page, pageSize, users });
  } catch (error) {
    console.error('[API Audit Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar a auditoria' }, { status: 500 });
  }
}
