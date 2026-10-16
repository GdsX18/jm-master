'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { peekCache, setCache } from '../lib/cache';
import { clearQueryParams, useQueryParams } from '../hooks/useQueryParams';
import CustomerList from './components/CustomerList';
import GroupsTab from './components/GroupsTab';
import CustomerForm from './components/CustomerForm';
import type { GroupItem } from './types';

type View = { mode: 'list' } | { mode: 'form'; customerId: string | null };

export default function CustomersPage() {
  const params = useQueryParams();
  const [view, setView] = useState<View>({ mode: 'list' });
  const [tab, setTab] = useState<'clientes' | 'grupos'>('clientes');
  const [groups, setGroups] = useState<GroupItem[]>(() => peekCache<GroupItem[]>('/api/products/groups') || []);
  const [listVersion, setListVersion] = useState(0);

  const loadGroups = useCallback(async () => {
    try {
      const data = await api<GroupItem[]>('/api/products/groups');
      setGroups(data);
      setCache('/api/products/groups', data);
    } catch {
      // A lista de grupos mostra o próprio erro na aba Grupos
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Atalhos vindos de outras telas: ?new=1, ?edit=<id>, ?tab=grupos
  useEffect(() => {
    if (!params) return;
    if (params.get('tab') === 'grupos') setTab('grupos');
    if (params.get('new') === '1') setView({ mode: 'form', customerId: null });
    const edit = params.get('edit');
    if (edit) setView({ mode: 'form', customerId: edit });
    if (params.get('new') || edit || params.get('tab')) clearQueryParams('new', 'edit', 'tab');
  }, [params]);

  const backToList = () => {
    setView({ mode: 'list' });
    setListVersion((v) => v + 1);
    loadGroups();
  };

  if (view.mode === 'form') {
    return (
      <div className="jm-page">
        <CustomerForm
          customerId={view.customerId}
          groups={groups}
          onBack={backToList}
          onCreated={(id) => setView({ mode: 'form', customerId: id })}
        />
      </div>
    );
  }

  return (
    <div className="jm-page">
      <div className="jm-page-header">
        <div>
          <h1 className="jm-page-title">Clientes JM Master</h1>
          <p className="jm-page-desc">Gestão de carteira operacional, contatos, documentos e grupos corporativos.</p>
        </div>
      </div>

      <div className="jm-tabs">
        <button onClick={() => setTab('clientes')} className={`jm-tab ${tab === 'clientes' ? 'jm-tab-active' : ''}`}>
          Clientes
        </button>
        <button onClick={() => setTab('grupos')} className={`jm-tab ${tab === 'grupos' ? 'jm-tab-active' : ''}`}>
          Grupos ({groups.length})
        </button>
      </div>

      {tab === 'clientes' ? (
        <CustomerList
          key={listVersion}
          groups={groups}
          onNew={() => setView({ mode: 'form', customerId: null })}
          onEdit={(id) => setView({ mode: 'form', customerId: id })}
        />
      ) : (
        <GroupsTab groups={groups} reload={loadGroups} onEditCustomer={(id) => setView({ mode: 'form', customerId: id })} />
      )}
    </div>
  );
}
