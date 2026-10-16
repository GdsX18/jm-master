import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { brazilToday } from '@/lib/dates';

// POST /api/blog/views { slug } — rota pública (liberada no middleware): conta uma visualização
// do artigo publicado (total + por dia). O navegador só chama uma vez por sessão para cada artigo.
export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (typeof slug !== 'string' || !slug || slug.length > 200) {
      return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
    }

    // Ignora robôs conhecidos
    const ua = req.headers.get('user-agent') || '';
    if (!ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i.test(ua)) {
      return NextResponse.json({ success: true, counted: false });
    }

    // Só artigos no ar (publicados, ou agendados cuja data já chegou)
    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        OR: [{ status: 'published' }, { status: 'scheduled', publishedAt: { lte: new Date() } }],
      },
      select: { id: true },
    });
    if (!post) return NextResponse.json({ success: true, counted: false });

    const day = new Date(`${brazilToday()}T00:00:00.000Z`);
    await prisma.$transaction([
      prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }),
      prisma.blogPostView.upsert({
        where: { postId_day: { postId: post.id, day } },
        update: { views: { increment: 1 } },
        create: { postId: post.id, day, views: 1 },
      }),
    ]);
    return NextResponse.json({ success: true, counted: true });
  } catch (error) {
    console.error('[API Blog Views Error]:', error);
    return NextResponse.json({ error: 'Erro ao registrar visualização' }, { status: 500 });
  }
}
