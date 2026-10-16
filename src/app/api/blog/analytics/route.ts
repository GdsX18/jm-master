import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';
import { brazilToday } from '@/lib/dates';

export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

// Extrai o slug do artigo de uma URL/caminho de origem do lead ("/blog/slug?utm=..." ou URL completa)
function slugFromPage(page: string | null): string | null {
  if (!page) return null;
  const match = page.match(/\/blog\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// GET /api/blog/analytics?days=30 - Desempenho do blog: visualizações por dia, por artigo e leads gerados
export async function GET(req: NextRequest) {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    const days = Math.min(365, Math.max(7, parseInt(new URL(req.url).searchParams.get('days') || '30', 10) || 30));
    const today = new Date(`${brazilToday()}T00:00:00.000Z`);
    const start = new Date(today.getTime() - (days - 1) * DAY_MS);
    const prevStart = new Date(start.getTime() - days * DAY_MS);

    const [posts, dailyRows, prevRows, leads] = await Promise.all([
      prisma.blogPost.findMany({
        select: { id: true, slug: true, title: true, status: true, views: true, publishedAt: true, category: true },
      }),
      prisma.blogPostView.findMany({ where: { day: { gte: start } }, select: { postId: true, day: true, views: true } }),
      prisma.blogPostView.groupBy({ by: ['postId'], where: { day: { gte: prevStart, lt: start } }, _sum: { views: true } }),
      // Leads cujo formulário foi enviado a partir de um artigo (página de origem /blog/...)
      prisma.lead.findMany({
        where: { sourcePage: { contains: '/blog/' }, createdAt: { gte: start } },
        select: { sourcePage: true, stage: true },
      }),
    ]);

    // Série diária (todos os artigos)
    const series: { day: string; views: number }[] = [];
    const byDay = new Map<string, number>();
    for (const row of dailyRows) {
      const key = row.day.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + row.views);
    }
    for (let t = start.getTime(); t <= today.getTime(); t += DAY_MS) {
      const key = new Date(t).toISOString().slice(0, 10);
      series.push({ day: key, views: byDay.get(key) || 0 });
    }

    const periodByPost = new Map<string, number>();
    for (const row of dailyRows) periodByPost.set(row.postId, (periodByPost.get(row.postId) || 0) + row.views);
    const prevByPost = new Map(prevRows.map((r) => [r.postId, r._sum.views || 0]));

    const leadsBySlug = new Map<string, { total: number; won: number }>();
    for (const lead of leads) {
      const slug = slugFromPage(lead.sourcePage);
      if (!slug) continue;
      const entry = leadsBySlug.get(slug) || { total: 0, won: 0 };
      entry.total += 1;
      if (lead.stage === 'GANHO') entry.won += 1;
      leadsBySlug.set(slug, entry);
    }

    const articles = posts
      .map((p) => {
        const periodViews = periodByPost.get(p.id) || 0;
        const previousViews = prevByPost.get(p.id) || 0;
        const postLeads = leadsBySlug.get(p.slug) || { total: 0, won: 0 };
        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          category: p.category,
          status: p.status,
          publishedAt: p.publishedAt?.toISOString() || null,
          totalViews: p.views,
          periodViews,
          previousViews,
          trend: previousViews > 0 ? Math.round(((periodViews - previousViews) / previousViews) * 100) : periodViews > 0 ? 100 : 0,
          leads: postLeads.total,
          wonLeads: postLeads.won,
          conversion: periodViews > 0 ? Math.round((postLeads.total / periodViews) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.periodViews - a.periodViews || b.totalViews - a.totalViews);

    const periodViews = series.reduce((s, d) => s + d.views, 0);
    const previousViews = prevRows.reduce((s, r) => s + (r._sum.views || 0), 0);

    return NextResponse.json({
      success: true,
      days,
      series,
      articles,
      totals: {
        periodViews,
        previousViews,
        trend: previousViews > 0 ? Math.round(((periodViews - previousViews) / previousViews) * 100) : 0,
        allTimeViews: posts.reduce((s, p) => s + p.views, 0),
        leads: leads.length,
        conversion: periodViews > 0 ? Math.round((leads.length / periodViews) * 1000) / 10 : 0,
      },
    });
  } catch (error) {
    console.error('[API Blog Analytics Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar o desempenho do blog' }, { status: 500 });
  }
}
