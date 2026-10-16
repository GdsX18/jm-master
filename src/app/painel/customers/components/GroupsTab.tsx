'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, qs } from '../../lib/api';
import { maskDocument } from '../../lib/format';
import { useNotify } from '../../components/ui/Notifications';
import type { CustomerListItem, GroupItem } from '../types';

export default function GroupsTab({
  groups,
  reload,
  onEditCustomer,
}: {
  groups: GroupItem[];
  reload: () => Promise<void>;
  onEditCustomer: (id: string) => void;
}) {
  const { toast, confirm } = useNotify();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
  const totalMembers = groups.reduce((s, g) => s + g.customerCount, 0);

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api('/api/products/groups', { method: 'POST', json: { name: newName.trim() } });
      toast.success('Grupo criado', `"${newName.trim()}" está disponível para vincular clientes e definir preços.`);
      setNewName('');
      setShowCreate(false);
      await reload();
    } catch (e) {
      toast.error('Erro ao criar grupo', e instanceof Error ? e.message : undefined);
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (g: GroupItem) => {
    try {
      await api(`/api/customers/groups/${g.id}/toggle`, { method: 'PUT' });
      toast.success(`Grupo ${g.isActive ? 'inativado' : 'ativado'}`, g.name);
      await reload();
    } catch (e) {
      toast.error('Erro ao alterar status', e instanceof Error ? e.message : undefined);
    }
  };

  const remove = async (g: GroupItem) => {
    const ok = await confirm({
      title: 'Excluir grupo',
      message: `Excluir "${g.name}"? ${g.customerCount} cliente(s) perdem o vínculo e a tabela de preços do grupo (${g.priceCount} produto(s)) é apagada.`,
      confirmLabel: 'Sim, excluir',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/products/groups${qs({ id: g.id })}`, { method: 'DELETE' });
      toast.success('Grupo excluído', g.name);
      await reload();
    } catch (e) {
      toast.error('Erro ao excluir', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="jm-card px-4 py-3.5">
          <p className="jm-stat-label">Grupos registrados</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-jm-fg">{groups.length}</p>
        </div>
        <div className="jm-card px-4 py-3.5">
          <p className="jm-stat-label">Vínculos de empresas</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-jm-primary-text">{totalMembers}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar grupo..."
          className="jm-input max-w-md"
        />
        <button onClick={() => setShowCreate(true)} className="jm-btn jm-btn-accent sm:ml-auto">
          + Cadastrar grupo
        </button>
      </div>

      {showCreate && (
        <div className="jm-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="Nome do grupo corporativo (ex.: Grupo Varejo Sul)"
            className="jm-input flex-1"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="jm-btn jm-btn-secondary">
              Cancelar
            </button>
            <button onClick={create} disabled={creating || !newName.trim()} className="jm-btn jm-btn-primary">
              {creating ? 'Salvando...' : 'Salvar grupo'}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="jm-card jm-empty">
          {groups.length === 0 ? 'Nenhum grupo corporativo cadastrado ainda.' : 'Nenhum grupo encontrado.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((g) => (
            <div key={g.id} className="jm-card overflow-hidden">
              <div className="flex flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center md:px-5">
                <button className="min-w-0 text-left" onClick={() => setExpanded(expanded === g.id ? null : g.id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-jm-fg">{g.name}</h3>
                    <span className={`jm-badge ${g.isActive ? 'jm-badge-success' : 'jm-badge-danger'}`}>
                      {g.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-jm-muted">
                    {g.customerCount} empresa(s) · {g.activeCustomerCount} ativa(s) · {g.priceCount} preço(s) definido(s)
                    <span className="ml-2 text-jm-primary-text">{expanded === g.id ? 'Ocultar empresas ▲' : 'Ver empresas ▼'}</span>
                  </p>
                </button>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link href={`/painel/products?group=${g.id}`} className="jm-btn jm-btn-secondary jm-btn-sm">
                    Tabela de preços
                  </Link>
                  <button onClick={() => toggle(g)} className={`jm-btn jm-btn-sm ${g.isActive ? 'jm-btn-danger' : 'jm-btn-primary'}`}>
                    {g.isActive ? 'Inativar' : 'Ativar'}
                  </button>
                  <button onClick={() => remove(g)} className="jm-btn jm-btn-ghost jm-btn-sm text-jm-danger-fg hover:bg-jm-danger-bg">
                    Excluir
                  </button>
                </div>
              </div>
              {expanded === g.id && <GroupMembers groupId={g.id} onEdit={onEditCustomer} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Empresas do grupo, carregadas só quando o grupo é expandido
function GroupMembers({ groupId, onEdit }: { groupId: string; onEdit: (id: string) => void }) {
  const [members, setMembers] = useState<CustomerListItem[] | null>(null);
  useEffect(() => {
    api<{ customers: CustomerListItem[] }>(`/api/customers${qs({ groupId, pageSize: 100 })}`)
      .then((d) => setMembers(d.customers))
      .catch(() => setMembers([]));
  }, [groupId]);

  if (!members) return <div className="border-t border-jm-border py-4 text-center text-xs text-jm-muted">Carregando...</div>;
  if (members.length === 0)
    return <div className="border-t border-jm-border py-4 text-center text-xs text-jm-muted">Nenhuma empresa vinculada.</div>;

  return (
    <div className="overflow-x-auto border-t border-jm-border">
      <table className="jm-table min-w-[620px]">
        <tbody>
          {members.map((c) => (
            <tr key={c.id} className="jm-tr cursor-pointer" onClick={() => onEdit(c.id)}>
              <td className="jm-td font-medium text-jm-fg">{c.name}</td>
              <td className="jm-td tabular-nums text-jm-fg2">{c.document ? maskDocument(c.document) : '—'}</td>
              <td className="jm-td">
                <span className={`jm-badge ${c.isActive ? 'jm-badge-success' : 'jm-badge-danger'}`}>{c.isActive ? 'Ativo' : 'Inativo'}</span>
              </td>
              <td className="jm-td text-jm-fg2">{c.city ? `${c.city}/${c.state}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
