'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { clearQueryParams, useQueryParams } from '../hooks/useQueryParams';
import RecordsTab from './components/RecordsTab';
import RecurringTab from './components/RecurringTab';
import CashflowTab from './components/CashflowTab';

type Tab = 'receitas' | 'despesas' | 'recorrentes' | 'fluxo';

export default function FinancePage() {
  const params = useQueryParams();
  const [tab, setTab] = useState<Tab>('receitas');
  const [openNew, setOpenNew] = useState(false);
  const [focusCustomer, setFocusCustomer] = useState<string | null>(null);
  const [automationNote, setAutomationNote] = useState('');

  // Atalhos: ?new=1 (nova fatura), ?tab=recorrentes&customer=<id>
  useEffect(() => {
    if (!params) return;
    const t = params.get('tab');
    if (t === 'recorrentes' || t === 'despesas' || t === 'fluxo') setTab(t);
    if (params.get('customer')) setFocusCustomer(params.get('customer'));
    if (params.get('new') === '1') setOpenNew(true);
    if (t || params.get('new') || params.get('customer')) clearQueryParams('tab', 'new', 'customer');
  }, [params]);

  // Ao abrir o Financeiro: gera faturas recorrentes pendentes do mês (no máximo a cada 6 h; o cron diário cobre o resto)
  useEffect(() => {
    api<{ skippedRun?: boolean; created?: number; overdueLogged?: number }>('/api/finance/generate?auto=1', { method: 'POST' })
      .then((r) => {
        if (!r.skippedRun && (r.created || r.overdueLogged)) {
          setAutomationNote(
            `Automação: ${r.created || 0} fatura(s) recorrente(s) gerada(s) e ${r.overdueLogged || 0} vencida(s) registrada(s) no CRM.`
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="jm-page">
      <header className="jm-page-header">
        <div>
          <h1 className="jm-page-title">Financeiro</h1>
          <p className="jm-page-desc">Faturas, despesas, cobrança recorrente automática, fluxo de caixa e MRR.</p>
        </div>
      </header>

      {automationNote && (
        <div className="jm-alert jm-alert-info flex items-center justify-between gap-3">
          <span>{automationNote}</span>
          <button onClick={() => setAutomationNote('')} className="text-xs underline">
            Fechar
          </button>
        </div>
      )}

      <div className="jm-tabs">
        {(
          [
            ['receitas', 'Faturas (receitas)'],
            ['despesas', 'Despesas'],
            ['recorrentes', 'Cobrança recorrente'],
            ['fluxo', 'Fluxo de caixa & MRR'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`jm-tab ${tab === key ? 'jm-tab-active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'receitas' && <RecordsTab key="RECEITA" type="RECEITA" openNew={openNew} onNewHandled={() => setOpenNew(false)} />}
      {tab === 'despesas' && <RecordsTab key="DESPESA" type="DESPESA" openNew={false} onNewHandled={() => {}} />}
      {tab === 'recorrentes' && <RecurringTab focusCustomer={focusCustomer} />}
      {tab === 'fluxo' && <CashflowTab />}
    </div>
  );
}
