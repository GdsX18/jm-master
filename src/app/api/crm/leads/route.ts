import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { LEAD_INCLUDE, leadSchema, mapLead } from '@/lib/lead-mapper';
import { LEAD_SOURCES, OPEN_STAGES } from '@/lib/leads';
import { formatDateTimeBr } from '@/lib/dates';
import { logAudit } from '@/lib/audit';



// GET /api/crm/leads?q=&ownerId=&closedDays=30 - Quadro do funil
// Estágios abertos: todos. Ganhos/perdidos: só os movidos nos últimos "closedDays" dias.
export async function GET(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim();
    const ownerId = url.searchParams.get('ownerId');
    const closedDays = Math.min(365, Math.max(1, parseInt(url.searchParams.get('closedDays') || '30', 10) || 30));
    const closedSince = new Date(Date.now() - closedDays * 24 * 60 * 60 * 1000);

    const where: Prisma.LeadWhereInput = {
      AND: [
        { OR: [{ stage: { in: OPEN_STAGES } }, { stageChangedAt: { gte: closedSince } }] },
        ...(ownerId === 'none' ? [{ ownerId: null }] : ownerId ? [{ ownerId }] : []),
        ...(q
          ? [
              {
                OR: [
                  { name: { contains: q, mode: 'insensitive' as const } },
                  { company: { contains: q, mode: 'insensitive' as const } },
                  { email: { contains: q, mode: 'insensitive' as const } },
                  { phone: { contains: q } },
                  { interest: { contains: q, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    };

    const [leads, owners] = await Promise.all([
      prisma.lead.findMany({ where, include: LEAD_INCLUDE, orderBy: [{ position: 'asc' }, { createdAt: 'desc' }], take: 1000 }),
      prisma.user.findMany({
        where: { isBlocked: false, role: { not: 'Criador de Blog' } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ success: true, leads: leads.map(mapLead), owners });
  } catch (error) {
    console.error('[API Leads GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar o funil' }, { status: 500 });
  }
}

// POST /api/crm/leads - Cadastrar lead manualmente
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const parsed = leadSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 });
    const input = parsed.data;

    const top = await prisma.lead.findFirst({ where: { stage: input.stage }, orderBy: { position: 'asc' }, select: { position: true } });
    const nextActionAt = input.nextActionAt ? new Date(input.nextActionAt) : null;

    const lead = await prisma.lead.create({
      data: {
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        company: input.company || null,
        interest: input.interest || null,
        message: input.message || null,
        source: input.source,
        stage: input.stage,
        estimatedValue: input.estimatedValue,
        ownerId: input.ownerId || auth.id,
        nextAction: input.nextAction || null,
        nextActionAt: nextActionAt && !Number.isNaN(nextActionAt.getTime()) ? nextActionAt : null,
        position: (top?.position ?? 0) - 1,
        interactions: {
          create: {
            operator: `${auth.name} (${auth.role})`,
            customerName: input.company ? `${input.name} (${input.company})` : input.name,
            title: 'Lead cadastrado manualmente',
            description: input.message || `Origem: ${LEAD_SOURCES.find((s) => s.key === input.source)?.label}`,
            date: formatDateTimeBr(),
            type: 'LEAD',
          },
        },
      },
      include: LEAD_INCLUDE,
    });

    await logAudit({ actor: actorOf(auth), action: 'CREATE', entity: 'lead', entityId: lead.id, summary: `Lead "${lead.name}" cadastrado` });
    return NextResponse.json({ success: true, lead: mapLead(lead) });
  } catch (error) {
    console.error('[API Leads POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar lead' }, { status: 500 });
  }
}
