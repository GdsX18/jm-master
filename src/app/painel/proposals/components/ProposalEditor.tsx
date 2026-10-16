'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Printer, Send, Trash2, X, Undo2 } from 'lucide-react';
import { api } from '../../lib/api';
import { formatBRL, formatDate, parseMoney, whatsappLink } from '../../lib/format';
import { useNotify } from '../../components/ui/Notifications';
import { STATUS_INFO, proposalClientName, type Proposal, type ProposalItem } from '../types';

interface ProductOption {
  id: string;
  name: string;
  description: string;
  price: number;
  recurring: boolean;
  active: boolean;
}

interface Option {
  id: string;
  name: string;
}

type ItemDraft = ProposalItem & { priceText: string; key: string };

const newKey = () => Math.random().toString(36).slice(2);
const toDraft = (i: ProposalItem): ItemDraft => ({ ...i, priceText: i.unitPrice.toFixed(2).replace('.', ','), key: newKey() });

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ProposalEditor({
  proposalId,
  initialLeadId,
  initialCustomerId,
  onBack,
  onOpen,
}: {
  proposalId: string | null;
  initialLeadId: string | null;
  initialCustomerId: string | null;
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const { toast, confirm } = useNotify();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(!!proposalId);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [leads, setLeads] = useState<(Option & { company: string; customer: Option | null })[]>([]);
  const [groupPrices, setGroupPrices] = useState<Record<string, number>>({});

  const [form, setForm] = useState({
    title: 'Proposta comercial — Plataforma JM Master',
    target: initialCustomerId ? `c:${initialCustomerId}` : initialLeadId ? `l:${initialLeadId}` : '',
    validUntil: addDays(15),
    dueDay: 10,
    notes: '',
    discountText: '',
  });
  const [items, setItems] = useState<ItemDraft[]>([]);

  const readOnly = proposal?.status === 'ACEITA' || proposal?.status === 'RECUSADA';

  // Catálogo e opções de vínculo
  useEffect(() => {
    api<ProductOption[]>('/api/products').then((p) => setProducts(p.filter((x) => x.active))).catch(() => {});
    api<Option[]>('/api/customers?minimal=1').then(setCustomers).catch(() => {});
    api<{ leads: (Option & { company: string; customer: Option | null })[] }>('/api/crm/leads?closedDays=90')
      .then((d) => setLeads(d.leads))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!proposalId) return;
    setLoading(true);
    api<{ proposal: Proposal }>(`/api/proposals/${proposalId}`)
      .then(({ proposal: p }) => {
        setProposal(p);
        setForm({
          title: p.title,
          target: p.customerId ? `c:${p.customerId}` : p.leadId ? `l:${p.leadId}` : '',
          validUntil: p.validUntil || '',
          dueDay: p.dueDay,
          notes: p.notes,
          discountText: p.discount ? p.discount.toFixed(2).replace('.', ',') : '',
        });
        setItems(p.items.map(toDraft));
        setDirty(false);
      })
      .catch((e) => toast.error('Erro ao abrir proposta', e.message))
      .finally(() => setLoading(false));
  }, [proposalId, toast]);

  // Cliente escolhido: usa os preços do grupo dele como sugestão ao adicionar produtos
  const customerId = form.target.startsWith('c:') ? form.target.slice(2) : leads.find((l) => `l:${l.id}` === form.target)?.customer?.id || null;
  useEffect(() => {
    setGroupPrices({});
    if (!customerId) return;
    api<{ groupIds: string[]; groups: { id: string; isActive?: boolean; name: string }[] }>(`/api/customers/${customerId}`)
      .then((c) => {
        const group = c.groups.filter((g) => g.isActive !== false).sort((a, b) => a.name.localeCompare(b.name))[0];
        if (!group) return;
        return api<{ productId: string; price: number }[]>(`/api/products/group-prices/${group.id}`).then((prices) =>
          setGroupPrices(Object.fromEntries(prices.map((p) => [p.productId, p.price])))
        );
      })
      .catch(() => {});
  }, [customerId]);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const updateItem = (key: string, patch: Partial<ItemDraft>) => {
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
    setDirty(true);
  };

  const addProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const price = groupPrices[p.id] ?? p.price;
    setItems((list) => [
      ...list,
      toDraft({ productId: p.id, description: p.description ? `${p.name} — ${p.description}` : p.name, quantity: 1, unitPrice: price, recurring: p.recurring }),
    ]);
    setDirty(true);
  };

  const addFreeItem = () => {
    setItems((list) => [...list, toDraft({ productId: null, description: '', quantity: 1, unitPrice: 0, recurring: true })]);
    setDirty(true);
  };

  const totals = useMemo(() => {
    const parsed = items.map((i) => ({ ...i, unitPrice: parseMoney(i.priceText) }));
    const recurringGross = parsed.filter((i) => i.recurring).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const oneTime = parsed.filter((i) => !i.recurring).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const discount = Math.min(parseMoney(form.discountText), recurringGross);
    return { recurringGross, oneTime, discount, recurring: recurringGross - discount };
  }, [items, form.discountText]);

  const payload = () => ({
    title: form.title,
    leadId: form.target.startsWith('l:') ? form.target.slice(2) : null,
    customerId: form.target.startsWith('c:') ? form.target.slice(2) : null,
    validUntil: form.validUntil || null,
    dueDay: form.dueDay,
    notes: form.notes,
    discount: parseMoney(form.discountText),
    items: items.map((i) => ({
      productId: i.productId,
      description: i.description,
      quantity: i.quantity,
      unitPrice: parseMoney(i.priceText),
      recurring: i.recurring,
    })),
  });

  const save = async (): Promise<Proposal | null> => {
    if (!form.target) {
      toast.warning('Vincule a proposta', 'Escolha um cliente ou lead.');
      return null;
    }
    setSaving(true);
    try {
      const res = await api<{ proposal: Proposal }>(proposalId ? `/api/proposals/${proposalId}` : '/api/proposals', {
        method: proposalId ? 'PUT' : 'POST',
        json: payload(),
      });
      setProposal(res.proposal);
      setDirty(false);
      toast.success(proposalId ? 'Proposta salva' : `Proposta ${res.proposal.number} criada`);
      if (!proposalId) onOpen(res.proposal.id);
      return res.proposal;
    } catch (e) {
      toast.error('Erro ao salvar', e instanceof Error ? e.message : undefined);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status: Proposal['status']) => {
    let current = proposal;
    if (dirty || !current) {
      current = await save();
      if (!current) return;
    }
    const messages: Record<string, { title: string; message: string; label: string; variant?: 'danger' | 'warning' }> = {
      ENVIADA: { title: 'Marcar como enviada', message: 'A proposta será marcada como enviada e o lead (se houver) vai para o estágio "Proposta".', label: 'Marcar como enviada' },
      ACEITA: {
        title: 'Cliente aceitou a proposta?',
        message: `Ao confirmar: o lead vira cliente (se ainda não for), a mensalidade de ${formatBRL(current.recurringTotal)} é ativada na cobrança recorrente${current.oneTimeTotal ? ` e é gerada uma fatura de ${formatBRL(current.oneTimeTotal)} para os itens únicos` : ''}.`,
        label: 'Confirmar aceite',
      },
      RECUSADA: { title: 'Marcar como recusada', message: 'A proposta fica registrada como recusada no histórico.', label: 'Marcar como recusada', variant: 'danger' },
      RASCUNHO: { title: 'Voltar para rascunho', message: 'A proposta volta a ser editável.', label: 'Voltar para rascunho', variant: 'warning' },
    };
    const m = messages[status];
    if (!(await confirm({ title: m.title, message: m.message, confirmLabel: m.label, variant: m.variant }))) return;
    try {
      const res = await api<{ proposal: Proposal; warnings: string[] }>(`/api/proposals/${current.id}/status`, { method: 'POST', json: { status } });
      setProposal(res.proposal);
      toast.success(`Proposta ${STATUS_INFO[status].label.toLowerCase()}`, res.warnings.join(' ') || undefined);
    } catch (e) {
      toast.error('Erro ao alterar status', e instanceof Error ? e.message : undefined);
    }
  };

  const duplicate = () => {
    if (!proposal) return;
    setProposal(null);
    setForm((f) => ({ ...f, title: `${f.title} (nova versão)`, validUntil: addDays(15) }));
    setItems((list) => list.map((i) => ({ ...i, id: undefined, key: newKey() })));
    setDirty(true);
    onOpen('');
  };

  const remove = async () => {
    if (!proposal) return onBack();
    if (!(await confirm({ title: 'Excluir proposta', message: `Excluir ${proposal.number}?`, confirmLabel: 'Excluir', variant: 'danger' }))) return;
    try {
      await api(`/api/proposals/${proposal.id}`, { method: 'DELETE' });
      toast.success('Proposta excluída');
      onBack();
    } catch (e) {
      toast.error('Erro ao excluir', e instanceof Error ? e.message : undefined);
    }
  };

  const shareText = proposal
    ? `Olá! Segue a proposta ${proposal.number} — ${proposal.title}: mensalidade de ${formatBRL(proposal.recurringTotal)}${
        proposal.oneTimeTotal ? ` + ${formatBRL(proposal.oneTimeTotal)} de implantação` : ''
      }${proposal.validUntil ? `, válida até ${formatDate(proposal.validUntil)}` : ''}. Fico à disposição para qualquer dúvida. — JM MASTER GROUP`
    : '';
  const wa = proposal ? whatsappLink(proposal.customer?.phone || proposal.lead?.phone, shareText) : null;

  if (loading) return <div className="jm-card jm-empty">Carregando proposta...</div>;

  const status = proposal?.status || 'RASCUNHO';

  return (
    <div className="space-y-4">
      <div className="jm-page-header">
        <div className="min-w-0">
          <button onClick={onBack} className="mb-1 inline-flex items-center gap-1 text-xs text-jm-muted hover:text-jm-fg">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para propostas
          </button>
          <h1 className="jm-page-title flex flex-wrap items-center gap-2">
            {proposal ? proposal.number : 'Nova proposta'}
            <span className={`jm-badge ${STATUS_INFO[status].badge}`}>{STATUS_INFO[status].label}</span>
          </h1>
          {proposal && <p className="jm-page-desc">{proposalClientName(proposal)} · criada por {proposal.createdByName || '—'}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {proposal && (
            <Link href={`/painel/proposals/${proposal.id}/print`} target="_blank" className="jm-btn jm-btn-secondary">
              <Printer className="h-4 w-4" /> PDF / imprimir
            </Link>
          )}
          {proposal && wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="jm-btn jm-btn-secondary">
              Enviar resumo no WhatsApp
            </a>
          )}
          {proposal && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareText).then(() => toast.success('Resumo copiado'));
              }}
              className="jm-icon-btn h-9 w-9"
              title="Copiar resumo"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {proposal?.status === 'ACEITA' && (
        <div className="jm-alert jm-alert-success">
          Aceita em {formatDate(proposal.acceptedAt)}. {proposal.customer && <Link href={`/painel/customers?edit=${proposal.customer.id}`} className="underline">Abrir cliente</Link>}
          {proposal.invoices.length > 0 && <> · Fatura(s): {proposal.invoices.map((f) => f.invoiceNumber).join(', ')}</>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="jm-card grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:p-5">
            <div className="sm:col-span-2">
              <label className="jm-label">Título</label>
              <input disabled={readOnly} value={form.title} onChange={(e) => setField('title', e.target.value)} className="jm-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="jm-label">Para (cliente ou lead) *</label>
              <select disabled={readOnly} value={form.target} onChange={(e) => setField('target', e.target.value)} className="jm-input">
                <option value="">Selecione...</option>
                <optgroup label="Clientes">
                  {customers.map((c) => (
                    <option key={c.id} value={`c:${c.id}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Leads do funil">
                  {leads
                    .filter((l) => !l.customer)
                    .map((l) => (
                      <option key={l.id} value={`l:${l.id}`}>
                        {l.name}
                        {l.company ? ` — ${l.company}` : ''}
                      </option>
                    ))}
                </optgroup>
              </select>
              {Object.keys(groupPrices).length > 0 && <p className="jm-help">Preços sugeridos a partir da tabela do grupo do cliente.</p>}
            </div>
            <div>
              <label className="jm-label">Válida até</label>
              <input disabled={readOnly} type="date" value={form.validUntil} onChange={(e) => setField('validUntil', e.target.value)} className="jm-input" />
            </div>
            <div>
              <label className="jm-label">Vencimento da mensalidade</label>
              <select disabled={readOnly} value={form.dueDay} onChange={(e) => setField('dueDay', Number(e.target.value))} className="jm-input">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Dia {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="jm-card overflow-hidden">
            <div className="jm-card-header">
              <h2 className="jm-card-title">Itens</h2>
              {!readOnly && (
                <div className="flex gap-2">
                  <select value="" onChange={(e) => e.target.value && addProduct(e.target.value)} className="jm-input h-8 w-56 text-xs">
                    <option value="">+ Adicionar do catálogo...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatBRL(groupPrices[p.id] ?? p.price)}
                        {p.recurring ? '/mês' : ''})
                      </option>
                    ))}
                  </select>
                  <button onClick={addFreeItem} className="jm-btn jm-btn-secondary jm-btn-sm">
                    + Item livre
                  </button>
                </div>
              )}
            </div>
            {items.length === 0 ? (
              <div className="jm-empty py-10">Adicione produtos do catálogo ou itens livres.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="jm-table min-w-[680px]">
                  <thead>
                    <tr>
                      <th className="jm-th">Descrição</th>
                      <th className="jm-th w-20">Qtd.</th>
                      <th className="jm-th w-36 text-right">Valor unit. (R$)</th>
                      <th className="jm-th w-32">Cobrança</th>
                      <th className="jm-th w-32 text-right">Subtotal</th>
                      <th className="jm-th w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.key} className="jm-tr">
                        <td className="jm-td">
                          <input disabled={readOnly} value={i.description} onChange={(e) => updateItem(i.key, { description: e.target.value })} className="jm-input" placeholder="Descrição do item" />
                        </td>
                        <td className="jm-td">
                          <input
                            disabled={readOnly}
                            type="number"
                            min={1}
                            value={i.quantity}
                            onChange={(e) => updateItem(i.key, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                            className="jm-input text-right"
                          />
                        </td>
                        <td className="jm-td">
                          <input
                            disabled={readOnly}
                            inputMode="decimal"
                            value={i.priceText}
                            onChange={(e) => updateItem(i.key, { priceText: e.target.value.replace(/[^\d,.]/g, '') })}
                            className="jm-input text-right tabular-nums"
                          />
                        </td>
                        <td className="jm-td">
                          <select disabled={readOnly} value={i.recurring ? 'm' : 'u'} onChange={(e) => updateItem(i.key, { recurring: e.target.value === 'm' })} className="jm-input">
                            <option value="m">Mensal</option>
                            <option value="u">Única</option>
                          </select>
                        </td>
                        <td className="jm-td text-right tabular-nums">{formatBRL(i.quantity * parseMoney(i.priceText))}</td>
                        <td className="jm-td">
                          {!readOnly && (
                            <button
                              onClick={() => {
                                setItems((list) => list.filter((x) => x.key !== i.key));
                                setDirty(true);
                              }}
                              className="jm-icon-btn h-8 w-8"
                              title="Remover"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="jm-card p-4 md:p-5">
            <label className="jm-label">Observações e condições (aparecem no PDF)</label>
            <textarea
              disabled={readOnly}
              rows={4}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Ex.: Prazo de implantação de 7 dias úteis. Contrato mínimo de 12 meses. Valores não incluem o custo das conversas cobradas pela Meta."
              className="jm-input"
            />
          </div>
        </div>

        {/* Resumo e ações */}
        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <div className="jm-card space-y-3 p-4">
            <h2 className="jm-card-title">Resumo</h2>
            <Row label="Mensalidade bruta" value={formatBRL(totals.recurringGross)} />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-jm-muted">Desconto mensal (R$)</span>
              <input
                disabled={readOnly}
                inputMode="decimal"
                value={form.discountText}
                onChange={(e) => setField('discountText', e.target.value.replace(/[^\d,.]/g, ''))}
                className="jm-input h-8 w-28 text-right tabular-nums"
                placeholder="0,00"
              />
            </div>
            <div className="border-t border-jm-border pt-3">
              <Row label="Mensalidade" value={formatBRL(totals.recurring)} strong />
              <Row label="Cobrança única" value={formatBRL(totals.oneTime)} />
              <Row label="Primeiro ano" value={formatBRL(totals.recurring * 12 + totals.oneTime)} />
            </div>
          </div>

          <div className="jm-card space-y-2 p-4">
            {!readOnly && (
              <button onClick={save} disabled={saving || (!dirty && !!proposal)} className="jm-btn jm-btn-primary w-full">
                {saving ? 'Salvando...' : proposal ? (dirty ? 'Salvar alterações' : 'Salvo') : 'Criar proposta'}
              </button>
            )}
            {status === 'RASCUNHO' && proposal && (
              <button onClick={() => changeStatus('ENVIADA')} className="jm-btn jm-btn-secondary w-full">
                <Send className="h-4 w-4" /> Marcar como enviada
              </button>
            )}
            {(status === 'RASCUNHO' || status === 'ENVIADA') && proposal && (
              <>
                <button onClick={() => changeStatus('ACEITA')} className="jm-btn jm-btn-accent w-full">
                  <Check className="h-4 w-4" /> Cliente aceitou
                </button>
                <button onClick={() => changeStatus('RECUSADA')} className="jm-btn jm-btn-secondary w-full">
                  <X className="h-4 w-4" /> Recusada
                </button>
              </>
            )}
            {(status === 'ENVIADA' || status === 'RECUSADA') && (
              <button onClick={() => changeStatus('RASCUNHO')} className="jm-btn jm-btn-ghost w-full">
                <Undo2 className="h-4 w-4" /> Voltar para rascunho
              </button>
            )}
            {proposal && (
              <button onClick={duplicate} className="jm-btn jm-btn-ghost w-full">
                <Copy className="h-4 w-4" /> Duplicar como nova versão
              </button>
            )}
            {status !== 'ACEITA' && (
              <button onClick={remove} className="jm-btn jm-btn-ghost w-full text-jm-danger-fg hover:bg-jm-danger-bg">
                <Trash2 className="h-4 w-4" /> {proposal ? 'Excluir proposta' : 'Descartar'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-jm-muted">{label}</span>
      <span className={`tabular-nums ${strong ? 'text-base font-semibold text-jm-fg' : 'text-jm-fg2'}`}>{value}</span>
    </div>
  );
}
