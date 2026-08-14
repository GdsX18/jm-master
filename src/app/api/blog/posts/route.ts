import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getStoredPosts, saveStoredPosts } from '@/lib/blog-storage';
import { BlogPost } from '@/data/posts';

export async function GET() {
  try {
    const posts = getStoredPosts();
    return NextResponse.json({ success: true, posts });
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
      date: postData.date || postData.publishedAt ? new Date(postData.publishedAt || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Hoje',
      readTime: postData.readTime || `${postData.readingTimeMinutes || 4} min`,
      author: {
        name: postData.author?.name || 'JM MASTER GROUP',
        role: postData.author?.role || 'Especialistas em Mensageria & IA',
        avatar: postData.author?.avatarUrl || postData.author?.avatar || '/logos/Icone.png',
      },
      featured: postData.featured ?? postData.isFeatured ?? false,
      status: postData.status === 'draft' ? 'draft' : 'published',
      tags: Array.isArray(postData.tags) ? postData.tags : [postData.category || 'Mensageria', 'JM Master'],
    };

    const currentPosts = getStoredPosts();
    const existingIndex = currentPosts.findIndex((p) => p.id === post.id || p.slug === post.slug);

    let updatedPosts: BlogPost[];
    if (existingIndex >= 0) {
      // Atualiza post existente
      updatedPosts = [...currentPosts];
      updatedPosts[existingIndex] = {
        ...updatedPosts[existingIndex],
        ...post,
      };
    } else {
      // Adiciona novo post no topo
      updatedPosts = [post, ...currentPosts];
    }

    const saved = saveStoredPosts(updatedPosts);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Falha ao salvar no banco de posts' },
        { status: 500 }
      );
    }

    // Invalida o cache do blog para publicação imediata
    try {
      revalidatePath('/blog');
      revalidatePath(`/blog/${post.slug}`);
      revalidatePath('/');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Artigo salvo e publicado no site oficial com sucesso!',
      post,
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

    const currentPosts = getStoredPosts();
    const postToDelete = currentPosts.find((p) => p.id === id || p.slug === id);
    const updatedPosts = currentPosts.filter((p) => p.id !== id && p.slug !== id);

    saveStoredPosts(updatedPosts);

    if (postToDelete) {
      try {
        revalidatePath('/blog');
        revalidatePath(`/blog/${postToDelete.slug}`);
      } catch {}
    }

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
