'use client';

import { useEffect, useMemo, useState } from 'react';
import { Repeat, Search, Zap } from 'lucide-react';
import { api } from '../../lib/api';
import { formatBRL, monthLabel, parseMoney } from '../../lib/format';
import { useNotify } from '../../components/ui/Notifications';
import { PAYMENT_METHODS, type BillingConfig, type RecurringCustomer } from '../types';

export default function RecurringTab({ focusCustomer }: { focusCustomer: string | null }) {
  const { toast } = useNotify();
  const [customers, setCustomers] = useState<RecurringCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [editing, setEditing] = useState<RecurringCustomer | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try {
      const res = await api<{ customers: RecurringCustomer[] }>('/api/finance/recurring');
      setCustomers(res.customers);
      return res.customers;
    } catch (e) {
      toast.error('Erro ao carregar', e instanceof Error ? e.message : undefined);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().then((list) => {
      if (focusCustomer) {
        const c = list.find((x) => x.id === focusCustomer);
        if (c) setEditing(c);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateNow = async () => {
    setGenerating(true);
    try {
      const r = await api<{ created: number; skipped: number; overdueLogged: number; period: string }>('/api/finance/generate', { method: 'POST' });
      toast.success(
        r.created ? `${r.created} fatura(s) gerada(s)` : 'Nenhuma fatura nova',
        `Competência ${r.period ? monthLabel(r.period) : ''}. ${r.overdueLogged || 0} vencida(s) registrada(s) no CRM.`
      );
    } catch (e) {
      toast.error('Erro ao gerar', e instanceof Error ? e.message : undefined);
    } finally {
      setGenerating(false);
    }
  };

  const enabled = customers.filter((c) => c.billing.enabled && c.isActive);
  const mrr = enabled.reduce((s, c) => s + c.billing.amount, 0);
  const visible = useMemo(
    () =>
      customers.filter(
        (c) => (!onlyEnabled || c.billing.enabled) && c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [customers, onlyEnabled, search]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="jm-card px-4 py-3.5">
          <p className="jm-stat-label">Receita recorrente mensal (MRR)</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-jm-primary-text">{formatBRL(mrr)}</p>
        </div>
        <div className="jm-card px-4 py-3.5">
          <p className="jm-stat-label">Clientes com cobrança ativa</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-jm-fg">
            {enabled.length} <span className="text-sm font-normal text-jm-muted">de {customers.length}</span>
          </p>
        </div>
        <div className="jm-card flex flex-col justify-between gap-2 px-4 py-3.5">
          <p className="text-xs text-jm-muted">As faturas do mês são geradas automaticamente todo dia às 06:00 (Brasília).</p>
          <button onClick={generateNow} disabled={generating} className="jm-btn jm-btn-secondary jm-btn-sm self-start">
            <Zap className="h-3.5 w-3.5" /> {generating ? 'Gerando...' : 'Gerar faturas do mês agora'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-placeholder" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..." className="jm-input pl-9" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-jm-muted">
          <input type="checkbox" checked={onlyEnabled} onChange={(e) => setOnlyEnabled(e.target.checked)} />
          Só com cobrança ativa
        </label>
      </div>

      <div className="jm-table-wrap">
        {loading ? (
          <div className="jm-empty">Carregando...</div>
        ) : visible.length === 0 ? (
          <div className="jm-empty">{customers.length === 0 ? 'Cadastre clientes para configurar a cobrança recorrente.' : 'Nenhum cliente encontrado.'}</div>
        ) : (
          <table className="jm-table min-w-[820px]">
            <thead>
              <tr>
                <th className="jm-th">Cliente</th>
                <th className="jm-th">Grupo (preço sugerido)</th>
                <th className="jm-th text-right">Mensalidade</th>
                <th className="jm-th">Vencimento</th>
                <th className="jm-th">Início</th>
                <th className="jm-th">Status</th>
                <th className="jm-th text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id} className="jm-tr">
                  <td className="jm-td font-medium text-jm-fg">
                    {c.name}
                    {!c.isActive && <span className="jm-badge jm-badge-danger ml-2">Cliente inativo</span>}
                  </td>
                  <td className="jm-td text-jm-fg2">
                    {c.groupName ? (
                      <>
                        {c.groupName} <span className="text-jm-muted">({formatBRL(c.suggestedAmount)})</span>
                      </>
                    ) : (
                      <span className="text-jm-muted">—</span>
                    )}
                  </td>
                  <td className="jm-td text-right tabular-nums">{c.billing.enabled ? formatBRL(c.billing.amount) : '—'}</td>
                  <td className="jm-td tabular-nums">{c.billing.enabled ? `Dia ${c.billing.dueDay}` : '—'}</td>
                  <td className="jm-td tabular-nums text-jm-fg2">{c.billing.enabled && c.billing.startPeriod ? monthLabel(c.billing.startPeriod) : '—'}</td>
                  <td className="jm-td">
                    <span className={`jm-badge ${c.billing.enabled ? (c.isActive ? 'jm-badge-success' : 'jm-badge-warning') : 'jm-badge-neutral'}`}>
                      {c.billing.enabled ? (c.isActive ? 'Ativa' : 'Pausada (cliente inativo)') : 'Desativada'}
                    </span>
                  </td>
                  <td className="jm-td text-right">
                    <button onClick={() => setEditing(c)} className="jm-btn jm-btn-secondary jm-btn-sm">
                      <Repeat className="h-3.5 w-3.5" /> Configurar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <BillingModal
          customer={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function BillingModal({ customer, onClose, onSaved }: { customer: RecurringCustomer; onClose: () => void; onSaved: () => void }) {
  const { toast } = useNotify();
  const [form, setForm] = useState<BillingConfig & { amountText: string }>({
    ...customer.billing,
    amountText: customer.billing.amount ? customer.billing.amount.toFixed(2).replace('.', ',') : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (useGroupPrice = false) => {
    setSaving(true);
    setError('');
    try {
      await api('/api/finance/recurring', {
        method: 'PUT',
        json: { customerId: customer.id, useGroupPrice, billing: { ...form, amount: parseMoney(form.amountText) } },
      });
      toast.success('Cobrança recorrente salva', customer.name);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="jm-overlay" onClick={onClose}>
      <div className="jm-modal sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="jm-modal-header">
          <div>
            <h3 className="jm-modal-title">Cobrança recorrente</h3>
            <p className="text-xs text-jm-muted">{customer.name}</p>
          </div>
          <button onClick={onClose} className="jm-icon-btn" aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="jm-modal-body space-y-4">
          {error && <div className="jm-alert jm-alert-danger">{error}</div>}
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-jm-fg">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
            Gerar fatura automaticamente todo mês
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="jm-label">Valor mensal (R$)</label>
              <input
                inputMode="decimal"
                value={form.amountText}
                onChange={(e) => setForm({ ...form, amountText: e.target.value.replace(/[^\d,.]/g, '') })}
                className="jm-input text-right tabular-nums"
                placeholder="0,00"
              />
              {customer.suggestedAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, amountText: customer.suggestedAmount.toFixed(2).replace('.', ',') })}
                  className="jm-link mt-1 text-xs"
                >
                  Usar tabela do grupo ({formatBRL(customer.suggestedAmount)})
                </button>
              )}
            </div>
            <div>
              <label className="jm-label">Dia do vencimento</label>
              <select value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: Number(e.target.value) })} className="jm-input">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Dia {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="jm-label">Descrição na fatura</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="jm-input" />
          </div>
          <div>
            <label className="jm-label">Forma de pagamento</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="jm-input">
              {PAYMENT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          {form.enabled && !customer.billing.enabled && (
            <p className="jm-help">
              Se o vencimento deste mês já passou, a primeira fatura será gerada no mês seguinte (nada de fatura já vencida).
            </p>
          )}
        </div>
        <div className="jm-modal-footer">
          <button onClick={onClose} className="jm-btn jm-btn-secondary">
            Cancelar
          </button>
          <button onClick={() => save()} disabled={saving} className="jm-btn jm-btn-primary">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
