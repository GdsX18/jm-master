'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Search,
  Filter,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Briefcase,
  Headphones,
  Users,
  Award,
  AlertCircle,
  X,
  Save,
  Pencil,
  Globe,
} from 'lucide-react';
import { peekCache, setCache } from '../lib/cache';

interface CrmItem {
  id: string;
  operator: string;
  customerId?: string | null;
  customerName?: string;
  customer?: { id: string; name: string } | null;
  title: string;
  description: string;
  date: string;
  type: string;
  badge?: string;
  createdAt?: string;
}

const TYPE_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  COMERCIAL: { label: 'Comercial', badge: 'jm-badge-accent', icon: Briefcase },
  SUPORTE: { label: 'Suporte', badge: 'jm-badge-primary', icon: Headphones },
  REUNIAO: { label: 'Reunião', badge: 'jm-badge-success', icon: Users },
  NPS: { label: 'NPS & Feedback', badge: 'jm-badge-neutral', icon: Award },
  COBRANCA: { label: 'Cobrança', badge: 'jm-badge-warning', icon: Clock },
  LEAD: { label: 'Lead do Site', badge: 'jm-badge-primary', icon: Globe },
  OUTROS: { label: 'Outros', badge: 'jm-badge-neutral', icon: MessageSquare },
};

