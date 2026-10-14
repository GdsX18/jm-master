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
  AlertTriangle,
} from 'lucide-react';

interface DashboardMetrics {
  blogCount: number;
  publishedCount: number;
  draftCount: number;
  customerCount: number;
  activeCustomerCount: number;
  groupCount: number;
  productCount: number;
  openInvoices: number;
  newLeads: number;
}

interface HealthCheck {
  label: string;
  ok: boolean;
  detail: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

  const loadRealData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao carregar indicadores');
      setMetrics(data.metrics);
      setHealth(data.health || []);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar indicadores');
    } finally {
      setLoading(false);
    }
  };

  const blogCount = metrics?.publishedCount ?? 0;
  const customerCount = metrics?.customerCount ?? 0;
  const groupCount = metrics?.groupCount ?? 0;
  const productCount = metrics?.productCount ?? 0;
  const allHealthy = health.length > 0 && health.every((h) => h.ok);

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

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* BLOCO DE DESTAQUE: CRIADOR DE BLOG INTEGRADO */}
      <div className="bg-gradient-to-r from-orange-600/15 via-orange-500/10 to-transparent border border-orange-500/30 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-[#E85D26]" />
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Criador de Blog Oficial
            </h2>
            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-[#E85D26] text-white rounded-md">
              INTEGRADO
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
                <p className="text-xs uppercase font-extrabold tracking-wider text-neutral-500 dark:text-neutral-400">Artigos Publicados</p>
                <h3 className="text-3xl font-extrabold mt-2 text-neutral-900 dark:text-white">{blogCount}</h3>
                <span className="text-[11px] text-[#E85D26] font-semibold mt-1 block">{metrics ? `${metrics.draftCount} rascunho(s)` : '—'}</span>
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
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">{metrics ? `${metrics.activeCustomerCount} ativo(s) · ${metrics.newLeads} lead(s) do site em 7 dias` : '—'}</span>
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
                <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1 block">{metrics ? `${metrics.openInvoices} fatura(s) em aberto` : '—'}</span>
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
            {health.length > 0 && (
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                  allHealthy
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}
              >
                {allHealthy ? 'OPERACIONAL' : 'ATENÇÃO'}
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            {health.length === 0 && (
              <p className="text-neutral-500">{loading ? 'Verificando conexões...' : 'Sem dados de verificação.'}</p>
            )}
            {health.map((h) => (
              <div
                key={h.label}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800"
              >
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{h.label}</span>
                <span className={`font-bold flex items-center gap-1.5 text-right ${h.ok ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {h.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{h.detail}</span>
                </span>
              </div>
            ))}
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
