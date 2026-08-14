'use client';

import { useState } from 'react';

export default function CrmHistoryPage() {
  const [filterType, setFilterType] = useState('all');

  const timelineItems = [
    {
      id: '1',
      operator: 'João Moreira (Admin)',
      customer: 'ABC Indústria & Comércio S/A',
      title: 'Alinhamento de Integração WhatsApp API',
      description: 'Reunião técnica realizada para definir webhooks e integração com sistema ERP interno. Templates de cobrança aprovados na Meta.',
      date: 'Hoje às 16:45',
      type: 'REUNIAO',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    },
    {
      id: '2',
      operator: 'Adrielly de Campos (Super Admin)',
      customer: 'Global Logistics Brasil Ltda',
      title: 'Upgrade de Plano para Enterprise Cloud',
      description: 'Cliente solicitou liberação de mais 10 atendentes simultâneos no fluxo de rastreamento de entregas. Contrato aditado.',
      date: 'Hoje às 14:10',
      type: 'COMERCIAL',
      badge: 'bg-orange-500/10 text-[#E85D26] border border-orange-500/20',
    },
    {
      id: '3',
      operator: 'Amanda Santos (Supervisor)',
      customer: 'Apex Soluções em Tecnologia',
      title: 'Suporte Técnico: Configuração de Chatbot de Atendimento',
      description: 'Ajuste de fluxo do robô de primeiro contato para triagem de leads qualificados. TMA reduzido para 45 segundos.',
      date: 'Ontem às 18:30',
      type: 'SUPORTE',
      badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
    },
    {
      id: '4',
      operator: 'Anderson Rodrigues (Supervisor)',
      customer: 'Inova Health Saúde Integrada',
      title: 'Tratativa de Retenção & Feedback de NPS',
      description: 'Pesquisa trimestral de satisfação aplicada com nota 10/10 na velocidade de resposta e estabilidade dos canais.',
      date: 'Ontem às 11:15',
      type: 'NPS',
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
    },
  ];

  return (
    <div className="p-6 sm:p-8 md:p-10 space-y-8 bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-white min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">CRM & Linha do Tempo de Tratativas</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Histórico completo de atendimentos, interações técnicas, reuniões comerciais e registros de relacionamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-[#E85D26] hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-orange-900/10 cursor-pointer">
            <span>✍️</span>
            <span>REGISTRAR INTERAÇÃO</span>
          </button>
        </div>
      </div>

      {/* TIMELINE DE TRATATIVAS */}
      <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Linha do Tempo Recente</h2>
          <span className="text-xs text-neutral-400 font-semibold">{timelineItems.length} registros computados</span>
        </div>

        <div className="space-y-6">
          {timelineItems.map((item) => (
            <div key={item.id} className="relative pl-6 border-l-2 border-[#E85D26]/40 space-y-2">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#E85D26] border-2 border-white dark:border-neutral-900" />
              
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.badge}`}>
                    {item.type}
                  </span>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    {item.customer}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 font-medium">{item.date}</span>
              </div>

              <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {item.title}
              </h4>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
                {item.description}
              </p>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400 font-medium">
                <span>👤 Responsável: <strong className="text-neutral-700 dark:text-neutral-300">{item.operator}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
