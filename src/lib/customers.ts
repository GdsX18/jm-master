import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { supabaseAdmin } from './supabase';

export const CUSTOMER_INCLUDE = {
  groups: { select: { id: true, name: true, isActive: true } },
  documents: { orderBy: { createdAt: 'desc' as const } },
  noteEntries: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.CustomerInclude;

type CustomerWithRelations = Prisma.CustomerGetPayload<{ include: typeof CUSTOMER_INCLUDE }>;

// "type" (e não interface) para ser aceito como JSON pelo Prisma
export type ContactInput = {
  name: string;
  phone: string;
  email: string;
  role: string;
};

export function onlyDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

// Formato que o painel de clientes espera
export function mapCustomer(c: CustomerWithRelations) {
  const data = (c.data as Record<string, any>) || {};
  return {
    id: c.id,
    name: c.name,
    document: data.document || '',
    street: data.street || '',
    number: data.number || '',
    city: data.city || '',
    state: data.state || '',
    zipCode: data.zipCode || '',
    code: data.code || '',
    type: data.type === 'PRE_PAGO' ? 'PRE_PAGO' : 'POS_PAGO',
    isActive: c.status === 'ATIVO',
    groupIds: c.groups.map((g) => g.id),
    groups: c.groups,
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
    createdAt: c.createdAt.toISOString(),
  };
}

// Valida e normaliza o corpo de criação/edição de cliente
export function parseCustomerBody(body: any) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return { error: 'Razão social / Nome é obrigatório' as const };

  const contacts: ContactInput[] = Array.isArray(body.contacts)
    ? body.contacts
        .map((c: any) => ({
          name: String(c?.name ?? '').trim(),
          phone: String(c?.phone ?? '').trim(),
          email: String(c?.email ?? '').trim(),
          role: String(c?.role ?? '').trim(),
        }))
        .filter((c: ContactInput) => c.name || c.phone || c.email)
    : [];

  const groupIds: string[] = Array.isArray(body.groupIds)
    ? body.groupIds.filter((id: unknown): id is string => typeof id === 'string' && !!id)
    : [];

  const document = typeof body.document === 'string' ? body.document.trim() : '';

  return {
    name,
    isActive: body.isActive !== false,
    groupIds,
    contacts,
    documentDigits: onlyDigits(document),
    data: {
      document,
      documentDigits: onlyDigits(document),
      street: String(body.street ?? '').trim(),
      number: String(body.number ?? '').trim(),
      city: String(body.city ?? '').trim(),
      state: String(body.state ?? '').trim(),
      zipCode: String(body.zipCode ?? '').trim(),
      code: String(body.code ?? '').trim(),
      type: body.type === 'PRE_PAGO' ? 'PRE_PAGO' : 'POS_PAGO',
      contacts,
    } satisfies Prisma.InputJsonObject,
  };
}

// CPF/CNPJ duplicado em outro cliente
export async function findDocumentOwner(documentDigits: string, excludeId?: string) {
  if (!documentDigits) return null;
  return prisma.customer.findFirst({
    where: {
      data: { path: ['documentDigits'], equals: documentDigits },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true, name: true },
  });
}

// ─── Arquivos de clientes (bucket privado no Supabase Storage) ───────────────

export const CUSTOMER_DOCS_BUCKET = 'customer-documents';
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

let bucketReady = false;
export async function ensureCustomerDocsBucket() {
  if (bucketReady) return;
  const { data } = await supabaseAdmin.storage.getBucket(CUSTOMER_DOCS_BUCKET);
  if (!data) {
    const { error } = await supabaseAdmin.storage.createBucket(CUSTOMER_DOCS_BUCKET, {
      public: false,
      fileSizeLimit: MAX_DOCUMENT_SIZE,
    });
    if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
  }
  bucketReady = true;
}
