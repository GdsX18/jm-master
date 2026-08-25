import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoredPosts, getPostBySlug } from "@/lib/blog-storage";
import { SinglePostView } from "@/components/blog/single-post-view";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getStoredPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Artigo não encontrado | JM MASTER GROUP",
    };
  }

  const rawSeo = post.seo && typeof post.seo === 'object' ? post.seo : {};
  const metaTitle = (rawSeo.metaTitle || rawSeo.seoTitle || post.title || '').trim() || `${post.title} | Blog JM MASTER GROUP`;
  const metaDescription = (rawSeo.metaDescription || rawSeo.seoDescription || post.excerpt || '').trim() || post.excerpt;
  const canonicalUrl = (rawSeo.canonicalUrl || '').trim() || `https://jmmaster.com.br/blog/${post.slug}`;
  const ogTitle = (rawSeo.ogTitle || metaTitle || post.title).trim();
  const ogDescription = (rawSeo.ogDescription || metaDescription || post.excerpt).trim();
  const ogImage = rawSeo.ogImage || post.coverImage || "/images/blog/whatsapp-thumb.jpg";
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
      creator: "@jmmastergroup",
    },
  };
}

export default async function SinglePostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

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
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.seo?.metaTitle || post.seo?.seoTitle || post.title,
    "description": post.seo?.metaDescription || post.seo?.seoDescription || post.excerpt,
    "image": post.seo?.ogImage || post.coverImage,
    "datePublished": post.publishedAt || undefined,
    "author": {
      "@type": "Organization",
      "name": post.author?.name || "JM MASTER GROUP",
      "logo": "https://jmmaster.com.br/logos/Icone.png",
    },
    "publisher": {
      "@type": "Organization",
      "name": "JM MASTER GROUP",
      "logo": {
        "@type": "ImageObject",
        "url": "https://jmmaster.com.br/logos/Icone.png",
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": post.seo?.canonicalUrl || `https://jmmaster.com.br/blog/${post.slug}`,
    },
    "keywords": Array.isArray(post.seo?.keywords)
      ? post.seo.keywords.join(', ')
      : typeof post.seo?.keywords === 'string'
      ? post.seo.keywords
      : post.tags.join(', '),
  };

  return (
    <>
      {/* Injeção de Structured Data Schema.org para o Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <SinglePostView post={post} />
    </>
  );
}
