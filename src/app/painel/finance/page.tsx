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
  Pencil,
  Ban,
  Download,
  Repeat,
  Zap,
  MessageCircle,
} from 'lucide-react';

interface FinancialItem {
  id: string;
  description: string;
  amount: number;
  status: string;
  dueDate?: string;
  paymentDate?: string | null;
  invoiceNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  recurring?: boolean;
  method: string;
  createdAt?: string;
}

interface BillingConfig {
  enabled: boolean;
  amount: number;
  dueDay: number;
  description: string;
  method: string;
}

interface RecurringCustomer {
  id: string;
  name: string;
  isActive: boolean;
  phone: string | null;
  groupName: string | null;
  suggestedAmount: number;
  billing: BillingConfig;
}

const PAYMENT_METHODS = ['Boleto / Pix', 'Pix Oficial', 'Boleto 30D', 'Cartão de Crédito', 'Transferência Bancária'];

interface Metrics {
  receitaRecebida: number;
  aReceber: number;
  inadimplencia: number;
  totalFaturado: number;
  openCount: number;
  overdueCount: number;
  paidCount: number;
  canceledCount: number;
  totalCount: number;
}

interface CustomerOption {
  id: string;
  name: string;
}

const EMPTY_METRICS: Metrics = {
  receitaRecebida: 0,
  aReceber: 0,
  inadimplencia: 0,
  totalFaturado: 0,
  openCount: 0,
  overdueCount: 0,
  paidCount: 0,
  canceledCount: 0,
  totalCount: 0,
};

const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

const emptyForm = () => ({
  customerId: '',
  customer: '',
  description: 'Mensalidade Plataforma & WhatsApp API',
  amount: '',
  dueDate: todayIso(),
  method: 'Boleto / Pix',
  status: 'ABERTO',
});

