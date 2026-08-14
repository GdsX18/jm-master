'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  RefreshCw,
  PenTool,
  Users,
  Building2,
  Package,
  Zap,
  ExternalLink,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  const [blogCount, setBlogCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

  const loadRealData = async () => {
    setLoading(true);
    try {
      // 1. Carregar contagem real de artigos do blog
      const res = await fetch('/api/blog/posts');
      if (res.ok) {
        const posts = await res.json();
        setBlogCount(Array.isArray(posts) ? posts.length : 0);
      }
    } catch (e) {
      console.error('Erro ao carregar posts:', e);
    }

    try {
      // 2. Carregar contagem de clientes
      const savedCustomers = localStorage.getItem('@JMMaster:customers');
      if (savedCustomers) {
        const parsed = JSON.parse(savedCustomers);
        setCustomerCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setCustomerCount(0);
      }

      // 3. Carregar contagem de grupos
      const savedGroups = localStorage.getItem('@JMMaster:groups');
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups);
        setGroupCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setGroupCount(0);
      }

      // 4. Carregar contagem de produtos
      const savedProducts = localStorage.getItem('@JMMaster:products');
      if (savedProducts) {
        const parsed = JSON.parse(savedProducts);
        setProductCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setProductCount(0);
      }
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Formatar data atual
    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    setCurrentDate(formatted);

    loadRealData();
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#f8fafc] dark:bg-neutral-950 transition-colors duration-300 min-h-screen">
      
      {/* CABEÇALHO DO DASHBOARD */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1d2d44] dark:text-neutral-100">
            Painel Executivo
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Visão geral em tempo real de publicações, clientes, produtos e conexões operacionais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors duration-300">
            <Calendar className="w-4 h-4 text-[#E85D26]" />
            <span>HOJE / {currentDate}</span>
          </div>
          <button
            onClick={loadRealData}
            className="bg-[#E85D26] hover:bg-orange-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md shadow-orange-950/20 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* BLOCO DE DESTAQUE: CRIADOR DE BLOG INTEGRADO */}
      <div className="bg-gradient-to-r from-orange-600/15 via-orange-500/10 to-transparent border border-orange-500/30 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-[#E85D26]" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Criador de Blog Oficial
            </h2>
            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-[#E85D26] text-white rounded-md">
              INTEGRADO & ATIVO
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-2xl leading-relaxed">
            Escreva novos artigos com formatação rica, controle de fontes e imagens. Ao clicar em publicar, o artigo vai automaticamente para o site oficial em <code className="bg-orange-500/10 px-1.5 py-0.5 rounded text-[#E85D26] font-mono">/blog</code>.
          </p>
        </div>
        <Link
          href="/painel/blog"
          className="px-5 py-2.5 bg-[#E85D26] hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-orange-950/20 shrink-0 flex items-center gap-1.5"
        >
          <span>Acessar Criador de Blog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* CARDS DE MÉTRICA REAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Artigos Publicados no Blog */}
        <Link href="/painel/blog" className="block group">
          <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-xs transition-all group-hover:border-orange-500/50">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E85D26]" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">Artigos no Blog</p>
                <h3 className="text-3xl font-extrabold mt-2 text-neutral-900 dark:text-white">{blogCount}</h3>
                <span className="text-[11px] text-[#E85D26] font-semibold mt-1 block">Sincronizado com /blog</span>
              </div>
              <div className="bg-orange-500/10 p-2.5 rounded-xl text-[#E85D26]">
                <PenTool className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>

        {/* Card 2: Clientes Ativos */}
        <Link href="/painel/customers" className="block group">
          <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-xs transition-all group-hover:border-emerald-500/50">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">Clientes Cadastrados</p>
                <h3 className="text-3xl font-extrabold mt-2 text-neutral-900 dark:text-white">{customerCount}</h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">Central de Clientes</span>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>

        {/* Card 3: Grupos Corporativos */}
        <Link href="/painel/customers" className="block group">
          <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-xs transition-all group-hover:border-amber-500/50">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">Grupos Corporativos</p>
                <h3 className="text-3xl font-extrabold mt-2 text-neutral-900 dark:text-white">{groupCount}</h3>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">Gestão de Grupos</span>
              </div>
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-600 dark:text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>

        {/* Card 4: Catálogo de Produtos */}
        <Link href="/painel/products" className="block group">
          <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-xs transition-all group-hover:border-sky-500/50">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500" />
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">Produtos no Catálogo</p>
                <h3 className="text-3xl font-extrabold mt-2 text-neutral-900 dark:text-white">{productCount}</h3>
                <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1 block">Planos & Serviços</span>
              </div>
              <div className="bg-sky-500/10 p-2.5 rounded-xl text-sky-600 dark:text-sky-400">
                <Package className="w-5 h-5" />
              </div>
            </div>
          </div>
        </Link>

      </div>

      {/* BLOCO DE INTEGRAÇÃO EM TEMPO REAL COM O SITE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Status das APIs & Serviços */}
        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Status das Conexões & APIs</h3>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              OPERACIONAL
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">API de Publicação de Blog (/api/blog/posts)</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Conectada</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Revalidação Automática de Páginas (/blog)</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ativa</span>
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">Tema Claro / Escuro & Layout Adaptativo</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sincronizado</span>
              </span>
            </div>
          </div>
        </div>

        {/* Acesso Rápido às Funções */}
        <div className="bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E85D26]" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Ações Rápidas do Sistema</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Link
              href="/painel/blog"
              className="p-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-neutral-900 dark:text-white transition font-bold flex flex-col gap-1.5"
            >
              <PenTool className="w-5 h-5 text-[#E85D26]" />
              <span>Escrever Artigo</span>
              <span className="text-[10px] text-neutral-500 font-normal">Criar e publicar no blog</span>
            </Link>

            <Link
              href="/painel/customers"
              className="p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-neutral-900 dark:text-white transition font-bold flex flex-col gap-1.5"
            >
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Cadastrar Cliente</span>
              <span className="text-[10px] text-neutral-500 font-normal">Gerenciar empresas e grupos</span>
            </Link>

            <Link
              href="/painel/products"
              className="p-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-neutral-900 dark:text-white transition font-bold flex flex-col gap-1.5"
            >
              <Package className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>Tabela de Preços</span>
              <span className="text-[10px] text-neutral-500 font-normal">Configurar produtos e planos</span>
            </Link>

            <Link
              href="/blog"
              target="_blank"
              className="p-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-neutral-900 dark:text-white transition font-bold flex flex-col gap-1.5"
            >
              <ExternalLink className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Abrir Site Oficial</span>
              <span className="text-[10px] text-neutral-500 font-normal">Ver blog no ar</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
