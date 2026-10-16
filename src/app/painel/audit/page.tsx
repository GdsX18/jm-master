'use client';

import { Fragment, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api, qs } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/ui/Pagination';
import { useNotify } from '../components/ui/Notifications';

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  changes: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

const ENTITIES: Record<string, string> = {
  user: 'Usuários & acesso',
  customer: 'Clientes',
  group: 'Grupos',
  product: 'Produtos',
  prices: 'Tabela de preços',
  invoice: 'Financeiro',
  billing: 'Cobrança recorrente',
  lead: 'Funil (leads)',
  proposal: 'Propostas',
  crm: 'CRM',
  post: 'Blog — artigos',
  category: 'Blog — categorias',
  media: 'Blog — imagens',
  settings: 'Tags / configurações',
};

const ACTIONS: Record<string, { label: string; badge: string }> = {
  CREATE: { label: 'Criou', badge: 'jm-badge-success' },
  UPDATE: { label: 'Alterou', badge: 'jm-badge-primary' },
  DELETE: { label: 'Excluiu', badge: 'jm-badge-danger' },
  STATUS: { label: 'Status', badge: 'jm-badge-accent' },
  LOGIN: { label: 'Login', badge: 'jm-badge-neutral' },
  LOGIN_FAILED: { label: 'Login falhou', badge: 'jm-badge-warning' },
  LOGOUT: { label: 'Logout', badge: 'jm-badge-neutral' },
  PASSWORD: { label: 'Senha', badge: 'jm-badge-warning' },
  CONVERT: { label: 'Converteu', badge: 'jm-badge-success' },
  GENERATE: { label: 'Gerou', badge: 'jm-badge-primary' },
};

const PAGE_SIZE = 50;

function renderValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '∅';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// Trilha de auditoria: quem fez o quê, quando (exige "Gerenciar usuários")
export default function AuditPage() {
  const { toast } = useNotify();
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [data, setData] = useState<{ logs: AuditLog[]; total: number; users: { id: string; name: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const debounced = useDebounce(search);

  useEffect(() => {
    setLoading(true);
    api<{ logs: AuditLog[]; total: number; users: { id: string; name: string }[] }>(
      `/api/audit${qs({ entity, action, userId, from, to, q: debounced, page, pageSize: PAGE_SIZE })}`
    )
      .then(setData)
      .catch((e) => toast.error('Erro ao carregar auditoria', e.message))
      .finally(() => setLoading(false));
  }, [entity, action, userId, from, to, debounced, page, toast]);

  useEffect(() => setPage(1), [entity, action, userId, from, to, debounced]);

  return (
    <div className="jm-page">
      <header className="jm-page-header">
        <div>
          <h1 className="jm-page-title">Auditoria</h1>
          <p className="jm-page-desc">Registro de todas as alterações, acessos e exclusões feitas no painel.</p>
        </div>
      </header>

      <div className="jm-card grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-placeholder" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar no resumo, nome ou e-mail..." className="jm-input pl-9" />
        </div>
        <select value={entity} onChange={(e) => setEntity(e.target.value)} className="jm-input">
          <option value="">Todos os módulos</option>
          {Object.entries(ENTITIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="jm-input">
          <option value="">Todas as ações</option>
          {Object.entries(ACTIONS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className="jm-input">
          <option value="">Todos os usuários</option>
          {data?.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="jm-input" title="De" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="jm-input" title="Até" />
        </div>
      </div>

      <div className="jm-table-wrap">
        {loading && !data ? (
          <div className="jm-empty">Carregando...</div>
        ) : !data || data.logs.length === 0 ? (
          <div className="jm-empty">Nenhum registro encontrado.</div>
        ) : (
          <>
            <table className={`jm-table min-w-[860px] ${loading ? 'opacity-60' : ''}`}>
              <thead>
                <tr>
                  <th className="jm-th w-40">Quando</th>
                  <th className="jm-th w-48">Quem</th>
                  <th className="jm-th w-28">Ação</th>
                  <th className="jm-th w-40">Módulo</th>
                  <th className="jm-th">O quê</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => {
                  const a = ACTIONS[log.action] || { label: log.action, badge: 'jm-badge-neutral' };
                  const hasChanges = log.changes && Object.keys(log.changes).length > 0;
                  return (
                    <Fragment key={log.id}>
                      <tr className={`jm-tr ${hasChanges ? 'cursor-pointer' : ''}`} onClick={() => hasChanges && setExpanded(expanded === log.id ? null : log.id)}>
                        <td className="jm-td tabular-nums text-xs text-jm-fg2">{formatDateTime(log.createdAt)}</td>
                        <td className="jm-td">
                          <p className="text-sm text-jm-fg">{log.userName}</p>
                          {log.userEmail && <p className="text-[11px] text-jm-muted">{log.userEmail}</p>}
                        </td>
                        <td className="jm-td">
                          <span className={`jm-badge ${a.badge}`}>{a.label}</span>
                        </td>
                        <td className="jm-td text-xs text-jm-fg2">{ENTITIES[log.entity] || log.entity}</td>
                        <td className="jm-td text-sm text-jm-fg">
                          {log.summary}
                          {hasChanges && <span className="ml-2 text-[11px] text-jm-primary-text">{expanded === log.id ? 'ocultar detalhes ▲' : 'ver detalhes ▼'}</span>}
                          {log.ip && <span className="ml-2 font-mono text-[10px] text-jm-placeholder">{log.ip}</span>}
                        </td>
                      </tr>
                      {expanded === log.id && log.changes && (
                        <tr>
                          <td colSpan={5} className="bg-jm-subtle px-5 py-3">
                            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs md:grid-cols-2">
                              {Object.entries(log.changes).map(([field, value]) => {
                                const diff = value && typeof value === 'object' && 'from' in (value as object) && 'to' in (value as object);
                                return (
                                  <div key={field} className="min-w-0">
                                    <dt className="font-semibold text-jm-fg2">{field}</dt>
                                    <dd className="break-words font-mono text-[11px] text-jm-muted">
                                      {diff ? (
                                        <>
                                          <span className="text-jm-danger-fg line-through">{renderValue((value as { from: unknown }).from)}</span>
                                          {' → '}
                                          <span className="text-jm-success-fg">{renderValue((value as { to: unknown }).to)}</span>
                                        </>
                                      ) : (
                                        renderValue(value)
                                      )}
                                    </dd>
                                  </div>
                                );
                              })}
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
