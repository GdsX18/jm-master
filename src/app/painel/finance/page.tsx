'use client';

import { useState } from 'react';

export default function FinancePage() {
  const [period, setPeriod] = useState('mensal');

  const invoices = [
    { id: 'INV-2026-001', customer: 'ABC Indústria & Comércio S/A', value: 'R$ 4.850,00', status: 'PAGO', dueDate: '10/02/2026', method: 'Boleto / Pix' },
    { id: 'INV-2026-002', customer: 'Global Logistics Brasil Ltda', value: 'R$ 8.200,00', status: 'PAGO', dueDate: '12/02/2026', method: 'Pix Oficial' },
    { id: 'INV-2026-003', customer: 'Apex Soluções em Tecnologia', value: 'R$ 2.400,00', status: 'ABERTO', dueDate: '20/02/2026', method: 'Cartão de Crédito' },
    { id: 'INV-2026-004', customer: 'Master Telecom & Fibra', value: 'R$ 12.900,00', status: 'ABERTO', dueDate: '25/02/2026', method: 'Boleto 30D' },
    { id: 'INV-2026-005', customer: 'Inova Health Saúde Integrada', value: 'R$ 6.300,00', status: 'ATRASADO', dueDate: '05/02/2026', method: 'Pix' },
  ];

  return (
    <div className="p-6 sm:p-8 md:p-10 space-y-8 bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-white min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestão Financeira & Faturamento</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Controle de contratos, faturamento recorrente, faturas emitidas e conciliação bancária.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-[#E85D26] hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-orange-900/10 cursor-pointer">
            <span>+</span>
            <span>NOVA FATURA</span>
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <p className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">Receita Recebida</p>
          <h3 className="text-3xl font-extrabold mt-2 text-emerald-600 dark:text-emerald-400">R$ 48.650,00</h3>
          <span className="text-[11px] text-emerald-500 font-semibold mt-1 block">↑ +14% vs mês anterior</span>
        </div>

        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />
          <p className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">A Receber (No Prazo)</p>
          <h3 className="text-3xl font-extrabold mt-2 text-sky-600 dark:text-sky-400">R$ 21.500,00</h3>
          <span className="text-[11px] text-neutral-400 font-semibold mt-1 block">8 faturas em aberto</span>
        </div>

        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
          <p className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">Inadimplência (&gt; 5d)</p>
          <h3 className="text-3xl font-extrabold mt-2 text-rose-600 dark:text-rose-400">R$ 6.300,00</h3>
          <span className="text-[11px] text-rose-500 font-semibold mt-1 block">1 fatura pendente</span>
        </div>

        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E85D26]" />
          <p className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">MRR (Recorrência)</p>
          <h3 className="text-3xl font-extrabold mt-2 text-[#E85D26]">R$ 76.450,00</h3>
          <span className="text-[11px] text-orange-500 font-semibold mt-1 block">124 contas ativas</span>
        </div>
      </div>

      {/* TABELA DE FATURAS RECENTES */}
      <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Últimas Faturas e Cobranças</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Histórico de transações emitidas pelo módulo de billing corporativo.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 text-[11px] font-extrabold uppercase text-neutral-500 dark:text-neutral-400">
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
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-850/50 transition">
                  <td className="p-4 font-mono font-bold text-[#E85D26]">{inv.id}</td>
                  <td className="p-4 font-bold text-neutral-900 dark:text-white">{inv.customer}</td>
                  <td className="p-4 font-extrabold text-neutral-800 dark:text-neutral-200">{inv.value}</td>
                  <td className="p-4 text-neutral-500 dark:text-neutral-400">{inv.dueDate}</td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-300">{inv.method}</td>
                  <td className="p-4">
                    {inv.status === 'PAGO' && (
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ✓ PAGO
                      </span>
                    )}
                    {inv.status === 'ABERTO' && (
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        ⏳ EM ABERTO
                      </span>
                    )}
                    {inv.status === 'ATRASADO' && (
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        ⚠ ATRASADO
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-bold transition cursor-pointer">
                      Ver PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
