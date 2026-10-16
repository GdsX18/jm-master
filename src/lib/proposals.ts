import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from './prisma';
import { brazilToday } from './dates';
import { round2, toNumber } from './money';
import { isUniqueConflict, nextSequence } from './billing';

export const PROPOSAL_STATUSES = [
  { key: 'RASCUNHO', label: 'Rascunho' },
  { key: 'ENVIADA', label: 'Enviada' },
  { key: 'ACEITA', label: 'Aceita' },
  { key: 'RECUSADA', label: 'Recusada' },
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]['key'];

export function isProposalStatus(value: unknown): value is ProposalStatus {
  return typeof value === 'string' && PROPOSAL_STATUSES.some((s) => s.key === value);
}

const text = (max: number) => z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().trim().max(max));
const money = z.preprocess((v) => round2(toNumber(v)), z.number().min(0, 'Valores não podem ser negativos'));

export const proposalItemSchema = z.object({
  productId: z.string().nullable().optional(),
  description: text(300).pipe(z.string().min(1, 'Descreva todos os itens da proposta')),
  quantity: z.preprocess((v) => Math.round(toNumber(v)), z.number().int().min(1, 'Quantidade mínima é 1').max(100000)),
  unitPrice: money,
  recurring: z.boolean().catch(true),
});

export const proposalSchema = z
  .object({
    title: text(200).pipe(z.string().min(1, 'Informe o título da proposta')),
    leadId: z.string().nullable().optional(),
    customerId: z.string().nullable().optional(),
    validUntil: z.string().nullable().optional(),
    notes: text(5000),
    discount: money.catch(0),
    dueDay: z.preprocess((v) => Math.round(toNumber(v)), z.number().int().min(1).max(28)).catch(10),
    items: z.array(proposalItemSchema).min(1, 'Adicione pelo menos um item'),
  })
  .refine((v) => !!(v.leadId || v.customerId), { message: 'Vincule a proposta a um lead ou cliente', path: ['leadId'] });

export type ProposalInput = z.infer<typeof proposalSchema>;

// Totais: itens recorrentes formam a mensalidade (com desconto mensal); os demais são cobrança única
export function computeTotals(items: { quantity: number; unitPrice: number; recurring: boolean }[], discount: number) {
  const recurringGross = round2(items.filter((i) => i.recurring).reduce((s, i) => s + i.quantity * i.unitPrice, 0));
  const oneTimeTotal = round2(items.filter((i) => !i.recurring).reduce((s, i) => s + i.quantity * i.unitPrice, 0));
  const appliedDiscount = Math.min(discount, recurringGross);
  return { recurringTotal: round2(recurringGross - appliedDiscount), oneTimeTotal, discount: round2(appliedDiscount), recurringGross };
}

export function parseValidUntil(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function nextProposalNumber() {
  return nextSequence(`PROP-${brazilToday().slice(0, 4)}-`, 'proposal');
}

// Cria com número sequencial, tentando de novo em caso de colisão
export async function createProposalWithNumber(data: Omit<Prisma.ProposalUncheckedCreateInput, 'number'>) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.proposal.create({ data: { ...data, number: await nextProposalNumber() } });
    } catch (error) {
      if (!isUniqueConflict(error) || attempt >= 4) throw error;
    }
  }
}

export const PROPOSAL_INCLUDE = {
  items: { orderBy: { position: 'asc' as const } },
  lead: { select: { id: true, name: true, company: true, email: true, phone: true, stage: true, customerId: true } },
  customer: { select: { id: true, name: true, document: true, email: true, phone: true, city: true, state: true } },
  invoices: { select: { id: true, invoiceNumber: true, amount: true, status: true, dueDate: true } },
} satisfies Prisma.ProposalInclude;

type ProposalRow = Prisma.ProposalGetPayload<{ include: typeof PROPOSAL_INCLUDE }>;

export function mapProposal(p: ProposalRow) {
  return {
    id: p.id,
    number: p.number,
    title: p.title,
    status: p.status,
    leadId: p.leadId,
    customerId: p.customerId,
    lead: p.lead,
    customer: p.customer,
    validUntil: p.validUntil?.toISOString().slice(0, 10) || null,
    notes: p.notes || '',
    discount: toNumber(p.discount),
    dueDay: p.dueDay,
    oneTimeTotal: toNumber(p.oneTimeTotal),
    recurringTotal: toNumber(p.recurringTotal),
    createdByName: p.createdByName || '',
    sentAt: p.sentAt?.toISOString() || null,
    acceptedAt: p.acceptedAt?.toISOString() || null,
    rejectedAt: p.rejectedAt?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    items: p.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      description: i.description,
      quantity: i.quantity,
      unitPrice: toNumber(i.unitPrice),
      recurring: i.recurring,
    })),
    invoices: p.invoices.map((f) => ({ ...f, amount: toNumber(f.amount) })),
  };
}
