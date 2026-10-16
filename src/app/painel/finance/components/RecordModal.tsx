'use client';

import { useEffect, useState } from 'react';
import { api, qs } from '../../lib/api';
import { peekCache, setCache } from '../../lib/cache';
import { todayISO } from '../../lib/format';
import { useNotify } from '../../components/ui/Notifications';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  REVENUE_CATEGORIES,
  type CustomerOption,
  type FinancialItem,
  type RecordType,
} from '../types';

// Lançar/editar fatura (receita) ou despesa
export default function RecordModal({
  type,
  record,
  onClose,
  onSaved,
}: {
  type: RecordType;
  record: FinancialItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useNotify();
  const isRevenue = type === 'RECEITA';
  const [customers, setCustomers] = useState<CustomerOption[]>(() => peekCache<CustomerOption[]>('/api/customers?minimal=1') || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => ({
    customerId: record?.customerId || '',
    customer: record && !record.customerId ? record.customerName : '',
    supplier: record?.supplier || '',
    description: record?.description || (isRevenue ? 'Mensalidade Plataforma & WhatsApp API' : ''),
    category: record?.category || (isRevenue ? 'Mensalidade' : EXPENSE_CATEGORIES[0]),
    amount: record ? record.amount.toFixed(2).replace('.', ',') : '',
    dueDate: record?.dueDate ? record.dueDate.slice(0, 10) : todayISO(),
    method: record?.method || 'Boleto / Pix',
    status: record ? (record.status === 'ATRASADO' ? 'ABERTO' : record.status) : 'ABERTO',
  }));

  useEffect(() => {
    if (!isRevenue) return;
    const url = `/api/customers${qs({ minimal: 1 })}`;
    api<CustomerOption[]>(url)
      .then((d) => {
        setCustomers(d);
        setCache('/api/customers?minimal=1', d);
      })
      .catch(() => {});
  }, [isRevenue]);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isRevenue && !form.customerId && !form.customer.trim()) return setError('Selecione o cliente ou digite o nome.');
    setSaving(true);
    try {
      await api('/api/finance', {
        method: record ? 'PUT' : 'POST',
        json: { ...form, id: record?.id, type },
      });
      toast.success(record ? 'Alterações salvas' : isRevenue ? 'Fatura lançada' : 'Despesa lançada');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const categories = isRevenue ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="jm-overlay" onClick={onClose}>
      <form className="jm-modal sm:max-w-lg" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="jm-modal-header">
          <h3 className="jm-modal-title">
            {record ? `Editar ${record.invoiceNumber}` : isRevenue ? 'Nova fatura' : 'Nova despesa'}
          </h3>
          <button type="button" onClick={onClose} className="jm-icon-btn" aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="jm-modal-body grid grid-cols-1 gap-4 sm:grid-cols-2">
          {error && <div className="jm-alert jm-alert-danger sm:col-span-2">{error}</div>}

          {isRevenue ? (
            <>
              <div className="sm:col-span-2">
                <label className="jm-label">Cliente *</label>
                <select value={form.customerId} onChange={(e) => set('customerId', e.target.value)} className="jm-input">
                  <option value="">— Cliente não cadastrado (digitar nome) —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {!c.isActive ? ' (inativo)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {!form.customerId && (
                <div className="sm:col-span-2">
                  <label className="jm-label">Nome do cliente avulso *</label>
                  <input value={form.customer} onChange={(e) => set('customer', e.target.value)} className="jm-input" />
                </div>
              )}
            </>
          ) : (
            <div className="sm:col-span-2">
              <label className="jm-label">Fornecedor</label>
              <input value={form.supplier} onChange={(e) => set('supplier', e.target.value)} placeholder="Ex.: Meta Platforms, AWS, Contabilidade" className="jm-input" />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="jm-label">Descrição *</label>
            <input required value={form.description} onChange={(e) => set('description', e.target.value)} className="jm-input" />
          </div>

          <div>
            <label className="jm-label">Valor (R$) *</label>
            <input
              required
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value.replace(/[^\d,.]/g, ''))}
              placeholder="0,00"
              className="jm-input text-right tabular-nums"
            />
          </div>
          <div>
            <label className="jm-label">Vencimento *</label>
            <input type="date" required value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className="jm-input" />
          </div>
          <div>
            <label className="jm-label">Categoria</label>
            <input list="finance-categories" value={form.category} onChange={(e) => set('category', e.target.value)} className="jm-input" />
            <datalist id="finance-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="jm-label">Forma de pagamento</label>
            <select value={form.method} onChange={(e) => set('method', e.target.value)} className="jm-input">
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="jm-label">Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="jm-input">
              <option value="ABERTO">Em aberto</option>
              <option value="PAGO">Pago</option>
              {record && <option value="CANCELADO">Cancelado</option>}
            </select>
          </div>
        </div>

        <div className="jm-modal-footer">
          <button type="button" onClick={onClose} className="jm-btn jm-btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="jm-btn jm-btn-primary">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
