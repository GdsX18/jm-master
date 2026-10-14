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
    badge: 'bg-orange-500/10 text-[#E85D26] border border-orange-500/20',
    icon: Briefcase,
  },
  SUPORTE: {
    label: 'Suporte',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
    icon: Headphones,
  },
  REUNIAO: {
    label: 'Reunião',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    icon: Users,
  },
  NPS: {
    label: 'NPS & Feedback',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
    icon: Award,
  },
  COBRANCA: {
    label: 'Cobrança',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    icon: Clock,
  },
  LEAD: {
    label: 'Lead do Site',
    badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
    icon: Globe,
  },
  OUTROS: {
    label: 'Outros',
    badge: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20',
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
    <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-white min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-[#E85D26]" />
            <span>CRM & Linha do Tempo</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Histórico oficial de atendimentos, reuniões comerciais e tratativas com clientes.
          </p>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="bg-[#E85D26] hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTRAR INTERAÇÃO</span>
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* BARRA DE FILTROS & PESQUISA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, assunto ou descrição..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
          />
        </div>

        {/* Abas de Tipos */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterType === typeKey
                    ? 'bg-[#E85D26] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {TYPE_CONFIG[typeKey].label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* TIMELINE DE TRATATIVAS */}
      <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Linha do Tempo de Atendimentos</h2>
          <span className="text-xs text-neutral-400 font-semibold">{filteredInteractions.length} registros</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400 font-semibold animate-pulse">
            Carregando registros do banco de dados...
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#E85D26]">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-neutral-800 dark:text-neutral-200">
              {interactions.length > 0 ? 'Nenhum registro encontrado para o filtro' : 'Nenhuma interação registrada ainda'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              Utilize o botão acima para registrar o primeiro atendimento, reunião ou contato comercial no CRM.
            </p>
            <button
              type="button"
              onClick={openNew}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#E85D26] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Primeiro Atendimento</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredInteractions.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.COMERCIAL;
              const IconComponent = config.icon;

              return (
                <div key={item.id} className="relative pl-6 border-l-2 border-[#E85D26]/40 space-y-2 group">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#E85D26] border-2 border-white dark:border-neutral-900" />
                  
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${config.badge}`}>
                        <IconComponent className="w-3 h-3" />
                        <span>{config.label}</span>
                      </span>
                      <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                        {item.customer?.name || item.customerName || 'Cliente Geral'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        <span>{item.date}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-neutral-400 hover:text-[#E85D26] p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        title="Editar Registro"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-rose-500 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                    {item.title}
                  </h4>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-3xl whitespace-pre-wrap">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400 font-medium">
                    <UserIcon className="w-3 h-3" />
                    <span>Responsável: <strong className="text-neutral-700 dark:text-neutral-300">{item.operator || 'Equipe JM Master'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR INTERAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E85D26]" />
                <span>{editingId ? 'Editar Interação' : 'Registrar Nova Interação CRM'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tipo de Interação
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white font-semibold focus:outline-none focus:border-[#E85D26]"
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
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Cliente / Empresa
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white font-semibold focus:outline-none focus:border-[#E85D26]"
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
                    className="mt-2 w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Título da Tratativa
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Alinhamento de Proposta WhatsApp API Oficial"
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Descrição / Detalhes
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o que foi tratado, decisões tomadas e próximos passos acordados..."
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Responsável / Operador
                </label>
                <p className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500">
                  {editingId ? 'Mantido o responsável original' : operatorName || 'Usuário logado'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#E85D26] hover:bg-orange-600 text-white rounded-xl font-bold transition shadow-md shadow-orange-900/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
