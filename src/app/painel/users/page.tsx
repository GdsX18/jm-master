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

export interface Permissions {
  manageBlog: boolean;
  manageUsers: boolean;
  manageCrm: boolean;
  manageFinance: boolean;
  manageProducts: boolean;
  createCampaign: boolean;
  executeDispatches: boolean;
  manageTriggers: boolean;
  surveyManagement: boolean;
  structuralManagement: boolean;
}

export type UserRole = 
  | 'Super administrador'
  | 'Administrador'
  | 'Supervisor'
  | 'Operador'
  | 'Criador de Blog';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isBlocked: boolean;
  permissions: Permissions;
  prohibitions: Permissions;
}

const DEFAULT_PERMISSIONS: Permissions = {
  manageBlog: false,
  manageUsers: false,
  manageCrm: false,
  manageFinance: false,
  manageProducts: false,
  createCampaign: false,
  executeDispatches: false,
  manageTriggers: false,
  surveyManagement: false,
  structuralManagement: false,
};

// Configurações padrão por classe de acesso
const ROLE_DEFAULTS: Record<UserRole, { permissions: Permissions; prohibitions: Permissions }> = {
  'Super administrador': {
    permissions: {
      manageBlog: true,
      manageUsers: true,
      manageCrm: true,
      manageFinance: true,
      manageProducts: true,
      createCampaign: true,
      executeDispatches: true,
      manageTriggers: true,
      surveyManagement: true,
      structuralManagement: true,
    },
    prohibitions: DEFAULT_PERMISSIONS,
  },
  Administrador: {
    permissions: {
      manageBlog: true,
      manageUsers: false,
      manageCrm: true,
      manageFinance: true,
      manageProducts: true,
      createCampaign: true,
      executeDispatches: true,
      manageTriggers: true,
      surveyManagement: true,
      structuralManagement: true,
    },
    prohibitions: {
      ...DEFAULT_PERMISSIONS,
      manageUsers: true,
    },
  },
  Supervisor: {
    permissions: {
      manageBlog: true,
      manageUsers: false,
      manageCrm: true,
      manageFinance: false,
      manageProducts: true,
      createCampaign: true,
      executeDispatches: true,
      manageTriggers: true,
      surveyManagement: true,
      structuralManagement: false,
    },
    prohibitions: {
      ...DEFAULT_PERMISSIONS,
      manageUsers: true,
      manageFinance: true,
    },
  },
  Operador: {
    permissions: {
      manageBlog: false,
      manageUsers: false,
      manageCrm: true,
      manageFinance: false,
      manageProducts: false,
      createCampaign: false,
      executeDispatches: true,
      manageTriggers: false,
      surveyManagement: true,
      structuralManagement: false,
    },
    prohibitions: {
      ...DEFAULT_PERMISSIONS,
      manageBlog: true,
      manageUsers: true,
      manageFinance: true,
      manageProducts: true,
      manageTriggers: true,
    },
  },
  'Criador de Blog': {
    permissions: {
      manageBlog: true,
      manageUsers: false,
      manageCrm: false,
      manageFinance: false,
      manageProducts: false,
      createCampaign: false,
      executeDispatches: false,
      manageTriggers: false,
      surveyManagement: false,
      structuralManagement: false,
    },
    prohibitions: {
      manageBlog: false,
      manageUsers: true,
      manageCrm: true,
      manageFinance: true,
      manageProducts: true,
      createCampaign: true,
      executeDispatches: true,
      manageTriggers: true,
      surveyManagement: true,
      structuralManagement: true,
    },
  },
};

