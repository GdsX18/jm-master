import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { round2, toNumber } from './money';
import { LEAD_SOURCES, isLeadStage } from './leads';

export const LEAD_INCLUDE = {
  owner: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
  _count: { select: { interactions: true, proposals: true } },
} satisfies Prisma.LeadInclude;

type LeadRow = Prisma.LeadGetPayload<{ include: typeof LEAD_INCLUDE }>;

export function mapLead(l: LeadRow) {
  return {
    id: l.id,
    name: l.name,
    email: l.email || '',
    phone: l.phone || '',
    company: l.company || '',
    interest: l.interest || '',
    message: l.message || '',
    sourcePage: l.sourcePage || '',
    source: l.source,
    stage: l.stage,
    position: l.position,
    estimatedValue: l.estimatedValue === null ? null : toNumber(l.estimatedValue),
    nextAction: l.nextAction || '',
    nextActionAt: l.nextActionAt?.toISOString() || null,
    lostReason: l.lostReason || '',
    owner: l.owner,
    customer: l.customer,
    interactionCount: l._count.interactions,
    proposalCount: l._count.proposals,
    stageChangedAt: l.stageChangedAt.toISOString(),
    createdAt: l.createdAt.toISOString(),
  };
}

const text = (max: number) => z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().trim().max(max));

export const leadSchema = z.object({
  name: text(120).pipe(z.string().min(1, 'Informe o nome do lead')),
  email: text(160).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'E-mail inválido'),
  phone: text(40),
  company: text(120),
  interest: text(120),
  message: text(2000),
  source: z.string().refine((v) => LEAD_SOURCES.some((s) => s.key === v)).catch('MANUAL'),
  stage: z.string().refine(isLeadStage).catch('NOVO'),
  estimatedValue: z.preprocess((v) => (v === '' || v === null || v === undefined ? null : round2(toNumber(v))), z.number().min(0).nullable()),
  ownerId: z.string().nullable().optional(),
  nextAction: text(200),
  nextActionAt: z.string().nullable().optional(),
});
