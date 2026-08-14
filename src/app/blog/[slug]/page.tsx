import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoredPosts, getPostBySlug } from "@/lib/blog-storage";
import { SinglePostView } from "@/components/blog/single-post-view";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getStoredPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Artigo não encontrado | JM MASTER GROUP",
    };
  }

  return {
    title: `${post.title} | Blog JM MASTER GROUP`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      locale: "pt_BR",
      images: [
        {
          url: post.coverImage,
          alt: post.coverImageAlt || post.title,
        },
      ],
    },
  };
}

export default async function SinglePostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <SinglePostView post={post} />;
}
