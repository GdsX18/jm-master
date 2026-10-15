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
import { peekCache, setCache } from '../lib/cache';

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
    const cached = peekCache<RecurringCustomer[]>('/api/finance/recurring');
    if (cached) setRecurring(cached);
    setRecurringLoading(!cached);
    try {
      const res = await fetch('/api/finance/recurring', { cache: 'no-store' });
      const data = await readJson(res);
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao carregar cobranças recorrentes');
      setRecurring(data.customers);
      setCache('/api/finance/recurring', data.customers);
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
    const cached = peekCache<{ records: FinancialItem[]; metrics: Metrics }>('/api/finance');
    if (cached) {
      setRecords(cached.records);
      setMetrics(cached.metrics);
    }
    setLoading(!cached);
    setLoadError('');
    try {
      const res = await fetch('/api/finance', { cache: 'no-store' });
      const data = await readJson(res);
      if (!res.ok || !Array.isArray(data.records)) throw new Error(data.error || 'Erro ao carregar faturas');
      setRecords(data.records);
      setMetrics(data.metrics || EMPTY_METRICS);
      setCache('/api/finance', { records: data.records, metrics: data.metrics || EMPTY_METRICS });
    } catch (e: any) {
      setLoadError(e.message || 'Erro ao carregar faturas');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    const cached = peekCache<any[]>('/api/customers');
    if (Array.isArray(cached)) setCustomers(cached.map((c: any) => ({ id: c.id, name: c.name })));
    try {
      const res = await fetch('/api/customers', { cache: 'no-store' });
      const data = await readJson(res);
      if (res.ok && Array.isArray(data)) {
        setCache('/api/customers', data);
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
    <div className="jm-page">

      {/* HEADER */}
      <div className="jm-page-header">
        <div>
          <h1 className="jm-page-title">Financeiro</h1>
          <p className="jm-page-desc">
            Emissão e acompanhamento de faturas, recebimentos e inadimplência por cliente.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={generateNow}
            disabled={generating}
            title="Gera agora as faturas recorrentes do mês (também roda automaticamente todo dia)"
            className="jm-btn jm-btn-secondary"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{generating ? 'Gerando...' : 'Gerar Faturas'}</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredRecords.length === 0}
            className="jm-btn jm-btn-secondary"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={handleOpenModal}
            className="jm-btn jm-btn-accent"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Fatura</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="jm-alert jm-alert-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {notice && (
        <div className="jm-alert jm-alert-success items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="jm-icon-btn h-7 w-7 text-jm-success-fg hover:bg-transparent hover:text-jm-success-fg hover:opacity-75" aria-label="Fechar aviso"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* RESUMO FINANCEIRO (MÉTRICAS REAIS) */}
      <div className="grid grid-cols-2 overflow-hidden rounded-[6px] border border-jm-border bg-jm-border gap-px lg:grid-cols-4">

        <div className="bg-jm-surface p-4 md:p-5">
          <p className="jm-stat-label flex items-center gap-1.5"><span className="jm-dot text-jm-success-fg" />Receita Recebida</p>
          <p className="jm-stat-value text-xl md:text-2xl">
            {formatCurrency(metrics.receitaRecebida)}
          </p>
          <span className="mt-1 block text-xs text-jm-muted">Faturas liquidadas</span>
        </div>

        <div className="bg-jm-surface p-4 md:p-5">
          <p className="jm-stat-label flex items-center gap-1.5"><span className="jm-dot text-jm-primary-text" />A Receber (No Prazo)</p>
          <p className="jm-stat-value text-xl md:text-2xl">
            {formatCurrency(metrics.aReceber)}
          </p>
          <span className="mt-1 block text-xs text-jm-muted">{metrics.openCount} fatura(s) no prazo</span>
        </div>

        <div className="bg-jm-surface p-4 md:p-5">
          <p className="jm-stat-label flex items-center gap-1.5"><span className="jm-dot text-jm-danger-fg" />Inadimplência</p>
          <p className="jm-stat-value text-xl text-jm-danger-fg md:text-2xl">
            {formatCurrency(metrics.inadimplencia)}
          </p>
          <span className="mt-1 block text-xs text-jm-muted">{metrics.overdueCount} fatura(s) vencida(s)</span>
        </div>

        <div className="bg-jm-surface p-4 md:p-5">
          <p className="jm-stat-label">Total Faturado</p>
          <p className="jm-stat-value text-xl md:text-2xl">
            {formatCurrency(metrics.totalFaturado)}
          </p>
          <span className="mt-1 block text-xs text-jm-muted">{metrics.totalCount - metrics.canceledCount} cobrança(s) válida(s)</span>
        </div>

      </div>

      {/* ABAS */}
      <div className="jm-tabs">
        <button
          type="button"
          onClick={() => setTab('faturas')}
          className={`jm-tab ${tab === 'faturas' ? 'jm-tab-active' : ''}`}
        >
          <Receipt className="h-4 w-4" />
          Faturas
        </button>
        <button
          type="button"
          onClick={() => setTab('recorrentes')}
          className={`jm-tab ${tab === 'recorrentes' ? 'jm-tab-active' : ''}`}
        >
          <Repeat className="h-4 w-4" />
          Cobrança Recorrente
          <span className="jm-badge jm-badge-neutral tabular-nums">{recurring.filter((c) => c.billing.enabled).length}</span>
        </button>
      </div>

      {tab === 'recorrentes' && (
        <div className="jm-table-wrap">
          <div className="border-b border-jm-border bg-jm-subtle px-4 py-3 text-xs leading-relaxed text-jm-muted">
            Configure a mensalidade de cada cliente. Todo dia o sistema gera automaticamente a fatura do mês de quem tem a cobrança ativa
            (uma por cliente por mês, sem duplicar), marca como atrasada após o vencimento e registra no CRM.
          </div>
          {recurringLoading ? (
            <div className="jm-empty">Carregando clientes...</div>
          ) : recurring.length === 0 ? (
            <div className="jm-empty">Nenhum cliente cadastrado. Cadastre clientes em “Cadastro de Clientes”.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="jm-table min-w-[720px]">
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
                <tbody>
                  {recurring.map((c) => (
                    <tr key={c.id} className="jm-tr">
                      <td className="jm-td font-medium text-jm-fg">
                        {c.name}
                        {!c.isActive && <span className="ml-2 text-[11px] font-normal text-jm-muted">(inativo)</span>}
                        {c.groupName && <span className="block text-xs font-normal text-jm-muted">Grupo: {c.groupName}</span>}
                      </td>
                      <td className="jm-td font-medium tabular-nums text-jm-fg">{c.billing.amount > 0 ? formatCurrency(c.billing.amount) : '-'}</td>
                      <td className="jm-td text-jm-muted">Todo dia {c.billing.dueDay}</td>
                      <td className="jm-td">{c.billing.method}</td>
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
        <div className="flex flex-col gap-3 border-b border-jm-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, ID ou descrição..."
              className="jm-input pl-9"
            />
          </div>

          <div className="overflow-x-auto [scrollbar-width:none]">
            <div className="jm-segmented">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`jm-segment ${statusFilter === 'all' ? 'jm-segment-active' : ''}`}
              >
                Todas <span className="tabular-nums text-jm-muted">{records.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PAGO')}
                className={`jm-segment ${statusFilter === 'PAGO' ? 'jm-segment-active' : ''}`}
              >
                <span className="jm-dot text-jm-success-fg" />
                Pagas
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ABERTO')}
                className={`jm-segment ${statusFilter === 'ABERTO' ? 'jm-segment-active' : ''}`}
              >
                <span className="jm-dot text-jm-primary-text" />
                Em Aberto
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ATRASADO')}
                className={`jm-segment ${statusFilter === 'ATRASADO' ? 'jm-segment-active' : ''}`}
              >
                <span className="jm-dot text-jm-danger-fg" />
                Atrasadas
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CANCELADO')}
                className={`jm-segment ${statusFilter === 'CANCELADO' ? 'jm-segment-active' : ''}`}
              >
                <span className="jm-dot text-jm-muted" />
                Canceladas
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="jm-empty">
            Carregando registros financeiros do banco...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="jm-empty">
            <Receipt className="mb-1 h-6 w-6 text-jm-muted" strokeWidth={1.75} />
            {records.length > 0 ? (
              <>
                <h3 className="text-sm font-semibold text-jm-fg">Nenhuma fatura encontrada</h3>
                <p className="max-w-sm text-sm text-jm-muted">
                  Nenhum resultado para a busca ou o filtro selecionado.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-jm-fg">Nenhuma fatura cadastrada</h3>
                <p className="max-w-sm text-sm text-jm-muted">
                  Utilize o botão acima para emitir a primeira fatura ou cobrança do sistema.
                </p>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="jm-btn jm-btn-primary mt-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Emitir Primeira Fatura</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="jm-table min-w-[860px]">
              <thead>
                <tr>
                  <th className="jm-th">Identificador</th>
                  <th className="jm-th">Cliente / Razão Social</th>
                  <th className="jm-th text-right">Valor</th>
                  <th className="jm-th">Vencimento</th>
                  <th className="jm-th">Método</th>
                  <th className="jm-th">Status</th>
                  <th className="jm-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((inv) => (
                  <tr key={inv.id} className="jm-tr group">
                    <td className="jm-td whitespace-nowrap font-mono text-xs font-medium text-jm-fg">
                      {inv.invoiceNumber}
                      {inv.recurring && (
                        <span className="ml-1.5 inline-flex align-middle" title="Gerada automaticamente (cobrança recorrente)">
                          <Repeat className="h-3 w-3 text-jm-muted" />
                        </span>
                      )}
                    </td>
                    <td className="jm-td">
                      <span className="block font-medium text-jm-fg">{inv.customerName}</span>
                      <span className="block text-xs text-jm-muted">{inv.description}</span>
                    </td>
                    <td className="jm-td whitespace-nowrap text-right font-medium tabular-nums text-jm-fg">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="jm-td whitespace-nowrap tabular-nums text-jm-muted">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="jm-td whitespace-nowrap">
                      {inv.method}
                    </td>
                    <td className="jm-td whitespace-nowrap">
                      {inv.status === 'PAGO' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para alternar status"
                          className="jm-badge jm-badge-success cursor-pointer hover:border-jm-success-fg"
                        >
                          <span className="jm-dot" />
                          Pago
                        </button>
                      )}
                      {(inv.status === 'ABERTO' || inv.status === 'PENDENTE') && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para marcar como pago"
                          className="jm-badge jm-badge-primary cursor-pointer hover:border-jm-primary-text"
                        >
                          <span className="jm-dot" />
                          Em aberto
                        </button>
                      )}
                      {inv.status === 'ATRASADO' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para marcar como pago"
                          className="jm-badge jm-badge-danger cursor-pointer hover:border-jm-danger-fg"
                        >
                          <span className="jm-dot" />
                          Atrasado
                        </button>
                      )}
                      {inv.status === 'CANCELADO' && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(inv)}
                          title="Clique para reabrir a fatura"
                          className="jm-badge jm-badge-neutral cursor-pointer line-through hover:border-jm-border-strong"
                        >
                          Cancelada
                        </button>
                      )}
                      {inv.status === 'PAGO' && inv.paymentDate && (
                        <span className="mt-1 block text-[11px] text-jm-muted">em {formatDate(inv.paymentDate, false)}</span>
                      )}
                    </td>
                    <td className="jm-td whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-0.5">
                      {(inv.status === 'ABERTO' || inv.status === 'ATRASADO') && (() => {
                        const url = whatsappChargeUrl(inv);
                        return url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="jm-icon-btn h-7 w-7 hover:text-jm-success-fg"
                            title="Enviar cobrança pelo WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        ) : null;
                      })()}
                      <button
                        type="button"
                        onClick={() => handleEdit(inv)}
                        className="jm-icon-btn h-7 w-7"
                        title="Editar Fatura"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {inv.status !== 'CANCELADO' && inv.status !== 'PAGO' && (
                        <button
                          type="button"
                          onClick={() => handleCancelInvoice(inv)}
                          className="jm-icon-btn h-7 w-7 hover:text-jm-warning-fg"
                          title="Cancelar Fatura"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(inv)}
                        className="jm-icon-btn h-7 w-7 hover:text-jm-danger-fg"
                        title="Excluir Fatura"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      </div>
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
        <div className="jm-overlay">
          <div className="jm-modal">
            <div className="jm-modal-header">
              <h3 className="jm-modal-title min-w-0 truncate">
                Cobrança Recorrente — {billingEdit.name}
              </h3>
              <button type="button" onClick={() => setBillingEdit(null)} className="jm-icon-btn" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="jm-modal-body space-y-4">
              {billingError && (
                <div role="alert" className="jm-alert jm-alert-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{billingError}</span>
                </div>
              )}

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[4px] border border-jm-border bg-jm-subtle px-3.5 py-3">
                <span>
                  <span className="block text-sm font-medium text-jm-fg">Gerar fatura automaticamente todo mês</span>
                  <span className="block text-xs text-jm-muted">Só gera para clientes ativos.</span>
                </span>
                <input
                  type="checkbox"
                  checked={billingEdit.billing.enabled}
                  onChange={(e) => setBillingEdit({ ...billingEdit, billing: { ...billingEdit.billing, enabled: e.target.checked } })}
                  className="h-4 w-4 shrink-0"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="jm-label">Valor mensal (R$)</label>
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
                      className="jm-link mt-1 cursor-pointer text-left text-xs"
                    >
                      Usar tabela do grupo {billingEdit.groupName}: {formatCurrency(billingEdit.suggestedAmount)}
                    </button>
                  )}
                </div>
                <div>
                  <label className="jm-label">Dia do vencimento</label>
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
                <label className="jm-label">Descrição na fatura</label>
                <input
                  type="text"
                  value={billingEdit.billing.description}
                  onChange={(e) => setBillingEdit({ ...billingEdit, billing: { ...billingEdit.billing, description: e.target.value } })}
                  className="jm-input"
                />
                <p className="jm-help">O mês de referência é adicionado automaticamente (ex.: “— 11/2026”).</p>
              </div>

              <div>
                <label className="jm-label">Método de pagamento</label>
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
            </div>

            <div className="jm-modal-footer">
              <button type="button" onClick={() => setBillingEdit(null)} className="jm-btn jm-btn-secondary">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => saveBilling(false)}
                disabled={billingSaving}
                className="jm-btn jm-btn-primary"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{billingSaving ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVA FATURA */}
      {isModalOpen && (
        <div className="jm-overlay">
          <div className="jm-modal">
            <div className="jm-modal-header">
              <h3 className="jm-modal-title">
                {editingId ? 'Editar Fatura' : 'Emitir Nova Fatura / Cobrança'}
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

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="jm-modal-body space-y-4">
                {formError && (
                  <div role="alert" className="jm-alert jm-alert-danger">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="jm-label">
                      Nº da Fatura
                    </label>
                    <p className="flex h-9 w-full items-center rounded-[4px] border border-jm-border bg-jm-subtle px-3 font-mono text-sm text-jm-muted">
                      {editingId ? records.find((r) => r.id === editingId)?.invoiceNumber : 'Gerado automaticamente'}
                    </p>
                  </div>

                  <div>
                    <label className="jm-label">
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
                    <p className="jm-help">Faturas em aberto após o vencimento ficam “Atrasadas” automaticamente.</p>
                  </div>
                </div>

                <div>
                  <label className="jm-label">
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
                      className="jm-input mt-2"
                    />
                  )}
                </div>

                <div>
                  <label className="jm-label">
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="jm-label">
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
                    <label className="jm-label">
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
                  <label className="jm-label">
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
