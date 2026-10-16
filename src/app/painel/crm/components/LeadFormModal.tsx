'use client';

import { useState } from 'react';
import { LEAD_SOURCES, LEAD_STAGES } from '@/lib/leads';
import { api } from '../../lib/api';
import { maskPhone, parseMoney } from '../../lib/format';
import { useNotify } from '../../components/ui/Notifications';
import type { Lead, Owner } from '../shared';

// Cadastro manual de lead (indicação, WhatsApp, evento...)
export default function LeadFormModal({ owners, onClose, onSaved }: { owners: Owner[]; onClose: () => void; onSaved: (lead: Lead) => void }) {
  const { toast } = useNotify();
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    interest: '',
    message: '',
    source: 'MANUAL',
    stage: 'NOVO',
    estimatedValue: '',
    ownerId: '',
    nextAction: '',
    nextActionAt: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api<{ lead: Lead }>('/api/crm/leads', {
        method: 'POST',
        json: {
          ...form,
          estimatedValue: form.estimatedValue ? parseMoney(form.estimatedValue) : null,
          ownerId: form.ownerId || null,
          nextActionAt: form.nextActionAt ? new Date(form.nextActionAt).toISOString() : null,
        },
      });
      toast.success('Lead cadastrado', res.lead.name);
      onSaved(res.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="jm-overlay" onClick={onClose}>
      <form className="jm-modal sm:max-w-xl" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="jm-modal-header">
          <h3 className="jm-modal-title">Novo lead</h3>
          <button type="button" onClick={onClose} className="jm-icon-btn" aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="jm-modal-body grid grid-cols-1 gap-3 sm:grid-cols-2">
          {error && <div className="jm-alert jm-alert-danger sm:col-span-2">{error}</div>}
          <div>
            <label className="jm-label">Nome do contato *</label>
            <input required autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} className="jm-input" />
          </div>
          <div>
            <label className="jm-label">Empresa</label>
            <input value={form.company} onChange={(e) => set('company', e.target.value)} className="jm-input" />
          </div>
          <div>
            <label className="jm-label">Telefone / WhatsApp</label>
            <input value={form.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} placeholder="(00) 00000-0000" className="jm-input" />
          </div>
          <div>
            <label className="jm-label">E-mail</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="jm-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="jm-label">Interesse</label>
            <input value={form.interest} onChange={(e) => set('interest', e.target.value)} placeholder="Ex.: API oficial do WhatsApp + chatbot" className="jm-input" />
          </div>
          <div>
            <label className="jm-label">Origem</label>
            <select value={form.source} onChange={(e) => set('source', e.target.value)} className="jm-input">
              {LEAD_SOURCES.filter((s) => s.key !== 'SITE').map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="jm-label">Estágio</label>
            <select value={form.stage} onChange={(e) => set('stage', e.target.value)} className="jm-input">
              {LEAD_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="jm-label">Valor estimado (R$/mês)</label>
            <input inputMode="decimal" value={form.estimatedValue} onChange={(e) => set('estimatedValue', e.target.value.replace(/[^\d,.]/g, ''))} className="jm-input" />
          </div>
          <div>
            <label className="jm-label">Responsável</label>
            <select value={form.ownerId} onChange={(e) => set('ownerId', e.target.value)} className="jm-input">
              <option value="">Eu mesmo</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="jm-label">Próxima ação</label>
            <input value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} placeholder="Ex.: Ligar para apresentar" className="jm-input" />
          </div>
          <div>
            <label className="jm-label">Quando</label>
            <input type="datetime-local" value={form.nextActionAt} onChange={(e) => set('nextActionAt', e.target.value)} className="jm-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="jm-label">Observações</label>
            <textarea rows={2} value={form.message} onChange={(e) => set('message', e.target.value)} className="jm-input" />
          </div>
        </div>
        <div className="jm-modal-footer">
          <button type="button" onClick={onClose} className="jm-btn jm-btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="jm-btn jm-btn-primary">
            {saving ? 'Salvando...' : 'Cadastrar lead'}
          </button>
        </div>
      </form>
    </div>
  );
}
