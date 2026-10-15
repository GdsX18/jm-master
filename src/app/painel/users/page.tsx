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
    'Super administrador': 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    Administrador: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    Supervisor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    Operador: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    'Criador de Blog': 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
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

  return (
    <div className="space-y-6 relative">
      
      {/* TOAST DE NOTIFICAÇÃO FLUTUANTE */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-[999999] px-4 py-3 rounded-xl shadow-lg border border-jm-border flex items-center gap-2.5 animate-fadeIn text-xs font-semibold ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-jm-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-jm-text flex items-center gap-2.5">
            <Users className="w-6 h-6 text-jm-orange" />
            <span>Usuários do Sistema</span>
          </h1>
          <p className="text-xs text-jm-muted mt-1">
            Gerencie os acessos, senhas, classes de permissão e restrições dos operadores, redatores e administradores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsersFromApi}
            className="jm-btn jm-btn-secondary"
            title="Atualizar lista de usuários"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recarregar</span>
          </button>
          <button
            type="button"
            onClick={handleStartNewUser}
            className="jm-btn jm-btn-primary"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* GRID DE PAINEL DUPLO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        
        {/* PAINEL ESQUERDO: LISTA DE USUÁRIOS */}
        <div className="lg:col-span-4 jm-card p-4 sm:p-5 flex flex-col justify-between space-y-4 h-[75vh]">
          
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-jm-border shrink-0">
            <input
              type="text"
              placeholder="Buscar usuário por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="jm-input text-xs"
            />
          </div>

          {/* LISTA SCROLLABLE */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isSelected = selectedUser?.id === u.id && !isNewUser;
                return (
                  <div
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-jm-blue-600 bg-jm-blue-50/60 dark:bg-jm-blue-950/30 dark:border-jm-blue-500 shadow-xs'
                        : 'border-jm-border hover:bg-neutral-50 dark:hover:bg-neutral-800/50 bg-jm-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-jm-blue-50 dark:bg-neutral-800 border border-jm-border flex items-center justify-center text-xs font-semibold text-jm-blue-900 dark:text-neutral-200 shrink-0">
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-jm-text leading-snug truncate max-w-[140px]">{u.name}</h4>
                        <p className="text-[11px] text-jm-muted truncate max-w-[140px]">{u.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border ${roleStyles[u.role] || roleStyles['Operador']}`}>
                        {u.role}
                      </span>
                      {u.isBlocked && (
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-800">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-jm-muted text-xs">
                Nenhum usuário cadastrado.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-jm-border text-center text-[11px] text-jm-muted shrink-0">
            Total: <strong className="text-jm-text font-semibold">{users.length}</strong> usuários cadastrados
          </div>

        </div>

        {/* PAINEL DIREITO: DETALHES OU FORMULÁRIO DE CADASTRO */}
        <div className="lg:col-span-8 jm-card p-5 sm:p-6 flex flex-col justify-between h-[75vh]">
          
          {selectedUser || isNewUser ? (
            <form onSubmit={handleSave} className="flex flex-col h-full justify-between">
              
              {/* ÁREA SCROLLABLE DO FORMULÁRIO */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
                
                {/* CABEÇALHO DO FORMULÁRIO & TOGGLE BLOQUEADO */}
                <div className="flex justify-between items-center pb-3 border-b border-jm-border shrink-0">
                  <div>
                    <h3 className="text-sm font-semibold text-jm-text">
                      {isNewUser ? 'Cadastrar Novo Usuário' : 'Detalhes do Usuário'}
                    </h3>
                    <p className="text-xs text-jm-muted">
                      {isNewUser ? 'Defina os dados de login, senha e escolha a classe de acesso.' : 'Edite dados, altere a senha ou ajuste permissões de acesso.'}
                    </p>
                  </div>
                  
                  {/* Toggle Bloqueado */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-jm-text">Bloqueado:</span>
                    <button
                      type="button"
                      disabled={!isEditing}
                      onClick={() => setFormIsBlocked(!formIsBlocked)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formIsBlocked ? 'bg-rose-500' : 'bg-neutral-300 dark:bg-neutral-700'
                      } ${!isEditing && 'opacity-65 cursor-not-allowed'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formIsBlocked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* DADOS CADASTRAIS (CAMPOS) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-jm-text mb-1.5">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="jm-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-jm-text mb-1.5">
                      E-mail (Login de Acesso) *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!isEditing}
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="usuario@jmmaster.com.br"
                      className="jm-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-jm-text mb-1.5">
                      Classe de Acesso
                    </label>
                    <select
                      disabled={!isEditing}
                      value={formRole}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="jm-input text-xs font-semibold"
                    >
                      <option value="Criador de Blog">Criador de Blog (Acesso Exclusivo ao Blog)</option>
                      <option value="Super administrador">Super administrador (Acesso Total)</option>
                      <option value="Administrador">Administrador (Gestão Geral)</option>
                      <option value="Supervisor">Supervisor (Supervisão Operacional)</option>
                      <option value="Operador">Operador (Atendimento & Disparos)</option>
                    </select>
                    {formRole === 'Criador de Blog' && (
                      <p className="text-[11px] text-jm-orange font-medium mt-1.5 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Esta classe concede acesso somente ao Criador de Blog, bloqueando módulos confidenciais.</span>
                      </p>
                    )}
                  </div>

                  {/* CAMPO DE SENHA FUNCIONAL */}
                  <div>
                    <label className="block text-xs font-semibold text-jm-text mb-1.5">
                      Senha de Acesso {isNewUser && '*'}
                    </label>
                    <div className="relative flex rounded-lg border border-jm-border overflow-hidden bg-jm-surface">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={!isEditing}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder={isNewUser ? "Digite a senha do novo usuário..." : "Digite uma nova senha para alterar..."}
                        className="flex-1 px-3 py-2 text-jm-text bg-transparent focus:outline-none text-xs disabled:opacity-60 font-mono"
                      />
                      
                      {isEditing && (
                        <div className="flex items-center pr-2 gap-1.5 shrink-0 bg-transparent">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Ocultar Senha" : "Ver Senha"}
                            className="p-1.5 text-xs text-jm-muted hover:text-jm-text rounded-md transition cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={handleGeneratePassword}
                            title="Gerar Senha Forte Aleatória"
                            className="jm-btn jm-btn-secondary jm-btn-sm"
                          >
                            <Sparkles className="w-3 h-3 text-jm-orange" />
                            <span>Gerar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* GESTÃO DE PERMISSÕES */}
                <div className="space-y-3 pt-3 border-t border-jm-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-jm-text flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-jm-blue-600" />
                      <span>Permissões Habilitadas</span>
                    </h4>
                    <span className="text-[11px] text-jm-muted">
                      Defina os módulos liberados para este usuário
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissionsList.map((p) => (
                      <div key={p.key} className="flex items-start justify-between p-3 rounded-xl border border-jm-border bg-neutral-50/50 dark:bg-neutral-900/40">
                        <div className="space-y-0.5 pr-2">
                          <p className="text-xs font-semibold text-jm-text">{p.label}</p>
                          <p className="text-[11px] text-jm-muted leading-snug">{p.desc}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleTogglePermission(p.key as keyof Permissions, 'permission')}
                          className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formPermissions[p.key as keyof Permissions] ? 'bg-jm-blue-700' : 'bg-neutral-300 dark:bg-neutral-700'
                          } ${!isEditing && 'opacity-65 cursor-not-allowed'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              formPermissions[p.key as keyof Permissions] ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GESTÃO DE PROIBIÇÕES */}
                <div className="space-y-3 pt-3 border-t border-jm-border">
                  <h4 className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Proibições Explícitas</span>
                  </h4>
                  
                  {/* Banner de Aviso de Proibições */}
                  <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 rounded-xl p-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <p className="text-xs font-medium text-rose-800 dark:text-rose-300">
                      Atenção: As proibições têm prioridade sobre as permissões!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissionsList.map((p) => (
                      <div key={p.key} className="flex items-start justify-between p-3 rounded-xl border border-jm-border bg-neutral-50/50 dark:bg-neutral-900/40">
                        <div className="space-y-0.5 pr-2">
                          <p className="text-xs font-semibold text-jm-text">{p.label}</p>
                          <p className="text-[11px] text-jm-muted leading-snug">{p.desc}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleTogglePermission(p.key as keyof Permissions, 'prohibition')}
                          className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formProhibitions[p.key as keyof Permissions] ? 'bg-rose-500' : 'bg-neutral-300 dark:bg-neutral-700'
                          } ${!isEditing && 'opacity-65 cursor-not-allowed'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              formProhibitions[p.key as keyof Permissions] ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* BOTÕES DE AÇÃO NA BASE */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-jm-border shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="jm-btn jm-btn-primary"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>{isNewUser ? 'Criar Usuário' : 'Salvar Alterações'}</span>
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
                    className="jm-btn jm-btn-secondary text-rose-600 hover:border-rose-300 dark:hover:border-rose-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Usuário</span>
                  </button>
                )}
              </div>

            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-jm-muted text-xs">
              Selecione um usuário na lista ou crie um novo para gerenciar.
            </div>
          )}

        </div>

      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO COM CREATEPORTAL */}
      {showDeleteConfirm && isMounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="jm-card rounded-2xl w-full max-w-md p-6 shadow-xl border border-jm-border flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-jm-text">
                  Confirmar Exclusão
                </h3>
                <p className="text-xs text-jm-muted mt-0.5">
                  Esta ação removerá o usuário e seus privilégios permanentemente.
                </p>
              </div>
            </div>

            <p className="text-xs text-jm-muted leading-relaxed">
              Tem certeza que deseja excluir o usuário selecionado?
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-2">
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
                className="jm-btn bg-rose-600 hover:bg-rose-700 text-white"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
