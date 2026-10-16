'use client';

import { useEffect, useState } from 'react';
import { clearQueryParams, useQueryParams } from '../hooks/useQueryParams';
import FunnelBoard from './components/FunnelBoard';
import TimelineTab from './components/TimelineTab';

export default function CrmPage() {
  const params = useQueryParams();
  const [tab, setTab] = useState<'funil' | 'timeline'>('funil');
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [openNewLead, setOpenNewLead] = useState(false);

  // Atalhos: ?lead=<id> abre o lead; ?new=lead abre o cadastro; ?tab=timeline
  useEffect(() => {
    if (!params) return;
    if (params.get('tab') === 'timeline') setTab('timeline');
    if (params.get('lead')) setOpenLeadId(params.get('lead'));
    if (params.get('new') === 'lead') setOpenNewLead(true);
    if (params.get('lead') || params.get('new') || params.get('tab')) clearQueryParams('lead', 'new', 'tab');
  }, [params]);

  return (
    <div className="jm-page">
      <header className="jm-page-header">
        <div>
          <h1 className="jm-page-title">CRM & funil de vendas</h1>
          <p className="jm-page-desc">Leads do site e manuais, negociação por estágio e histórico completo de atendimento.</p>
        </div>
      </header>

      <div className="jm-tabs">
        <button onClick={() => setTab('funil')} className={`jm-tab ${tab === 'funil' ? 'jm-tab-active' : ''}`}>
          Funil de vendas
        </button>
        <button onClick={() => setTab('timeline')} className={`jm-tab ${tab === 'timeline' ? 'jm-tab-active' : ''}`}>
          Linha do tempo
        </button>
      </div>

      {tab === 'funil' ? (
        <FunnelBoard
          openLeadId={openLeadId}
          onLeadOpened={() => setOpenLeadId(null)}
          openNewLead={openNewLead}
          onNewLeadHandled={() => setOpenNewLead(false)}
        />
      ) : (
        <TimelineTab onOpenLead={(id) => {
          setTab('funil');
          setOpenLeadId(id);
        }} />
      )}
    </div>
  );
}
