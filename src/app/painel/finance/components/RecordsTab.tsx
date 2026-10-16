'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Download, MessageCircle, Pencil, Search, Trash2, Undo2, Ban } from 'lucide-react';
import { api, qs } from '../../lib/api';
import { peekCache, setCache } from '../../lib/cache';
import { formatBRL, formatDate, whatsappLink } from '../../lib/format';
import { useDebounce } from '../../hooks/useDebounce';
import { useNotify } from '../../components/ui/Notifications';
import { Pagination } from '../../components/ui/Pagination';
import RecordModal from './RecordModal';
import { STATUS_BADGE, STATUS_LABEL, type FinanceMetrics, type FinancialItem, type RecordType } from '../types';

interface ListResponse {
  records: FinancialItem[];
  total: number;
  page: number;
  pageSize: number;
  metrics: FinanceMetrics;
}

const PAGE_SIZE = 25;
const STATUS_FILTERS = ['all', 'ABERTO', 'ATRASADO', 'PAGO', 'CANCELADO'];

export default function RecordsTab({
  type,
  openNew,
  onNewHandled,
}: {
  type: RecordType;
  openNew: boolean;
  onNewHandled: () => void;
}) {
  const { toast, confirm } = useNotify();
  const isRevenue = type === 'RECEITA';
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ record: FinancialItem | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const debounced = useDebounce(search);

  const url = `/api/finance${qs({ type, status, q: debounced, page, pageSize: PAGE_SIZE })}`;

  const load = async () => {
    const cached = peekCache<ListResponse>(url);
    if (cached) setData(cached);
    setLoading(!cached);
    try {
      const res = await api<ListResponse>(url);
      setData(res);
      setCache(url, res);
    } catch (e) {
      toast.error('Erro ao carregar', e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => setPage(1), [status, debounced]);

  useEffect(() => {
    if (openNew) {
      setModal({ record: null });
      onNewHandled();
    }
  }, [openNew, onNewHandled]);

  const changeStatus = async (item: FinancialItem, next: 'PAGO' | 'ABERTO' | 'CANCELADO') => {
    if (next === 'CANCELADO') {
      const ok = await confirm({
        title: `Cancelar ${isRevenue ? 'fatura' : 'despesa'}`,
        message: `Cancelar ${item.invoiceNumber}? Ela deixa de contar nos totais (fica no histórico).`,
        confirmLabel: 'Sim, cancelar',
        variant: 'warning',
      });
      if (!ok) return;
    }
    setBusyId(item.id);
    try {
      await api('/api/finance', { method: 'PATCH', json: { id: item.id, status: next } });
      toast.success(
        next === 'PAGO' ? (isRevenue ? 'Pagamento registrado' : 'Despesa paga') : next === 'ABERTO' ? 'Reaberta' : 'Cancelada',
        next === 'PAGO' && isRevenue && item.customerId ? 'O recebimento foi registrado na linha do tempo do CRM.' : item.invoiceNumber
      );
      load();
    } catch (e) {
      toast.error('Erro ao alterar status', e instanceof Error ? e.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: FinancialItem) => {
    const ok = await confirm({
      title: 'Excluir definitivamente',
      message: `Excluir ${item.invoiceNumber} (${formatBRL(item.amount)})? Prefira "Cancelar" para manter o histórico. A exclusão fica registrada na auditoria.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/finance${qs({ id: item.id })}`, { method: 'DELETE' });
      toast.success('Registro excluído', item.invoiceNumber);
      load();
    } catch (e) {
      toast.error('Erro ao excluir', e instanceof Error ? e.message : undefined);
    }
  };

  const chargeText = (inv: FinancialItem) =>
    inv.status === 'ATRASADO'
      ? `Olá, ${inv.customerName}! Identificamos que a fatura ${inv.invoiceNumber} no valor de ${formatBRL(inv.amount)}, com vencimento em ${formatDate(inv.dueDate)}, ainda está em aberto. Pode nos confirmar a previsão de pagamento? Se já pagou, por favor desconsidere esta mensagem. — JM MASTER GROUP`
      : `Olá, ${inv.customerName}! Passando para lembrar da fatura ${inv.invoiceNumber} no valor de ${formatBRL(inv.amount)}, com vencimento em ${formatDate(inv.dueDate)} (${inv.method}). Qualquer dúvida, estamos à disposição. — JM MASTER GROUP`;

  const m = data?.metrics;
  const records = data?.records || [];

  return (
    <div className="space-y-4">
      {m && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {isRevenue ? (
            <>
              <Stat label="Recebido" value={formatBRL(m.receitaRecebida)} sub={`${m.paidCount} fatura(s)`} tone="text-jm-success-fg" />
              <Stat label="A receber" value={formatBRL(m.aReceber)} sub={`${m.openCount} em aberto`} tone="text-jm-primary-text" />
              <Stat label="Inadimplência" value={formatBRL(m.inadimplencia)} sub={`${m.overdueCount} vencida(s)`} tone={m.overdueCount ? 'text-jm-danger-fg' : 'text-jm-fg'} />
              <Stat label="Total faturado" value={formatBRL(m.totalFaturado)} sub={`${m.canceledCount} cancelada(s)`} />
            </>
          ) : (
            <>
              <Stat label="Despesas pagas" value={formatBRL(m.despesasPagas)} tone="text-jm-fg" />
              <Stat label="A pagar" value={formatBRL(m.despesasAPagar)} tone="text-jm-warning-fg" />
              <Stat label="Vencidas" value={formatBRL(m.despesasVencidas)} tone={m.despesasVencidas ? 'text-jm-danger-fg' : 'text-jm-fg'} />
              <Stat label="Saldo realizado" value={formatBRL(m.saldoRealizado)} sub="recebido − pago" tone={m.saldoRealizado >= 0 ? 'text-jm-success-fg' : 'text-jm-danger-fg'} />
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="jm-segmented flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`jm-segment ${status === s ? 'jm-segment-active' : ''}`}>
              {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-placeholder" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRevenue ? 'Número, cliente, descrição...' : 'Número, fornecedor, categoria...'}
            className="jm-input pl-9"
          />
        </div>
        <div className="flex gap-2 lg:ml-auto">
          <a href={`/api/finance/export${qs({ type, status, q: debounced })}`} className="jm-btn jm-btn-secondary" title="Exportar CSV (abre no Excel)">
            <Download className="h-4 w-4" /> CSV
          </a>
          <button onClick={() => setModal({ record: null })} className="jm-btn jm-btn-accent">
            + {isRevenue ? 'Nova fatura' : 'Nova despesa'}
          </button>
        </div>
      </div>

      <div className="jm-table-wrap">
        {loading && !data ? (
          <div className="jm-empty">Carregando...</div>
        ) : records.length === 0 ? (
          <div className="jm-empty">
            {status !== 'all' || debounced ? 'Nada encontrado com esses filtros.' : isRevenue ? 'Nenhuma fatura lançada ainda.' : 'Nenhuma despesa lançada ainda.'}
          </div>
        ) : (
          <>
            <table className={`jm-table min-w-[900px] ${loading ? 'opacity-60' : ''}`}>
              <thead>
                <tr>
                  <th className="jm-th">Número</th>
                  <th className="jm-th">{isRevenue ? 'Cliente' : 'Fornecedor'}</th>
                  <th className="jm-th">Descrição / categoria</th>
                  <th className="jm-th">Vencimento</th>
                  <th className="jm-th text-right">Valor</th>
                  <th className="jm-th">Status</th>
                  <th className="jm-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const wa = isRevenue && (r.status === 'ABERTO' || r.status === 'ATRASADO') ? whatsappLink(r.customerPhone, chargeText(r)) : null;
                  const busy = busyId === r.id;
                  return (
                    <tr key={r.id} className="jm-tr">
                      <td className="jm-td font-mono text-xs text-jm-fg2">
                        {r.invoiceNumber}
                        {r.recurring && <span className="jm-badge jm-badge-neutral ml-1.5">Recorrente</span>}
                      </td>
                      <td className="jm-td font-medium text-jm-fg">{isRevenue ? r.customerName : r.supplier || '—'}</td>
                      <td className="jm-td">
                        <p className="max-w-[260px] truncate text-jm-fg2">{r.description}</p>
                        <p className="text-[11px] text-jm-muted">{r.category}</p>
                      </td>
                      <td className="jm-td tabular-nums">
                        {formatDate(r.dueDate)}
                        {r.paymentDate && <p className="text-[11px] text-jm-muted">pago {formatDate(r.paymentDate)}</p>}
                      </td>
                      <td className="jm-td text-right font-medium tabular-nums text-jm-fg">{formatBRL(r.amount)}</td>
                      <td className="jm-td">
                        <span className={`jm-badge ${STATUS_BADGE[r.status] || 'jm-badge-neutral'}`}>{STATUS_LABEL[r.status] || r.status}</span>
                      </td>
                      <td className="jm-td">
                        <div className="flex justify-end gap-1">
                          {(r.status === 'ABERTO' || r.status === 'ATRASADO') && (
                            <button disabled={busy} onClick={() => changeStatus(r, 'PAGO')} className="jm-btn jm-btn-primary jm-btn-sm" title="Marcar como pago">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Pago
                            </button>
                          )}
                          {wa && (
                            <a href={wa} target="_blank" rel="noopener noreferrer" className="jm-icon-btn h-8 w-8" title="Cobrar pelo WhatsApp">
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}
                          {(r.status === 'PAGO' || r.status === 'CANCELADO') && (
                            <button disabled={busy} onClick={() => changeStatus(r, 'ABERTO')} className="jm-icon-btn h-8 w-8" title="Reabrir">
                              <Undo2 className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => setModal({ record: r })} className="jm-icon-btn h-8 w-8" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          {r.status !== 'CANCELADO' && r.status !== 'PAGO' && (
                            <button disabled={busy} onClick={() => changeStatus(r, 'CANCELADO')} className="jm-icon-btn h-8 w-8" title="Cancelar">
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => remove(r)} className="jm-icon-btn h-8 w-8 hover:bg-jm-danger-bg hover:text-jm-danger-fg" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total || 0} onChange={setPage} />
          </>
        )}
      </div>

      {modal && (
        <RecordModal
          type={type}
          record={modal.record}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone = 'text-jm-fg' }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="jm-card px-4 py-3.5">
      <p className="jm-stat-label">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums tracking-tight ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-jm-muted">{sub}</p>}
    </div>
  );
}