export default function CrmHistoryPage() {
  const [interactions, setInteractions] = useState<CrmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [operatorName, setOperatorName] = useState('');

  const emptyForm = { customerId: '', customerName: '', title: '', description: '', type: 'COMERCIAL' };
  const [formData, setFormData] = useState(emptyForm);

  // Responsável é definido no servidor pelo usuário logado; aqui só exibimos
  useEffect(() => {
    try {
      const stored = localStorage.getItem('@JMMaster:user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.name) setOperatorName(`${u.name} (${u.role})`);
      }
    } catch {}

    const cachedCustomers = peekCache<any[]>('/api/customers');
    if (Array.isArray(cachedCustomers)) setCustomers(cachedCustomers.map((c: any) => ({ id: c.id, name: c.name })));
    fetch('/api/customers', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCache('/api/customers', data);
        return Array.isArray(data) && setCustomers(data.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, []);

  const loadInteractions = async () => {
    const cached = peekCache<CrmItem[]>('/api/crm');
    if (cached) {
      setInteractions(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setLoadError('');
    try {
      const res = await fetch('/api/crm', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.interactions)) throw new Error(data.error || 'Erro ao carregar o CRM');
      setInteractions(data.interactions);
      setCache('/api/crm', data.interactions);
    } catch (e: any) {
      setLoadError(e.message || 'Erro ao carregar o CRM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInteractions();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setFormError('');
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (item: CrmItem) => {
    setEditingId(item.id);
    setFormError('');
    setFormData({
      customerId: item.customerId || '',
      customerName: item.customerId ? '' : item.customerName || '',
      title: item.title,
      description: item.description,
      type: item.type,
    });
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError('Preencha o título e a descrição.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/crm', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingId || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao salvar registro');
      setIsModalOpen(false);
      setFormData(emptyForm);
      loadInteractions();
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar registro');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de atendimento?')) return;
    try {
      const res = await fetch(`/api/crm?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao excluir');
      setInteractions((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir');
    }
  };

  // Filtros combinados
  const filteredInteractions = interactions.filter((item) => {
    const cust = item.customerName || item.customer?.name || '';
    const matchSearch =
      cust.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    const matchType = filterType === 'all' || item.type === filterType;

    return matchSearch && matchType;
  });

  return (
    <div className="jm-page">

      {/* HEADER */}
      <div className="jm-page-header">
        <div>
          <h1 className="jm-page-title">CRM & Linha do Tempo</h1>
          <p className="jm-page-desc">
            Histórico oficial de atendimentos, reuniões comerciais e tratativas com clientes.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="jm-btn jm-btn-accent shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Interação</span>
        </button>
      </div>

      {loadError && (
        <div role="alert" className="jm-alert jm-alert-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* BARRA DE FILTROS & PESQUISA */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, assunto ou descrição..."
            className="jm-input pl-9"
          />
        </div>

        {/* Abas de Tipos */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none]">
          <div className="jm-segmented">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`jm-segment ${filterType === 'all' ? 'jm-segment-active' : ''}`}
            >
              Todos <span className="tabular-nums text-jm-muted">{interactions.length}</span>
            </button>
            {Object.keys(TYPE_CONFIG).map((typeKey) => {
              const count = interactions.filter((i) => i.type === typeKey).length;
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => setFilterType(typeKey)}
                  className={`jm-segment ${filterType === typeKey ? 'jm-segment-active' : ''}`}
                >
                  {TYPE_CONFIG[typeKey].label} {count > 0 && <span className="tabular-nums text-jm-muted">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TIMELINE DE TRATATIVAS */}
      <div className="jm-card">
        <div className="jm-card-header">
          <h2 className="jm-card-title">Linha do Tempo de Atendimentos</h2>
          <span className="text-xs tabular-nums text-jm-muted">{filteredInteractions.length} registros</span>
        </div>

        {loading ? (
          <div className="jm-empty">
            Carregando registros do banco de dados...
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="jm-empty">
            <MessageSquare className="mb-1 h-6 w-6 text-jm-muted" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-jm-fg">
              {interactions.length > 0 ? 'Nenhum registro encontrado para o filtro' : 'Nenhuma interação registrada ainda'}
            </h3>
            <p className="max-w-sm text-sm text-jm-muted">
              Utilize o botão acima para registrar o primeiro atendimento, reunião ou contato comercial no CRM.
            </p>
            <button
              type="button"
              onClick={openNew}
              className="jm-btn jm-btn-primary mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Primeiro Atendimento</span>
            </button>
          </div>
        ) : (
          <ol className="px-4 py-4 md:px-5">
            {filteredInteractions.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.COMERCIAL;
              const IconComponent = config.icon;

              return (
                <li key={item.id} className="group relative border-l border-jm-border pb-6 pl-5 last:pb-1">
                  <div className="absolute -left-[4.5px] top-[7px] h-2 w-2 rounded-full bg-jm-accent-line" />

                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className={`jm-badge ${config.badge}`}>
                        <IconComponent className="h-3 w-3" />
                        <span>{config.label}</span>
                      </span>
                      <span className="truncate text-[13px] font-medium text-jm-fg">
                        {item.customer?.name || item.customerName || 'Cliente Geral'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="mr-1 flex items-center gap-1 text-xs tabular-nums text-jm-muted">
                        <Calendar className="h-3 w-3" />
                        <span>{item.date}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="jm-icon-btn h-7 w-7 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                        title="Editar Registro"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="jm-icon-btn h-7 w-7 hover:text-jm-danger-fg lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                        title="Excluir Registro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="mt-1.5 text-sm font-semibold text-jm-fg">
                    {item.title}
                  </h4>

                  <p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-jm-fg2">
                    {item.description}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-jm-muted">
                    <UserIcon className="h-3 w-3" />
                    <span>Responsável: <strong className="font-medium text-jm-fg2">{item.operator || 'Equipe JM Master'}</strong></span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* MODAL REGISTRAR INTERAÇÃO */}
      {isModalOpen && (
        <div className="jm-overlay">
          <div className="jm-modal">
            <div className="jm-modal-header">
              <h3 className="jm-modal-title">
                {editingId ? 'Editar Interação' : 'Registrar Nova Interação CRM'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="jm-icon-btn"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
              <div className="jm-modal-body space-y-4">
                {formError && (
                  <div role="alert" className="jm-alert jm-alert-danger">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div>
                  <label className="jm-label">
                    Tipo de Interação
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="jm-input"
                  >
                    <option value="COMERCIAL">Comercial / Vendas</option>
                    <option value="SUPORTE">Suporte Técnico</option>
                    <option value="REUNIAO">Reunião / Apresentação</option>
                    <option value="NPS">NPS / Feedback</option>
                    <option value="COBRANCA">Cobrança / Financeiro</option>
                    <option value="LEAD">Lead do Site</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="jm-label">
                    Cliente / Empresa
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="jm-input"
                  >
                    <option value="">— Não cadastrado (digitar nome) —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {!formData.customerId && (
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="Ex: Empresa ABC Ltda"
                      className="jm-input mt-2"
                    />
                  )}
                </div>

                <div>
                  <label className="jm-label">
                    Título da Tratativa
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Alinhamento de Proposta WhatsApp API Oficial"
                    className="jm-input"
                  />
                </div>

                <div>
                  <label className="jm-label">
                    Descrição / Detalhes
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o que foi tratado, decisões tomadas e próximos passos acordados..."
                    className="jm-input"
                  />
                </div>

                <div>
                  <label className="jm-label">
                    Responsável / Operador
                  </label>
                  <p className="flex h-9 w-full items-center rounded-[4px] border border-jm-border bg-jm-subtle px-3 text-sm text-jm-muted">
                    {editingId ? 'Mantido o responsável original' : operatorName || 'Usuário logado'}
                  </p>
                </div>
              </div>

              <div className="jm-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="jm-btn jm-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="jm-btn jm-btn-primary"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saving ? 'Salvando...' : 'Salvar Registro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
