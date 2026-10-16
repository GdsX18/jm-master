export type RecordType = 'RECEITA' | 'DESPESA';

export interface FinancialItem {
  id: string;
  type: RecordType;
  description: string;
  amount: number;
  status: 'ABERTO' | 'ATRASADO' | 'PAGO' | 'CANCELADO' | string;
  category: string;
  dueDate: string | null;
  paymentDate: string | null;
  invoiceNumber: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  supplier: string;
  recurring: boolean;
  method: string;
  createdAt: string;
}

export interface FinanceMetrics {
  receitaRecebida: number;
  aReceber: number;
  inadimplencia: number;
  totalFaturado: number;
  paidCount: number;
  openCount: number;
  overdueCount: number;
  canceledCount: number;
  totalCount: number;
  despesasPagas: number;
  despesasAPagar: number;
  despesasVencidas: number;
  saldoRealizado: number;
}

export interface BillingConfig {
  enabled: boolean;
  amount: number;
  dueDay: number;
  description: string;
  method: string;
  startPeriod?: string;
}

export interface RecurringCustomer {
  id: string;
  name: string;
  isActive: boolean;
  phone: string | null;
  groupName: string | null;
  suggestedAmount: number;
  billing: BillingConfig;
}

export interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
  isActive: boolean;
}

export const PAYMENT_METHODS = ['Boleto / Pix', 'Pix Oficial', 'Boleto 30D', 'Cartão de Crédito', 'Transferência Bancária'];

export const EXPENSE_CATEGORIES = [
  'Infraestrutura & Servidores',
  'Mensageria (Meta / WhatsApp)',
  'Software & Licenças',
  'Pessoal & Pró-labore',
  'Impostos & Taxas',
  'Marketing & Anúncios',
  'Escritório & Administrativo',
  'Outras despesas',
];

export const REVENUE_CATEGORIES = ['Mensalidade', 'Implantação', 'Serviço avulso', 'Consumo / Excedente', 'Outras receitas'];

export const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Em aberto',
  ATRASADO: 'Vencida',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
};

export const STATUS_BADGE: Record<string, string> = {
  ABERTO: 'jm-badge-primary',
  ATRASADO: 'jm-badge-danger',
  PAGO: 'jm-badge-success',
  CANCELADO: 'jm-badge-neutral',
};