async function readJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function FinancePage() {
  const [records, setRecords] = useState<FinancialItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState(emptyForm());
  const [tab, setTab] = useState<'faturas' | 'recorrentes'>('faturas');
  const [recurring, setRecurring] = useState<RecurringCustomer[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [billingEdit, setBillingEdit] = useState<RecurringCustomer | null>(null);
  const [billingSaving, setBillingSaving] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState('');

  const loadRecurring = async () => {
    setRecurringLoading(true);
    try {
      const res = await fetch('/api/finance/recurring', { cache: 'no-store' });
      const data = await readJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao carregar cobranças recorrentes');
      setRecurring(data.customers);
    } catch (e: any) {
      setLoadError(e.message);
    } finally {
      setRecurringLoading(false);
    }
  };

  const saveBilling = async (useGroupPrice = false) => {
    if (!billingEdit) return;
    setBillingSaving(true);
    setBillingError('');
    try {
      const res = await fetch('/api/finance/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: billingEdit.id, billing: billingEdit.billing, useGroupPrice }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao salvar');
      if (useGroupPrice) {
        setBillingEdit({ ...billingEdit, billing: data.billing });
      } else {
        setBillingEdit(null);
      }
      loadRecurring();
    } catch (e: any) {
      setBillingError(e.message);
    } finally {
      setBillingSaving(false);
    }
  };

  const generateNow = async () => {
    setGenerating(true);
    setNotice('');
    try {
      const res = await fetch('/api/finance/generate', { method: 'POST' });
      const data = await readJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao gerar faturas');
      setNotice(
        data.created > 0
          ? `${data.created} fatura(s) recorrente(s) gerada(s) para ${data.period.split('-').reverse().join('/')}.`
          : `Nenhuma fatura nova: as cobranças recorrentes de ${data.period.split('-').reverse().join('/')} já estão emitidas.`
      );
      loadFinanceData();
    } catch (e: any) {
      setNotice(e.message);
    } finally {
      setGenerating(false);
    }
  };

  // Mensagem de cobrança pronta para o WhatsApp do contato principal do cliente
  const whatsappChargeUrl = (inv: FinancialItem) => {
    const digits = (inv.customerPhone || '').replace(/\D/g, '');
    if (digits.length < 10) return null;
    const phone = digits.startsWith('55') ? digits : `55${digits}`;
    const value = formatCurrency(inv.amount);
    const due = formatDate(inv.dueDate);
    const text =
      inv.status === 'ATRASADO'
        ? `Olá, ${inv.customerName}! Identificamos que a fatura ${inv.invoiceNumber} no valor de ${value}, com vencimento em ${due}, ainda está em aberto. Pode nos confirmar a previsão de pagamento? Se já pagou, por favor desconsidere esta mensagem. — JM MASTER GROUP`
        : `Olá, ${inv.customerName}! Passando para lembrar da fatura ${inv.invoiceNumber} no valor de ${value}, com vencimento em ${due} (${inv.method}). Qualquer dúvida, estamos à disposição. — JM MASTER GROUP`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const loadFinanceData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/finance', { cache: 'no-store' });
      const data = await readJson(res);
      if (!res.ok || !Array.isArray(data.records)) throw new Error(data.error || 'Erro ao carregar faturas');
      setRecords(data.records);
      setMetrics(data.metrics || EMPTY_METRICS);
    } catch (e: any) {
      setLoadError(e.message || 'Erro ao carregar faturas');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers', { cache: 'no-store' });
      const data = await readJson(res);
      if (res.ok && Array.isArray(data)) {
        setCustomers(data.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch {}
  };

  useEffect(() => {
    loadFinanceData();
    loadCustomers();
    loadRecurring();
  }, []);

  const handleOpenModal = () => {
    setEditingId(null);
    setFormError('');
    setFormData(emptyForm());
    setIsModalOpen(true);
  };

  const handleEdit = (item: FinancialItem) => {
    setEditingId(item.id);
    setFormError('');
    setFormData({
      customerId: item.customerId || '',
      customer: item.customerId ? '' : item.customerName,
      description: item.description,
      amount: String(item.amount),
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : todayIso(),
      method: item.method,
      status: item.status === 'ATRASADO' ? 'ABERTO' : item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.customerId && !formData.customer.trim()) {
      setFormError('Selecione um cliente cadastrado ou digite o nome do cliente.');
      return;
    }
    if (!(parseFloat(formData.amount) > 0)) {
      setFormError('Informe um valor maior que zero.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/finance', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingId || undefined }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao salvar fatura');
      setIsModalOpen(false);
      loadFinanceData();
    } catch (e: any) {
      setFormError(e.message || 'Erro ao salvar fatura');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (item: FinancialItem, nextStatus: 'ABERTO' | 'PAGO' | 'CANCELADO') => {
    try {
      const res = await fetch('/api/finance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: nextStatus }),
      });
      const data = await readJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao alterar status');
      loadFinanceData();
    } catch (e: any) {
      alert(e.message || 'Erro ao alterar status');
    }
  };

  const handleToggleStatus = (item: FinancialItem) =>
    updateStatus(item, item.status === 'PAGO' || item.status === 'CANCELADO' ? 'ABERTO' : 'PAGO');

  const handleCancelInvoice = (item: FinancialItem) => {
    if (!confirm(`Cancelar a fatura ${item.invoiceNumber}? Ela deixa de contar no faturamento.`)) return;
    updateStatus(item, 'CANCELADO');
  };

  const handleDelete = async (item: FinancialItem) => {
    if (!confirm(`Excluir definitivamente a fatura ${item.invoiceNumber}?`)) return;
    try {
      const res = await fetch(`/api/finance?id=${item.id}`, { method: 'DELETE' });
      const data = await readJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao excluir');
      loadFinanceData();
    } catch (e: any) {
      alert(e.message || 'Erro ao excluir');
    }
  };

  const exportCsv = () => {
    const header = ['Fatura', 'Cliente', 'Descrição', 'Valor', 'Vencimento', 'Pagamento', 'Método', 'Status'];
    const lines = filteredRecords.map((r) =>
      [
        r.invoiceNumber,
        r.customerName,
        r.description,
        r.amount.toFixed(2).replace('.', ','),
        formatDate(r.dueDate),
        r.paymentDate ? formatDate(r.paymentDate, false) : '',
        r.method,
        r.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(';')
    );
    const blob = new Blob(['\ufeff' + [header.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faturas-${todayIso()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Formatar Moeda Real
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Vencimentos são datas de calendário (gravadas em UTC): formatar em UTC evita mostrar o dia anterior
  const formatDate = (dateStr?: string | null, calendarDate = true) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-BR', calendarDate ? { timeZone: 'UTC' } : { timeZone: 'America/Sao_Paulo' });
  };

  // Filtros combinados
  const filteredRecords = records.filter((r) => {
    const term = search.toLowerCase();
    const matchSearch =
      r.customerName.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term) ||
      r.invoiceNumber.toLowerCase().includes(term);

    const matchStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 bg-jm-bg text-jm-fg min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-jm-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-jm-fg flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-jm-primary-text" strokeWidth={1.75} />
            <span>Gestão Financeira & Faturamento</span>
          </h1>
          <p className="text-sm text-jm-muted mt-1">
            Emissão e acompanhamento de faturas, recebimentos e inadimplência por cliente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={generateNow}
            disabled={generating}
            title="Gera agora as faturas recorrentes do mês (também roda automaticamente todo dia)"
            className="jm-btn jm-btn-secondary jm-btn-sm"
          >
            <Zap className={`w-3.5 h-3.5 text-jm-primary-text ${generating ? 'animate-pulse' : ''}`} />
            <span>{generating ? 'Gerando...' : 'Gerar Faturas'}</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredRecords.length === 0}
            className="jm-btn jm-btn-secondary jm-btn-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={handleOpenModal}
            className="jm-btn jm-btn-primary jm-btn-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Fatura</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-jm-danger-border bg-jm-danger-bg p-4 text-sm font-medium text-jm-danger-fg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-2 p-4 rounded-xl border border-jm-success-border bg-jm-success-bg text-jm-success-fg text-sm font-medium">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="cursor-pointer text-jm-success-fg hover:opacity-75"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* CARDS DE RESUMO FINANCEIRO (MÉTRICAS REAIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="jm-card p-5 md:p-6 shadow-xs">
          <p className="text-sm font-medium text-jm-muted">Receita Recebida</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-jm-success-fg mt-2">
            {formatCurrency(metrics.receitaRecebida)}
          </p>
          <span className="text-xs text-jm-muted font-medium mt-1 block">Faturas liquidadas</span>
        </div>

        <div className="jm-card p-5 md:p-6 shadow-xs">
          <p className="text-sm font-medium text-jm-muted">A Receber (No Prazo)</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-jm-primary-text mt-2">
            {formatCurrency(metrics.aReceber)}
          </p>
          <span className="text-xs text-jm-muted font-medium mt-1 block">{metrics.openCount} fatura(s) no prazo</span>
        </div>

        <div className="jm-card p-5 md:p-6 shadow-xs">
          <p className="text-sm font-medium text-jm-muted">Inadimplência</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-jm-danger-fg mt-2">
            {formatCurrency(metrics.inadimplencia)}
          </p>
          <span className="text-xs text-jm-muted font-medium mt-1 block">{metrics.overdueCount} fatura(s) vencida(s)</span>
        </div>

        <div className="jm-card p-5 md:p-6 shadow-xs">
          <p className="text-sm font-medium text-jm-muted">Total Faturado</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-jm-fg mt-2">
            {formatCurrency(metrics.totalFaturado)}
          </p>
          <span className="text-xs text-jm-muted font-medium mt-1 block">{metrics.totalCount - metrics.canceledCount} cobrança(s) válida(s)</span>
        </div>

      </div>

      {/* ABAS */}
      <div className="jm-tabs">
        <button
          type="button"
          onClick={() => setTab('faturas')}
          className={`jm-tab flex items-center gap-1.5 ${tab === 'faturas' ? 'jm-tab-active' : ''}`}
        >
          <Receipt className="w-4 h-4" />
          Faturas
        </button>
        <button
          type="button"
          onClick={() => setTab('recorrentes')}
          className={`jm-tab flex items-center gap-1.5 ${tab === 'recorrentes' ? 'jm-tab-active' : ''}`}
        >
          <Repeat className="w-4 h-4" />
          Cobrança Recorrente ({recurring.filter((c) => c.billing.enabled).length})
        </button>
      </div>

      {tab === 'recorrentes' && (
        <div className="jm-table-wrap">
          <div className="p-4 sm:p-5 border-b border-jm-border bg-jm-subtle text-xs text-jm-muted leading-relaxed">
            Configure a mensalidade de cada cliente. Todo dia o sistema gera automaticamente a fatura do mês de quem tem a cobrança ativa
            (uma por cliente por mês, sem duplicar), marca como atrasada após o vencimento e registra no CRM.
          </div>
          {recurringLoading ? (
            <div className="py-12 text-center text-xs text-jm-muted font-medium animate-pulse">Carregando clientes...</div>
          ) : recurring.length === 0 ? (
            <div className="py-12 text-center text-xs text-jm-muted">Nenhum cliente cadastrado. Cadastre clientes em “Cadastro de Clientes”.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="jm-table">
                <thead>
                  <tr>
                    <th className="jm-th">Cliente</th>
                    <th className="jm-th">Mensalidade</th>
                    <th className="jm-th">Vencimento</th>
                    <th className="jm-th">Método</th>
                    <th className="jm-th">Cobrança Automática</th>
                    <th className="jm-th text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-jm-border">
                  {recurring.map((c) => (
                    <tr key={c.id} className="jm-tr">
                      <td className="jm-td font-semibold text-jm-fg">
                        {c.name}
                        {!c.isActive && <span className="ml-2 text-[10px] text-jm-muted font-normal">(inativo)</span>}
                        {c.groupName && <span className="block text-xs font-normal text-jm-muted">Grupo: {c.groupName}</span>}
                      </td>
                      <td className="jm-td font-semibold text-jm-fg">{c.billing.amount > 0 ? formatCurrency(c.billing.amount) : '-'}</td>
                      <td className="jm-td text-jm-muted">Todo dia {c.billing.dueDay}</td>
                      <td className="jm-td text-jm-fg2">{c.billing.method}</td>
                      <td className="jm-td">
                        {c.billing.enabled && c.isActive ? (
                          <span className="jm-badge jm-badge-success">Ativa</span>
                        ) : c.billing.enabled ? (
                          <span className="jm-badge jm-badge-warning">Pausada (cliente inativo)</span>
                        ) : (
                          <span className="jm-badge jm-badge-neutral">Desligada</span>
                        )}
                      </td>
                      <td className="jm-td text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setBillingError('');
                            setBillingEdit(c);
                          }}
                          className="jm-btn jm-btn-secondary jm-btn-sm"
                        >
                          Configurar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TABELA DE FATURAS RECENTES */}
      {tab === 'faturas' && (
      <div className="jm-card overflow-hidden">
        
        {/* FILTROS DA TABELA */}
        <div className="p-4 sm:p-5 border-b border-jm-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/40">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-jm-muted absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, ID ou descrição..."
              className="jm-input pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-jm-blue-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-jm-muted hover:text-jm-text hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Todas ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PAGO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'PAGO'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-jm-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              Pagas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ABERTO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'ABERTO'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-jm-muted hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30'
              }`}
            >
              Em Aberto
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ATRASADO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'ATRASADO'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-jm-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              Atrasadas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CANCELADO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'CANCELADO'
                  ? 'bg-neutral-700 text-white shadow-xs'
                  : 'text-jm-muted hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              Canceladas
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-jm-muted font-medium animate-pulse">
            Carregando registros financeiros do banco...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center justify-center text-jm-orange">
              <Receipt className="w-6 h-6" />
            </div>
            {records.length > 0 ? (
              <>
                <h3 className="text-sm font-semibold text-jm-text">Nenhuma fatura encontrada</h3>
                <p className="text-xs text-jm-muted max-w-sm mx-auto">
                  Nenhum resultado para a busca ou o filtro selecionado.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-jm-text">Nenhuma fatura cadastrada</h3>
                <p className="text-xs text-jm-muted max-w-sm mx-auto">
                  Utilize o botão acima para emitir a primeira fatura ou cobrança do sistema.
                </p>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="mt-2 jm-btn jm-btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>Emitir Primeira Fatura</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="jm-table-wrap border-0 rounded-none">
            <table className="jm-table">
              <thead>
                <tr className="jm-tr">
                  <th className="jm-th">Identificador</th>
                  <th className="jm-th">Cliente / Razão Social</th>
                  <th className="jm-th">Valor</th>
                  <th className="jm-th">Vencimento</th>
                  <th className="jm-th">Método</th>
                  <th className="jm-th">Status</th>
                  <th className="jm-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jm-border text-xs">
                {filteredRecords.map((inv) => (
                  <tr key={inv.id} className="jm-tr group">
                    <td className="jm-td font-mono font-bold text-jm-orange">
                      {inv.invoiceNumber}
                      {inv.recurring && (
                        <span className="ml-1.5 inline-flex align-middle" title="Gerada automaticamente (cobrança recorrente)">
                          <Repeat className="w-3 h-3 text-jm-muted" />
                        </span>
                      )}
                    </td>
                    <td className="jm-td">
                      <span className="block font-semibold text-jm-text">{inv.customerName}</span>
                      <span className="block text-[11px] text-jm-muted">{inv.description}</span>
                    </td>
                    <td className="jm-td font-semibold text-jm-text">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="jm-td text-jm-muted">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="jm-td text-jm-text">
                      {inv.method}
                    </td>
                    <td className="jm-td">
                      {inv.status === 'PAGO' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para alternar status"
                          className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          ✓ PAGO
                        </button>
                      )}
                      {(inv.status === 'ABERTO' || inv.status === 'PENDENTE') && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para marcar como pago"
                          className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition cursor-pointer"
                        >
                          ⏳ EM ABERTO
                        </button>
                      )}
                      {inv.status === 'ATRASADO' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para marcar como pago"
                          className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition cursor-pointer"
                        >
                          ⚠ ATRASADO
                        </button>
                      )}
                      {inv.status === 'CANCELADO' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para reabrir a fatura"
                          className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 transition cursor-pointer line-through"
                        >
                          CANCELADA
                        </button>
                      )}
                      {inv.status === 'PAGO' && inv.paymentDate && (
                        <span className="block mt-1 text-[10px] text-jm-muted">em {formatDate(inv.paymentDate, false)}</span>
                      )}
                    </td>
                    <td className="jm-td text-right space-x-1 whitespace-nowrap">
                      {(inv.status === 'ABERTO' || inv.status === 'ATRASADO') && (() => {
                        const url = whatsappChargeUrl(inv);
                        return url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-jm-muted hover:text-emerald-600 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            title="Enviar cobrança pelo WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        ) : null;
                      })()}
                      <button
                        type="button"
                        onClick={() => handleEdit(inv)}
                        className="text-jm-muted hover:text-jm-orange p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                        title="Editar Fatura"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {inv.status !== 'CANCELADO' && inv.status !== 'PAGO' && (
                        <button
                          type="button"
                          onClick={() => handleCancelInvoice(inv)}
                          className="text-jm-muted hover:text-amber-600 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                          title="Cancelar Fatura"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(inv)}
                        className="text-jm-muted hover:text-rose-600 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
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

      )}

      {/* MODAL COBRANÇA RECORRENTE */}
      {billingEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="jm-card w-full max-w-lg overflow-hidden shadow-xl border border-jm-border animate-fadeIn">
            <div className="flex items-center justify-between p-5 border-b border-jm-border bg-neutral-50/50 dark:bg-neutral-900/50">
              <h3 className="text-sm font-semibold text-jm-text flex items-center gap-2">
                <Repeat className="w-4 h-4 text-jm-orange" />
                <span>Cobrança Recorrente — {billingEdit.name}</span>
              </h3>
              <button type="button" onClick={() => setBillingEdit(null)} className="text-jm-muted hover:text-jm-text p-1.5 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {billingError && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{billingError}</span>
                </div>
              )}

              <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-jm-border bg-neutral-50/50 dark:bg-neutral-900/40 cursor-pointer">
                <span>
                  <span className="block font-semibold text-jm-text">Gerar fatura automaticamente todo mês</span>
                  <span className="block text-[11px] text-jm-muted">Só gera para clientes ativos.</span>
                </span>
                <input
                  type="checkbox"
                  checked={billingEdit.billing.enabled}
                  onChange={(e) => setBillingEdit({ ...billingEdit, billing: { ...billingEdit.billing, enabled: e.target.checked } })}
                  className="w-4 h-4 accent-jm-orange rounded"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-xs text-jm-text mb-1.5">Valor mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={billingEdit.billing.amount || ''}
                    onChange={(e) => setBillingEdit({ ...billingEdit, billing: { ...billingEdit.billing, amount: parseFloat(e.target.value) || 0 } })}
                    className="jm-input font-mono"
                  />
                  {billingEdit.suggestedAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setBillingEdit({ ...billingEdit, billing: { ...billingEdit.billing, amount: billingEdit.suggestedAmount } })}
                      className="mt-1 text-[11px] font-semibold text-jm-orange hover:underline cursor-pointer"
                    >
                      Usar tabela do grupo {billingEdit.groupName}: {formatCurrency(billingEdit.suggestedAmount)}
                    </button>
                  )}
                </div>
                <div>
                  <label className="block font-medium text-xs text-jm-text mb-1.5">Dia do vencimento</label>
                  <select
                    value={billingEdit.billing.dueDay}
                    onChange={(e) => setBillingEdit({ ...billingEdit, billing: { ...billingEdit.billing, dueDay: parseInt(e.target.value, 10) } })}
                    className="jm-input"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>Dia {d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-xs text-jm-text mb-1.5">Descrição na fatura</label>
                <input
                  type="text"
                  value={billingEdit.billing.description}
                  onChange={(e) => setBillingEdit({ ...billingEdit, billing: { ...billingEdit.billing, description: e.target.value } })}
                  className="jm-input"
                />
                <p className="mt-1 text-[11px] text-jm-muted">O mês de referência é adicionado automaticamente (ex.: “— 11/2026”).</p>
              </div>

              <div>
                <label className="block font-medium text-xs text-jm-text mb-1.5">Método de pagamento</label>
                <select
                  value={billingEdit.billing.method}
                  onChange={(e) => setBillingEdit({ ...billingEdit, billing: { ...billingEdit.billing, method: e.target.value } })}
                  className="jm-input"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setBillingEdit(null)} className="jm-btn jm-btn-secondary">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => saveBilling(false)}
                  disabled={billingSaving}
                  className="jm-btn jm-btn-primary"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{billingSaving ? 'Salvando...' : 'Salvar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVA FATURA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="jm-card w-full max-w-lg overflow-hidden shadow-xl border border-jm-border animate-fadeIn">
            <div className="flex items-center justify-between p-5 border-b border-jm-border bg-neutral-50/50 dark:bg-neutral-900/50">
              <h3 className="text-sm font-semibold text-jm-text flex items-center gap-2">
                <Plus className="w-4 h-4 text-jm-orange" />
                <span>{editingId ? 'Editar Fatura' : 'Emitir Nova Fatura / Cobrança'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-jm-muted hover:text-jm-text p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-jm-text mb-1.5">
                    Nº da Fatura
                  </label>
                  <p className="w-full px-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-900 border border-jm-border rounded-lg text-jm-muted font-mono">
                    {editingId ? records.find((r) => r.id === editingId)?.invoiceNumber : 'Gerado automaticamente'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-jm-text mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="jm-input"
                  >
                    <option value="ABERTO">Em Aberto</option>
                    <option value="PAGO">Pago</option>
                    {editingId && <option value="CANCELADO">Cancelado</option>}
                  </select>
                  <p className="mt-1 text-[11px] text-jm-muted">Faturas em aberto após o vencimento ficam “Atrasadas” automaticamente.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-jm-text mb-1.5">
                  Cliente
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="jm-input"
                >
                  <option value="">— Cliente não cadastrado (digitar nome) —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {!formData.customerId && (
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    placeholder="Nome / Razão Social do cliente"
                    className="mt-2 jm-input"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-jm-text mb-1.5">
                  Descrição do Serviço / Contrato
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Mensalidade WhatsApp API Enterprise"
                  className="jm-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-jm-text mb-1.5">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Ex: 2450.00"
                    className="jm-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-jm-text mb-1.5">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="jm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-jm-text mb-1.5">
                  Método de Pagamento
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="jm-input"
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
                  <span>{saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Emitir Fatura'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
