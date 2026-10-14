import prisma from './prisma';
import { BlogPost, SEOData } from '@/data/posts';
import { DEFAULT_OG_IMAGE, resolvePostCanonical } from './site';

function toIsoString(value: unknown): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// Publicado = status "published", ou "scheduled" cuja data de publicação já chegou
export function isPublished(post: BlogPost, now = Date.now()) {
  const status = post.status || 'published';
  if (status === 'published') return true;
  if (status === 'scheduled' && post.publishedAt) return new Date(post.publishedAt).getTime() <= now;
  return false;
}

// Data de publicação a gravar:
// - agendado: a data escolhida;
// - primeira publicação (vindo de rascunho/novo): agora;
// - já publicado: mantém a data original;
// - rascunho: não altera.
function resolvePublishedAt(
  post: BlogPost,
  existing?: { status: string; publishedAt: Date | null }
): Date | null | undefined {
  if (post.status === 'scheduled') {
    const requested = post.publishedAt ? new Date(post.publishedAt) : null;
    return requested && !Number.isNaN(requested.getTime()) ? requested : null;
  }
  if (post.status === 'published') {
    const alreadyLive =
      existing?.publishedAt &&
      (existing.status === 'published' || (existing.status === 'scheduled' && existing.publishedAt <= new Date()));
    if (alreadyLive) return existing!.publishedAt;
    return new Date();
  }
  return undefined;
}

function mapDbToBlogPost(dbPost: any): BlogPost {
  const rawSeo = dbPost.seo && typeof dbPost.seo === 'object' ? dbPost.seo : {};
  
  const seoData: SEOData = {
    focusKeyphrase: rawSeo.focusKeyphrase || '',
    metaTitle: rawSeo.metaTitle || rawSeo.seoTitle || dbPost.title,
    seoTitle: rawSeo.seoTitle || rawSeo.metaTitle || dbPost.title,
    metaDescription: rawSeo.metaDescription || rawSeo.seoDescription || dbPost.excerpt,
    seoDescription: rawSeo.seoDescription || rawSeo.metaDescription || dbPost.excerpt,
    canonicalUrl: resolvePostCanonical(dbPost.slug, rawSeo.canonicalUrl),
    noIndex: !!rawSeo.noIndex,
    noFollow: !!rawSeo.noFollow,
    keywords: Array.isArray(rawSeo.keywords)
      ? rawSeo.keywords
      : typeof rawSeo.keywords === 'string' && rawSeo.keywords.trim()
      ? rawSeo.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : Array.isArray(dbPost.tags)
      ? dbPost.tags
      : [],
    ogTitle: rawSeo.ogTitle || rawSeo.metaTitle || rawSeo.seoTitle || dbPost.title,
    ogDescription: rawSeo.ogDescription || rawSeo.metaDescription || rawSeo.seoDescription || dbPost.excerpt,
    ogImage: rawSeo.ogImage || dbPost.coverImage || DEFAULT_OG_IMAGE,
    twitterTitle: rawSeo.twitterTitle || rawSeo.ogTitle || rawSeo.metaTitle || dbPost.title,
    twitterDescription: rawSeo.twitterDescription || rawSeo.ogDescription || rawSeo.metaDescription || dbPost.excerpt,
    twitterImage: rawSeo.twitterImage || rawSeo.ogImage || dbPost.coverImage || DEFAULT_OG_IMAGE,
  };

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
    status: (dbPost.status as 'draft' | 'published' | 'scheduled') || 'published',
    tags: Array.isArray(dbPost.tags) ? dbPost.tags : [],
    seo: seoData,
    faqs: Array.isArray(dbPost.faqs) ? dbPost.faqs : [],
    views: dbPost.views,
    publishedAt: toIsoString(dbPost.publishedAt) || toIsoString(dbPost.createdAt),
    createdAt: toIsoString(dbPost.createdAt),
    updatedAt: toIsoString(dbPost.updatedAt),
  };
}

// Retorna todos os posts (painel). Erros de banco são propagados: a página em cache continua no ar
// em vez de o site/painel exibirem uma lista vazia como se fosse real.
export async function getStoredPosts(): Promise<BlogPost[]> {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return posts.map(mapDbToBlogPost);
}

// Apenas posts publicados — destaques primeiro, depois os mais recentes (site público e sitemap)
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = (await getStoredPosts()).filter((p) => isPublished(p));
  return posts.sort((a, b) => {
    if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
    return (b.publishedAt || '').localeCompare(a.publishedAt || '');
  });
}

// Post publicado pelo slug — rascunhos retornam undefined (404 no site)
export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const post = await getPostBySlug(slug);
  return post && isPublished(post) ? post : undefined;
}

// Retorna um post específico pelo slug
export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });
  return post ? mapDbToBlogPost(post) : undefined;
}

// Salva ou atualiza um post
export async function saveStoredPost(post: BlogPost): Promise<BlogPost | null> {
  try {
    let existingPost = null;

    // 1. Tentar encontrar por ID (identificador primário imutável)
    if (post.id) {
      existingPost = await prisma.blogPost.findUnique({
        where: { id: post.id },
      });
    }

    // 2. Se não encontrou por ID, tentar por Slug
    if (!existingPost && post.slug) {
      existingPost = await prisma.blogPost.findUnique({
        where: { slug: post.slug },
      });
    }

    let targetSlug = post.slug;

    // Se já existe um post no banco
    if (existingPost) {
      // Se o slug mudou, verificar se o novo slug já está sendo usado por OUTRO post
      if (targetSlug !== existingPost.slug) {
        const slugConflict = await prisma.blogPost.findFirst({
          where: {
            slug: targetSlug,
            NOT: { id: existingPost.id },
          },
        });
        if (slugConflict) {
          targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
        }
      }

      const updated = await prisma.blogPost.update({
        where: { id: existingPost.id },
        data: {
          slug: targetSlug,
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
          publishedAt: resolvePublishedAt(post, existingPost),
          tags: post.tags as any,
          seo: (post.seo as any) || null,
          faqs: (post.faqs as any) || null,
        },
      });

      return mapDbToBlogPost(updated);
    }

    // Caso seja um novo post:
    // Verificar se o slug já existe
    const existingSlug = await prisma.blogPost.findUnique({
      where: { slug: targetSlug },
    });
    if (existingSlug) {
      targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Se o ID informado já existe por algum motivo, deixa o Prisma gerar um novo cuid()
    let postDataId: string | undefined = undefined;
    if (post.id && !post.id.startsWith('post-')) {
      const idConflict = await prisma.blogPost.findUnique({
        where: { id: post.id },
      });
      if (!idConflict) {
        postDataId = post.id;
      }
    }

    const created = await prisma.blogPost.create({
      data: {
        id: postDataId,
        slug: targetSlug,
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
        publishedAt: resolvePublishedAt(post) ?? null,
        tags: post.tags as any,
        seo: (post.seo as any) || null,
        faqs: (post.faqs as any) || null,
      },
    });

    return mapDbToBlogPost(created);
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
