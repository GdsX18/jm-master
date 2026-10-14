import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/blog/views { slug } — rota pública (liberada no middleware): conta uma visualização
// do artigo publicado. O navegador só chama uma vez por sessão para cada artigo.
export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (typeof slug !== 'string' || !slug || slug.length > 200) {
      return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
    }

    // Ignora robôs conhecidos
    const ua = req.headers.get('user-agent') || '';
    if (/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp/i.test(ua)) {
      return NextResponse.json({ success: true, counted: false });
    }

    const result = await prisma.blogPost.updateMany({
      where: { slug, status: { in: ['published', 'scheduled'] } },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ success: true, counted: result.count > 0 });
  } catch (error) {
    console.error('[API Blog Views Error]:', error);
    return NextResponse.json({ error: 'Erro ao registrar visualização' }, { status: 500 });
  }
}
