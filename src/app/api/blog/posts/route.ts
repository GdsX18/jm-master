import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getStoredPosts, saveStoredPost, deleteStoredPost } from '@/lib/blog-storage';
import { BlogPost } from '@/data/posts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const posts = await getStoredPosts();
    return NextResponse.json(
      { success: true, posts },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Suporta tanto { post: {...} } quanto { ...article } direto
    const postData = body.post || body;

    if (!postData || !postData.title || !postData.slug) {
      return NextResponse.json(
        { success: false, error: 'Título e slug são obrigatórios' },
        { status: 400 }
      );
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
      canonicalUrl: rawSeo.canonicalUrl || `https://jmmaster.com.br/blog/${postData.slug}`,
      noIndex: !!rawSeo.noIndex,
      noFollow: !!rawSeo.noFollow,
      keywords: seoKeywords,
      ogTitle: rawSeo.ogTitle || seoTitle,
      ogDescription: rawSeo.ogDescription || seoDesc,
      ogImage: rawSeo.ogImage || postData.coverImage || '/images/blog/whatsapp-thumb.jpg',
      twitterTitle: rawSeo.twitterTitle || rawSeo.ogTitle || seoTitle,
      twitterDescription: rawSeo.twitterDescription || rawSeo.ogDescription || seoDesc,
      twitterImage: rawSeo.twitterImage || rawSeo.ogImage || postData.coverImage || '/images/blog/whatsapp-thumb.jpg',
    };

    const post: BlogPost = {
      id: postData.id || `post-${Date.now()}`,
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt || '',
      content: Array.isArray(postData.content) ? postData.content : [],
      contentHtml: postData.contentHtml || '',
      category: postData.category || 'WhatsApp API',
      coverImage: postData.coverImage || '/images/blog/whatsapp-thumb.jpg',
      coverImageAlt: postData.coverImageAlt || postData.title,
      date: postData.date || (postData.publishedAt ? new Date(postData.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Hoje'),
      readTime: postData.readTime || `${postData.readingTimeMinutes || 4} min`,
      author: {
        name: postData.author?.name || 'JM MASTER GROUP',
        role: postData.author?.role || 'Especialistas em Mensageria & IA',
        avatar: postData.author?.avatarUrl || postData.author?.avatar || '/logos/Icone.png',
      },
      featured: postData.featured ?? postData.isFeatured ?? false,
      status: postData.status === 'draft' ? 'draft' : postData.status === 'scheduled' ? 'draft' : 'published',
      tags: Array.isArray(postData.tags) && postData.tags.length > 0 ? postData.tags : (seoKeywords.length > 0 ? seoKeywords : [postData.category || 'Mensageria', 'JM Master']),
      seo: seoObject,
      faqs: Array.isArray(postData.faqs) ? postData.faqs : [],
    };

    const savedPost = await saveStoredPost(post);
    if (!savedPost) {
      return NextResponse.json(
        { success: false, error: 'Falha ao salvar no banco de posts do Supabase' },
        { status: 500 }
      );
    }

    const updatedPosts = await getStoredPosts();

    // Invalida o cache do blog para publicação e sincronização imediata
    try {
      revalidatePath('/blog');
      revalidatePath('/blog/[slug]', 'page');
      revalidatePath(`/blog/${savedPost.slug}`);
      if (postData.previousSlug && postData.previousSlug !== savedPost.slug) {
        revalidatePath(`/blog/${postData.previousSlug}`);
      }
      if (postData.slug && postData.slug !== savedPost.slug) {
        revalidatePath(`/blog/${postData.slug}`);
      }
      revalidatePath('/');
    } catch (revalidateErr) {
      console.warn('[BlogAPI] Aviso ao revalidar cache:', revalidateErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Artigo salvo e sincronizado com sucesso!',
      post: savedPost,
      posts: updatedPosts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar publicação' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID ou slug do artigo é obrigatório' },
        { status: 400 }
      );
    }

    const success = await deleteStoredPost(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir artigo do banco de dados' },
        { status: 500 }
      );
    }

    try {
      revalidatePath('/blog');
      revalidatePath('/blog/[slug]', 'page');
      revalidatePath(`/blog/${id}`);
      revalidatePath('/');
    } catch {}

    const updatedPosts = await getStoredPosts();

    return NextResponse.json({
      success: true,
      message: 'Artigo removido com sucesso do site oficial!',
      posts: updatedPosts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir artigo' },
      { status: 500 }
    );
  }
}
