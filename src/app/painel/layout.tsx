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
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [menuLayout, setMenuLayout] = useState<'sidebar' | 'top'>('sidebar');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Carregar usuário logado
    const savedUserStr = localStorage.getItem('@JMMaster:user');
    if (savedUserStr) {
      try {
        const user = JSON.parse(savedUserStr);
        setCurrentUser(user);
        // Se for Criador de Blog e estiver tentando acessar outra página do painel, redireciona
        if (user.role === 'Criador de Blog' && pathname !== '/painel/blog' && pathname !== '/painel/login') {
          window.location.href = '/painel/blog';
        }
      } catch (e) {}
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

  // Se o usuário logado for da classe Criador de Blog, exibe apenas a opção do Blog
  const menuItems = currentUser?.role === 'Criador de Blog'
    ? [{ name: 'Criador de Blog', shortName: 'Blog', path: '/painel/blog', icon: PenTool }]
    : allMenuItems;

  const handleLogout = () => {
    localStorage.removeItem('@JMMaster:token');
    localStorage.removeItem('@JMMaster:user');
    window.location.href = '/painel/login';
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-neutral-950 text-white" />;
  }

  const isDark = theme === 'dark';

  /* 1. LAYOUT DE MENU SUPERIOR */
  if (menuLayout === 'top') {
    return (
      <div className={`min-h-screen w-full flex flex-col font-sans ${isDark ? 'dark bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-900'} transition-colors duration-300`}>
        
        {/* HEADER / NAVBAR SUPERIOR FIXA */}
        <header className={`w-full h-16 sticky top-0 border-b flex items-center justify-between px-4 sm:px-6 transition-colors duration-300 z-50 shrink-0 gap-3 ${isDark ? 'bg-neutral-900/95 border-neutral-800 backdrop-blur-md' : 'bg-white/95 border-neutral-200 backdrop-blur-md'}`}>
          
          {/* Logo (Esquerda) */}
          <div className="flex items-center shrink-0">
            <Link href="/painel" className="relative w-28 sm:w-32 h-8 block">
              <Image 
                src="/images/logo_jm.png" 
                alt="JM Master Group"
                fill
                className="object-contain"
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
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                      isActive 
                        ? 'bg-[#E85D26] text-white shadow-md shadow-orange-950/20' 
                        : isDark 
                          ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' 
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
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
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#E85D26] bg-orange-500/10 hover:bg-orange-500/20 rounded-xl border border-orange-500/30 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Site</span>
            </Link>

            {/* Perfil */}
            <div className={`hidden 2xl:flex items-center gap-1.5 py-1 px-2.5 rounded-xl border transition-colors ${isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-200' : 'bg-neutral-50 border-neutral-200 text-neutral-800'}`}>
              <span className="text-xs font-bold">{currentUser?.name?.split(' ')[0] || 'Admin'}</span>
              <span className="px-1.5 py-0.2 text-[8px] font-extrabold uppercase bg-orange-600/10 text-[#E85D26] rounded border border-orange-500/25">
                {currentUser?.role || 'ADMIN'}
              </span>
            </div>

            {/* Alternador de Layout */}
            <button
              onClick={toggleLayout}
              title="Mudar para Menu Lateral"
              className={`p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white border-neutral-800' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border-neutral-200'}`}
            >
              <Sidebar className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Menu Lateral</span>
            </button>

            {/* Alternador de Tema */}
            <button
              onClick={toggleTheme}
              title={`Tema Atual: ${isDark ? 'Escuro' : 'Claro'}. Clique para alternar.`}
              className={`p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${isDark ? 'text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border-neutral-700' : 'text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border-neutral-300'}`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-600" />}
              <span className="hidden xl:inline text-[11px]">{isDark ? 'Escuro' : 'Claro'}</span>
            </button>

            {/* Sair */}
            <button
              onClick={handleLogout}
              title="Sair do Sistema"
              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* ÁREA DE CONTEÚDO PRINCIPAL (Scroll Livre) */}
        <main className="flex-1 w-full min-h-0">
          {children}
        </main>
        
      </div>
    );
  }

  /* 2. LAYOUT DE MENU LATERAL (PADRÃO) */
  return (
    <div className={`min-h-screen w-full flex font-sans ${isDark ? 'dark bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-900'} transition-colors duration-300`}>
      
      {/* SIDEBAR LATERAL FIXA */}
      <aside className={`w-64 sticky top-0 h-screen border-r flex flex-col justify-between transition-colors duration-300 shrink-0 overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
        <div>
          {/* Logo JM Master Group */}
          <div className={`p-6 border-b flex justify-center ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
            <Link href="/painel" className="relative w-40 h-12 block">
              <Image 
                src="/images/logo_jm.png" 
                alt="JM Master Group"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </Link>
          </div>

          {/* Perfil do Usuário Logado */}
          <div className={`p-5 text-center border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
            <div className={`py-3 px-4 rounded-xl border transition-colors duration-300 ${isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-200' : 'bg-neutral-100 border-neutral-200 text-neutral-800'}`}>
              <p className="text-sm font-semibold tracking-wide">{currentUser?.name || 'Administrador'}</p>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-orange-600/10 text-[#E85D26] rounded-full border border-orange-500/25">
                {currentUser?.role || 'SUPER ADMIN'}
              </span>
            </div>
          </div>

          {/* Itens do Menu */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-[#E85D26] text-white shadow-lg shadow-orange-950/20' 
                      : isDark
                        ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Botões de Ação na Base (Tema, Layout, Ver Blog & Sair) */}
        <div className={`p-4 border-t space-y-2 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
          
          {/* Link Ver Blog Oficial */}
          <Link
            href="/blog"
            target="_blank"
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-[#E85D26] bg-orange-500/10 hover:bg-orange-500/20 rounded-xl border border-orange-500/25 transition-all"
          >
            <span>Ver Blog Oficial</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Alternador de Layout */}
          <button
            onClick={toggleLayout}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}
          >
            <span>Menu Superior</span>
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>

          {/* Alternador de Tema */}
          <button
            onClick={toggleTheme}
            title={`Tema Atual: ${isDark ? 'Escuro' : 'Claro'}. Clique para alternar.`}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${isDark ? 'text-neutral-200 bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700' : 'text-neutral-800 bg-neutral-200/80 hover:bg-neutral-200 border-neutral-300'}`}
          >
            <span>{isDark ? 'Tema: Escuro' : 'Tema: Claro'}</span>
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-600" />}
          </button>

          {/* Sair */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 rounded-xl transition-all cursor-pointer"
          >
            <span>Sair do Sistema</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (Scroll Livre em toda a tela) */}
      <main className="flex-1 min-w-0 min-h-screen">
        {children}
      </main>

    </div>
  );
}
