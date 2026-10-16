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
  UserPlus,
  FileText,
  Receipt,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { peekCache, setCache } from './lib/cache';
import { api } from './lib/api';
import { formatBRL, formatDateTime } from './lib/format';

interface DashboardData {
  metrics: {
    blogCount: number;
    publishedCount: number;
    scheduledCount: number;
    draftCount: number;
    customerCount: number;
    activeCustomerCount: number;
    groupCount: number;
    productCount: number;
  };
  finance: {
    openInvoices: number;
    aReceber: number;
    overdueCount: number;
    inadimplencia: number;
    recebidoMes: number;
    mrr: number;
  } | null;
  funnel: {
    newLeads: number;
    newLeads7d: number;
    openLeads: number;
    staleLeads: number;
    wonMonth: number;
    pipelineValue: number;
  } | null;
  followUps: { id: string; name: string; company: string; nextAction: string; nextActionAt: string | null; stage: string }[];
  health: { label: string; ok: boolean; detail: string }[];
}

const CACHE_KEY = '/api/dashboard';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api<DashboardData>('/api/dashboard');
      setData(res);
      setCache(CACHE_KEY, res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar indicadores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    // Dados da última visita aparecem na hora; a requisição abaixo atualiza
    const cached = peekCache<DashboardData>(CACHE_KEY);
    if (cached) {
      setData(cached);
      setLoading(false);
    }
    load();
  }, []);

  const m = data?.metrics;
  const health = data?.health || [];
  const allHealthy = health.length > 0 && health.every((h) => h.ok);

  const statCell =
    'group flex flex-col justify-between gap-1 p-4 outline-none transition-colors duration-100 hover:bg-jm-hover focus-visible:bg-jm-hover md:p-5';
  const actionRow =
    'flex items-center gap-3 px-4 py-3 outline-none transition-colors duration-100 hover:bg-jm-hover focus-visible:bg-jm-hover md:px-5';

  return (
    <div className="jm-page">
      <header className="jm-page-header">
        <div>
          <h1 className="jm-page-title">Painel Executivo</h1>
          <p className="jm-page-desc">Visão geral de vendas, financeiro, clientes, publicações e conexões operacionais.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 px-1 text-[13px] text-jm-muted">
            <Calendar className="h-4 w-4" strokeWidth={1.75} />
            <span>
              Hoje, <span className="tabular-nums text-jm-fg2">{currentDate}</span>
            </span>
          </span>
          <button onClick={load} className="jm-btn jm-btn-secondary">
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

      {/* VENDAS E FINANCEIRO (conforme permissão) */}
      {(data?.funnel || data?.finance) && (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {data?.funnel && (
            <div className="jm-card overflow-hidden">
              <div className="jm-card-header">
                <h2 className="jm-card-title">Funil de vendas</h2>
                <Link href="/painel/crm" className="jm-link text-xs">
                  Abrir funil
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3">
                <Kpi label="Novos (sem atendimento)" value={data.funnel.newLeads} tone={data.funnel.newLeads > 0 ? 'accent' : undefined} />
                <Kpi label="Leads em 7 dias" value={data.funnel.newLeads7d} />
                <Kpi label="Em negociação" value={data.funnel.openLeads} />
                <Kpi label="Parados há +3 dias" value={data.funnel.staleLeads} tone={data.funnel.staleLeads > 0 ? 'warning' : undefined} />
                <Kpi label="Ganhos no mês" value={data.funnel.wonMonth} tone="success" />
                <Kpi label="Valor em negociação" value={formatBRL(data.funnel.pipelineValue)} />
              </div>
            </div>
          )}
          {data?.finance && (
            <div className="jm-card overflow-hidden">
              <div className="jm-card-header">
                <h2 className="jm-card-title">Financeiro</h2>
                <Link href="/painel/finance" className="jm-link text-xs">
                  Abrir financeiro
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3">
                <Kpi label="Receita recorrente (MRR)" value={formatBRL(data.finance.mrr)} tone="primary" />
                <Kpi label="Recebido no mês" value={formatBRL(data.finance.recebidoMes)} tone="success" />
                <Kpi label="A receber" value={formatBRL(data.finance.aReceber)} />
                <Kpi label="Faturas em aberto" value={data.finance.openInvoices} />
                <Kpi label="Faturas vencidas" value={data.finance.overdueCount} tone={data.finance.overdueCount > 0 ? 'danger' : undefined} />
                <Kpi label="Inadimplência" value={formatBRL(data.finance.inadimplencia)} tone={data.finance.inadimplencia > 0 ? 'danger' : undefined} />
              </div>
            </div>
          )}
        </section>
      )}

      {/* INDICADORES GERAIS */}
      <section className="jm-card overflow-hidden">
        <h2 className="sr-only">Indicadores</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 [&>*]:border-jm-border [&>*:nth-child(odd)]:border-r [&>*:nth-child(-n+2)]:border-b lg:[&>*]:border-b-0 lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0">
          <Link href="/painel/blog" className={statCell}>
            <div className="flex items-center justify-between gap-2">
              <p className="jm-stat-label">Artigos no ar</p>
              <PenTool className="h-3.5 w-3.5 text-jm-muted" strokeWidth={1.75} />
            </div>
            <p className="jm-stat-value">{m?.publishedCount ?? 0}</p>
            <p className="truncate text-xs text-jm-muted">
              {m ? `${m.draftCount} rascunho(s)${m.scheduledCount ? ` · ${m.scheduledCount} agendado(s)` : ''}` : '—'}
            </p>
          </Link>

          <Link href="/painel/customers" className={statCell}>
            <div className="flex items-center justify-between gap-2">
              <p className="jm-stat-label">Clientes cadastrados</p>
              <Users className="h-3.5 w-3.5 text-jm-muted" strokeWidth={1.75} />
            </div>
            <p className="jm-stat-value">{m?.customerCount ?? 0}</p>
            <p className="text-xs text-jm-muted">{m ? `${m.activeCustomerCount} ativo(s)` : '—'}</p>
          </Link>

          <Link href="/painel/customers?tab=grupos" className={statCell}>
            <div className="flex items-center justify-between gap-2">
              <p className="jm-stat-label">Grupos corporativos</p>
              <Building2 className="h-3.5 w-3.5 text-jm-muted" strokeWidth={1.75} />
            </div>
            <p className="jm-stat-value">{m?.groupCount ?? 0}</p>
            <p className="truncate text-xs text-jm-muted">Tabelas de preço por grupo</p>
          </Link>

          <Link href="/painel/products" className={statCell}>
            <div className="flex items-center justify-between gap-2">
              <p className="jm-stat-label">Produtos ativos</p>
              <Package className="h-3.5 w-3.5 text-jm-muted" strokeWidth={1.75} />
            </div>
            <p className="jm-stat-value">{m?.productCount ?? 0}</p>
            <p className="truncate text-xs text-jm-muted">Catálogo e planos</p>
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* RETORNOS AGENDADOS */}
        {data?.funnel && (
          <div className="jm-card overflow-hidden">
            <div className="jm-card-header">
              <h2 className="jm-card-title">Meus retornos (até amanhã)</h2>
              <Clock className="h-4 w-4 text-jm-muted" strokeWidth={1.75} />
            </div>
            <div className="jm-list">
              {data.followUps.length === 0 ? (
                <p className="jm-empty py-8">Nenhum retorno agendado. 🎉</p>
              ) : (
                data.followUps.map((f) => {
                  const late = f.nextActionAt && new Date(f.nextActionAt).getTime() < Date.now();
                  return (
                    <Link key={f.id} href={`/painel/crm?lead=${f.id}`} className={actionRow}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-jm-fg">
                          {f.name}
                          {f.company ? <span className="text-jm-muted"> · {f.company}</span> : null}
                        </p>
                        <p className="truncate text-xs text-jm-muted">{f.nextAction}</p>
                      </div>
                      <span className={`shrink-0 text-xs tabular-nums ${late ? 'font-semibold text-jm-danger-fg' : 'text-jm-muted'}`}>
                        {f.nextActionAt ? formatDateTime(f.nextActionAt) : '—'}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}

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
            {health.length === 0 && <p className="jm-empty py-8">{loading ? 'Verificando conexões...' : 'Sem dados de verificação.'}</p>}
            {health.map((h) => (
              <div key={h.label} className="jm-list-item">
                <span className="flex min-w-0 items-center gap-2.5 text-sm text-jm-fg">
                  {h.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-jm-success-fg" strokeWidth={1.75} />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-jm-warning-fg" strokeWidth={1.75} />
                  )}
                  <span className="truncate">{h.label}</span>
                </span>
                <span className={`shrink-0 text-right text-xs ${h.ok ? 'text-jm-muted' : 'font-medium text-jm-warning-fg'}`}>{h.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AÇÕES RÁPIDAS: abrem direto o formulário de criação */}
        <div className="jm-card overflow-hidden">
          <div className="jm-card-header">
            <h2 className="jm-card-title">Ações rápidas</h2>
          </div>
          <div className="jm-list">
            {data?.funnel && (
              <QuickAction href="/painel/crm?new=lead" icon={UserPlus} title="Novo lead" desc="Cadastrar oportunidade no funil" className={actionRow} />
            )}
            {data?.funnel && (
              <QuickAction href="/painel/proposals?new=1" icon={FileText} title="Nova proposta" desc="Montar proposta com a tabela de preços" className={actionRow} />
            )}
            {data?.finance && (
              <QuickAction href="/painel/finance?new=1" icon={Receipt} title="Nova fatura" desc="Lançar cobrança avulsa" className={actionRow} />
            )}
            <QuickAction href="/painel/blog?new=1" icon={PenTool} title="Escrever artigo" desc="Criar e publicar no blog" className={actionRow} />
            {data?.funnel && (
              <QuickAction href="/painel/customers?new=1" icon={Users} title="Cadastrar cliente" desc="Empresa, contatos e grupos" className={actionRow} />
            )}
            <QuickAction href="/painel/blog?tab=desempenho" icon={TrendingUp} title="Desempenho do blog" desc="Visualizações e leads por artigo" className={actionRow} />
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

function Kpi({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'accent' | 'warning' | 'danger' | 'success' | 'primary' }) {
  const color =
    tone === 'accent'
      ? 'text-jm-accent-text'
      : tone === 'warning'
        ? 'text-jm-warning-fg'
        : tone === 'danger'
          ? 'text-jm-danger-fg'
          : tone === 'success'
            ? 'text-jm-success-fg'
            : tone === 'primary'
              ? 'text-jm-primary-text'
              : 'text-jm-fg';
  return (
    <div className="border-b border-r border-jm-border px-4 py-3">
      <p className="jm-stat-label">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  desc,
  className,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  className: string;
}) {
  return (
    <Link href={href} className={className}>
      <Icon className="h-4 w-4 shrink-0 text-jm-muted" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-jm-fg">{title}</p>
        <p className="text-xs text-jm-muted">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-jm-placeholder" />
    </Link>
  );
}
