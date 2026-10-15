'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  PenTool,
  Shield,
  CreditCard,
  History,
  Sun,
  Moon,
  Sidebar,
  LayoutGrid,
  LogOut,
  ExternalLink,
  ShieldOff,
} from 'lucide-react';
import { permissionForPath, type Permissions } from '@/lib/permissions';

interface PanelUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Permissions;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [menuLayout, setMenuLayout] = useState<'sidebar' | 'top'>('sidebar');
  const [currentUser, setCurrentUser] = useState<PanelUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Usuário logado vem do servidor (sessão + permissões atualizadas do banco)
    if (pathname !== '/painel/login') {
      fetch('/api/auth/me', { cache: 'no-store' })
        .then(async (res) => {
          if (res.status === 401) {
            localStorage.removeItem('@JMMaster:user');
            window.location.href = `/painel/login?next=${encodeURIComponent(pathname)}`;
            return;
          }
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('@JMMaster:user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }

    // Carregar tema do localStorage
    const savedTheme = localStorage.getItem('@JMMaster:theme') as 'dark' | 'light';
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(savedTheme);
    } else {
      setTheme('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }

    // Carregar layout do menu
    const savedLayout = localStorage.getItem('@JMMaster:menuLayout') as 'sidebar' | 'top';
    if (savedLayout) {
      setMenuLayout(savedLayout);
    }
  }, [pathname]);

  // Se estiver na tela de login, renderiza apenas o conteúdo
  if (pathname === '/painel/login') {
    return <>{children}</>;
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('@JMMaster:theme', nextTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(nextTheme);
  };

  const toggleLayout = () => {
    const nextLayout = menuLayout === 'sidebar' ? 'top' : 'sidebar';
    setMenuLayout(nextLayout);
    localStorage.setItem('@JMMaster:menuLayout', nextLayout);
  };

  const allMenuItems = [
    { name: 'Dashboard', shortName: 'Dashboard', path: '/painel', icon: LayoutDashboard },
    { name: 'Cadastro de Clientes', shortName: 'Clientes', path: '/painel/customers', icon: Users },
    { name: 'Cadastro de Produtos', shortName: 'Produtos', path: '/painel/products', icon: Package },
    { name: 'Criador de Blog', shortName: 'Blog', path: '/painel/blog', icon: PenTool },
    { name: 'Usuários do Sistema', shortName: 'Usuários', path: '/painel/users', icon: Shield },
    { name: 'Financeiro', shortName: 'Financeiro', path: '/painel/finance', icon: CreditCard },
    { name: 'CRM & Linha do Tempo', shortName: 'CRM', path: '/painel/crm', icon: History },
  ];

  // Menu conforme as permissões efetivas do usuário
  const canAccess = (path: string) => {
    const key = permissionForPath(path);
    return !key || !!currentUser?.permissions?.[key];
  };
  const menuItems = currentUser
    ? allMenuItems.filter((item) => canAccess(item.path) && !(item.path === '/painel' && currentUser.role === 'Criador de Blog'))
    : [];

  // Tela sem permissão: as APIs já bloqueiam no servidor, aqui só evitamos uma tela quebrada
  const pageContent =
    currentUser && !canAccess(pathname) ? (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-3 p-8">
        <ShieldOff className="w-10 h-10 text-jm-danger-fg" strokeWidth={1.75} />
        <h2 className="text-lg font-semibold text-jm-fg">Acesso não permitido</h2>
        <p className="text-sm text-jm-muted max-w-sm">
          Seu perfil não tem permissão para este módulo. Fale com um administrador se precisar de acesso.
        </p>
      </div>
    ) : currentUser ? (
      children
    ) : (
      <div className="min-h-[60vh]" />
    );

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('@JMMaster:user');
    window.location.href = '/painel/login';
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-[#0B0F17]" />;
  }

  const isDark = theme === 'dark';

  /* 1. LAYOUT DE MENU SUPERIOR */
  if (menuLayout === 'top') {
    return (
      <div className={`min-h-screen w-full flex flex-col font-sans jm-panel bg-jm-bg text-jm-fg ${isDark ? 'dark' : ''} transition-colors duration-300`}>
        
        {/* HEADER / NAVBAR SUPERIOR FIXA */}
        <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-jm-border bg-jm-surface px-4 sm:px-6">
          
          {/* Logo (Esquerda) */}
          <div className="flex items-center shrink-0">
            <Link href="/painel" className="relative block h-8 w-32">
              <Image 
                src="/images/logo_jm.png" 
                alt="JM Master Group"
                fill
                className="object-contain object-left"
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* Menu Centralizado (Centro) */}
          <nav className="flex-1 flex items-center justify-center overflow-x-auto py-1 scrollbar-none">
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`jm-nav-link !w-auto h-9 px-3 whitespace-nowrap shrink-0 ${isActive ? 'jm-nav-link-active' : ''}`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                    <span>{item.shortName}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Ações do Header (Perfil, Config, Tema, Sair) (Direita) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
            
            {/* Link para o Blog Oficial */}
            <Link
              href="/blog"
              target="_blank"
              title="Ver Blog Oficial"
              className="hidden lg:flex items-center gap-1.5 jm-btn jm-btn-secondary jm-btn-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Ver Site</span>
            </Link>

            {/* Perfil */}
            <div className="hidden 2xl:flex items-center gap-2 px-3 h-9 rounded-lg border border-jm-border bg-jm-subtle text-jm-fg text-xs font-medium">
              <span className="font-semibold">{currentUser?.name?.split(' ')[0] || ''}</span>
              <span className="jm-badge jm-badge-accent !px-1.5 text-[10px] uppercase">
                {currentUser?.role || ''}
              </span>
            </div>

            {/* Alternador de Layout */}
            <button
              onClick={toggleLayout}
              title="Mudar para Menu Lateral"
              className="jm-btn jm-btn-secondary jm-btn-sm"
            >
              <Sidebar className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden xl:inline text-xs">Menu Lateral</span>
            </button>

            {/* Alternador de Tema */}
            <button
              onClick={toggleTheme}
              title={`Tema Atual: ${isDark ? 'Escuro' : 'Claro'}. Clique para alternar.`}
              className="jm-btn jm-btn-secondary jm-btn-sm"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} /> : <Moon className="w-3.5 h-3.5 text-jm-muted" strokeWidth={1.75} />}
              <span className="hidden xl:inline text-xs">{isDark ? 'Escuro' : 'Claro'}</span>
            </button>

            {/* Sair */}
            <button
              onClick={handleLogout}
              title="Sair do Sistema"
              className="jm-icon-btn text-jm-danger-fg hover:bg-jm-danger-bg"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO PRINCIPAL (Scroll Livre) */}
        <main className="flex-1 w-full min-h-0 bg-jm-bg">
          {pageContent}
        </main>
        
      </div>
    );
  }

  /* 2. LAYOUT DE MENU LATERAL (PADRÃO) */
  return (
    <div className={`min-h-screen w-full flex font-sans jm-panel bg-jm-bg text-jm-fg ${isDark ? 'dark' : ''} transition-colors duration-300`}>
      
      {/* SIDEBAR LATERAL FIXA */}
      <aside className="w-[272px] sticky top-0 h-screen border-r border-jm-border bg-jm-surface flex flex-col justify-between transition-colors duration-300 shrink-0 overflow-y-auto">
        <div>
          {/* Logo JM Master Group */}
          <div className="px-6 pt-6 pb-5 flex items-center justify-start">
            <Link href="/painel" className="relative block h-9 w-36">
              <Image 
                src="/images/logo_jm.png" 
                alt="JM Master Group"
                fill
                className="object-contain object-left"
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* Itens do Menu */}
          <nav className="px-4 space-y-0.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`jm-nav-link ${isActive ? 'jm-nav-link-active' : ''}`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Botões de Ação na Base (Tema, Layout, Ver Blog, Sair & Perfil) */}
        <div className="p-4 border-t border-jm-border space-y-1">
          
          {/* Link Ver Blog Oficial */}
          <Link
            href="/blog"
            target="_blank"
            className="jm-nav-link"
          >
            <ExternalLink className="w-5 h-5 shrink-0" strokeWidth={1.75} />
            <span>Ver Blog Oficial</span>
          </Link>

          {/* Alternador de Layout */}
          <button
            onClick={toggleLayout}
            className="jm-nav-link"
          >
            <LayoutGrid className="w-5 h-5 shrink-0" strokeWidth={1.75} />
            <span>Menu Superior</span>
          </button>

          {/* Alternador de Tema */}
          <button
            onClick={toggleTheme}
            title={`Tema Atual: ${isDark ? 'Escuro' : 'Claro'}. Clique para alternar.`}
            className="jm-nav-link"
          >
            {isDark ? <Sun className="w-5 h-5 shrink-0 text-amber-400" strokeWidth={1.75} /> : <Moon className="w-5 h-5 shrink-0" strokeWidth={1.75} />}
            <span>{isDark ? 'Tema: Escuro' : 'Tema: Claro'}</span>
          </button>

          {/* Sair */}
          <button
            onClick={handleLogout}
            className="jm-nav-link text-jm-danger-fg hover:bg-jm-danger-bg hover:text-jm-danger-fg"
          >
            <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.75} />
            <span>Sair do Sistema</span>
          </button>

          {/* Card de Perfil Ancorado no Rodapé */}
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-jm-border bg-jm-surface p-3 shadow-xs">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-jm-primary-border bg-jm-primary-soft text-sm font-semibold text-jm-primary-text" aria-hidden="true">
              {(currentUser?.name || '?').trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-jm-fg">{currentUser?.name || ''}</p>
              <span className="jm-badge jm-badge-accent mt-0.5 !px-1.5 text-[10px] uppercase tracking-wide">{currentUser?.role || ''}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (Scroll Livre em toda a tela) */}
      <main className="flex-1 min-w-0 min-h-screen bg-jm-bg">
        {pageContent}
      </main>

    </div>
  );
}
