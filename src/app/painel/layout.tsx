'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  PanelLeft,
  PanelTop,
  LogOut,
  ExternalLink,
  ShieldOff,
  Menu,
  X,
} from 'lucide-react';
import { permissionForPath, type Permissions } from '@/lib/permissions';
import { clearCache } from './lib/cache';

interface PanelUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Permissions;
}

// Revalida a sessão/permissões no servidor no máximo uma vez por intervalo,
// em vez de a cada troca de tela (cada chamada consulta o banco)
const SESSION_REVALIDATE_MS = 60_000;

const allMenuItems = [
  { name: 'Dashboard', shortName: 'Dashboard', path: '/painel', icon: LayoutDashboard },
  { name: 'Clientes', shortName: 'Clientes', path: '/painel/customers', icon: Users },
  { name: 'Produtos', shortName: 'Produtos', path: '/painel/products', icon: Package },
  { name: 'Blog', shortName: 'Blog', path: '/painel/blog', icon: PenTool },
  { name: 'Usuários', shortName: 'Usuários', path: '/painel/users', icon: Shield },
  { name: 'Financeiro', shortName: 'Financeiro', path: '/painel/finance', icon: CreditCard },
  { name: 'CRM', shortName: 'CRM', path: '/painel/crm', icon: History },
];

