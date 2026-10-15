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
  COMERCIAL: {
    label: 'Comercial',
    badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    icon: Briefcase,
  },
  SUPORTE: {
    label: 'Suporte',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    icon: Headphones,
  },
  REUNIAO: {
    label: 'Reunião',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    icon: Users,
  },
  NPS: {
    label: 'NPS & Feedback',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    icon: Award,
  },
  COBRANCA: {
    label: 'Cobrança',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    icon: Clock,
  },
  LEAD: {
    label: 'Lead do Site',
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    icon: Globe,
  },
  OUTROS: {
    label: 'Outros',
    badge: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700',
    icon: MessageSquare,
  },
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

    fetch('/api/customers', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => Array.isArray(data) && setCustomers(data.map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  const loadInteractions = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/crm', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.interactions)) throw new Error(data.error || 'Erro ao carregar o CRM');
      setInteractions(data.interactions);
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
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-jm-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-jm-text flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-jm-orange" />
            <span>CRM & Linha do Tempo</span>
          </h1>
          <p className="text-xs text-jm-muted mt-1">
            Histórico oficial de atendimentos, reuniões comerciais e tratativas com clientes.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="jm-btn jm-btn-primary shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Interação</span>
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* BARRA DE FILTROS & PESQUISA */}
      <div className="jm-card p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-jm-muted absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, assunto ou descrição..."
            className="jm-input pl-9 text-xs"
          />
        </div>

        {/* Abas de Tipos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-jm-blue-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                : 'text-jm-muted hover:text-jm-text hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Todos ({interactions.length})
          </button>
          {Object.keys(TYPE_CONFIG).map((typeKey) => {
            const count = interactions.filter((i) => i.type === typeKey).length;
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => setFilterType(typeKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  filterType === typeKey
                    ? 'bg-jm-orange text-white shadow-xs'
                    : 'text-jm-muted hover:text-jm-text hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {TYPE_CONFIG[typeKey].label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* TIMELINE DE TRATATIVAS */}
      <div className="jm-card p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-jm-border pb-4">
          <h2 className="text-sm font-semibold text-jm-text">Linha do Tempo de Atendimentos</h2>
          <span className="text-xs text-jm-muted font-medium">{filteredInteractions.length} registros</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-jm-muted font-medium animate-pulse">
            Carregando registros do banco de dados...
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center justify-center text-jm-orange">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-jm-text">
              {interactions.length > 0 ? 'Nenhum registro encontrado para o filtro' : 'Nenhuma interação registrada ainda'}
            </h3>
            <p className="text-xs text-jm-muted max-w-sm mx-auto">
              Utilize o botão acima para registrar o primeiro atendimento, reunião ou contato comercial no CRM.
            </p>
            <button
              type="button"
              onClick={openNew}
              className="mt-2 jm-btn jm-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primeiro Atendimento</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredInteractions.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.COMERCIAL;
              const IconComponent = config.icon;

              return (
                <div key={item.id} className="relative pl-6 border-l-2 border-jm-border space-y-2 group pb-6 last:pb-0">
                  <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-jm-orange ring-4 ring-jm-surface" />
                  
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${config.badge}`}>
                        <IconComponent className="w-3 h-3" />
                        <span>{config.label}</span>
                      </span>
                      <span className="text-xs font-semibold text-jm-text">
                        {item.customer?.name || item.customerName || 'Cliente Geral'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-jm-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-jm-muted" />
                        <span>{item.date}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-jm-muted hover:text-jm-orange p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        title="Editar Registro"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-jm-muted hover:text-rose-600 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-jm-text">
                    {item.title}
                  </h4>

                  <p className="text-xs text-jm-muted leading-relaxed max-w-3xl whitespace-pre-wrap">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-jm-muted">
                    <UserIcon className="w-3 h-3" />
                    <span>Responsável: <strong className="text-jm-text font-medium">{item.operator || 'Equipe JM Master'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR INTERAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="jm-card w-full max-w-lg overflow-hidden shadow-xl border border-jm-border animate-fadeIn">
            <div className="flex items-center justify-between p-5 border-b border-jm-border bg-neutral-50/50 dark:bg-neutral-900/50">
              <h3 className="text-sm font-semibold text-jm-text flex items-center gap-2">
                <Plus className="w-4 h-4 text-jm-orange" />
                <span>{editingId ? 'Editar Interação' : 'Registrar Nova Interação CRM'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-jm-muted hover:text-jm-text p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-jm-text mb-1.5">
                  Tipo de Interação
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="jm-input text-xs font-semibold"
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
                <label className="block text-xs font-semibold text-jm-text mb-1.5">
                  Cliente / Empresa
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="jm-input text-xs font-semibold"
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
                    className="mt-2 jm-input text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-jm-text mb-1.5">
                  Título da Tratativa
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Alinhamento de Proposta WhatsApp API Oficial"
                  className="jm-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-jm-text mb-1.5">
                  Descrição / Detalhes
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o que foi tratado, decisões tomadas e próximos passos acordados..."
                  className="jm-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-jm-text mb-1.5">
                  Responsável / Operador
                </label>
                <p className="w-full px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-900 border border-jm-border rounded-lg text-jm-muted">
                  {editingId ? 'Mantido o responsável original' : operatorName || 'Usuário logado'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
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
                  <Save className="w-3.5 h-3.5" />
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
