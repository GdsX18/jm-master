'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, TrendingDown, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { BarChart } from '../../components/ui/BarChart';

interface ArticleStats {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  publishedAt: string | null;
  totalViews: number;
  periodViews: number;
  previousViews: number;
  trend: number;
  leads: number;
  wonLeads: number;
  conversion: number;
}

interface AnalyticsResponse {
  days: number;
  series: { day: string; views: number }[];
  articles: ArticleStats[];
  totals: { periodViews: number; previousViews: number; trend: number; allTimeViews: number; leads: number; conversion: number };
}

const nf = (n: number) => n.toLocaleString('pt-BR');

// Desempenho do blog: visualizações por dia, ranking de artigos e leads gerados por conteúdo
export default function BlogAnalytics({ onEditArticle }: { onEditArticle: (id: string) => void }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api<AnalyticsResponse>(`/api/blog/analytics?days=${days}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [days]);

  if (error) return <div className="jm-alert jm-alert-danger">{error}</div>;
  if (!data) return <div className="jm-card jm-empty">Carregando métricas...</div>;

  const t = data.totals;
  const chartData = data.series.map((d) => ({
    label: new Date(`${d.day}T12:00:00Z`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
    values: [d.views],
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-jm-muted">
          Visualizações contadas uma vez por sessão (robôs ignorados). Leads atribuídos quando o formulário é enviado a partir de um artigo ou logo após a leitura.
        </p>
        <div className="jm-segmented">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={`jm-segment ${days === d ? 'jm-segment-active' : ''}`}>
              {d} dias
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={`Visualizações (${data.days} dias)`}
          value={nf(t.periodViews)}
          extra={
            t.previousViews > 0 ? (
              <span className={`inline-flex items-center gap-1 text-xs ${t.trend >= 0 ? 'text-jm-success-fg' : 'text-jm-danger-fg'}`}>
                {t.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {t.trend >= 0 ? '+' : ''}
                {t.trend}% vs. período anterior
              </span>
            ) : (
              <span className="text-xs text-jm-muted">sem período anterior para comparar</span>
            )
          }
        />
        <Stat label="Visualizações (total histórico)" value={nf(t.allTimeViews)} />
        <Stat label="Leads gerados pelo blog" value={nf(t.leads)} />
        <Stat label="Conversão visita → lead" value={`${t.conversion.toLocaleString('pt-BR')}%`} />
      </div>

      <div className="jm-card p-4 md:p-5">
        <h2 className="jm-card-title mb-3">Visualizações por dia</h2>
        {t.periodViews === 0 ? (
          <p className="jm-empty py-10">Ainda não há visualizações registradas no período. Os dados diários começam a ser coletados a partir de agora.</p>
        ) : (
          <BarChart title="Visualizações por dia" data={chartData} series={[{ name: 'Visualizações', color: 'var(--jm-chart-1)' }]} format={nf} height={160} />
        )}
      </div>

      <div className="jm-table-wrap">
        <table className="jm-table min-w-[860px]">
          <thead>
            <tr>
              <th className="jm-th">Artigo</th>
              <th className="jm-th text-right">No período</th>
              <th className="jm-th text-right">Tendência</th>
              <th className="jm-th text-right">Total</th>
              <th className="jm-th text-right">Leads</th>
              <th className="jm-th text-right">Conversão</th>
              <th className="jm-th text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.articles.map((a) => (
              <tr key={a.id} className="jm-tr">
                <td className="jm-td">
                  <p className="max-w-[360px] truncate font-medium text-jm-fg">{a.title}</p>
                  <p className="text-[11px] text-jm-muted">
                    {a.category}
                    {a.publishedAt && a.status !== 'draft' ? ` · publicado em ${formatDate(a.publishedAt)}` : ` · ${a.status === 'draft' ? 'rascunho' : a.status}`}
                  </p>
                </td>
                <td className="jm-td text-right tabular-nums">{nf(a.periodViews)}</td>
                <td className={`jm-td text-right tabular-nums text-xs ${a.trend > 0 ? 'text-jm-success-fg' : a.trend < 0 ? 'text-jm-danger-fg' : 'text-jm-muted'}`}>
                  {a.previousViews > 0 || a.periodViews > 0 ? `${a.trend > 0 ? '+' : ''}${a.trend}%` : '—'}
                </td>
                <td className="jm-td text-right tabular-nums text-jm-fg2">{nf(a.totalViews)}</td>
                <td className="jm-td text-right tabular-nums">
                  {a.leads}
                  {a.wonLeads > 0 && <span className="ml-1 text-[11px] text-jm-success-fg">({a.wonLeads} ganho)</span>}
                </td>
                <td className="jm-td text-right tabular-nums">{a.periodViews ? `${a.conversion.toLocaleString('pt-BR')}%` : '—'}</td>
                <td className="jm-td">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onEditArticle(a.id)} className="jm-btn jm-btn-secondary jm-btn-sm">
                      Editar
                    </button>
                    {a.status !== 'draft' && (
                      <a href={`/blog/${a.slug}`} target="_blank" rel="noopener" className="jm-icon-btn h-8 w-8" title="Ver no site">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div className="jm-card px-4 py-3.5">
      <p className="jm-stat-label">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-jm-fg">{value}</p>
      {extra}
    </div>
  );
}
