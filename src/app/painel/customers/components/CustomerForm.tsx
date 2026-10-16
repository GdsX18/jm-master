'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { documentError } from '@/lib/validators';
import { api } from '../../lib/api';
import { formatDateTime, maskDocument, maskPhone, maskZipCode } from '../../lib/format';
import { useNotify } from '../../components/ui/Notifications';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '../../components/ui/UnsavedChangesModal';
import CustomerTimeline from './CustomerTimeline';
import type { ContactInput, CustomerDetail, CustomerDocument, CustomerNote, GroupItem } from '../types';

type Tab = 'geral' | 'contatos' | 'documentos' | 'observacoes' | 'historico';

const EMPTY_CONTACT: ContactInput = { name: '', phone: '', email: '', role: '' };

interface FormState {
  name: string;
  document: string;
  code: string;
  type: 'PRE_PAGO' | 'POS_PAGO';
  isActive: boolean;
  groupIds: string[];
  zipCode: string;
  street: string;
  number: string;
  state: string;
  city: string;
  contacts: ContactInput[];
}

const EMPTY_FORM: FormState = {
  name: '',
  document: '',
  code: '',
  type: 'POS_PAGO',
  isActive: true,
  groupIds: [],
  zipCode: '',
  street: '',
  number: '',
  state: '',
  city: '',
  contacts: [{ ...EMPTY_CONTACT }],
};

function fromDetail(c: CustomerDetail): FormState {
  return {
    name: c.name,
    document: maskDocument(c.document),
    code: c.code,
    type: c.type,
    isActive: c.isActive,
    groupIds: c.groupIds,
    zipCode: maskZipCode(c.zipCode),
    street: c.street,
    number: c.number,
    state: c.state,
    city: c.city,
    contacts: c.contacts.length
      ? c.contacts.map((ct) => ({ name: ct.name || '', phone: maskPhone(ct.phone || ''), email: ct.email || '', role: ct.role || '' }))
      : [{ ...EMPTY_CONTACT }],
  };
}