function readStoredUser(): PanelUser | null {
  try {
    const raw = localStorage.getItem('@JMMaster:user');
    return raw ? (JSON.parse(raw) as PanelUser) : null;
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [menuLayout, setMenuLayout] = useState<'sidebar' | 'top'>('sidebar');
  const [currentUser, setCurrentUser] = useState<PanelUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastSessionCheck = useRef(0);

  // Preferências locais e usuário em cache: lidos uma única vez
  useEffect(() => {
    setIsMounted(true);

    const savedTheme = localStorage.getItem('@JMMaster:theme') as 'dark' | 'light';
    const nextTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
    setTheme(nextTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(nextTheme);

    const savedLayout = localStorage.getItem('@JMMaster:menuLayout') as 'sidebar' | 'top';
    if (savedLayout) {
      setMenuLayout(savedLayout);
    }

    // Mostra o menu na hora com o último usuário conhecido; o servidor confirma logo em seguida
    const cached = readStoredUser();
    if (cached) setCurrentUser(cached);
  }, []);

  // Tokens do painel também no <html>, para que modais em portal herdem o tema
  useEffect(() => {
    if (pathname === '/painel/login') return;
    const root = document.documentElement;
    root.classList.add('jm-root');
    return () => root.classList.remove('jm-root');
  }, [pathname]);

  // Usuário logado vem do servidor (sessão + permissões atualizadas do banco)
  useEffect(() => {
    if (pathname === '/painel/login') return;
    const now = Date.now();
    if (now - lastSessionCheck.current < SESSION_REVALIDATE_MS) return;
    lastSessionCheck.current = now;

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
  }, [pathname]);

  // Fecha a gaveta do mobile ao trocar de tela
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Gaveta aberta: trava o scroll do fundo e fecha com Esc
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

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

  // Menu conforme as permissões efetivas do usuário
  const canAccess = (path: string) => {
    const key = permissionForPath(path);
    return !key || !!currentUser?.permissions?.[key];
  };
  const menuItems = currentUser
    ? allMenuItems.filter((item) => canAccess(item.path) && !(item.path === '/painel' && currentUser.role === 'Criador de Blog'))
    : [];

  const isActivePath = (path: string) =>
    path === '/painel' ? pathname === '/painel' : pathname === path || pathname.startsWith(`${path}/`);

  // Tela sem permissão: as APIs já bloqueiam no servidor, aqui só evitamos uma tela quebrada
  const pageContent =
    currentUser && !canAccess(pathname) ? (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 p-8 text-center">
        <ShieldOff className="mb-1 h-8 w-8 text-jm-danger-fg" strokeWidth={1.75} />
        <h2 className="text-base font-semibold text-jm-fg">Acesso não permitido</h2>
        <p className="max-w-sm text-sm text-jm-muted">
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
    clearCache();
    window.location.href = '/painel/login';
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-[#0C1018]" />;
  }

  const isDark = theme === 'dark';
  const firstName = currentUser?.name?.split(' ')[0] || '';
  const initial = (currentUser?.name || '?').trim().charAt(0).toUpperCase();

  /* Conteúdo do menu lateral (desktop) e da gaveta (mobile) */
  const sideNav = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between px-5">
        <Link href="/painel" className="block" aria-label="JM Master Group — início">
          <Image src="/logos/JM-Master-2.png" alt="JM Master Group" width={128} height={36} className="h-auto w-[128px]" priority unoptimized />
        </Link>
        <button
          onClick={() => setDrawerOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-jm-side-muted hover:bg-jm-side-hover hover:text-jm-side-fg lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-3" aria-label="Módulos do painel">
        <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-jm-side-muted/70">Módulos</p>
        <div className="space-y-px">
          {menuItems.map((item) => {
            const active = isActivePath(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? 'page' : undefined}
                className={`jm-side-link ${active ? 'jm-side-link-active' : ''}`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 space-y-px border-t border-jm-side-border px-3 py-3">
        <Link href="/blog" target="_blank" className="jm-side-link">
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span>Ver blog no site</span>
        </Link>
        <button onClick={toggleLayout} className="jm-side-link hidden lg:flex">
          <PanelTop className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span>Menu superior</span>
        </button>
        <button
          onClick={toggleTheme}
          title={`Tema atual: ${isDark ? 'escuro' : 'claro'}. Clique para alternar.`}
          className="jm-side-link"
        >
          {isDark ? <Sun className="h-4 w-4 shrink-0" strokeWidth={1.75} /> : <Moon className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
          <span>{isDark ? 'Tema claro' : 'Tema escuro'}</span>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-jm-side-border px-4 py-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[4px] bg-jm-accent-line text-[13px] font-semibold text-white" aria-hidden="true">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-jm-side-fg">{currentUser?.name || ''}</p>
          <p className="truncate text-[11px] text-jm-side-muted">{currentUser?.role || ''}</p>
        </div>
        <button
          onClick={handleLogout}
          title="Sair do sistema"
          aria-label="Sair do sistema"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-jm-side-muted transition-colors hover:bg-jm-side-hover hover:text-white"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );

  /* Gaveta (mobile/tablet, ambos os layouts) */
  const drawer = drawerOpen && (
    <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-jm-overlay" style={{ animation: 'jm-fade-in 120ms ease-out' }} onClick={() => setDrawerOpen(false)} />
      <aside className="absolute inset-y-0 left-0 w-[272px] max-w-[85vw] bg-jm-side-bg shadow-jm-pop">
        {sideNav}
      </aside>
    </div>
  );

  /* Barra superior do mobile (layout lateral) */
  const mobileBar = (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-jm-side-border bg-jm-side-bg px-3 lg:hidden">
      <button
        onClick={() => setDrawerOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] text-white hover:bg-jm-side-hover"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Link href="/painel" aria-label="JM Master Group — início">
        <Image src="/logos/JM-Master-2.png" alt="JM Master Group" width={112} height={32} className="h-auto w-[112px]" priority unoptimized />
      </Link>
      <div className="grid h-8 w-8 place-items-center rounded-[4px] bg-jm-accent-line text-[13px] font-semibold text-white" aria-hidden="true">
        {initial}
      </div>
    </header>
  );

  /* 1. LAYOUT DE MENU SUPERIOR */
  if (menuLayout === 'top') {
    return (
      <div className="jm-panel flex min-h-screen w-full flex-col bg-jm-bg font-sans text-jm-fg">
        <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center gap-4 border-b border-jm-side-border bg-jm-side-bg px-3 sm:px-5">
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] text-white hover:bg-jm-side-hover lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/painel" className="shrink-0" aria-label="JM Master Group — início">
            <Image src="/logos/JM-Master-2.png" alt="JM Master Group" width={116} height={32} className="h-auto w-[116px]" priority unoptimized />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center gap-px overflow-x-auto lg:flex [scrollbar-width:none]" aria-label="Módulos do painel">
            {menuItems.map((item) => {
              const active = isActivePath(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex h-14 shrink-0 items-center gap-2 px-3 text-[13px] font-medium transition-colors duration-100 ${
                    active
                      ? 'text-white after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:bg-jm-accent-line'
                      : 'text-jm-side-muted hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  <span>{item.shortName}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Link
              href="/blog"
              target="_blank"
              title="Ver blog no site"
              className="hidden h-8 items-center gap-1.5 rounded-[4px] px-2.5 text-xs font-medium text-jm-side-muted hover:bg-jm-side-hover hover:text-white xl:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Ver site</span>
            </Link>
            <button
              onClick={toggleLayout}
              title="Mudar para menu lateral"
              aria-label="Mudar para menu lateral"
              className="hidden h-8 w-8 items-center justify-center rounded-[4px] text-jm-side-muted hover:bg-jm-side-hover hover:text-white lg:inline-flex"
            >
              <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              onClick={toggleTheme}
              title={`Tema atual: ${isDark ? 'escuro' : 'claro'}. Clique para alternar.`}
              aria-label="Alternar tema"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-jm-side-muted hover:bg-jm-side-hover hover:text-white"
            >
              {isDark ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
            </button>
            <div className="mx-1 hidden h-5 w-px bg-jm-side-border sm:block" />
            <div className="hidden items-center gap-2 pr-1 sm:flex">
              <div className="grid h-7 w-7 place-items-center rounded-[4px] bg-jm-accent-line text-xs font-semibold text-white" aria-hidden="true">
                {initial}
              </div>
              <div className="hidden leading-tight 2xl:block">
                <p className="text-xs font-medium text-white">{firstName}</p>
                <p className="text-[10px] text-jm-side-muted">{currentUser?.role || ''}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sair do sistema"
              aria-label="Sair do sistema"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-jm-side-muted hover:bg-jm-side-hover hover:text-white"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        {drawer}

        <main className="w-full min-w-0 flex-1 bg-jm-bg">{pageContent}</main>
      </div>
    );
  }

  /* 2. LAYOUT DE MENU LATERAL (PADRÃO) */
  return (
    <div className="jm-panel flex min-h-screen w-full bg-jm-bg font-sans text-jm-fg">
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 border-r border-jm-side-border bg-jm-side-bg lg:block">
        {sideNav}
      </aside>

      {drawer}

      <div className="flex min-w-0 flex-1 flex-col">
        {mobileBar}
        <main className="w-full min-w-0 flex-1 bg-jm-bg">{pageContent}</main>
      </div>
    </div>
  );
}
