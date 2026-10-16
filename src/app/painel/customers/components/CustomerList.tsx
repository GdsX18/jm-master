'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api, qs } from '../../lib/api';
import { peekCache, setCache } from '../../lib/cache';
import { maskDocument } from '../../lib/format';
import { useDebounce } from '../../hooks/useDebounce';
import { useNotify } from '../../components/ui/Notifications';
import { Pagination } from '../../components/ui/Pagination';
import type { CustomerListItem, CustomerStats, GroupItem } from '../types';

interface ListResponse {
  customers: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
  stats: CustomerStats;
}

const PAGE_SIZE = 25;

export default function CustomerList({
  groups,
  onNew,
  onEdit,
}: {
  groups: GroupItem[];
  onNew: () => void;
  onEdit: (id: string) => void;
}) {
  const { toast, confirm } = useNotify();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [groupId, setGroupId] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debouncedSearch = useDebounce(search);

  const url = `/api/customers${qs({ q: debouncedSearch, status, type, groupId, page, pageSize: PAGE_SIZE })}`;

  const load = async () => {
    const cached = peekCache<ListResponse>(url);
    if (cached) setData(cached);
    setLoading(!cached);
    setError('');
    try {
      const res = await api<ListResponse>(url);
      setData(res);
      setCache(url, res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Filtro mudou: volta para a primeira página
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, type, groupId]);

  const handleDelete = async (c: CustomerListItem) => {
    const ok = await confirm({
      title: 'Excluir cliente',
      message: `Excluir "${c.name}"? Contatos, documentos anexados e observações serão removidos. O histórico do CRM, propostas e faturas são mantidos (sem o vínculo). Se quiser apenas pausar, prefira inativar o cadastro.`,
      confirmLabel: 'Sim, excluir cliente',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/customers/${c.id}`, { method: 'DELETE' });
      toast.success('Cliente excluído', `"${c.name}" foi removido.`);
      load();
    } catch (e) {
      toast.error('Não foi possível excluir', e instanceof Error ? e.message : undefined);
    }
  };

  const stats = data?.stats;
  const customers = data?.customers || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Clientes cadastrados" value={stats?.total} />
        <Stat label="Ativos" value={stats?.active} className="text-jm-success-fg" />
        <Stat label="Pré-pago" value={stats?.prePaid} className="text-jm-accent-text" />
        <Stat label="Pós-pago" value={stats?.postPaid} className="text-jm-primary-text" />
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-placeholder" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, CPF/CNPJ, código, cidade, telefone..."
            className="jm-input pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="jm-input w-auto">
            <option value="all">Todos os status</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="jm-input w-auto">
            <option value="all">Pré e pós-pago</option>
            <option value="PRE_PAGO">Pré-pago</option>
            <option value="POS_PAGO">Pós-pago</option>
          </select>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="jm-input w-auto">
            <option value="all">Todos os grupos</option>
            <option value="none">Sem grupo</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button onClick={onNew} className="jm-btn jm-btn-accent lg:ml-auto">
            + Novo cliente
          </button>
        </div>
      </div>

      {error && <div className="jm-alert jm-alert-danger">{error}</div>}

      <div className="jm-table-wrap">
        {loading && !data ? (
          <div className="jm-empty">Carregando carteira de clientes...</div>
        ) : customers.length === 0 ? (
          <div className="jm-empty">
            {debouncedSearch || status !== 'all' || type !== 'all' || groupId !== 'all'
              ? 'Nenhum cliente encontrado com esses filtros.'
              : 'Nenhum cliente cadastrado ainda. Clique em "+ Novo cliente" ou converta um lead do funil.'}
          </div>
        ) : (
          <>
            <table className={`jm-table min-w-[820px] ${loading ? 'opacity-60' : ''}`}>
              <thead>
                <tr>
                  <th className="jm-th">Cliente</th>
                  <th className="jm-th">CPF / CNPJ</th>
                  <th className="jm-th">Tipo</th>
                  <th className="jm-th">Grupo corporativo</th>
                  <th className="jm-th">Cidade/UF</th>
                  <th className="jm-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="jm-tr cursor-pointer" onClick={() => onEdit(c.id)}>
                    <td className="jm-td">
                      <span className="text-sm font-medium text-jm-fg">{c.name}</span>
                      <div className="mt-0.5 flex items-center gap-2">
                        {c.code && <span className="font-mono text-xs text-jm-muted">{c.code}</span>}
                        <span className={`jm-badge ${c.isActive ? 'jm-badge-success' : 'jm-badge-danger'}`}>
                          {c.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="jm-td tabular-nums text-jm-fg2">{c.document ? maskDocument(c.document) : '—'}</td>
                    <td className="jm-td">
                      <span className={`jm-badge ${c.type === 'POS_PAGO' ? 'jm-badge-primary' : 'jm-badge-accent'}`}>
                        {c.type === 'POS_PAGO' ? 'Pós-pago' : 'Pré-pago'}
                      </span>
                    </td>
                    <td className="jm-td">
                      {c.groups.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.groups.map((g) => (
                            <span key={g.id} className="jm-badge jm-badge-neutral">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs italic text-jm-muted">Nenhum</span>
                      )}
                    </td>
                    <td className="jm-td text-jm-fg2">{c.city ? `${c.city}/${c.state}` : '—'}</td>
                    <td className="jm-td space-x-1.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onEdit(c.id)} className="jm-btn jm-btn-secondary jm-btn-sm">
                        Abrir
                      </button>
                      <button onClick={() => handleDelete(c)} className="jm-btn jm-btn-danger jm-btn-sm">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total || 0} onChange={setPage} label="clientes" />
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, className = 'text-jm-fg' }: { label: string; value: number | undefined; className?: string }) {
  return (
    <div className="jm-card px-4 py-3.5">
      <p className="jm-stat-label">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${className}`}>{value ?? '—'}</p>
    </div>
  );
}
