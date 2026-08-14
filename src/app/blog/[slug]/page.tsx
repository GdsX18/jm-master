import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoredPosts, getPostBySlug } from "@/lib/blog-storage";
import { SinglePostView } from "@/components/blog/single-post-view";

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

  const metaTitle = post.seo?.metaTitle || `${post.title} | Blog JM MASTER GROUP`;
  const metaDescription = post.seo?.metaDescription || post.excerpt;
  const canonicalUrl = post.seo?.canonicalUrl || `https://jmmaster.com.br/blog/${post.slug}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: post.seo?.noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "article",
      locale: "pt_BR",
      url: canonicalUrl,
      images: [
        {
          url: post.coverImage,
          alt: post.coverImageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [post.coverImage],
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
    "headline": post.seo?.metaTitle || post.title,
    "description": post.seo?.metaDescription || post.excerpt,
    "image": post.coverImage,
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
      "@id": `https://jmmaster.com.br/blog/${post.slug}`,
    },
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