const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_master',
    name: 'Administrador JM Master',
    email: 'admin@jmmaster.com.br',
    password: 'admin',
    role: 'Super administrador',
    isBlocked: false,
    permissions: ROLE_DEFAULTS['Super administrador'].permissions,
    prohibitions: ROLE_DEFAULTS['Super administrador'].prohibitions,
  },
  {
    id: 'usr_redator_blog',
    name: 'Redator de Conteúdo',
    email: 'redacao@jmmaster.com.br',
    password: '123',
    role: 'Criador de Blog',
    isBlocked: false,
    permissions: ROLE_DEFAULTS['Criador de Blog'].permissions,
    prohibitions: ROLE_DEFAULTS['Criador de Blog'].prohibitions,
  },
];

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
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          if (!selectedUser && !isNewUser) {
            selectUser(data[0]);
          } else if (selectedUser) {
            const updated = data.find((u: User) => u.id === selectedUser.id);
            if (updated) selectUser(updated);
          }
          return;
        }
      }
    } catch (e) {
      console.error('Erro ao carregar usuários da API:', e);
    }

    // Fallback local
    setUsers(INITIAL_USERS);
    selectUser(INITIAL_USERS[0]);
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
    setFormPassword(user.password || '');
    setShowPassword(false);
    setFormRole(user.role);
    setFormIsBlocked(user.isBlocked);
    setFormPermissions(user.permissions || ROLE_DEFAULTS[user.role]?.permissions || DEFAULT_PERMISSIONS);
    setFormProhibitions(user.prohibitions || ROLE_DEFAULTS[user.role]?.prohibitions || DEFAULT_PERMISSIONS);
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
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let newPassword = '';
    for (let i = 0; i < 10; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
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
        id: isNewUser ? `usr_${Date.now()}` : selectedUser?.id,
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
        showNotification('success', `Dados e senha do usuário "${data.user.name}" atualizados com sucesso!`);
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
      if (res.ok) {
        showNotification('success', 'Usuário excluído com sucesso.');
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        await fetchUsersFromApi();
      } else {
        throw new Error('Erro ao excluir');
      }
    } catch (e: any) {
      showNotification('error', 'Falha ao excluir o usuário.');
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
    'Super administrador': 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400',
    Administrador: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
    Supervisor: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
    Operador: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    'Criador de Blog': 'bg-orange-500/10 border-[#E85D26]/40 text-[#E85D26]',
  };

  const permissionsList = [
    { key: 'manageBlog', label: 'Criador de Blog & Artigos', desc: 'Permite criar, redigir, editar imagens e publicar artigos no Blog oficial da JM Master.' },
    { key: 'manageUsers', label: 'Gerenciar Usuários & Classes', desc: 'Permite gerenciar operadores, cadastrar novos usuários e definir permissões.' },
    { key: 'manageCrm', label: 'CRM & Central de Clientes', desc: 'Permite visualizar e gerenciar histórico de contatos, clientes e grupos corporativos.' },
    { key: 'manageFinance', label: 'Módulo Financeiro & Faturamento', desc: 'Permite visualizar faturamentos, cobranças e relatórios de fluxo financeiro.' },
    { key: 'manageProducts', label: 'Catálogo de Produtos & Preços', desc: 'Permite gerenciar produtos, serviços e precificação do portfólio.' },
    { key: 'createCampaign', label: 'Criar Campanhas de Mensageria', desc: 'Permite estruturar campanhas ativas e funis no sistema.' },
    { key: 'executeDispatches', label: 'Efetuar Disparos WhatsApp API', desc: 'Permite realizar disparos em lote via WhatsApp Cloud API Oficial.' },
    { key: 'manageTriggers', label: 'Gerenciar Gatilhos & Automações', desc: 'Permite configurar webhooks, transbordo inteligente e gatilhos.' },
    { key: 'surveyManagement', label: 'Gestão de Pesquisa & NPS', desc: 'Permite manutenção e gerenciamento de pesquisas de satisfação.' },
    { key: 'structuralManagement', label: 'Gerenciamento Estrutural', desc: 'Permite gerenciar departamentos e configurações corporativas.' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] dark:bg-neutral-950 transition-colors duration-300 p-6 md:p-8 space-y-6 relative">
      
      {/* TOAST DE NOTIFICAÇÃO FLUTUANTE */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-[999999] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn text-xs font-bold ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-950/20' : 'bg-rose-600 text-white shadow-rose-950/20'
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1d2d44] dark:text-neutral-100 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#E85D26]" />
            <span>Usuários do Sistema</span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Gerencie os acessos, senhas, classes de permissão e restrições dos operadores, redatores e administradores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsersFromApi}
            className="px-3.5 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            title="Atualizar lista de usuários"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recarregar</span>
          </button>
          <button
            type="button"
            onClick={handleStartNewUser}
            className="px-4 py-2 bg-[#2b6cb0] hover:bg-[#235891] active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition cursor-pointer flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* GRID DE PAINEL DUPLO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        
        {/* PAINEL ESQUERDO: LISTA DE USUÁRIOS */}
        <div className="lg:col-span-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm p-5 flex flex-col justify-between space-y-4 h-[75vh]">
          
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-850 shrink-0">
            <input
              type="text"
              placeholder="Buscar usuário por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none focus:ring-1 focus:ring-[#E85D26] dark:text-white transition"
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
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#2b6cb0] bg-[#2b6cb0]/5 dark:bg-[#2b6cb0]/15 shadow-sm'
                        : 'border-neutral-200/70 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850 bg-white dark:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-700 dark:text-neutral-200 shrink-0">
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-snug truncate max-w-[140px]">{u.name}</h4>
                        <p className="text-[11px] text-neutral-500 truncate max-w-[140px]">{u.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${roleStyles[u.role] || roleStyles['Operador']}`}>
                        {u.role}
                      </span>
                      {u.isBlocked && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-md">
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-neutral-400 text-xs">
                Nenhum usuário cadastrado.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-850 text-center text-[11px] text-neutral-500 shrink-0">
            Total: <strong className="text-neutral-900 dark:text-white font-bold">{users.length}</strong> usuários cadastrados
          </div>

        </div>

        {/* PAINEL DIREITO: DETALHES OU FORMULÁRIO DE CADASTRO */}
        <div className="lg:col-span-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm p-6 flex flex-col justify-between h-[75vh]">
          
          {selectedUser || isNewUser ? (
            <form onSubmit={handleSave} className="flex flex-col h-full justify-between">
              
              {/* ÁREA SCROLLABLE DO FORMULÁRIO */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
                
                {/* CABEÇALHO DO FORMULÁRIO & TOGGLE BLOQUEADO */}
                <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-neutral-850 shrink-0">
                  <div>
                    <h3 className="text-base font-extrabold text-[#1d2d44] dark:text-neutral-100 uppercase tracking-wide">
                      {isNewUser ? 'Cadastrar Novo Usuário' : 'Detalhes do Usuário'}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {isNewUser ? 'Defina os dados de login, senha e escolha a classe de acesso.' : 'Edite dados, altere a senha ou ajuste permissões de acesso.'}
                    </p>
                  </div>
                  
                  {/* Toggle Bloqueado */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Bloqueado:</span>
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
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 dark:text-neutral-500 tracking-wider">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:bg-neutral-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E85D26] transition text-xs font-medium disabled:bg-neutral-50 disabled:dark:bg-neutral-900/40 disabled:text-neutral-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 dark:text-neutral-500 tracking-wider">
                      E-mail (Login de Acesso) *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!isEditing}
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="usuario@jmmaster.com.br"
                      className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:bg-neutral-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E85D26] transition text-xs font-medium disabled:bg-neutral-50 disabled:dark:bg-neutral-900/40 disabled:text-neutral-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 dark:text-neutral-500 tracking-wider">
                      Classe de Acesso
                    </label>
                    <select
                      disabled={!isEditing}
                      value={formRole}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:bg-neutral-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E85D26] transition text-xs font-bold disabled:bg-neutral-50 disabled:dark:bg-neutral-900/40 disabled:text-neutral-500 cursor-pointer"
                    >
                      <option value="Criador de Blog">Criador de Blog (Acesso Exclusivo ao Blog)</option>
                      <option value="Super administrador">Super administrador (Acesso Total)</option>
                      <option value="Administrador">Administrador (Gestão Geral)</option>
                      <option value="Supervisor">Supervisor (Supervisão Operacional)</option>
                      <option value="Operador">Operador (Atendimento & Disparos)</option>
                    </select>
                    {formRole === 'Criador de Blog' && (
                      <p className="text-[11px] text-[#E85D26] font-medium mt-1 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Esta classe concede acesso somente ao Criador de Blog, bloqueando módulos confidenciais.</span>
                      </p>
                    )}
                  </div>

                  {/* CAMPO DE SENHA FUNCIONAL */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-neutral-400 dark:text-neutral-500 tracking-wider block">
                      Senha de Acesso {isNewUser && '*'}
                    </label>
                    <div className="relative flex rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-950">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled={!isEditing}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder={isNewUser ? "Digite a senha do novo usuário..." : "Digite uma nova senha para alterar..."}
                        className="flex-1 px-4 py-2 text-neutral-900 dark:text-white dark:bg-neutral-950 focus:outline-none text-xs disabled:bg-neutral-50 disabled:dark:bg-neutral-900/40 disabled:text-neutral-500 font-mono"
                      />
                      
                      {isEditing && (
                        <div className="flex items-center pr-2 gap-1.5 shrink-0 bg-white dark:bg-neutral-950">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Ocultar Senha" : "Ver Senha"}
                            className="p-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md transition cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={handleGeneratePassword}
                            title="Gerar Senha Forte Aleatória"
                            className="px-2.5 py-1 text-[10px] font-black uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-[#E85D26]" />
                            <span>Gerar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* GESTÃO DE PERMISSÕES */}
                <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-850">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[#1d2d44] dark:text-neutral-200 uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#2b6cb0]" />
                      <span>Permissões Habilitadas</span>
                    </h4>
                    <span className="text-[11px] text-neutral-400">
                      Defina os módulos liberados para este usuário
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissionsList.map((p) => (
                      <div key={p.key} className="flex items-start justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
                        <div className="space-y-0.5 pr-2">
                          <p className="text-xs font-bold text-neutral-850 dark:text-neutral-200">{p.label}</p>
                          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 leading-snug">{p.desc}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleTogglePermission(p.key as keyof Permissions, 'permission')}
                          className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            formPermissions[p.key as keyof Permissions] ? 'bg-[#2b6cb0]' : 'bg-neutral-300 dark:bg-neutral-700'
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
                <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-850">
                  <h4 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Proibições Explícitas</span>
                  </h4>
                  
                  {/* Banner de Aviso de Proibições */}
                  <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 rounded-xl p-3.5 flex items-center justify-between shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <p className="text-xs font-bold text-rose-800 dark:text-rose-400">
                        Atenção: As proibições têm prioridade sobre as permissões!
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissionsList.map((p) => (
                      <div key={p.key} className="flex items-start justify-between p-3 rounded-xl border border-neutral-105 dark:border-neutral-800 bg-rose-50/15 dark:bg-rose-950/5">
                        <div className="space-y-0.5 pr-2">
                          <p className="text-xs font-bold text-neutral-850 dark:text-neutral-200">{p.label}</p>
                          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 leading-snug">{p.desc}</p>
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
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-150 dark:border-neutral-800 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-[#2b6cb0] hover:bg-[#235891] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow active:scale-95 transition-all cursor-pointer flex items-center gap-2"
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
                      className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-750 dark:text-neutral-300 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {!isNewUser && selectedUser && (
                  <button
                    type="button"
                    onClick={() => confirmDelete(selectedUser.id)}
                    className="px-4 py-2.5 bg-rose-50/50 hover:bg-rose-100/60 dark:hover:bg-rose-950/20 text-rose-600 border border-rose-200 dark:border-rose-900 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Usuário</span>
                  </button>
                )}
              </div>

            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 text-xs">
              Selecione um usuário na lista ou crie um novo para gerenciar.
            </div>
          )}

        </div>

      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO COM CREATEPORTAL */}
      {showDeleteConfirm && isMounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-neutral-100 dark:border-neutral-800 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                  Confirmar Exclusão
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Esta ação removerá o usuário e seus privilégios permanentemente.
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Tem certeza que deseja excluir o usuário selecionado?
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-750 dark:text-neutral-300 font-bold text-xs uppercase rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase rounded-xl shadow transition active:scale-95 cursor-pointer"
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
