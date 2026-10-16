'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Mail, MessageCircle, Trash2, UserCheck, X } from 'lucide-react';
import { LEAD_SOURCES, LEAD_STAGES } from '@/lib/leads';
import { api } from '../../lib/api';
import { formatBRL, formatDateTime, maskPhone, parseMoney, relativeTime, whatsappLink } from '../../lib/format';
import { useNotify } from '../../components/ui/Notifications';
import { TYPE_CONFIG, type CrmItem, type Lead, type Owner } from '../shared';

interface LeadDetail {
  lead: Lead;
  interactions: CrmItem[];
  proposals: { id: string; number: string; title: string; status: string; recurringTotal: number; oneTimeTotal: number; createdAt: string }[];
}

// datetime-local espera "YYYY-MM-DDTHH:mm" no fuso do navegador
function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LeadDrawer({
  leadId,
  owners,
  onClose,
  onChanged,
  onDeleted,
}: {
  leadId: string;
  owners: Owner[];
  onClose: () => void;
  onChanged: (lead?: Lead) => void;
  onDeleted: () => void;
}) {
  const { toast, confirm } = useNotify();
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState({ type: 'COMERCIAL', title: '', description: '' });
  const [savingNote, setSavingNote] = useState(false);
  const [converting, setConverting] = useState(false);

  const load = async () => {
    try {
      const res = await api<LeadDetail>(`/api/crm/leads/${leadId}`);
      setDetail(res);
      const l = res.lead;
      setForm({
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        interest: l.interest,
        source: l.source,
        stage: l.stage,
        estimatedValue: l.estimatedValue ? l.estimatedValue.toFixed(2).replace('.', ',') : '',
        ownerId: l.owner?.id || '',
        nextAction: l.nextAction,
        nextActionAt: toLocalInput(l.nextActionAt),
        lostReason: l.lostReason,
      });
      setDirty(false);
    } catch (e) {
      toast.error('Erro ao abrir o lead', e instanceof Error ? e.message : undefined);
      onClose();
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await api<{ lead: Lead }>(`/api/crm/leads/${leadId}`, {
        method: 'PUT',
        json: {
          ...form,
          estimatedValue: form.estimatedValue ? parseMoney(form.estimatedValue) : null,
          ownerId: form.ownerId || null,
          nextActionAt: form.nextActionAt ? new Date(form.nextActionAt).toISOString() : null,
        },
      });
      toast.success('Lead atualizado');
      onChanged(res.lead);
      load();
    } catch (e) {
      toast.error('Erro ao salvar', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.title.trim() || !note.description.trim()) return;
    setSavingNote(true);
    try {
      await api('/api/crm', { method: 'POST', json: { ...note, leadId } });
      setNote({ type: note.type, title: '', description: '' });
      toast.success('Interação registrada');
      load();
      onChanged();
    } catch (err) {
      toast.error('Erro ao registrar', err instanceof Error ? err.message : undefined);
    } finally {
      setSavingNote(false);
    }
  };

  const convert = async () => {
    const ok = await confirm({
      title: 'Converter em cliente',
      message: `Criar o cliente "${detail?.lead.company || detail?.lead.name}" com os dados deste lead? O lead vai para "Ganho" e o histórico passa para o cadastro do cliente.`,
      confirmLabel: 'Converter',
    });
    if (!ok) return;
    setConverting(true);
    try {
      const res = await api<{ lead: Lead; customerId: string }>(`/api/crm/leads/${leadId}/convert`, { method: 'POST', json: {} });
      toast.success('Cliente criado!', 'Complete CPF/CNPJ e endereço no cadastro do cliente.');
      onChanged(res.lead);
      load();
    } catch (e) {
      toast.error('Erro ao converter', e instanceof Error ? e.message : undefined);
    } finally {
      setConverting(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Excluir lead',
      message: 'Excluir este lead? As interações registradas continuam na linha do tempo do CRM.',
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/crm/leads/${leadId}`, { method: 'DELETE' });
      toast.success('Lead excluído');
      onDeleted();
    } catch (e) {
      toast.error('Erro ao excluir', e instanceof Error ? e.message : undefined);
    }
  };

  const lead = detail?.lead;
  const wa = lead ? whatsappLink(lead.phone, `Olá, ${lead.name.split(' ')[0]}! Aqui é da JM Master Group. Recebemos seu contato${lead.interest ? ` sobre ${lead.interest}` : ''} e gostaria de entender melhor sua necessidade.`) : null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-jm-overlay" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col bg-jm-surface shadow-jm-pop">
        <header className="flex items-start justify-between gap-3 border-b border-jm-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-jm-fg">{lead?.name || 'Carregando...'}</h2>
            {lead && (
              <p className="text-xs text-jm-muted">
                {LEAD_SOURCES.find((s) => s.key === lead.source)?.label} · criado {relativeTime(lead.createdAt)}
                {lead.sourcePage && <> · origem {lead.sourcePage}</>}
              </p>
            )}
          </div>
          <button onClick={onClose} className="jm-icon-btn" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </header>

        {!lead ? (
          <div className="jm-empty flex-1">Carregando...</div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {/* Ações rápidas */}
            <div className="flex flex-wrap gap-2">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="jm-btn jm-btn-secondary jm-btn-sm">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="jm-btn jm-btn-secondary jm-btn-sm">
                  <Mail className="h-3.5 w-3.5" /> E-mail
                </a>
              )}
              <Link href={`/painel/proposals?new=1&lead=${lead.id}`} className="jm-btn jm-btn-secondary jm-btn-sm">
                <FileText className="h-3.5 w-3.5" /> Nova proposta
              </Link>
              {lead.customer ? (
                <Link href={`/painel/customers?edit=${lead.customer.id}`} className="jm-btn jm-btn-primary jm-btn-sm">
                  <UserCheck className="h-3.5 w-3.5" /> Cliente: {lead.customer.name}
                </Link>
              ) : (
                <button onClick={convert} disabled={converting} className="jm-btn jm-btn-primary jm-btn-sm">
                  <UserCheck className="h-3.5 w-3.5" /> {converting ? 'Convertendo...' : 'Converter em cliente'}
                </button>
              )}
            </div>

            {lead.message && (
              <div className="rounded-[4px] border border-jm-border bg-jm-subtle px-3 py-2.5">
                <p className="jm-stat-label mb-1">Mensagem do lead</p>
                <p className="whitespace-pre-wrap text-sm text-jm-fg2">{lead.message}</p>
              </div>
            )}

            {/* Dados editáveis */}
            <section className="grid grid-cols-2 gap-3">
              <Input label="Nome" value={form.name} onChange={(v) => set('name', v)} />
              <Input label="Empresa" value={form.company} onChange={(v) => set('company', v)} />
              <Input label="Telefone" value={form.phone} onChange={(v) => set('phone', maskPhone(v))} />
              <Input label="E-mail" value={form.email} onChange={(v) => set('email', v)} />
              <div className="col-span-2">
                <Input label="Interesse" value={form.interest} onChange={(v) => set('interest', v)} />
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
                <label className="jm-label">Responsável</label>
                <select value={form.ownerId} onChange={(e) => set('ownerId', e.target.value)} className="jm-input">
                  <option value="">Sem responsável</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Valor estimado (R$/mês)" value={form.estimatedValue} onChange={(v) => set('estimatedValue', v.replace(/[^\d,.]/g, ''))} />
              <div>
                <label className="jm-label">Origem</label>
                <select value={form.source} onChange={(e) => set('source', e.target.value)} className="jm-input">
                  {LEAD_SOURCES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Próxima ação" value={form.nextAction} onChange={(v) => set('nextAction', v)} />
              <div>
                <label className="jm-label">Quando</label>
                <input type="datetime-local" value={form.nextActionAt} onChange={(e) => set('nextActionAt', e.target.value)} className="jm-input" />
              </div>
              {form.stage === 'PERDIDO' && (
                <div className="col-span-2">
                  <Input label="Motivo da perda" value={form.lostReason} onChange={(v) => set('lostReason', v)} />
                </div>
              )}
              <div className="col-span-2 flex items-center justify-between">
                <button onClick={remove} className="jm-btn jm-btn-ghost jm-btn-sm text-jm-danger-fg hover:bg-jm-danger-bg">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir lead
                </button>
                <button onClick={save} disabled={!dirty || saving} className="jm-btn jm-btn-primary">
                  {saving ? 'Salvando...' : dirty ? 'Salvar alterações' : 'Salvo'}
                </button>
              </div>
            </section>

            {/* Propostas */}
            {detail.proposals.length > 0 && (
              <section>
                <h3 className="jm-section-title mb-2">Propostas</h3>
                <div className="space-y-1.5">
                  {detail.proposals.map((p) => (
                    <Link key={p.id} href={`/painel/proposals?open=${p.id}`} className="flex items-center justify-between rounded-[4px] border border-jm-border px-3 py-2 text-sm hover:bg-jm-hover">
                      <span className="min-w-0 truncate">
                        <span className="font-mono text-xs text-jm-muted">{p.number}</span> {p.title}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-jm-fg2">
                        {formatBRL(p.recurringTotal)}/mês · {p.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Registrar interação */}
            <section>
              <h3 className="jm-section-title mb-2">Registrar interação</h3>
              <form onSubmit={addNote} className="space-y-2">
                <div className="flex gap-2">
                  <select value={note.type} onChange={(e) => setNote({ ...note, type: e.target.value })} className="jm-input w-40">
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <input value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })} placeholder="Título (ex.: Ligação de apresentação)" className="jm-input flex-1" />
                </div>
                <textarea rows={2} value={note.description} onChange={(e) => setNote({ ...note, description: e.target.value })} placeholder="O que foi conversado, próximos passos..." className="jm-input" />
                <div className="flex justify-end">
                  <button type="submit" disabled={savingNote || !note.title.trim() || !note.description.trim()} className="jm-btn jm-btn-secondary jm-btn-sm">
                    {savingNote ? 'Registrando...' : 'Registrar'}
                  </button>
                </div>
              </form>
            </section>

            {/* Histórico */}
            <section>
              <h3 className="jm-section-title mb-2">Histórico ({detail.interactions.length})</h3>
              <ol className="space-y-2">
                {detail.interactions.map((i) => {
                  const cfg = TYPE_CONFIG[i.type] || TYPE_CONFIG.OUTROS;
                  return (
                    <li key={i.id} className="rounded-[4px] border border-jm-border bg-jm-subtle px-3 py-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-jm-fg">{i.title}</p>
                        <span className={`jm-badge ${cfg.badge} shrink-0`}>{cfg.label}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs text-jm-fg2">{i.description}</p>
                      <p className="mt-1 text-[11px] text-jm-muted">
                        {i.operator} · {formatDateTime(i.createdAt)}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="jm-label">{label}</label>
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} className="jm-input" />
    </div>
  );
}
