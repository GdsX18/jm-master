export interface ProposalItem {
  id?: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  recurring: boolean;
}

export interface Proposal {
  id: string;
  number: string;
  title: string;
  status: 'RASCUNHO' | 'ENVIADA' | 'ACEITA' | 'RECUSADA';
  leadId: string | null;
  customerId: string | null;
  lead: { id: string; name: string; company: string | null; email: string | null; phone: string | null; stage: string; customerId: string | null } | null;
  customer: { id: string; name: string; document: string | null; email: string | null; phone: string | null; city: string | null; state: string | null } | null;
  validUntil: string | null;
  notes: string;
  discount: number;
  dueDay: number;
  oneTimeTotal: number;
  recurringTotal: number;
  createdByName: string;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ProposalItem[];
  invoices: { id: string; invoiceNumber: string | null; amount: number; status: string; dueDate: string | null }[];
}

export const STATUS_INFO: Record<string, { label: string; badge: string }> = {
  RASCUNHO: { label: 'Rascunho', badge: 'jm-badge-neutral' },
  ENVIADA: { label: 'Enviada', badge: 'jm-badge-primary' },
  ACEITA: { label: 'Aceita', badge: 'jm-badge-success' },
  RECUSADA: { label: 'Recusada', badge: 'jm-badge-danger' },
};

export function proposalClientName(p: Pick<Proposal, 'customer' | 'lead'>) {
  return p.customer?.name || p.lead?.company || p.lead?.name || '—';
}
