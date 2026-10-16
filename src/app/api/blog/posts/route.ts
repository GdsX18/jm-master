import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getStoredPosts, saveStoredPost, deleteStoredPost } from '@/lib/blog-storage';
import { BlogPost } from '@/data/posts';
import { DEFAULT_OG_IMAGE, resolvePostCanonical } from '@/lib/site';
import { actorOf, requirePermission } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const STATUS_LABEL: Record<string, string> = { draft: 'rascunho', published: 'publicado', scheduled: 'agendado' };

function revalidateBlog(slugs: (string | undefined | null)[]) {
  try {
    revalidatePath('/blog');
    revalidatePath('/blog/[slug]', 'page');
    for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/blog/${slug}`);
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
  } catch (revalidateErr) {
    console.warn('[BlogAPI] Aviso ao revalidar cache:', revalidateErr);
  }
}

export async function GET() {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    const posts = await getStoredPosts();
    return NextResponse.json(
      { success: true, posts },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('[BlogAPI GET Error]:', error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    // Suporta tanto { post: {...} } quanto { ...article } direto
    const postData = body.post || body;

    if (!postData || !postData.title || !postData.slug) {
      return NextResponse.json({ success: false, error: 'Título e slug são obrigatórios' }, { status: 400 });
    }

    // Normalizar e extrair SEO com segurança e fallbacks
    const rawSeo = postData.seo && typeof postData.seo === 'object' ? postData.seo : {};
    const seoTitle = rawSeo.metaTitle || rawSeo.seoTitle || postData.title;
    const seoDesc = rawSeo.metaDescription || rawSeo.seoDescription || postData.excerpt || '';

    let seoKeywords: string[] = [];
    if (Array.isArray(rawSeo.keywords)) {
      seoKeywords = rawSeo.keywords;
    } else if (typeof rawSeo.keywords === 'string' && rawSeo.keywords.trim()) {
      seoKeywords = rawSeo.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    } else if (Array.isArray(postData.tags) && postData.tags.length > 0) {
      seoKeywords = postData.tags;
    }

    const seoObject = {
      focusKeyphrase: rawSeo.focusKeyphrase || '',
      metaTitle: seoTitle,
      seoTitle: seoTitle,
      metaDescription: seoDesc,
      seoDescription: seoDesc,
      canonicalUrl: resolvePostCanonical(postData.slug, rawSeo.canonicalUrl),
      noIndex: !!rawSeo.noIndex,
      noFollow: !!rawSeo.noFollow,
      keywords: seoKeywords,
      ogTitle: rawSeo.ogTitle || seoTitle,
      ogDescription: rawSeo.ogDescription || seoDesc,
      ogImage: rawSeo.ogImage || postData.coverImage || DEFAULT_OG_IMAGE,
      twitterTitle: rawSeo.twitterTitle || rawSeo.ogTitle || seoTitle,
      twitterDescription: rawSeo.twitterDescription || rawSeo.ogDescription || seoDesc,
      twitterImage: rawSeo.twitterImage || rawSeo.ogImage || postData.coverImage || DEFAULT_OG_IMAGE,
    };

    const post: BlogPost = {
      id: postData.id || `post-${Date.now()}`,
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt || '',
      content: Array.isArray(postData.content) ? postData.content : [],
      contentHtml: postData.contentHtml || '',
      category: postData.category || 'WhatsApp API',
      coverImage: postData.coverImage || DEFAULT_OG_IMAGE,
      coverImageAlt: postData.coverImageAlt || postData.title,
      date:
        postData.date ||
        (postData.publishedAt
          ? new Date(postData.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Hoje'),
      readTime: postData.readTime || `${postData.readingTimeMinutes || 4} min`,
      author: {
        name: postData.author?.name || 'JM MASTER GROUP',
        role: postData.author?.role || 'Especialistas em Mensageria & IA',
        avatar: postData.author?.avatarUrl || postData.author?.avatar || '/logos/Icone.png',
      },
      featured: postData.featured ?? postData.isFeatured ?? false,
      status: postData.status === 'draft' ? 'draft' : postData.status === 'scheduled' ? 'scheduled' : 'published',
      publishedAt: postData.publishedAt || undefined,
      tags:
        Array.isArray(postData.tags) && postData.tags.length > 0
          ? postData.tags
          : seoKeywords.length > 0
            ? seoKeywords
            : [postData.category || 'Mensageria', 'JM Master'],
      seo: seoObject,
      faqs: Array.isArray(postData.faqs) ? postData.faqs : [],
    };

    const previous = postData.id
      ? await prisma.blogPost.findUnique({ where: { id: postData.id }, select: { status: true, slug: true } }).catch(() => null)
      : null;

    const savedPost = await saveStoredPost(post);
    if (!savedPost) {
      return NextResponse.json({ success: false, error: 'Falha ao salvar no banco de posts do Supabase' }, { status: 500 });
    }

    // Invalida o cache do blog para publicação e sincronização imediata
    revalidateBlog([savedPost.slug, postData.previousSlug, postData.slug, previous?.slug]);

    const statusChanged = previous && previous.status !== savedPost.status;
    await logAudit({
      actor: actorOf(auth),
      action: previous ? (statusChanged ? 'STATUS' : 'UPDATE') : 'CREATE',
      entity: 'post',
      entityId: savedPost.id,
      summary: previous
        ? `Artigo "${savedPost.title}" salvo como ${STATUS_LABEL[savedPost.status || 'published']}${
            statusChanged ? ` (antes: ${STATUS_LABEL[previous.status] || previous.status})` : ''
          }`
        : `Artigo "${savedPost.title}" criado como ${STATUS_LABEL[savedPost.status || 'published']}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Artigo salvo e sincronizado com sucesso!',
      post: savedPost,
    });
  } catch (error) {
    console.error('[BlogAPI POST Error]:', error);
    return NextResponse.json({ success: false, error: 'Erro ao processar publicação' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID ou slug do artigo é obrigatório' }, { status: 400 });
    }

    const target = await prisma.blogPost.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, slug: true, title: true },
    });

    const success = await deleteStoredPost(id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Erro ao excluir artigo do banco de dados' }, { status: 500 });
    }

    revalidateBlog([target?.slug]);

    if (target) {
      await logAudit({
        actor: actorOf(auth),
        action: 'DELETE',
        entity: 'post',
        entityId: target.id,
        summary: `Artigo "${target.title}" excluído`,
      });
    }

    return NextResponse.json({ success: true, message: 'Artigo removido com sucesso do site oficial!' });
  } catch (error) {
    console.error('[BlogAPI DELETE Error]:', error);
    return NextResponse.json({ success: false, error: 'Erro ao excluir artigo' }, { status: 500 });
  }
}
