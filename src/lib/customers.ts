import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from './prisma';
import { ensureBucket } from './storage';
import { documentError, onlyDigits } from './validators';

export { onlyDigits };

// Lista: só o necessário para a tabela (documentos e observações vêm no detalhe)
export const CUSTOMER_LIST_SELECT = {
  id: true,
  name: true,
  status: true,
  document: true,
  type: true,
  code: true,
  city: true,
  state: true,
  phone: true,
  email: true,
  createdAt: true,
  groups: { select: { id: true, name: true, isActive: true } },
} satisfies Prisma.CustomerSelect;

export const CUSTOMER_DETAIL_INCLUDE = {
  groups: { select: { id: true, name: true, isActive: true } },
  documents: { orderBy: { createdAt: 'desc' as const } },
  noteEntries: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.CustomerInclude;

type CustomerListRow = Prisma.CustomerGetPayload<{ select: typeof CUSTOMER_LIST_SELECT }>;
type CustomerDetailRow = Prisma.CustomerGetPayload<{ include: typeof CUSTOMER_DETAIL_INCLUDE }>;

export type ContactInput = {
  name: string;
  phone: string;
  email: string;
  role: string;
};

export function mapCustomerListItem(c: CustomerListRow) {
  return {
    id: c.id,
    name: c.name,
    document: c.document || '',
    type: c.type === 'PRE_PAGO' ? 'PRE_PAGO' : 'POS_PAGO',
    code: c.code || '',
    city: c.city || '',
    state: c.state || '',
    phone: c.phone || '',
    email: c.email || '',
    isActive: c.status === 'ATIVO',
    groupIds: c.groups.map((g) => g.id),
    groups: c.groups,
    createdAt: c.createdAt.toISOString(),
  };
}

// Formato completo que o formulário do painel espera
export function mapCustomerDetail(c: CustomerDetailRow) {
  const data = (c.data as Record<string, any>) || {};
  return {
    ...mapCustomerListItem(c),
    street: c.street || '',
    number: c.number || '',
    zipCode: c.zipCode || '',
    contacts: Array.isArray(data.contacts) ? data.contacts : [],
    documents: c.documents.map((d) => ({
      id: d.id,
      name: d.name,
      originalName: d.originalName,
      mimeType: d.mimeType,
      size: d.size,
      userEmail: d.userEmail || '',
      createdAt: d.createdAt.toISOString(),
    })),
    notes: c.noteEntries.map((n) => ({
      id: n.id,
      content: n.content,
      userEmail: n.userEmail || '',
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

const text = (max: number) => z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().trim().max(max));

const contactSchema = z.object({
  name: text(120),
  phone: text(40),
  email: text(160),
  role: text(80),
});

export const customerInputSchema = z
  .object({
    name: text(200).pipe(z.string().min(1, 'Razão social / Nome é obrigatório')),
    document: text(30),
    code: text(40),
    type: z.enum(['PRE_PAGO', 'POS_PAGO']).catch('POS_PAGO'),
    isActive: z.boolean().catch(true),
    groupIds: z.array(z.string().min(1)).catch([]),
    street: text(200),
    number: text(20),
    city: text(120),
    state: text(2),
    zipCode: text(10),
    contacts: z.array(contactSchema).catch([]),
  })
  .superRefine((value, ctx) => {
    const error = documentError(value.document);
    if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ['document'] });
    for (const contact of value.contacts) {
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `E-mail inválido no contato "${contact.name || contact.email}"`, path: ['contacts'] });
      }
    }
  });

// Valida e normaliza o corpo de criação/edição de cliente
export function parseCustomerBody(body: unknown) {
  const parsed = customerInputSchema.safeParse(body ?? {});
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Dados inválidos' };
  const input = parsed.data;
  const contacts = input.contacts.filter((c) => c.name || c.phone || c.email);
  const documentDigits = onlyDigits(input.document);

  return {
    name: input.name,
    isActive: input.isActive,
    groupIds: Array.from(new Set(input.groupIds)),
    contacts,
    columns: {
      name: input.name,
      company: input.name,
      email: contacts[0]?.email || null,
      phone: contacts[0]?.phone || null,
      status: input.isActive ? 'ATIVO' : 'INATIVO',
      document: input.document || null,
      documentDigits: documentDigits || null,
      type: input.type,
      code: input.code || null,
      street: input.street || null,
      number: input.number || null,
      city: input.city || null,
      state: input.state.toUpperCase() || null,
      zipCode: input.zipCode || null,
    },
  };
}

// CPF/CNPJ duplicado em outro cliente (a coluna documentDigits também é UNIQUE no banco)
export async function findDocumentOwner(documentDigits: string | null, excludeId?: string) {
  if (!documentDigits) return null;
  return prisma.customer.findFirst({
    where: { documentDigits, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true, name: true },
  });
}

// ─── Arquivos de clientes (bucket privado, ver src/lib/storage.ts) ───────────

export const CUSTOMER_DOCS_BUCKET = 'customer-documents';
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

export async function ensureCustomerDocsBucket() {
  await ensureBucket(CUSTOMER_DOCS_BUCKET, { public: false, fileSizeLimit: MAX_DOCUMENT_SIZE });
}
