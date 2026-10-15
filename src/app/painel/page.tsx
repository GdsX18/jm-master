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
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { peekCache, setCache } from './lib/cache';

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
      setCache('/api/dashboard', data);
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

    // Dados da última visita aparecem na hora; a requisição abaixo atualiza
    const cached = peekCache<{ metrics: DashboardMetrics; health?: HealthCheck[] }>('/api/dashboard');
    if (cached) {
      setMetrics(cached.metrics);
      setHealth(cached.health || []);
      setLoading(false);
    }

    loadRealData();
  }, []);

  const statCell = 'group flex flex-col justify-between gap-1 p-4 outline-none transition-colors duration-100 hover:bg-jm-hover focus-visible:bg-jm-hover md:p-5';
  const actionRow = 'flex items-center gap-3 px-4 py-3 outline-none transition-colors duration-100 hover:bg-jm-hover focus-visible:bg-jm-hover md:px-5';

  return (
    <div className="jm-page">

      {/* CABEÇALHO */}
      <header className="jm-page-header">
        <div>
          <h1 className="jm-page-title">Painel Executivo</h1>
          <p className="jm-page-desc">
            Visão geral de publicações, clientes, produtos e conexões operacionais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 px-1 text-[13px] text-jm-muted">
            <Calendar className="h-4 w-4" strokeWidth={1.75} />
            <span>Hoje, <span className="tabular-nums text-jm-fg2">{currentDate}</span></span>
          </span>
          <button onClick={loadRealData} className="jm-btn jm-btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="jm-alert jm-alert-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* INDICADORES */}
      <section className="jm-card overflow-hidden">
        <h2 className="sr-only">Indicadores</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 [&>*]:border-jm-border [&>*:nth-child(odd)]:border-r [&>*:nth-child(-n+2)]:border-b lg:[&>*]:border-b-0 lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0">
          <Link href="/painel/blog" className={statCell}>
            <div className="flex items-center justify-between gap-2">
              <p className="jm-stat-label">Artigos publicados</p>
              <PenTool className="h-3.5 w-3.5 text-jm-muted" strokeWidth={1.75} />
            </div>
            <p className="jm-stat-value">{blogCount}</p>
            <p className="truncate text-xs text-jm-muted">{metrics ? `${metrics.draftCount} rascunho(s)` : '—'}</p>
          </Link>

          <Link href="/painel/customers" className={statCell}>
            <div className="flex items-center justify-between gap-2">
              <p className="jm-stat-label">Clientes cadastrados</p>
              <Users className="h-3.5 w-3.5 text-jm-muted" strokeWidth={1.75} />
            </div>
            <p className="jm-stat-value">{customerCount}</p>
            <p className="text-xs text-jm-muted">{metrics ? `${metrics.activeCustomerCount} ativo(s) · ${metrics.newLeads} lead(s) do site em 7 dias` : '—'}</p>
          </Link>

          <Link href="/painel/customers" className={statCell}>
            <div className="flex items-center justify-between gap-2">
              <p className="jm-stat-label">Grupos corporativos</p>
              <Building2 className="h-3.5 w-3.5 text-jm-muted" strokeWidth={1.75} />
            </div>
            <p className="jm-stat-value">{groupCount}</p>
            <p className="truncate text-xs text-jm-muted">Gestão de grupos</p>
          </Link>

          <Link href="/painel/products" className={statCell}>
            <div className="flex items-center justify-between gap-2">
              <p className="jm-stat-label">Produtos no catálogo</p>
              <Package className="h-3.5 w-3.5 text-jm-muted" strokeWidth={1.75} />
            </div>
            <p className="jm-stat-value">{productCount}</p>
            <p className="truncate text-xs text-jm-muted">{metrics ? `${metrics.openInvoices} fatura(s) em aberto` : '—'}</p>
          </Link>
        </div>
      </section>

      {/* ATALHO DO BLOG */}
      <section className="jm-card flex flex-col gap-3 border-l-[3px] border-l-jm-accent-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-jm-fg">Criador de Blog</h2>
            <span className="jm-badge jm-badge-neutral">Integrado</span>
          </div>
          <p className="mt-0.5 text-[13px] text-jm-muted">
            Escreva artigos com formatação rica e imagens. Ao publicar, o artigo vai direto para o site em <code className="rounded-[3px] bg-jm-subtle px-1 py-px font-mono text-xs text-jm-fg2">/blog</code>.
          </p>
        </div>
        <Link href="/painel/blog" className="jm-btn jm-btn-accent shrink-0 self-start sm:self-auto">
          <span>Abrir criador de blog</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* STATUS DAS CONEXÕES */}
        <div className="jm-card overflow-hidden">
          <div className="jm-card-header">
            <h2 className="jm-card-title">Conexões e APIs</h2>
            {health.length > 0 && (
              <span className={`jm-badge ${allHealthy ? 'jm-badge-success' : 'jm-badge-warning'}`}>
                <span className="jm-dot" />
                {allHealthy ? 'Operacional' : 'Atenção'}
              </span>
            )}
          </div>
          <div className="jm-list">
            {health.length === 0 && (
              <p className="jm-empty py-8">{loading ? 'Verificando conexões...' : 'Sem dados de verificação.'}</p>
            )}
            {health.map((h) => (
              <div key={h.label} className="jm-list-item">
                <span className="flex min-w-0 items-center gap-2.5 text-sm text-jm-fg">
                  {h.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-jm-success-fg" strokeWidth={1.75} /> : <AlertTriangle className="h-4 w-4 shrink-0 text-jm-warning-fg" strokeWidth={1.75} />}
                  <span className="truncate">{h.label}</span>
                </span>
                <span className={`shrink-0 text-right text-xs ${h.ok ? 'text-jm-muted' : 'font-medium text-jm-warning-fg'}`}>{h.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="jm-card overflow-hidden">
          <div className="jm-card-header">
            <h2 className="jm-card-title">Ações rápidas</h2>
          </div>

          <div className="jm-list">
            <Link href="/painel/blog" className={actionRow}>
              <PenTool className="h-4 w-4 shrink-0 text-jm-muted" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-jm-fg">Escrever artigo</p>
                <p className="text-xs text-jm-muted">Criar e publicar no blog</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-jm-placeholder" />
            </Link>

            <Link href="/painel/customers" className={actionRow}>
              <Users className="h-4 w-4 shrink-0 text-jm-muted" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-jm-fg">Cadastrar cliente</p>
                <p className="text-xs text-jm-muted">Gerenciar empresas e grupos</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-jm-placeholder" />
            </Link>

            <Link href="/painel/products" className={actionRow}>
              <Package className="h-4 w-4 shrink-0 text-jm-muted" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-jm-fg">Tabela de preços</p>
                <p className="text-xs text-jm-muted">Configurar produtos e planos</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-jm-placeholder" />
            </Link>

            <Link href="/blog" target="_blank" className={actionRow}>
              <ExternalLink className="h-4 w-4 shrink-0 text-jm-muted" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-jm-fg">Abrir site oficial</p>
                <p className="text-xs text-jm-muted">Ver blog no ar</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-jm-placeholder" />
            </Link>
          </div>
        </div>

      </section>

    </div>
  );
}
