'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Save,
  Search,
  Receipt,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface FinancialItem {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  status: string;
  dueDate?: string;
  paymentDate?: string;
  metadata?: {
    invoiceId?: string;
    customer?: string;
    method?: string;
  };
  createdAt?: string;
}

interface Metrics {
  receitaRecebida: number;
  aReceber: number;
  inadimplencia: number;
  mrr: number;
  openCount: number;
  overdueCount: number;
  totalCount: number;
}

export default function FinancePage() {
  const [records, setRecords] = useState<FinancialItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    receitaRecebida: 0,
    aReceber: 0,
    inadimplencia: 0,
    mrr: 0,
    openCount: 0,
    overdueCount: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    invoiceId: '',
    customer: '',
    description: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    method: 'Boleto / Pix',
    status: 'ABERTO',
  });

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance');
      const data = await res.json();
      if (data.records && Array.isArray(data.records)) {
        setRecords(data.records);
      } else {
        setRecords([]);
      }
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Erro ao carregar finanças:', e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const handleOpenModal = () => {
    const nextNum = String(records.length + 1).padStart(3, '0');
    setFormData({
      invoiceId: `INV-2026-${nextNum}`,
      customer: '',
      description: 'Mensalidade Plataforma & WhatsApp API',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      method: 'Boleto / Pix',
      status: 'ABERTO',
    });
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer.trim() || !formData.amount) {
      alert('Por favor, preencha o cliente e o valor.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.invoiceId,
          customer: formData.customer,
          description: formData.description,
          amount: formData.amount,
          dueDate: formData.dueDate,
          method: formData.method,
          status: formData.status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        loadFinanceData();
      } else {
        alert(data.error || 'Erro ao criar fatura');
      }
    } catch (e: any) {
      alert('Erro de conexão: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: FinancialItem) => {
    const nextStatus = item.status === 'PAGO' ? 'ABERTO' : 'PAGO';
    try {
      const res = await fetch('/api/finance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        loadFinanceData();
      } else {
        alert(data.error || 'Erro ao alterar status');
      }
    } catch (e: any) {
      alert('Erro ao alterar status: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta fatura?')) return;
    try {
      const res = await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadFinanceData();
      } else {
        alert(data.error || 'Erro ao excluir');
      }
    } catch (e: any) {
      alert('Erro ao excluir: ' + e.message);
    }
  };

  // Formatar Moeda Real
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Formatar Data
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // Filtros combinados
  const filteredRecords = records.filter((r) => {
    const cust = r.metadata?.customer || r.description || '';
    const invId = r.metadata?.invoiceId || '';
    const matchSearch =
      cust.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      invId.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-white min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-[#E85D26]" />
            <span>Gestão Financeira & Faturamento</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Controle de contratos, faturamento recorrente, faturas emitidas e conciliação bancária.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="bg-[#E85D26] hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>NOVA FATURA</span>
        </button>
      </div>

      {/* CARDS DE RESUMO FINANCEIRO (MÉTRICAS REAIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-5 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <p className="text-[11px] uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">Receita Recebida</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.receitaRecebida)}
          </h3>
          <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">Faturas liquidadas</span>
        </div>

        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-5 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />
          <p className="text-[11px] uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">A Receber (No Prazo)</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-sky-600 dark:text-sky-400">
            {formatCurrency(metrics.aReceber)}
          </h3>
          <span className="text-[10px] text-neutral-400 font-semibold mt-1 block">{metrics.openCount} faturas em aberto</span>
        </div>

        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-5 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
          <p className="text-[11px] uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">Inadimplência</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-rose-600 dark:text-rose-400">
            {formatCurrency(metrics.inadimplencia)}
          </h3>
          <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{metrics.overdueCount} faturas pendentes</span>
        </div>

        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-5 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E85D26]" />
          <p className="text-[11px] uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">Total Faturado</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-[#E85D26]">
            {formatCurrency(metrics.mrr)}
          </h3>
          <span className="text-[10px] text-orange-500 font-semibold mt-1 block">{metrics.totalCount} cobranças emitidas</span>
        </div>

      </div>

      {/* TABELA DE FATURAS RECENTES */}
      <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        
        {/* FILTROS DA TABELA */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-950/40">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, ID ou descrição..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Todas ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PAGO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'PAGO'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-500 hover:text-emerald-600'
              }`}
            >
              Pagas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ABERTO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ABERTO'
                  ? 'bg-sky-600 text-white'
                  : 'text-neutral-500 hover:text-sky-600'
              }`}
            >
              Em Aberto
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ATRASADO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ATRASADO'
                  ? 'bg-rose-600 text-white'
                  : 'text-neutral-500 hover:text-rose-600'
              }`}
            >
              Atrasadas
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400 font-semibold animate-pulse">
            Carregando registros financeiros do banco...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#E85D26]">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-neutral-800 dark:text-neutral-200">
              Nenhuma fatura cadastrada
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              Utilize o botão acima para emitir a primeira fatura ou cobrança do sistema.
            </p>
            <button
              type="button"
              onClick={handleOpenModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#E85D26] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Emitir Primeira Fatura</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/60 text-[11px] font-extrabold uppercase text-neutral-500 dark:text-neutral-400">
                  <th className="p-4">Identificador</th>
                  <th className="p-4">Cliente / Razão Social</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Método</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
                {filteredRecords.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-850/50 transition group">
                    <td className="p-4 font-mono font-bold text-[#E85D26]">
                      {inv.metadata?.invoiceId || inv.id.slice(0, 10)}
                    </td>
                    <td className="p-4 font-bold text-neutral-900 dark:text-white">
                      {inv.metadata?.customer || inv.description}
                    </td>
                    <td className="p-4 font-extrabold text-neutral-800 dark:text-neutral-100">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="p-4 text-neutral-500 dark:text-neutral-400">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="p-4 text-neutral-600 dark:text-neutral-300">
                      {inv.metadata?.method || 'Pix'}
                    </td>
                    <td className="p-4">
                      {inv.status === 'PAGO' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para alternar status"
                          className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                        >
                          ✓ PAGO
                        </button>
                      )}
                      {(inv.status === 'ABERTO' || inv.status === 'PENDENTE') && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para marcar como pago"
                          className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition cursor-pointer"
                        >
                          ⏳ EM ABERTO
                        </button>
                      )}
                      {inv.status === 'ATRASADO' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para marcar como pago"
                          className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer"
                        >
                          ⚠ ATRASADO
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(inv.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        title="Excluir Fatura"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL NOVA FATURA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E85D26]" />
                <span>Emitir Nova Fatura / Cobrança</span>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    ID da Fatura
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceId}
                    onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-[#E85D26]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white font-semibold focus:outline-none focus:border-[#E85D26]"
                  >
                    <option value="ABERTO">Em Aberto</option>
                    <option value="PAGO">Pago</option>
                    <option value="ATRASADO">Atrasado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Cliente / Razão Social
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  placeholder="Ex: Razão Social do Cliente"
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Descrição do Serviço / Contrato
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Mensalidade WhatsApp API Enterprise"
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Ex: 2450.00"
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-[#E85D26]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Método de Pagamento
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white font-semibold focus:outline-none focus:border-[#E85D26]"
                >
                  <option value="Boleto / Pix">Boleto / Pix</option>
                  <option value="Pix Oficial">Pix Oficial</option>
                  <option value="Boleto 30D">Boleto 30 Dias</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Transferência Bancária">Transferência Bancária</option>
                </select>
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
                  <span>{saving ? 'Emitindo...' : 'Emitir Fatura'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
