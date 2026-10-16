'use client';

import { useEffect, useState } from 'react';
import { History, Pencil, Receipt, FileText, UserPlus } from 'lucide-react';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import type { TimelineEvent } from '../types';

const KIND = {
  crm: { label: 'Atendimento', icon: History, color: 'bg-jm-primary' },
  audit: { label: 'Alteração', icon: Pencil, color: 'bg-jm-muted' },
  invoice: { label: 'Financeiro', icon: Receipt, color: 'bg-jm-success-fg' },
  proposal: { label: 'Proposta', icon: FileText, color: 'bg-jm-accent-line' },
  lead: { label: 'Funil', icon: UserPlus, color: 'bg-jm-warning-fg' },
} as const;

// Linha do tempo unificada: atendimentos, alterações no cadastro, faturas, propostas e lead de origem
export default function CustomerTimeline({ customerId }: { customerId: string }) {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [filter, setFilter] = useState<'all' | TimelineEvent['kind']>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ events: TimelineEvent[] }>(`/api/customers/${customerId}/timeline`)
      .then((d) => setEvents(d.events))
      .catch((e) => setError(e.message));
  }, [customerId]);

  if (error) return <div className="jm-alert jm-alert-danger">{error}</div>;
  if (!events) return <div className="jm-card jm-empty">Carregando histórico...</div>;

  const visible = filter === 'all' ? events : events.filter((e) => e.kind === filter);

  return (
    <div className="jm-card space-y-4 p-4 sm:p-5 md:p-6">
      <div className="jm-segmented flex-wrap">
        <button onClick={() => setFilter('all')} className={`jm-segment ${filter === 'all' ? 'jm-segment-active' : ''}`}>
          Tudo ({events.length})
        </button>
        {(Object.keys(KIND) as TimelineEvent['kind'][]).map((k) => {
          const count = events.filter((e) => e.kind === k).length;
          if (!count) return null;
          return (
            <button key={k} onClick={() => setFilter(k)} className={`jm-segment ${filter === k ? 'jm-segment-active' : ''}`}>
              {KIND[k].label} ({count})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="jm-empty">Nenhum evento registrado ainda.</div>
      ) : (
        <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-jm-border">
          {visible.map((e) => {
            const cfg = KIND[e.kind];
            const Icon = cfg.icon;
            return (
              <li key={e.id} className="relative pl-8">
                <span className={`absolute left-0 top-2 grid h-6 w-6 place-items-center rounded-full text-white ${cfg.color}`}>
                  <Icon className="h-3 w-3" strokeWidth={2} />
                </span>
                <div className="rounded-[4px] border border-jm-border bg-jm-subtle px-3.5 py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-jm-fg">{e.title}</p>
                    <span className="text-[11px] tabular-nums text-jm-muted">{formatDateTime(e.at)}</span>
                  </div>
                  {e.description && <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-jm-fg2">{e.description}</p>}
                  <p className="mt-1.5 text-[11px] text-jm-muted">
                    {cfg.label} · {e.actor}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
