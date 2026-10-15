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
  ExternalLink,
  ArrowRight,
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
    <div className="mx-auto w-full max-w-[1280px] space-y-8 px-4 py-6 md:px-8 md:py-8">
      
      {/* CABEÇALHO DO DASHBOARD */}
      <header className="flex flex-col gap-4 border-b border-jm-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-jm-fg lg:text-3xl">
            Painel Executivo
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-jm-muted md:text-base">
            Visão geral em tempo real de publicações, clientes, produtos e conexões operacionais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-jm-border bg-jm-surface px-3.5 text-sm font-medium text-jm-fg2">
            <Calendar className="h-4 w-4 text-jm-muted" />
            <span>Hoje, {currentDate}</span>
          </div>
          <button
            onClick={loadRealData}
            className="jm-btn jm-btn-primary"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-jm-danger-border bg-jm-danger-bg p-4 text-sm font-medium text-jm-danger-fg">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* BLOCO DE DESTAQUE: CRIADOR DE BLOG INTEGRADO */}
      <section className="jm-card flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-start gap-4">
          <div className="jm-icon-chip jm-icon-chip-accent !h-10 !w-10">
            <PenTool className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-jm-fg">
                Criador de Blog Oficial
              </h2>
              <span className="jm-badge jm-badge-primary">
                Integrado
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-jm-muted">
              Escreva novos artigos com formatação rica, controle de fontes e imagens. Ao clicar em publicar, o artigo vai automaticamente para o site oficial em <code className="rounded-md border border-jm-border bg-jm-subtle px-1.5 py-0.5 font-mono text-xs text-jm-fg2">/blog</code>.
            </p>
          </div>
        </div>
        <Link
          href="/painel/blog"
          className="jm-btn jm-btn-accent shrink-0"
        >
          <span>Acessar Criador de Blog</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* CARDS DE MÉTRICA REAIS */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <h2 className="sr-only">Indicadores</h2>
        
        {/* Card 1: Artigos Publicados no Blog */}
        <Link href="/painel/blog" className="group block rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-jm-ring">
          <div className="jm-card h-full p-5 transition group-hover:border-jm-border-strong group-hover:shadow-sm md:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-jm-muted">Artigos Publicados</p>
              <div className="jm-icon-chip jm-icon-chip-accent">
                <PenTool className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
            </div>
            <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-jm-fg">{blogCount}</p>
            <p className="mt-2 text-sm text-jm-muted">{metrics ? `${metrics.draftCount} rascunho(s)` : '—'}</p>
          </div>
        </Link>

        {/* Card 2: Clientes Ativos */}
        <Link href="/painel/customers" className="group block rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-jm-ring">
          <div className="jm-card h-full p-5 transition group-hover:border-jm-border-strong group-hover:shadow-sm md:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-jm-muted">Clientes Cadastrados</p>
              <div className="jm-icon-chip jm-icon-chip-primary">
                <Users className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
            </div>
            <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-jm-fg">{customerCount}</p>
            <p className="mt-2 text-sm text-jm-muted">{metrics ? `${metrics.activeCustomerCount} ativo(s) · ${metrics.newLeads} lead(s) do site em 7 dias` : '—'}</p>
          </div>
        </Link>

        {/* Card 3: Grupos Corporativos */}
        <Link href="/painel/customers" className="group block rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-jm-ring">
          <div className="jm-card h-full p-5 transition group-hover:border-jm-border-strong group-hover:shadow-sm md:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-jm-muted">Grupos Corporativos</p>
              <div className="jm-icon-chip jm-icon-chip-primary">
                <Building2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
            </div>
            <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-jm-fg">{groupCount}</p>
            <p className="mt-2 text-sm text-jm-muted">Gestão de Grupos</p>
          </div>
        </Link>

        {/* Card 4: Catálogo de Produtos */}
        <Link href="/painel/products" className="group block rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-jm-ring">
          <div className="jm-card h-full p-5 transition group-hover:border-jm-border-strong group-hover:shadow-sm md:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-jm-muted">Produtos no Catálogo</p>
              <div className="jm-icon-chip jm-icon-chip-primary">
                <Package className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
            </div>
            <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-jm-fg">{productCount}</p>
            <p className="mt-2 text-sm text-jm-muted">{metrics ? `${metrics.openInvoices} fatura(s) em aberto` : '—'}</p>
          </div>
        </Link>

      </section>

      {/* BLOCO DE INTEGRAÇÃO EM TEMPO REAL COM O SITE */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        
        {/* Status das APIs & Serviços */}
        <div className="jm-card overflow-hidden">
          <div className="jm-card-header">
            <h2 className="jm-card-title">Status das Conexões & APIs</h2>
            {health.length > 0 && (
              <span className={`jm-badge ${allHealthy ? 'jm-badge-success' : 'jm-badge-warning'}`}>
                {allHealthy ? 'Operacional' : 'Atenção'}
              </span>
            )}
          </div>
          <div className="divide-y divide-jm-border">
            {health.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-jm-muted">{loading ? 'Verificando conexões...' : 'Sem dados de verificação.'}</p>
            )}
            {health.map((h) => (
              <div key={h.label} className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
                <span className="text-sm font-medium text-jm-fg">{h.label}</span>
                <span className={`jm-badge ${h.ok ? 'jm-badge-success' : 'jm-badge-warning'}`}>
                  {h.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                  <span>{h.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Acesso Rápido às Funções */}
        <div className="jm-card overflow-hidden">
          <div className="jm-card-header">
            <h2 className="jm-card-title">Ações Rápidas do Sistema</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 md:p-6">
            <Link
              href="/painel/blog"
              className="group flex flex-col gap-3 rounded-lg border border-jm-border bg-jm-surface p-4 outline-none transition hover:border-jm-border-strong hover:bg-jm-subtle focus-visible:ring-4 focus-visible:ring-jm-ring"
            >
              <div className="jm-icon-chip jm-icon-chip-accent">
                <PenTool className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-jm-fg">Escrever Artigo</p>
                <p className="mt-0.5 text-sm text-jm-muted">Criar e publicar no blog</p>
              </div>
            </Link>

            <Link
              href="/painel/customers"
              className="group flex flex-col gap-3 rounded-lg border border-jm-border bg-jm-surface p-4 outline-none transition hover:border-jm-border-strong hover:bg-jm-subtle focus-visible:ring-4 focus-visible:ring-jm-ring"
            >
              <div className="jm-icon-chip jm-icon-chip-primary">
                <Users className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-jm-fg">Cadastrar Cliente</p>
                <p className="mt-0.5 text-sm text-jm-muted">Gerenciar empresas e grupos</p>
              </div>
            </Link>

            <Link
              href="/painel/products"
              className="group flex flex-col gap-3 rounded-lg border border-jm-border bg-jm-surface p-4 outline-none transition hover:border-jm-border-strong hover:bg-jm-subtle focus-visible:ring-4 focus-visible:ring-jm-ring"
            >
              <div className="jm-icon-chip jm-icon-chip-primary">
                <Package className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-jm-fg">Tabela de Preços</p>
                <p className="mt-0.5 text-sm text-jm-muted">Configurar produtos e planos</p>
              </div>
            </Link>

            <Link
              href="/blog"
              target="_blank"
              className="group flex flex-col gap-3 rounded-lg border border-jm-border bg-jm-surface p-4 outline-none transition hover:border-jm-border-strong hover:bg-jm-subtle focus-visible:ring-4 focus-visible:ring-jm-ring"
            >
              <div className="jm-icon-chip jm-icon-chip-neutral">
                <ExternalLink className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-jm-fg">Abrir Site Oficial</p>
                <p className="mt-0.5 text-sm text-jm-muted">Ver blog no ar</p>
              </div>
            </Link>
          </div>
        </div>

      </section>

    </div>
  );
}
