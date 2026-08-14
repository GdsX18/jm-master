import prisma from './prisma';
import { BlogPost, BLOG_POSTS } from '@/data/posts';

function mapDbToBlogPost(dbPost: any): BlogPost {
  return {
    id: dbPost.id,
    slug: dbPost.slug,
    title: dbPost.title,
    excerpt: dbPost.excerpt,
    content: Array.isArray(dbPost.content) ? dbPost.content : [],
    contentHtml: dbPost.contentHtml || undefined,
    category: dbPost.category,
    date: dbPost.date || 'Hoje',
    readTime: dbPost.readTime || '4 min',
    coverImage: dbPost.coverImage,
    coverImageAlt: dbPost.coverImageAlt || dbPost.title,
    author: {
      name: dbPost.authorName || 'JM MASTER GROUP',
      role: dbPost.authorRole || 'Especialistas em Mensageria & IA',
      avatar: dbPost.authorAvatar || '/logos/Icone.png',
    },
    featured: dbPost.featured,
    status: (dbPost.status as 'draft' | 'published') || 'published',
    tags: Array.isArray(dbPost.tags) ? dbPost.tags : [],
    seo: dbPost.seo || undefined,
    faqs: Array.isArray(dbPost.faqs) ? dbPost.faqs : [],
  };
}

// Retorna todos os posts do Supabase PostgreSQL
export async function getStoredPosts(): Promise<BlogPost[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (posts && posts.length > 0) {
      return posts.map(mapDbToBlogPost);
    }
  } catch (err) {
    console.error('[BlogStorage] Erro ao buscar posts no Supabase:', err);
  }

  // Fallback para posts estáticos se banco não responder
  return BLOG_POSTS.map((p) => ({ ...p, status: 'published' as const }));
}

// Retorna um post específico pelo slug
export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (post) {
      return mapDbToBlogPost(post);
    }
  } catch (err) {
    console.error('[BlogStorage] Erro ao buscar post por slug no Supabase:', err);
  }

  return BLOG_POSTS.find((p) => p.slug === slug);
}

// Salva ou atualiza um post
export async function saveStoredPost(post: BlogPost): Promise<BlogPost | null> {
  try {
    const result = await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content as any,
        contentHtml: post.contentHtml || null,
        category: post.category,
        date: post.date,
        readTime: post.readTime,
        coverImage: post.coverImage,
        coverImageAlt: post.coverImageAlt,
        authorName: post.author?.name || 'JM MASTER GROUP',
        authorRole: post.author?.role || 'Especialistas em Mensageria & IA',
        authorAvatar: post.author?.avatar || '/logos/Icone.png',
        featured: !!post.featured,
        status: post.status || 'published',
        tags: post.tags as any,
        seo: (post.seo as any) || null,
        faqs: (post.faqs as any) || null,
      },
      create: {
        id: post.id || undefined,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content as any,
        contentHtml: post.contentHtml || null,
        category: post.category,
        date: post.date,
        readTime: post.readTime,
        coverImage: post.coverImage,
        coverImageAlt: post.coverImageAlt,
        authorName: post.author?.name || 'JM MASTER GROUP',
        authorRole: post.author?.role || 'Especialistas em Mensageria & IA',
        authorAvatar: post.author?.avatar || '/logos/Icone.png',
        featured: !!post.featured,
        status: post.status || 'published',
        tags: post.tags as any,
        seo: (post.seo as any) || null,
        faqs: (post.faqs as any) || null,
      },
    });

    return mapDbToBlogPost(result);
  } catch (err) {
    console.error('[BlogStorage] Erro ao salvar post no Supabase:', err);
    return null;
  }
}

// Exclui um post por ID ou slug
export async function deleteStoredPost(idOrSlug: string): Promise<boolean> {
  try {
    await prisma.blogPost.deleteMany({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    return true;
  } catch (err) {
    console.error('[BlogStorage] Erro ao excluir post no Supabase:', err);
    return false;
  }
}
