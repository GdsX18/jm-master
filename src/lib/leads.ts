// Funil de vendas — estágios compartilhados entre servidor e painel.

export const LEAD_STAGES = [
  { key: 'NOVO', label: 'Novo', hint: 'Chegou e ainda não foi atendido' },
  { key: 'CONTATO', label: 'Em contato', hint: 'Primeiro contato feito' },
  { key: 'QUALIFICADO', label: 'Qualificado', hint: 'Tem perfil e interesse real' },
  { key: 'PROPOSTA', label: 'Proposta', hint: 'Proposta enviada' },
  { key: 'GANHO', label: 'Ganho', hint: 'Virou cliente' },
  { key: 'PERDIDO', label: 'Perdido', hint: 'Não avançou' },
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number]['key'];

export const LEAD_SOURCES = [
  { key: 'SITE', label: 'Site' },
  { key: 'MANUAL', label: 'Cadastro manual' },
  { key: 'INDICACAO', label: 'Indicação' },
  { key: 'WHATSAPP', label: 'WhatsApp' },
  { key: 'EVENTO', label: 'Evento' },
  { key: 'OUTRO', label: 'Outro' },
] as const;

export function isLeadStage(value: unknown): value is LeadStage {
  return typeof value === 'string' && LEAD_STAGES.some((s) => s.key === value);
}

export function stageLabel(stage: string) {
  return LEAD_STAGES.find((s) => s.key === stage)?.label || stage;
}

// Lead "esfriando": sem mudança de estágio há mais de N dias nos estágios abertos
export const STALE_DAYS = 3;
export const OPEN_STAGES: LeadStage[] = ['NOVO', 'CONTATO', 'QUALIFICADO', 'PROPOSTA'];
