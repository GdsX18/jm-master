'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, qs } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useDebounce } from '../../hooks/useDebounce';
import { useNotify } from '../../components/ui/Notifications';
import { Pagination } from '../../components/ui/Pagination';
import { TYPE_CONFIG, type CrmItem } from '../shared';

interface TimelineResponse {
  interactions: CrmItem[];
  total: number;
  counts: Record<string, number>;
}

const PAGE_SIZE = 30;

export default function TimelineTab({ onOpenLead }: { onOpenLead: (id: string) => void }) {
  const { toast, confirm } = useNotify();
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<CrmItem> | null>(null);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const debounced = useDebounce(search);

  const load = async () => {
    setLoading(true);
    try {
      setData(await api<TimelineResponse>(`/api/crm${qs({ type, q: debounced, page, pageSize: PAGE_SIZE })}`));
    } catch (e) {
      toast.error('Erro ao carregar', e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, debounced, page]);

  useEffect(() => setPage(1), [type, debounced]);

  const openEditor = (item: Partial<CrmItem> | null) => {
    setEditing(item || { type: 'COMERCIAL', title: '', description: '', customerId: '', customerName: '' });
    if (customers.length === 0) {
      api<{ id: string; name: string }[]>('/api/customers?minimal=1').then(setCustomers).catch(() => {});
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api('/api/crm', { method: editing.id ? 'PUT' : 'POST', json: editing });
      toast.success(editing.id ? 'Registro atualizado' : 'Atendimento registrado');
      setEditing(null);
      load();
    } catch (err) {
      toast.error('Erro ao salvar', err instanceof Error ? err.message : undefined);
    }
  };

  const remove = async (item: CrmItem) => {
    const ok = await confirm({
      title: 'Excluir registro',
      message: `Excluir "${item.title}"? O conteúdo fica guardado na auditoria.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/crm${qs({ id: item.id })}`, { method: 'DELETE' });
      toast.success('Registro excluído');
      load();
    } catch (e) {
      toast.error('Erro ao excluir', e instanceof Error ? e.message : undefined);
    }
  };

  const counts = data?.counts || {};
  const totalAll = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="jm-segmented flex-wrap">
          <button onClick={() => setType('all')} className={`jm-segment ${type === 'all' ? 'jm-segment-active' : ''}`}>
            Todos ({totalAll})
          </button>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => setType(key)} className={`jm-segment ${type === key ? 'jm-segment-active' : ''}`}>
              {cfg.label} ({counts[key] || 0})
            </button>
          ))}
        </div>
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-placeholder" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="jm-input pl-9" />
        </div>
        <button onClick={() => openEditor(null)} className="jm-btn jm-btn-accent lg:ml-auto">
          <Plus className="h-4 w-4" /> Registrar atendimento
        </button>
      </div>

      <div className="jm-card overflow-hidden">
        {loading && !data ? (
          <div className="jm-empty">Carregando...</div>
        ) : !data || data.interactions.length === 0 ? (
          <div className="jm-empty">Nenhum registro encontrado.</div>
        ) : (
          <>
            <ol className={`divide-y divide-jm-border ${loading ? 'opacity-60' : ''}`}>
              {data.interactions.map((item) => {
                const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.OUTROS;
                const Icon = cfg.icon;
                return (
                  <li key={item.id} className="group flex gap-3 px-4 py-3 md:px-5">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-jm-subtle text-jm-muted">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-jm-fg">{item.title}</p>
                        <span className="text-[11px] tabular-nums text-jm-muted">{formatDateTime(item.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-jm-fg2">{item.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-jm-muted">
                        <span className={`jm-badge ${cfg.badge}`}>{cfg.label}</span>
                        {item.customer ? (
                          <Link href={`/painel/customers?edit=${item.customer.id}`} className="jm-link">
                            {item.customer.name}
                          </Link>
                        ) : (
                          item.customerName && <span>{item.customerName}</span>
                        )}
                        {item.lead && (
                          <button onClick={() => onOpenLead(item.lead!.id)} className="jm-link">
                            Lead: {item.lead.name}
                          </button>
                        )}
                        <span>· {item.operator}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-1 sm:opacity-0 sm:group-hover:opacity-100">
                      <button onClick={() => openEditor(item)} className="jm-icon-btn h-8 w-8" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(item)} className="jm-icon-btn h-8 w-8 hover:bg-jm-danger-bg hover:text-jm-danger-fg" title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
          </>
        )}
      </div>

      {editing && (
        <div className="jm-overlay" onClick={() => setEditing(null)}>
          <form className="jm-modal sm:max-w-lg" onClick={(e) => e.stopPropagation()} onSubmit={save}>
            <div className="jm-modal-header">
              <h3 className="jm-modal-title">{editing.id ? 'Editar registro' : 'Registrar atendimento'}</h3>
            </div>
            <div className="jm-modal-body space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="jm-label">Tipo</label>
                  <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="jm-input">
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="jm-label">Cliente</label>
                  <select value={editing.customerId || ''} onChange={(e) => setEditing({ ...editing, customerId: e.target.value })} className="jm-input">
                    <option value="">— Sem cadastro —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {!editing.customerId && (
                <div>
                  <label className="jm-label">Nome (sem cadastro)</label>
                  <input value={editing.customerName || ''} onChange={(e) => setEditing({ ...editing, customerName: e.target.value })} className="jm-input" />
                </div>
              )}
              <div>
                <label className="jm-label">Título *</label>
                <input required value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="jm-input" />
              </div>
              <div>
                <label className="jm-label">Descrição *</label>
                <textarea required rows={4} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="jm-input" />
              </div>
            </div>
            <div className="jm-modal-footer">
              <button type="button" onClick={() => setEditing(null)} className="jm-btn jm-btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="jm-btn jm-btn-primary">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
