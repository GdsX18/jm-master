import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPosts, getPublishedPostBySlug } from "@/lib/blog-storage";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, absoluteUrl, jsonLd, resolvePostCanonical } from "@/lib/site";
import { SinglePostView } from "@/components/blog/single-post-view";

// ISR: o painel chama revalidatePath ao salvar/excluir; slugs novos são gerados sob demanda
export const revalidate = 300; // 5 min: posts agendados entram no ar perto do horário

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: "Artigo não encontrado | JM MASTER GROUP",
    };
  }

  const rawSeo = post.seo && typeof post.seo === 'object' ? post.seo : {};
  const metaTitle = (rawSeo.metaTitle || rawSeo.seoTitle || post.title || '').trim() || `${post.title} | Blog JM MASTER GROUP`;
  const metaDescription = (rawSeo.metaDescription || rawSeo.seoDescription || post.excerpt || '').trim() || post.excerpt;
  const canonicalUrl = resolvePostCanonical(post.slug, rawSeo.canonicalUrl);
  const ogTitle = (rawSeo.ogTitle || metaTitle || post.title).trim();
  const ogDescription = (rawSeo.ogDescription || metaDescription || post.excerpt).trim();
  const ogImage = rawSeo.ogImage || post.coverImage || DEFAULT_OG_IMAGE;
  const twitterTitle = (rawSeo.twitterTitle || ogTitle || metaTitle).trim();
  const twitterDescription = (rawSeo.twitterDescription || ogDescription || metaDescription).trim();
  const twitterImage = rawSeo.twitterImage || ogImage;

  let keywords: string[] = [];
  if (Array.isArray(rawSeo.keywords)) {
    keywords = rawSeo.keywords;
  } else if (typeof rawSeo.keywords === 'string' && rawSeo.keywords.trim()) {
    keywords = rawSeo.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
  } else if (Array.isArray(post.tags) && post.tags.length > 0) {
    keywords = post.tags;
  }

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords.length > 0 ? keywords : [post.category, "WhatsApp API", "JM Master Group"],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !rawSeo.noIndex,
      follow: !rawSeo.noFollow,
      nocache: false,
      googleBot: {
        index: !rawSeo.noIndex,
        follow: !rawSeo.noFollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "article",
      locale: "pt_BR",
      url: canonicalUrl,
      siteName: "JM MASTER GROUP",
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      authors: [post.author?.name || "JM MASTER GROUP"],
      tags: keywords,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.coverImageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: twitterTitle,
      description: twitterDescription,
      images: [twitterImage],
    },
  };
}

export default async function SinglePostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Relacionados reais: mesma categoria primeiro, completando com os mais recentes
  const others = (await getPublishedPosts()).filter((p) => p.id !== post.id);
  const relatedPosts = [
    ...others.filter((p) => p.category === post.category),
    ...others.filter((p) => p.category !== post.category),
  ].slice(0, 3);

  // Schema estruturado JSON-LD FAQPage (quando houver perguntas cadastradas)
  const validFaqs = (post.faqs || []).filter(
    (f) => f.question && f.question.trim() && f.answer && f.answer.trim()
  );

  const faqJsonLd = validFaqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": validFaqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  } : null;

  // Schema estruturado Article / BlogPosting
  const postUrl = resolvePostCanonical(post.slug, post.seo?.canonicalUrl);
  const logoUrl = absoluteUrl("/logos/Icone.png");
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.seo?.metaDescription || post.seo?.seoDescription || post.excerpt,
    "image": absoluteUrl(post.seo?.ogImage || post.coverImage || DEFAULT_OG_IMAGE),
    "datePublished": post.publishedAt || undefined,
    "dateModified": post.updatedAt || post.publishedAt || undefined,
    "inLanguage": "pt-BR",
    "articleSection": post.category,
    "author": {
      "@type": "Organization",
      "name": post.author?.name || SITE_NAME,
      "url": SITE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "logo": {
        "@type": "ImageObject",
        "url": logoUrl,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl,
    },
    "keywords": Array.isArray(post.seo?.keywords)
      ? post.seo.keywords.join(', ')
      : typeof post.seo?.keywords === 'string'
      ? post.seo.keywords
      : post.tags.join(', '),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Início", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": absoluteUrl("/blog") },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": postUrl },
    ],
  };

  return (
    <>
      {/* Injeção de Structured Data Schema.org para o Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }}
        />
      )}
      <SinglePostView post={post} relatedPosts={relatedPosts} />
    </>
  );
}
