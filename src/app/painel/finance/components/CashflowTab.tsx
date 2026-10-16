'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { formatBRL, monthLabel } from '../../lib/format';
import { BarChart } from '../../components/ui/BarChart';

interface CashflowMonth {
  month: string;
  isFuture: boolean;
  isCurrent: boolean;
  receitaRealizada: number;
  despesaRealizada: number;
  receitaPrevista: number;
  despesaPrevista: number;
  saldo: number;
}

interface CashflowResponse {
  cashflow: CashflowMonth[];
  indicators: { mrr: number; arr: number; activeBillingCount: number; ticketMedio: number; inadimplenciaPct: number };
  byGroup: { group: string; mrr: number; customers: number; ticketMedio: number }[];
  expenseCategories: { category: string; total: number }[];
}

const compactBRL = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil` : formatBRL(v);

export default function CashflowTab() {
  const [data, setData] = useState<CashflowResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<CashflowResponse>('/api/finance/cashflow')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="jm-alert jm-alert-danger">{error}</div>;
  if (!data) return <div className="jm-card jm-empty">Calculando fluxo de caixa...</div>;

  const i = data.indicators;
  // Meses passados: realizado; mês atual e futuros: realizado + previsto (em aberto + mensalidades a gerar)
  const chartData = data.cashflow.map((m) => ({
    label: monthLabel(m.month),
    hint: m.isFuture ? 'previsto' : m.isCurrent ? 'realizado + previsto' : 'realizado',
    muted: m.isFuture,
    values: [
      m.receitaRealizada + (m.isFuture || m.isCurrent ? m.receitaPrevista : 0),
      m.despesaRealizada + (m.isFuture || m.isCurrent ? m.despesaPrevista : 0),
    ],
  }));
  const expenseTotal = data.expenseCategories.reduce((s, e) => s + e.total, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Indicator label="MRR" value={formatBRL(i.mrr)} tone="text-jm-primary-text" />
        <Indicator label="ARR (MRR × 12)" value={formatBRL(i.arr)} />
        <Indicator label="Contratos recorrentes" value={String(i.activeBillingCount)} />
        <Indicator label="Ticket médio" value={formatBRL(i.ticketMedio)} />
        <Indicator label="Inadimplência (12 meses)" value={`${i.inadimplenciaPct.toLocaleString('pt-BR')}%`} tone={i.inadimplenciaPct > 5 ? 'text-jm-danger-fg' : 'text-jm-fg'} />
      </div>

      <div className="jm-card p-4 md:p-5">
        <div className="mb-3">
          <h2 className="jm-card-title">Entradas × saídas por mês</h2>
          <p className="text-xs text-jm-muted">Últimos 6 meses realizados e próximos 6 previstos (barras mais claras).</p>
        </div>
        <BarChart
          title="Fluxo de caixa mensal"
          data={chartData}
          series={[
            { name: 'Entradas', color: 'var(--jm-chart-1)' },
            { name: 'Saídas', color: 'var(--jm-chart-2)' },
          ]}
          format={compactBRL}
        />
      </div>

      <div className="jm-table-wrap">
        <table className="jm-table min-w-[760px]">
          <thead>
            <tr>
              <th className="jm-th">Mês</th>
              <th className="jm-th text-right">Recebido</th>
              <th className="jm-th text-right">Pago</th>
              <th className="jm-th text-right">A receber (previsto)</th>
              <th className="jm-th text-right">A pagar (previsto)</th>
              <th className="jm-th text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {data.cashflow.map((m) => (
              <tr key={m.month} className={`jm-tr ${m.isCurrent ? 'bg-jm-primary-soft' : ''}`}>
                <td className="jm-td font-medium text-jm-fg">
                  {monthLabel(m.month)} {m.isCurrent && <span className="jm-badge jm-badge-primary ml-1">Atual</span>}
                </td>
                <td className="jm-td text-right tabular-nums">{formatBRL(m.receitaRealizada)}</td>
                <td className="jm-td text-right tabular-nums">{formatBRL(m.despesaRealizada)}</td>
                <td className="jm-td text-right tabular-nums text-jm-fg2">{m.isFuture || m.isCurrent ? formatBRL(m.receitaPrevista) : '—'}</td>
                <td className="jm-td text-right tabular-nums text-jm-fg2">{m.isFuture || m.isCurrent ? formatBRL(m.despesaPrevista) : '—'}</td>
                <td className={`jm-td text-right font-semibold tabular-nums ${m.saldo >= 0 ? 'text-jm-success-fg' : 'text-jm-danger-fg'}`}>{formatBRL(m.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="jm-card overflow-hidden">
          <div className="jm-card-header">
            <h2 className="jm-card-title">MRR por grupo corporativo</h2>
          </div>
          {data.byGroup.length === 0 ? (
            <p className="jm-empty py-8">Nenhuma cobrança recorrente ativa.</p>
          ) : (
            <div className="jm-list">
              {data.byGroup.map((g) => (
                <div key={g.group} className="jm-list-item">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-jm-fg">{g.group}</p>
                    <p className="text-xs text-jm-muted">
                      {g.customers} cliente(s) · ticket {formatBRL(g.ticketMedio)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-jm-fg">{formatBRL(g.mrr)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="jm-card overflow-hidden">
          <div className="jm-card-header">
            <h2 className="jm-card-title">Despesas por categoria (últimos 3 meses)</h2>
          </div>
          {data.expenseCategories.length === 0 ? (
            <p className="jm-empty py-8">Nenhuma despesa lançada no período.</p>
          ) : (
            <div className="space-y-3 p-4">
              {data.expenseCategories.map((e) => (
                <div key={e.category}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-jm-fg2">{e.category}</span>
                    <span className="tabular-nums text-jm-fg">
                      {formatBRL(e.total)} <span className="text-jm-muted">({Math.round((e.total / expenseTotal) * 100)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-jm-subtle">
                    <div className="h-full rounded-full" style={{ width: `${(e.total / expenseTotal) * 100}%`, background: 'var(--jm-chart-2)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Indicator({ label, value, tone = 'text-jm-fg' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="jm-card px-4 py-3.5">
      <p className="jm-stat-label">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums tracking-tight ${tone}`}>{value}</p>
    </div>
  );
}