export default function CustomerForm({
  customerId,
  groups,
  onBack,
  onCreated,
}: {
  customerId: string | null;
  groups: GroupItem[];
  onBack: () => void;
  onCreated: (id: string) => void;
}) {
  const { toast } = useNotify();
  const { isDirty, markDirty, markClean } = useUnsavedChanges();
  const [tab, setTab] = useState<Tab>('geral');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(!!customerId);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showUnsaved, setShowUnsaved] = useState(false);

  const [states, setStates] = useState<{ sigla: string; nome: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const loadDetail = useCallback(async () => {
    if (!customerId) return;
    try {
      const data = await api<CustomerDetail>(`/api/customers/${customerId}`);
      setForm(fromDetail(data));
      setDocuments(data.documents);
      setNotes(data.notes);
    } catch (e) {
      toast.error('Erro ao carregar cliente', e instanceof Error ? e.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [customerId, toast]);

  useEffect(() => {
    setForm(EMPTY_FORM);
    setDocuments([]);
    setNotes([]);
    setTab('geral');
    setLoading(!!customerId);
    loadDetail();
  }, [customerId, loadDetail]);

  // Estados e cidades do IBGE (sem bloquear o formulário se a API estiver fora)
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?ordenar=nome')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setStates(data.map((s: any) => ({ sigla: s.sigla, nome: s.nome }))))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!form.state) return setCities([]);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.state}/municipios?ordenar=nome`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCities(data.map((c: any) => c.nome)))
      .catch(() => {});
  }, [form.state]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    markDirty();
  };

  const docError = useMemo(() => documentError(form.document), [form.document]);

  const handleZip = async (value: string) => {
    const masked = maskZipCode(value);
    update('zipCode', masked);
    const digits = masked.replace(/\D/g, '');
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({ ...f, street: data.logradouro || f.street, state: data.uf || f.state, city: data.localidade || f.city }));
      } else {
        toast.warning('CEP não encontrado', 'Confira o número ou preencha o endereço manualmente.');
      }
    } catch {
      // ViaCEP indisponível: segue com preenchimento manual
    }
  };

  const setContact = (index: number, field: keyof ContactInput, value: string) => {
    setForm((f) => ({
      ...f,
      contacts: f.contacts.map((c, i) => (i === index ? { ...c, [field]: field === 'phone' ? maskPhone(value) : value } : c)),
    }));
    markDirty();
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setTab('geral');
      return setFormError('Informe a razão social / nome do cliente.');
    }
    if (docError) {
      setTab('geral');
      return setFormError(docError);
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        contacts: form.contacts.filter((c) => c.name.trim() || c.phone.trim() || c.email.trim()),
      };
      if (customerId) {
        const res = await api<{ customer: CustomerDetail }>(`/api/customers/${customerId}`, { method: 'PUT', json: payload });
        setForm(fromDetail(res.customer));
        markClean();
        toast.success('Alterações salvas', 'O cadastro do cliente foi atualizado.');
      } else {
        const res = await api<CustomerDetail>('/api/customers', { method: 'POST', json: payload });
        markClean();
        toast.success('Cliente cadastrado', 'Agora você pode anexar documentos e registrar observações.');
        onCreated(res.id);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const requestBack = () => {
    if (isDirty) setShowUnsaved(true);
    else onBack();
  };

  const currentCities = form.city && !cities.includes(form.city) ? [...cities, form.city] : cities;

  if (loading) {
    return <div className="jm-card jm-empty">Carregando cadastro...</div>;
  }

  return (
    <div className="space-y-4">
      <UnsavedChangesModal
        isOpen={showUnsaved}
        isSaving={saving}
        onSave={async () => {
          setShowUnsaved(false);
          await save();
        }}
        onDiscard={() => {
          markClean();
          setShowUnsaved(false);
          onBack();
        }}
        onCancel={() => setShowUnsaved(false)}
      />

      <div className="jm-page-header">
        <div className="min-w-0">
          <button onClick={requestBack} className="mb-1 inline-flex items-center gap-1 text-xs text-jm-muted hover:text-jm-fg">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para a lista
          </button>
          <h1 className="jm-page-title truncate">{customerId ? form.name || 'Cliente' : 'Cadastrar novo cliente'}</h1>
          {customerId && (
            <p className="jm-page-desc">
              <Link href={`/painel/proposals?new=1&customer=${customerId}`} className="jm-link">
                Nova proposta
              </Link>
              {' · '}
              <Link href={`/painel/finance?tab=recorrentes&customer=${customerId}`} className="jm-link">
                Cobrança recorrente
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="jm-tabs">
        {(
          [
            ['geral', '1. Dados gerais & endereço'],
            ['contatos', `2. Contatos (${form.contacts.filter((c) => c.name).length})`],
            ['documentos', `3. Documentos (${documents.length})`],
            ['observacoes', `4. Observações (${notes.length})`],
            ['historico', '5. Histórico'],
          ] as [Tab, string][]
        ).map(([key, label]) => {
          const disabled = !customerId && key !== 'geral' && key !== 'contatos';
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              title={disabled ? 'Salve o cliente para liberar esta aba' : undefined}
              onClick={() => setTab(key)}
              className={`jm-tab ${tab === key ? 'jm-tab-active' : ''} ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {(tab === 'geral' || tab === 'contatos') && (
        <form onSubmit={save} className="jm-card space-y-6 p-4 sm:p-5 md:p-6">
          {formError && <div className="jm-alert jm-alert-danger">{formError}</div>}

          {tab === 'geral' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Razão social / Nome completo *">
                <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex.: JM Master Group LTDA" className="jm-input" />
              </Field>
              <Field label="CPF ou CNPJ" error={form.document && docError ? docError : undefined}>
                <input
                  value={form.document}
                  onChange={(e) => update('document', maskDocument(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className={`jm-input ${form.document && docError ? 'border-jm-danger-fg' : ''}`}
                />
              </Field>
              <Field label="Código interno (opcional)">
                <input value={form.code} onChange={(e) => update('code', e.target.value)} placeholder="Ex.: CLI-102" className="jm-input" />
              </Field>
              <Field label="Tipo de consumo">
                <select value={form.type} onChange={(e) => update('type', e.target.value as FormState['type'])} className="jm-input">
                  <option value="POS_PAGO">Pós-pago (fechamento)</option>
                  <option value="PRE_PAGO">Pré-pago</option>
                </select>
              </Field>
              <Field label="Status da empresa">
                <select value={form.isActive ? 'true' : 'false'} onChange={(e) => update('isActive', e.target.value === 'true')} className="jm-input">
                  <option value="true">Ativo</option>
                  <option value="false">Inativo (não gera cobrança recorrente)</option>
                </select>
              </Field>
              <Field label="Grupos corporativos (definem a tabela de preços)">
                <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[4px] border border-jm-border-strong bg-jm-surface p-1.5">
                  {groups.length === 0 ? (
                    <span className="px-1.5 text-xs text-jm-muted">Nenhum grupo cadastrado. Crie na aba Grupos.</span>
                  ) : (
                    groups.map((g) => {
                      const selected = form.groupIds.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() =>
                            update('groupIds', selected ? form.groupIds.filter((id) => id !== g.id) : [...form.groupIds, g.id])
                          }
                          className={`flex h-7 items-center gap-1 rounded-[3px] border px-2.5 text-xs font-medium transition-colors ${
                            selected
                              ? 'border-jm-primary-border bg-jm-primary-soft text-jm-primary-text'
                              : 'border-jm-border bg-jm-subtle text-jm-fg2 hover:bg-jm-hover hover:text-jm-fg'
                          } ${!g.isActive ? 'opacity-60' : ''}`}
                          title={!g.isActive ? 'Grupo inativo' : undefined}
                        >
                          {selected && <span>✓</span>}
                          {g.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </Field>

              <div className="mt-2 border-t border-jm-border pt-5 md:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-jm-fg">Endereço</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <Field label="CEP">
                    <input value={form.zipCode} onChange={(e) => handleZip(e.target.value)} placeholder="00000-000" className="jm-input" />
                  </Field>
                  <Field label="Rua / Avenida" className="md:col-span-2">
                    <input value={form.street} onChange={(e) => update('street', e.target.value)} placeholder="Ex.: Av. Rio Branco" className="jm-input" />
                  </Field>
                  <Field label="Número">
                    <input value={form.number} onChange={(e) => update('number', e.target.value)} placeholder="123" className="jm-input" />
                  </Field>
                  <Field label="Estado (UF)">
                    <select
                      value={form.state}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, state: e.target.value, city: '' }));
                        markDirty();
                      }}
                      className="jm-input"
                    >
                      <option value="">Selecione...</option>
                      {states.map((s) => (
                        <option key={s.sigla} value={s.sigla}>
                          {s.nome} ({s.sigla})
                        </option>
                      ))}
                      {form.state && !states.some((s) => s.sigla === form.state) && <option value={form.state}>{form.state}</option>}
                    </select>
                  </Field>
                  <Field label="Cidade" className="md:col-span-2">
                    <select value={form.city} onChange={(e) => update('city', e.target.value)} disabled={!form.state} className="jm-input">
                      <option value="">Selecione...</option>
                      {currentCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {tab === 'contatos' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-jm-fg">Contatos</h3>
                  <p className="text-xs text-jm-muted">O primeiro contato é usado como telefone/e-mail principal (cobrança via WhatsApp).</p>
                </div>
                <button type="button" onClick={() => update('contacts', [...form.contacts, { ...EMPTY_CONTACT }])} className="jm-btn jm-btn-secondary jm-btn-sm">
                  + Adicionar contato
                </button>
              </div>
              {form.contacts.map((contact, index) => (
                <div key={index} className="relative grid grid-cols-1 gap-3 rounded-[4px] border border-jm-border bg-jm-subtle p-4 pt-8 sm:grid-cols-2 lg:grid-cols-4">
                  {index === 0 && <span className="jm-badge jm-badge-primary absolute left-3 top-2">Principal</span>}
                  <Field label="Nome">
                    <input value={contact.name} onChange={(e) => setContact(index, 'name', e.target.value)} placeholder="Ex.: Camila Souza" className="jm-input" />
                  </Field>
                  <Field label="Cargo">
                    <input value={contact.role} onChange={(e) => setContact(index, 'role', e.target.value)} placeholder="Ex.: Gerente de TI" className="jm-input" />
                  </Field>
                  <Field label="Telefone / WhatsApp">
                    <input value={contact.phone} onChange={(e) => setContact(index, 'phone', e.target.value)} placeholder="(00) 00000-0000" className="jm-input" />
                  </Field>
                  <Field label="E-mail">
                    <input type="email" value={contact.email} onChange={(e) => setContact(index, 'email', e.target.value)} placeholder="camila@empresa.com.br" className="jm-input" />
                  </Field>
                  {form.contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => update('contacts', form.contacts.filter((_, i) => i !== index))}
                      className="absolute right-2 top-1.5 rounded-[3px] px-1.5 py-0.5 text-xs font-medium text-jm-danger-fg hover:bg-jm-danger-bg"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end border-t border-jm-border pt-4">
            <button type="submit" disabled={saving} className="jm-btn jm-btn-accent w-full sm:w-auto">
              {saving ? 'Salvando...' : customerId ? 'Salvar alterações' : 'Cadastrar cliente'}
            </button>
          </div>
        </form>
      )}

      {tab === 'documentos' && customerId && (
        <DocumentsTab customerId={customerId} documents={documents} reload={loadDetail} />
      )}
      {tab === 'observacoes' && customerId && <NotesTab customerId={customerId} notes={notes} reload={loadDetail} />}
      {tab === 'historico' && customerId && <CustomerTimeline customerId={customerId} />}
    </div>
  );
}

function DocumentsTab({ customerId, documents, reload }: { customerId: string; documents: CustomerDocument[]; reload: () => Promise<void> }) {
  const { toast, confirm } = useNotify();
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.warning('Arquivo muito grande', 'O limite é 10 MB.');
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('name', docName || file.name);
      await api(`/api/customers/${customerId}/documents`, { method: 'POST', body });
      setFile(null);
      setDocName('');
      await reload();
      toast.success('Documento anexado');
    } catch (e) {
      toast.error('Erro no upload', e instanceof Error ? e.message : undefined);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (doc: CustomerDocument) => {
    const ok = await confirm({ title: 'Excluir documento', message: `Excluir "${doc.name}" permanentemente?`, confirmLabel: 'Sim, excluir', variant: 'danger' });
    if (!ok) return;
    try {
      await api(`/api/customers/${customerId}/documents/${doc.id}`, { method: 'DELETE' });
      await reload();
      toast.success('Documento excluído');
    } catch (e) {
      toast.error('Erro ao excluir', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <div className="jm-card space-y-5 p-4 sm:p-5 md:p-6">
      <div className="space-y-4 rounded-[4px] border border-jm-border bg-jm-subtle p-4">
        <h4 className="text-[13px] font-semibold text-jm-fg">Anexar arquivo (PDF, imagem, Word, Excel, CSV, TXT ou ZIP — até 10 MB)</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Nome / descrição">
            <input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Ex.: Contrato de prestação de serviços" className="jm-input" />
          </Field>
          <Field label="Arquivo">
            <input
              key={file ? 'f' : 'empty'}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full cursor-pointer text-sm text-jm-muted file:mr-3 file:h-9 file:cursor-pointer file:rounded-[4px] file:border file:border-solid file:border-jm-border-strong file:bg-jm-surface file:px-3 file:text-xs file:font-medium file:text-jm-fg2 hover:file:bg-jm-hover"
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={upload} disabled={uploading || !file} className="jm-btn jm-btn-primary">
            {uploading ? 'Enviando...' : 'Enviar documento'}
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-[4px] border border-dashed border-jm-border-strong bg-jm-subtle py-6 text-center text-xs text-jm-muted">
          Nenhum documento anexado.
        </div>
      ) : (
        <div className="jm-table-wrap">
          <table className="jm-table min-w-[680px]">
            <thead>
              <tr>
                <th className="jm-th">Documento</th>
                <th className="jm-th">Arquivo</th>
                <th className="jm-th">Tamanho</th>
                <th className="jm-th">Enviado por</th>
                <th className="jm-th">Data</th>
                <th className="jm-th text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="jm-tr">
                  <td className="jm-td font-medium text-jm-fg">{doc.name}</td>
                  <td className="jm-td font-mono text-xs text-jm-muted">{doc.originalName}</td>
                  <td className="jm-td tabular-nums">{(doc.size / 1024).toFixed(1)} KB</td>
                  <td className="jm-td">{doc.userEmail}</td>
                  <td className="jm-td tabular-nums">{formatDateTime(doc.createdAt)}</td>
                  <td className="jm-td space-x-1.5 whitespace-nowrap text-right">
                    <a href={`/api/customers/documents/${doc.id}/download`} target="_blank" rel="noopener" className="jm-btn jm-btn-secondary jm-btn-sm">
                      Baixar
                    </a>
                    <button type="button" onClick={() => remove(doc)} className="jm-btn jm-btn-danger jm-btn-sm">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NotesTab({ customerId, notes, reload }: { customerId: string; notes: CustomerNote[]; reload: () => Promise<void> }) {
  const { toast, confirm } = useNotify();
  const [content, setContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const add = async () => {
    if (!content.trim()) return;
    setSavingNote(true);
    try {
      await api(`/api/customers/${customerId}/notes`, { method: 'POST', json: { content } });
      setContent('');
      await reload();
      toast.success('Observação registrada');
    } catch (e) {
      toast.error('Erro ao salvar', e instanceof Error ? e.message : undefined);
    } finally {
      setSavingNote(false);
    }
  };

  const remove = async (note: CustomerNote) => {
    const ok = await confirm({ title: 'Excluir observação', message: 'Excluir esta observação? A exclusão fica registrada na auditoria.', confirmLabel: 'Sim, excluir', variant: 'danger' });
    if (!ok) return;
    try {
      await api(`/api/customers/${customerId}/notes/${note.id}`, { method: 'DELETE' });
      await reload();
    } catch (e) {
      toast.error('Erro ao excluir', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <div className="jm-card space-y-5 p-4 sm:p-5 md:p-6">
      <div className="space-y-2">
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nova anotação interna sobre o cliente..." rows={3} className="jm-input" />
        <div className="flex justify-end">
          <button type="button" onClick={add} disabled={savingNote || !content.trim()} className="jm-btn jm-btn-primary">
            {savingNote ? 'Salvando...' : 'Registrar observação'}
          </button>
        </div>
      </div>
      {notes.length === 0 ? (
        <div className="rounded-[4px] border border-dashed border-jm-border-strong bg-jm-subtle py-6 text-center text-xs text-jm-muted">
          Nenhuma anotação registrada.
        </div>
      ) : (
        <div className="relative space-y-3 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-jm-border">
          {notes.map((note) => (
            <div key={note.id} className="relative pl-6">
              <div className="absolute left-[4px] top-3.5 h-[7px] w-[7px] rounded-full bg-jm-accent-line" />
              <div className="group rounded-[4px] border border-jm-border bg-jm-subtle px-3.5 py-3">
                <div className="flex items-start justify-between gap-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-jm-fg">{note.content}</p>
                  <button
                    type="button"
                    onClick={() => remove(note)}
                    title="Excluir observação"
                    className="jm-icon-btn h-7 w-7 hover:bg-jm-danger-bg hover:text-jm-danger-fg sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2 border-t border-jm-border pt-2 text-[11px] text-jm-muted">
                  {note.userEmail} · {formatDateTime(note.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, error, className = '', children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="jm-label !mb-0">{label}</label>
      {children}
      {error && <p className="text-xs text-jm-danger-fg">{error}</p>}
    </div>
  );
}
