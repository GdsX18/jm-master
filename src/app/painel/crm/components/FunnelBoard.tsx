'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, Plus, Search } from 'lucide-react';
import { LEAD_SOURCES, LEAD_STAGES, OPEN_STAGES, STALE_DAYS } from '@/lib/leads';
import { api, qs } from '../../lib/api';
import { peekCache, setCache } from '../../lib/cache';
import { formatBRL, formatDateTime } from '../../lib/format';
import { useDebounce } from '../../hooks/useDebounce';
import { useNotify } from '../../components/ui/Notifications';
import LeadDrawer from './LeadDrawer';
import LeadFormModal from './LeadFormModal';
import { STAGE_ACCENT, type Lead, type Owner } from '../shared';

interface BoardResponse {
  leads: Lead[];
  owners: Owner[];
}

const DAY = 86_400_000;

export default function FunnelBoard({
  openLeadId,
  onLeadOpened,
  openNewLead,
  onNewLeadHandled,
}: {
  openLeadId: string | null;
  onLeadOpened: () => void;
  openNewLead: boolean;
  onNewLeadHandled: () => void;
}) {
  const { toast } = useNotify();
  const [search, setSearch] = useState('');
  const [ownerId, setOwnerId] = useState('all');
  const [closedDays, setClosedDays] = useState(30);
  const [data, setData] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [lostPrompt, setLostPrompt] = useState<{ lead: Lead; position: number } | null>(null);
  const debounced = useDebounce(search);

  const url = `/api/crm/leads${qs({ q: debounced, ownerId, closedDays })}`;

  const load = async () => {
    const cached = peekCache<BoardResponse>(url);
    if (cached) setData(cached);
    setLoading(!cached);
    try {
      const res = await api<BoardResponse>(url);
      setData(res);
      setCache(url, res);
    } catch (e) {
      toast.error('Erro ao carregar o funil', e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    if (openLeadId) {
      setSelectedId(openLeadId);
      onLeadOpened();
    }
  }, [openLeadId, onLeadOpened]);

  useEffect(() => {
    if (openNewLead) {
      setShowNew(true);
      onNewLeadHandled();
    }
  }, [openNewLead, onNewLeadHandled]);

  const leads = data?.leads || [];
  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    LEAD_STAGES.forEach((s) => (map[s.key] = []));
    leads.forEach((l) => (map[l.stage] ||= []).push(l));
    Object.values(map).forEach((list) => list.sort((a, b) => a.position - b.position));
    return map;
  }, [leads]);

  const replaceLead = (updated: Lead) =>
    setData((d) => (d ? { ...d, leads: d.leads.map((l) => (l.id === updated.id ? updated : l)) } : d));

  const move = async (lead: Lead, stage: string, position: number, lostReason?: string) => {
    const previous = lead;
    replaceLead({ ...lead, stage, position, stageChangedAt: stage !== lead.stage ? new Date().toISOString() : lead.stageChangedAt });
    try {
      const res = await api<{ lead: Lead }>(`/api/crm/leads/${lead.id}`, {
        method: 'PUT',
        json: { stage, position, ...(lostReason !== undefined ? { lostReason } : {}) },
      });
      replaceLead(res.lead);
      if (stage === 'GANHO' && !res.lead.customer) {
        toast.info('Lead ganho!', 'Abra o lead e clique em "Converter em cliente" para criar o cadastro.');
      }
    } catch (e) {
      replaceLead(previous);
      toast.error('Não foi possível mover o lead', e instanceof Error ? e.message : undefined);
    }
  };

  // Posição fracionária entre os vizinhos: não precisa renumerar a coluna inteira
  const positionAt = (stage: string, beforeId: string | null) => {
    const list = byStage[stage].filter((l) => l.id !== dragId);
    if (!beforeId) return list.length ? list[list.length - 1].position + 1 : 0;
    const index = list.findIndex((l) => l.id === beforeId);
    const after = list[index];
    const before = list[index - 1];
    if (!after) return 0;
    return before ? (before.position + after.position) / 2 : after.position - 1;
  };

  const handleDrop = (stage: string, beforeId: string | null) => {
    const lead = leads.find((l) => l.id === dragId);
    setDragId(null);
    setDropStage(null);
    if (!lead) return;
    const position = positionAt(stage, beforeId);
    if (stage === lead.stage && Math.abs(position - lead.position) < 1e-9) return;
    if (stage === 'PERDIDO' && lead.stage !== 'PERDIDO') {
      setLostPrompt({ lead, position });
      return;
    }
    move(lead, stage, position);
  };

  const totalOpen = leads.filter((l) => OPEN_STAGES.includes(l.stage as never));
  const openValue = totalOpen.reduce((s, l) => s + (l.estimatedValue || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-placeholder" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, empresa, e-mail, telefone..." className="jm-input pl-9" />
        </div>
        <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="jm-input w-auto">
          <option value="all">Todos os responsáveis</option>
          <option value="none">Sem responsável</option>
          {data?.owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select value={closedDays} onChange={(e) => setClosedDays(Number(e.target.value))} className="jm-input w-auto" title="Ganhos e perdidos exibidos">
          <option value={7}>Fechados: 7 dias</option>
          <option value={30}>Fechados: 30 dias</option>
          <option value={90}>Fechados: 90 dias</option>
          <option value={365}>Fechados: 1 ano</option>
        </select>
        <div className="flex items-center gap-3 lg:ml-auto">
          <span className="text-xs text-jm-muted">
            {totalOpen.length} em negociação · <strong className="tabular-nums text-jm-fg">{formatBRL(openValue)}</strong>
          </span>
          <button onClick={() => setShowNew(true)} className="jm-btn jm-btn-accent">
            <Plus className="h-4 w-4" /> Novo lead
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="jm-card jm-empty">Carregando funil...</div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="grid min-w-[1080px] grid-cols-6 gap-3">
            {LEAD_STAGES.map((stage) => {
              const list = byStage[stage.key] || [];
              const value = list.reduce((s, l) => s + (l.estimatedValue || 0), 0);
              return (
                <section
                  key={stage.key}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropStage(stage.key);
                  }}
                  onDragLeave={() => setDropStage((s) => (s === stage.key ? null : s))}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(stage.key, null);
                  }}
                  className={`flex min-h-[420px] flex-col rounded-[6px] border border-t-[3px] border-jm-border bg-jm-subtle ${STAGE_ACCENT[stage.key]} ${
                    dropStage === stage.key ? 'ring-2 ring-jm-ring' : ''
                  }`}
                >
                  <header className="px-3 pb-2 pt-2.5" title={stage.hint}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-[13px] font-semibold text-jm-fg">{stage.label}</h3>
                      <span className="jm-badge jm-badge-neutral tabular-nums">{list.length}</span>
                    </div>
                    {value > 0 && <p className="text-[11px] tabular-nums text-jm-muted">{formatBRL(value)}</p>}
                  </header>
                  <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                    {list.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        dragging={dragId === lead.id}
                        onOpen={() => setSelectedId(lead.id)}
                        onDragStart={() => setDragId(lead.id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setDropStage(null);
                        }}
                        onDropBefore={() => handleDrop(stage.key, lead.id)}
                      />
                    ))}
                    {list.length === 0 && (
                      <p className="mt-6 text-center text-[11px] text-jm-placeholder">Arraste um lead para cá</p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {selectedId && (
        <LeadDrawer
          leadId={selectedId}
          owners={data?.owners || []}
          onClose={() => setSelectedId(null)}
          onChanged={(lead) => (lead ? replaceLead(lead) : load())}
          onDeleted={() => {
            setSelectedId(null);
            load();
          }}
        />
      )}

      {showNew && (
        <LeadFormModal
          owners={data?.owners || []}
          onClose={() => setShowNew(false)}
          onSaved={(lead) => {
            setShowNew(false);
            setData((d) => (d ? { ...d, leads: [lead, ...d.leads] } : d));
            setSelectedId(lead.id);
          }}
        />
      )}

      {lostPrompt && (
        <LostReasonModal
          lead={lostPrompt.lead}
          onCancel={() => setLostPrompt(null)}
          onConfirm={(reason) => {
            move(lostPrompt.lead, 'PERDIDO', lostPrompt.position, reason);
            setLostPrompt(null);
          }}
        />
      )}
    </div>
  );
}

function LeadCard({
  lead,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onDropBefore,
}: {
  lead: Lead;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropBefore: () => void;
}) {
  const daysInStage = Math.floor((Date.now() - new Date(lead.stageChangedAt).getTime()) / DAY);
  const stale = OPEN_STAGES.includes(lead.stage as never) && daysInStage >= STALE_DAYS;
  const late = lead.nextActionAt && new Date(lead.nextActionAt).getTime() < Date.now();
  const sourceLabel = LEAD_SOURCES.find((s) => s.key === lead.source)?.label || lead.source;

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', lead.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDropBefore();
      }}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      tabIndex={0}
      className={`cursor-grab rounded-[4px] border border-jm-border bg-jm-surface p-2.5 text-left shadow-sm transition hover:border-jm-border-strong active:cursor-grabbing ${
        dragging ? 'opacity-40' : ''
      }`}
    >
      <p className="truncate text-[13px] font-semibold text-jm-fg">{lead.name}</p>
      {lead.company && <p className="truncate text-xs text-jm-fg2">{lead.company}</p>}
      {lead.interest && <p className="mt-1 line-clamp-2 text-[11px] text-jm-muted">{lead.interest}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="jm-badge jm-badge-neutral">{sourceLabel}</span>
        {lead.estimatedValue ? <span className="jm-badge jm-badge-primary tabular-nums">{formatBRL(lead.estimatedValue)}</span> : null}
        {lead.customer && <span className="jm-badge jm-badge-success">Cliente</span>}
      </div>

      {(lead.nextActionAt || stale) && (
        <div className="mt-2 space-y-0.5 border-t border-jm-border pt-1.5 text-[11px]">
          {lead.nextActionAt && (
            <p className={`flex items-center gap-1 ${late ? 'font-semibold text-jm-danger-fg' : 'text-jm-muted'}`}>
              <CalendarClock className="h-3 w-3" /> {formatDateTime(lead.nextActionAt)}
            </p>
          )}
          {stale && (
            <p className="flex items-center gap-1 text-jm-warning-fg">
              <AlertTriangle className="h-3 w-3" /> {daysInStage} dias neste estágio
            </p>
          )}
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-jm-placeholder">
        <span>{lead.owner?.name?.split(' ')[0] || 'Sem responsável'}</span>
        <span>{lead.interactionCount} interação(ões)</span>
      </div>
    </article>
  );
}

function LostReasonModal({ lead, onCancel, onConfirm }: { lead: Lead; onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const presets = ['Preço', 'Escolheu concorrente', 'Sem retorno', 'Sem orçamento agora', 'Fora do perfil'];
  return (
    <div className="jm-overlay" onClick={onCancel}>
      <div className="jm-modal sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="jm-modal-header">
          <h3 className="jm-modal-title">Marcar &ldquo;{lead.name}&rdquo; como perdido</h3>
        </div>
        <div className="jm-modal-body space-y-3">
          <p className="text-sm text-jm-muted">O motivo ajuda a entender onde o funil está vazando.</p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button key={p} type="button" onClick={() => setReason(p)} className={`jm-btn jm-btn-sm ${reason === p ? 'jm-btn-primary' : 'jm-btn-secondary'}`}>
                {p}
              </button>
            ))}
          </div>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ou descreva o motivo..." className="jm-input" autoFocus />
        </div>
        <div className="jm-modal-footer">
          <button onClick={onCancel} className="jm-btn jm-btn-secondary">
            Cancelar
          </button>
          <button onClick={() => onConfirm(reason)} className="jm-btn jm-btn-danger-solid">
            Marcar como perdido
          </button>
        </div>
      </div>
    </div>
  );
}
