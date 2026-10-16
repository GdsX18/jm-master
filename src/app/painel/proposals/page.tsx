'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api, qs } from '../lib/api';
import { formatBRL, formatDate } from '../lib/format';
import { useDebounce } from '../hooks/useDebounce';
import { clearQueryParams, useQueryParams } from '../hooks/useQueryParams';
import { Pagination } from '../components/ui/Pagination';
import { useNotify } from '../components/ui/Notifications';
import ProposalEditor from './components/ProposalEditor';
import { STATUS_INFO, proposalClientName, type Proposal } from './types';

interface ListResponse {
  proposals: Proposal[];
  total: number;
  summary: Record<string, { count: number; recurring: number; oneTime: number }>;
}

type View = { mode: 'list' } | { mode: 'edit'; id: string | null; leadId?: string | null; customerId?: string | null };

const PAGE_SIZE = 25;

export default function ProposalsPage() {
  const params = useQueryParams();
  const { toast } = useNotify();
  const [view, setView] = useState<View>({ mode: 'list' });
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const debounced = useDebounce(search);

  // Atalhos: ?new=1&lead=<id>&customer=<id>, ?open=<id>
  useEffect(() => {
    if (!params) return;
    if (params.get('open')) setView({ mode: 'edit', id: params.get('open') });
    else if (params.get('new') === '1') setView({ mode: 'edit', id: null, leadId: params.get('lead'), customerId: params.get('customer') });
    if (params.get('open') || params.get('new')) clearQueryParams('open', 'new', 'lead', 'customer');
  }, [params]);

  const load = async () => {
    setLoading(true);
    try {
      setData(await api<ListResponse>(`/api/proposals${qs({ status, q: debounced, page, pageSize: PAGE_SIZE })}`));
    } catch (e) {
      toast.error('Erro ao carregar propostas', e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view.mode === 'list') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debounced, page, view.mode]);

  useEffect(() => setPage(1), [status, debounced]);

  if (view.mode === 'edit') {
    return (
      <div className="jm-page">
        <ProposalEditor
          proposalId={view.id}
          initialLeadId={view.leadId || null}
          initialCustomerId={view.customerId || null}
          onBack={() => setView({ mode: 'list' })}
          onOpen={(id) => setView({ mode: 'edit', id })}
        />
      </div>
    );
  }

  const s = data?.summary || {};
  const sentCount = s.ENVIADA?.count || 0;
  const accepted = s.ACEITA?.count || 0;
  const rejected = s.RECUSADA?.count || 0;
  const winRate = accepted + rejected > 0 ? Math.round((accepted / (accepted + rejected)) * 100) : null;

  return (
    <div className="jm-page">
      <header className="jm-page-header">
        <div>
          <h1 className="jm-page-title">Propostas comerciais</h1>
          <p className="jm-page-desc">Monte com o catálogo e a tabela do grupo, envie em PDF e, no aceite, a cobrança é ativada automaticamente.</p>
        </div>
        <button onClick={() => setView({ mode: 'edit', id: null })} className="jm-btn jm-btn-accent self-start sm:self-auto">
          + Nova proposta
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Rascunhos" value={String(s.RASCUNHO?.count || 0)} />
        <Stat label="Aguardando resposta" value={String(sentCount)} sub={`${formatBRL(s.ENVIADA?.recurring || 0)}/mês em jogo`} tone="text-jm-primary-text" />
        <Stat label="Aceitas" value={String(accepted)} sub={`${formatBRL(s.ACEITA?.recurring || 0)}/mês conquistados`} tone="text-jm-success-fg" />
        <Stat label="Taxa de aceite" value={winRate === null ? '—' : `${winRate}%`} sub={`${rejected} recusada(s)`} />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="jm-segmented flex-wrap">
          {['all', 'RASCUNHO', 'ENVIADA', 'ACEITA', 'RECUSADA'].map((k) => (
            <button key={k} onClick={() => setStatus(k)} className={`jm-segment ${status === k ? 'jm-segment-active' : ''}`}>
              {k === 'all' ? 'Todas' : STATUS_INFO[k].label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-placeholder" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Número, título, cliente ou lead..." className="jm-input pl-9" />
        </div>
      </div>

      <div className="jm-table-wrap">
        {loading && !data ? (
          <div className="jm-empty">Carregando...</div>
        ) : !data || data.proposals.length === 0 ? (
          <div className="jm-empty">Nenhuma proposta encontrada.</div>
        ) : (
          <>
            <table className={`jm-table min-w-[820px] ${loading ? 'opacity-60' : ''}`}>
              <thead>
                <tr>
                  <th className="jm-th">Número</th>
                  <th className="jm-th">Título</th>
                  <th className="jm-th">Cliente / lead</th>
                  <th className="jm-th text-right">Mensal</th>
                  <th className="jm-th text-right">Único</th>
                  <th className="jm-th">Validade</th>
                  <th className="jm-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.proposals.map((p) => {
                  const expired = p.status === 'ENVIADA' && p.validUntil && p.validUntil < new Date().toISOString().slice(0, 10);
                  return (
                    <tr key={p.id} className="jm-tr cursor-pointer" onClick={() => setView({ mode: 'edit', id: p.id })}>
                      <td className="jm-td font-mono text-xs text-jm-fg2">{p.number}</td>
                      <td className="jm-td font-medium text-jm-fg">{p.title}</td>
                      <td className="jm-td text-jm-fg2">
                        {proposalClientName(p)}
                        {!p.customer && p.lead && <span className="jm-badge jm-badge-neutral ml-1.5">Lead</span>}
                      </td>
                      <td className="jm-td text-right tabular-nums">{formatBRL(p.recurringTotal)}</td>
                      <td className="jm-td text-right tabular-nums">{p.oneTimeTotal ? formatBRL(p.oneTimeTotal) : '—'}</td>
                      <td className={`jm-td tabular-nums ${expired ? 'font-semibold text-jm-danger-fg' : ''}`}>{p.validUntil ? formatDate(p.validUntil) : '—'}</td>
                      <td className="jm-td">
                        <span className={`jm-badge ${STATUS_INFO[p.status].badge}`}>{STATUS_INFO[p.status].label}</span>
                        {expired && <span className="jm-badge jm-badge-warning ml-1">Vencida</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} label="propostas" />
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone = 'text-jm-fg' }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="jm-card px-4 py-3.5">
      <p className="jm-stat-label">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-jm-muted">{sub}</p>}
    </div>
  );
}
