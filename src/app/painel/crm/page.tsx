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
} from 'lucide-react';

interface CrmItem {
  id: string;
  operator: string;
  customerName?: string;
  customer?: { name: string };
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

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    title: '',
    description: '',
    type: 'COMERCIAL',
    operator: '',
  });

  // Carrega operador logado
  useEffect(() => {
    try {
      const stored = localStorage.getItem('@JMMaster:user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.name) {
          setFormData((prev) => ({ ...prev, operator: `${u.name} (${u.role || 'Operador'})` }));
        }
      }
    } catch {}
  }, []);

  const loadInteractions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm');
      const data = await res.json();
      if (data.interactions && Array.isArray(data.interactions)) {
        setInteractions(data.interactions);
      } else {
        setInteractions([]);
      }
    } catch (e) {
      console.error('Erro ao carregar CRM:', e);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInteractions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Por favor, preencha o título e a descrição.');
      return;
    }

    setSaving(true);
    try {
      const config = TYPE_CONFIG[formData.type] || TYPE_CONFIG.COMERCIAL;
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          badge: config.badge,
          date: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData({
          customerName: '',
          title: '',
          description: '',
          type: 'COMERCIAL',
          operator: formData.operator,
        });
        loadInteractions();
      } else {
        alert(data.error || 'Erro ao registrar');
      }
    } catch (e: any) {
      alert('Erro de conexão: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de atendimento?')) return;
    try {
      const res = await fetch(`/api/crm?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setInteractions((prev) => prev.filter((i) => i.id !== id));
      } else {
        alert(data.error || 'Erro ao excluir');
      }
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
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
          onClick={() => setIsModalOpen(true)}
          className="bg-[#E85D26] hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTRAR INTERAÇÃO</span>
        </button>
      </div>

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
              Nenhuma interação registrada ainda
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              Utilize o botão acima para registrar o primeiro atendimento, reunião ou contato comercial no CRM.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
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
                        {item.customerName || item.customer?.name || 'Cliente Geral'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        <span>{item.date}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
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
                <span>Registrar Nova Interação CRM</span>
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
                  <option value="OUTROS">Outros</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Cliente / Empresa
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Ex: Empresa ABC Ltda"
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                />
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
                <input
                  type="text"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  placeholder="Seu nome"
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                />
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
