'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';

import {
  EMPTY_PERMISSIONS as DEFAULT_PERMISSIONS,
  ROLE_DEFAULTS,
  type Permissions,
  type UserRole,
} from '@/lib/permissions';
import { peekCache, setCache } from '../lib/cache';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  permissions: Permissions;
  prohibitions: Permissions;
}

// Usuários antigos podem ter permissões salvas como {}: nesse caso valem os padrões do perfil
function withRoleDefaults(role: UserRole, stored: Partial<Permissions> | undefined, kind: 'permissions' | 'prohibitions'): Permissions {
  const defaults = ROLE_DEFAULTS[role]?.[kind] || DEFAULT_PERMISSIONS;
  if (!stored || Object.keys(stored).length === 0) return defaults;
  return { ...DEFAULT_PERMISSIONS, ...stored };
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<UserRole>('Criador de Blog');
  const [formIsBlocked, setFormIsBlocked] = useState(false);
  const [formPermissions, setFormPermissions] = useState<Permissions>(ROLE_DEFAULTS['Criador de Blog'].permissions);
  const [formProhibitions, setFormProhibitions] = useState<Permissions>(ROLE_DEFAULTS['Criador de Blog'].prohibitions);

  // Dialog/Modal de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Carregar dados de usuários da API
  const fetchUsersFromApi = async () => {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data?.error || 'Não foi possível carregar os usuários.');
      }
      setUsers(data);
      setCache('/api/users', data);
      if (data.length > 0) {
        if (!selectedUser && !isNewUser) {
          selectUser(data[0]);
        } else if (selectedUser) {
          const updated = data.find((u: User) => u.id === selectedUser.id);
          if (updated) selectUser(updated);
        }
      } else {
        setSelectedUser(null);
      }
    } catch (e: any) {
      console.error('Erro ao carregar usuários da API:', e);
      showNotification('error', e.message || 'Não foi possível carregar os usuários.');
    }
  };

  useEffect(() => {
    setIsMounted(true);
    // Lista da última visita aparece na hora; a requisição atualiza em seguida
    const cached = peekCache<User[]>('/api/users');
    if (cached && cached.length > 0) {
      setUsers(cached);
      selectUser(cached[0]);
    }
    fetchUsersFromApi();
  }, []);

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setIsNewUser(false);
    setIsEditing(true);

    // Preencher formulário com dados reais do usuário selecionado
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword('');
    setShowPassword(false);
    setFormRole(user.role);
    setFormIsBlocked(user.isBlocked);
    setFormPermissions(withRoleDefaults(user.role, user.permissions, 'permissions'));
    setFormProhibitions(withRoleDefaults(user.role, user.prohibitions, 'prohibitions'));
  };

  const handleStartNewUser = () => {
    setIsNewUser(true);
    setIsEditing(true);
    setSelectedUser(null);

    // Limpar formulário para novo cadastro
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setShowPassword(true);
    setFormRole('Criador de Blog');
    setFormIsBlocked(false);
    setFormPermissions(ROLE_DEFAULTS['Criador de Blog'].permissions);
    setFormProhibitions(ROLE_DEFAULTS['Criador de Blog'].prohibitions);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormRole(newRole);
    // Aplicar automaticamente as permissões e proibições recomendadas para a classe
    if (ROLE_DEFAULTS[newRole]) {
      setFormPermissions(ROLE_DEFAULTS[newRole].permissions);
      setFormProhibitions(ROLE_DEFAULTS[newRole].prohibitions);
    }
  };

  const handleCancel = () => {
    if (isNewUser) {
      if (users.length > 0) {
        selectUser(users[0]);
      } else {
        setSelectedUser(null);
        setIsNewUser(false);
        setIsEditing(false);
      }
    } else if (selectedUser) {
      selectUser(selectedUser);
    }
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    const random = new Uint32Array(14);
    crypto.getRandomValues(random);
    const newPassword = Array.from(random, (n) => chars[n % chars.length]).join('');
    setFormPassword(newPassword);
    setShowPassword(true);
    showNotification('success', 'Nova senha forte gerada com sucesso!');
  };

  const handleTogglePermission = (field: keyof Permissions, type: 'permission' | 'prohibition') => {
    if (!isEditing) return;
    if (type === 'permission') {
      const nextVal = !formPermissions[field];
      setFormPermissions({
        ...formPermissions,
        [field]: nextVal,
      });
      if (nextVal && formProhibitions[field]) {
        setFormProhibitions({
          ...formProhibitions,
          [field]: false,
        });
      }
    } else {
      const nextVal = !formProhibitions[field];
      setFormProhibitions({
        ...formProhibitions,
        [field]: nextVal,
      });
      if (nextVal && formPermissions[field]) {
        setFormPermissions({
          ...formPermissions,
          [field]: false,
        });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showNotification('error', 'Nome e e-mail são campos obrigatórios.');
      return;
    }

    if (isNewUser && !formPassword.trim()) {
      showNotification('error', 'Por favor, defina uma senha para o novo usuário.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        id: isNewUser ? undefined : selectedUser?.id,
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim(),
        role: formRole,
        isBlocked: formIsBlocked,
        permissions: formPermissions,
        prohibitions: formProhibitions,
      };

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar usuário');
      }

      await fetchUsersFromApi();

      if (isNewUser) {
        selectUser(data.user);
        showNotification('success', `Usuário "${data.user.name}" cadastrado com sucesso!`);
      } else {
        selectUser(data.user);
        showNotification(
          'success',
          data.passwordChanged
            ? `Dados e senha de "${data.user.name}" atualizados com sucesso!`
            : `Dados de "${data.user.name}" atualizados com sucesso!`
        );
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setUserToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/users?id=${userToDelete}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao excluir o usuário.');
      }
      showNotification('success', 'Usuário excluído com sucesso.');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      if (selectedUser?.id === userToDelete) setSelectedUser(null);
      await fetchUsersFromApi();
    } catch (e: any) {
      showNotification('error', e.message || 'Falha ao excluir o usuário.');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    const split = name.split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const roleStyles: Record<UserRole, string> = {
    'Super administrador': 'jm-badge-primary',
    Administrador: 'jm-badge-accent',
    Supervisor: 'jm-badge-warning',
    Operador: 'jm-badge-success',
    'Criador de Blog': 'jm-badge-neutral',
  };

  const permissionsList = [
    { key: 'manageBlog', label: 'Criador de Blog & Artigos', desc: 'Permite criar, redigir, editar imagens e publicar artigos no Blog oficial da JM Master.' },
    { key: 'manageUsers', label: 'Gerenciar Usuários & Classes', desc: 'Permite gerenciar operadores, cadastrar novos usuários e definir permissões.' },
    { key: 'manageCrm', label: 'CRM & Central de Clientes', desc: 'Permite visualizar e gerenciar histórico de contatos, clientes e grupos corporativos.' },
    { key: 'manageFinance', label: 'Módulo Financeiro & Faturamento', desc: 'Permite visualizar faturamentos, cobranças e relatórios de fluxo financeiro.' },
    { key: 'manageProducts', label: 'Catálogo de Produtos & Preços', desc: 'Permite gerenciar produtos, serviços e precificação do portfólio.' },
    { key: 'createCampaign', label: 'Criar Campanhas de Mensageria', desc: 'Permite estruturar campanhas ativas e funis no sistema. (Módulo ainda não disponível no sistema.)' },
    { key: 'executeDispatches', label: 'Efetuar Disparos WhatsApp API', desc: 'Permite realizar disparos em lote via WhatsApp Cloud API Oficial. (Módulo ainda não disponível no sistema.)' },
    { key: 'manageTriggers', label: 'Gerenciar Gatilhos & Automações', desc: 'Permite configurar webhooks, transbordo inteligente e gatilhos. (Módulo ainda não disponível no sistema.)' },
    { key: 'surveyManagement', label: 'Gestão de Pesquisa & NPS', desc: 'Permite manutenção e gerenciamento de pesquisas de satisfação. (Módulo ainda não disponível no sistema.)' },
    { key: 'structuralManagement', label: 'Gerenciamento Estrutural', desc: 'Permite gerenciar departamentos e configurações corporativas.' },
  ] as const;

  // Interruptor compacto (cantos retos, sem sombra)
  const switchTrack = (on: boolean, onClass: string) =>
    `relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-[3px] border transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-jm-ring disabled:cursor-not-allowed disabled:opacity-60 ${
      on ? `${onClass} border-transparent` : 'border-jm-border-strong bg-jm-hover'
    }`;
  const switchThumb = (on: boolean) =>
    `pointer-events-none absolute top-[2px] h-3 w-3 rounded-[2px] transition-[left] duration-100 ${on ? 'left-[16px] bg-white' : 'left-[2px] bg-jm-muted'}`;

  return (
    <div className="jm-page relative">

      {/* TOAST DE NOTIFICAÇÃO FLUTUANTE */}
      {toastMessage && (
        <div className={`fixed right-4 top-4 z-[999999] flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-[4px] border px-3.5 py-2.5 text-[13px] font-medium shadow-jm-pop ${
          toastMessage.type === 'success'
            ? 'border-jm-success-border bg-jm-surface text-jm-success-fg'
            : 'border-jm-danger-border bg-jm-surface text-jm-danger-fg'
        }`} style={{ animation: 'jm-pop-in 140ms ease-out' }}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span className="text-jm-fg">{toastMessage.text}</span>
        </div>
      )}

      {/* CABEÇALHO DA PÁGINA */}
      <header className="jm-page-header">
        <div>
          <h1 className="jm-page-title">Usuários do sistema</h1>
          <p className="jm-page-desc">
            Acessos, senhas, classes de permissão e restrições de operadores, redatores e administradores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchUsersFromApi}
            className="jm-btn jm-btn-secondary"
            title="Atualizar lista de usuários"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Recarregar</span>
          </button>
          <button
            type="button"
            onClick={handleStartNewUser}
            className="jm-btn jm-btn-accent"
          >
            <UserPlus className="h-4 w-4" />
            <span>Novo usuário</span>
          </button>
        </div>
      </header>

      {/* GRID DE PAINEL DUPLO */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">

        {/* PAINEL ESQUERDO: LISTA DE USUÁRIOS */}
        <div className="jm-card flex max-h-[420px] flex-col overflow-hidden lg:h-[calc(100vh-200px)] lg:max-h-none lg:min-h-[520px]">

          <div className="shrink-0 border-b border-jm-border p-3">
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="jm-input"
            />
          </div>

          {/* LISTA SCROLLABLE */}
          <div className="flex-1 divide-y divide-jm-border overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isSelected = selectedUser?.id === u.id && !isNewUser;
                return (
                  <div
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className={`relative flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 transition-colors duration-100 ${
                      isSelected
                        ? 'bg-jm-primary-soft before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-jm-accent-line'
                        : 'hover:bg-jm-hover'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {/* Avatar */}
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] border border-jm-border bg-jm-subtle text-[11px] font-semibold text-jm-fg2">
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-[13px] font-medium leading-snug text-jm-fg">{u.name}</h4>
                        <p className="truncate text-xs text-jm-muted">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`jm-badge ${roleStyles[u.role] || roleStyles['Operador']}`}>
                        {u.role}
                      </span>
                      {u.isBlocked && (
                        <span className="jm-badge jm-badge-danger">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="jm-empty">
                Nenhum usuário cadastrado.
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-jm-border bg-jm-subtle px-3 py-2 text-xs text-jm-muted">
            Total: <strong className="font-semibold text-jm-fg tabular-nums">{users.length}</strong> usuários cadastrados
          </div>

        </div>

        {/* PAINEL DIREITO: DETALHES OU FORMULÁRIO DE CADASTRO */}
        <div className="jm-card flex min-w-0 flex-col overflow-hidden lg:h-[calc(100vh-200px)] lg:min-h-[520px]">

          {selectedUser || isNewUser ? (
            <form onSubmit={handleSave} className="flex h-full min-h-0 flex-col">

              {/* CABEÇALHO DO FORMULÁRIO & TOGGLE BLOQUEADO */}
              <div className="flex shrink-0 flex-col gap-3 border-b border-jm-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-jm-fg">
                    {isNewUser ? 'Cadastrar novo usuário' : 'Detalhes do usuário'}
                  </h3>
                  <p className="mt-0.5 text-xs text-jm-muted">
                    {isNewUser ? 'Defina os dados de login, senha e escolha a classe de acesso.' : 'Edite dados, altere a senha ou ajuste permissões de acesso.'}
                  </p>
                </div>

                {/* Toggle Bloqueado */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-jm-fg2">Bloqueado</span>
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => setFormIsBlocked(!formIsBlocked)}
                    className={switchTrack(formIsBlocked, 'bg-jm-danger-fg')}
                  >
                    <span className={switchThumb(formIsBlocked)} />
                  </button>
                </div>
              </div>

              {/* ÁREA SCROLLABLE DO FORMULÁRIO */}
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 md:px-5">

                {/* DADOS CADASTRAIS (CAMPOS) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="jm-label">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="jm-input"
                    />
                  </div>

                  <div>
                    <label className="jm-label">
                      E-mail (login de acesso) *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!isEditing}
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="usuario@jmmaster.com.br"
                      className="jm-input"
                    />
                  </div>

                  <div>
                    <label className="jm-label">
                      Classe de acesso
                    </label>
                    <select
                      disabled={!isEditing}
                      value={formRole}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="jm-input"
                    >
                      <option value="Criador de Blog">Criador de Blog (Acesso Exclusivo ao Blog)</option>
                      <option value="Super administrador">Super administrador (Acesso Total)</option>
                      <option value="Administrador">Administrador (Gestão Geral)</option>
                      <option value="Supervisor">Supervisor (Supervisão Operacional)</option>
                      <option value="Operador">Operador (Atendimento & Disparos)</option>
                    </select>
                    {formRole === 'Criador de Blog' && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs text-jm-accent-text">
                        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
                        <span>Esta classe concede acesso somente ao Criador de Blog, bloqueando módulos confidenciais.</span>
                      </p>
                    )}
                  </div>

                  {/* CAMPO DE SENHA FUNCIONAL */}
                  <div>
                    <label className="jm-label">
                      Senha de acesso {isNewUser && '*'}
                    </label>
                    <div className="relative flex h-9 overflow-hidden rounded-[4px] border border-jm-border-strong bg-jm-surface focus-within:border-jm-primary focus-within:ring-2 focus-within:ring-jm-ring">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={!isEditing}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder={isNewUser ? "Digite a senha do novo usuário..." : "Digite uma nova senha para alterar..."}
                        className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-jm-fg outline-none placeholder:font-sans placeholder:text-jm-placeholder disabled:opacity-60"
                      />

                      {isEditing && (
                        <div className="flex shrink-0 items-center gap-1 pr-1">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Ocultar Senha" : "Ver Senha"}
                            className="jm-icon-btn h-7 w-7"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={handleGeneratePassword}
                            title="Gerar Senha Forte Aleatória"
                            className="jm-btn jm-btn-secondary h-7 px-2 text-xs"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Gerar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* GESTÃO DE PERMISSÕES */}
                <section className="space-y-2.5">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                    <h4 className="flex items-center gap-1.5 text-sm font-semibold text-jm-fg">
                      <ShieldCheck className="h-4 w-4 text-jm-primary-text" strokeWidth={1.75} />
                      <span>Permissões habilitadas</span>
                    </h4>
                    <span className="text-xs text-jm-muted">
                      Defina os módulos liberados para este usuário
                    </span>
                  </div>
                  <div className="grid grid-cols-1 overflow-hidden rounded-[4px] border border-jm-border md:grid-cols-2 [&>*]:border-jm-border [&>*]:border-b md:[&>*:nth-child(odd)]:border-r">
                    {permissionsList.map((p) => (
                      <div key={p.key} className="flex items-start justify-between gap-3 bg-jm-surface px-3 py-2.5">
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-[13px] font-medium text-jm-fg">{p.label}</p>
                          <p className="text-xs leading-snug text-jm-muted">{p.desc}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleTogglePermission(p.key as keyof Permissions, 'permission')}
                          className={`mt-0.5 ${switchTrack(!!formPermissions[p.key as keyof Permissions], 'bg-jm-primary')}`}
                        >
                          <span className={switchThumb(!!formPermissions[p.key as keyof Permissions])} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* GESTÃO DE PROIBIÇÕES */}
                <section className="space-y-2.5">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-jm-danger-fg">
                    <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />
                    <span>Proibições explícitas</span>
                  </h4>

                  {/* Banner de Aviso de Proibições */}
                  <div className="jm-alert jm-alert-danger">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-[13px] font-medium">
                      Atenção: as proibições têm prioridade sobre as permissões.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 overflow-hidden rounded-[4px] border border-jm-border md:grid-cols-2 [&>*]:border-jm-border [&>*]:border-b md:[&>*:nth-child(odd)]:border-r">
                    {permissionsList.map((p) => (
                      <div key={p.key} className="flex items-start justify-between gap-3 bg-jm-surface px-3 py-2.5">
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-[13px] font-medium text-jm-fg">{p.label}</p>
                          <p className="text-xs leading-snug text-jm-muted">{p.desc}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleTogglePermission(p.key as keyof Permissions, 'prohibition')}
                          className={`mt-0.5 ${switchTrack(!!formProhibitions[p.key as keyof Permissions], 'bg-jm-danger-fg')}`}
                        >
                          <span className={switchThumb(!!formProhibitions[p.key as keyof Permissions])} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

              </div>

              {/* BOTÕES DE AÇÃO NA BASE */}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-jm-border bg-jm-subtle px-4 py-3 md:px-5">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="jm-btn jm-btn-primary"
                  >
                    {isSaving ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>{isNewUser ? 'Criar usuário' : 'Salvar alterações'}</span>
                    )}
                  </button>
                  {isNewUser && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="jm-btn jm-btn-secondary"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {!isNewUser && selectedUser && (
                  <button
                    type="button"
                    onClick={() => confirmDelete(selectedUser.id)}
                    className="jm-btn jm-btn-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir usuário</span>
                  </button>
                )}
              </div>

            </form>
          ) : (
            <div className="jm-empty flex-1">
              Selecione um usuário na lista ou crie um novo para gerenciar.
            </div>
          )}

        </div>

      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO COM CREATEPORTAL */}
      {showDeleteConfirm && isMounted && createPortal(
        <div className="jm-overlay z-[99999]">
          <div className="jm-modal sm:max-w-md">
            <div className="jm-modal-body flex gap-3">
              <div className="jm-icon-chip border-jm-danger-border bg-jm-danger-bg text-jm-danger-fg">
                <Trash2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="jm-modal-title">
                  Confirmar exclusão
                </h3>
                <p className="mt-1 text-sm text-jm-muted">
                  Esta ação removerá o usuário e seus privilégios permanentemente.
                </p>
                <p className="mt-2 text-sm text-jm-fg2">
                  Tem certeza que deseja excluir o usuário selecionado?
                </p>
              </div>
            </div>

            <div className="jm-modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="jm-btn jm-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="jm-btn jm-btn-danger-solid"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
