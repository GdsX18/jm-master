import { Award, Briefcase, Clock, Globe, Headphones, MessageSquare, Users, type LucideIcon } from 'lucide-react';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  interest: string;
  message: string;
  sourcePage: string;
  source: string;
  stage: string;
  position: number;
  estimatedValue: number | null;
  nextAction: string;
  nextActionAt: string | null;
  lostReason: string;
  owner: { id: string; name: string } | null;
  customer: { id: string; name: string } | null;
  interactionCount: number;
  proposalCount: number;
  stageChangedAt: string;
  createdAt: string;
}

export interface Owner {
  id: string;
  name: string;
}

export interface CrmItem {
  id: string;
  operator: string;
  customerId: string | null;
  customerName: string | null;
  customer?: { id: string; name: string } | null;
  lead?: { id: string; name: string; stage: string } | null;
  leadId?: string | null;
  title: string;
  description: string;
  date: string;
  type: string;
  createdAt: string;
}

export const TYPE_CONFIG: Record<string, { label: string; badge: string; icon: LucideIcon }> = {
  COMERCIAL: { label: 'Comercial', badge: 'jm-badge-accent', icon: Briefcase },
  SUPORTE: { label: 'Suporte', badge: 'jm-badge-primary', icon: Headphones },
  REUNIAO: { label: 'Reunião', badge: 'jm-badge-success', icon: Users },
  NPS: { label: 'NPS & feedback', badge: 'jm-badge-neutral', icon: Award },
  COBRANCA: { label: 'Cobrança', badge: 'jm-badge-warning', icon: Clock },
  LEAD: { label: 'Lead', badge: 'jm-badge-primary', icon: Globe },
  OUTROS: { label: 'Outros', badge: 'jm-badge-neutral', icon: MessageSquare },
};

// Cor de destaque de cada coluna do funil (borda superior)
export const STAGE_ACCENT: Record<string, string> = {
  NOVO: 'border-t-jm-accent-line',
  CONTATO: 'border-t-jm-primary',
  QUALIFICADO: 'border-t-jm-primary',
  PROPOSTA: 'border-t-jm-warning-fg',
  GANHO: 'border-t-jm-success-fg',
  PERDIDO: 'border-t-jm-danger-fg',
};
