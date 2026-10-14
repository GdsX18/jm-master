import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog-storage";
import { SERVICES } from "@/data/services";
import { SITE_URL, resolvePostCanonical } from "@/lib/site";

// Regenerado quando um post é salvo (revalidatePath('/sitemap.xml')) ou a cada hora
export const revalidate = 300; // 5 min: posts agendados entram no ar perto do horário

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();

  const latestPostDate = posts
    .map((post) => post.updatedAt || post.publishedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...SERVICES.map((service) => ({
      url: `${SITE_URL}/solucoes/${service.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    {
      url: `${SITE_URL}/blog`,
      lastModified: latestPostDate ? new Date(latestPostDate) : undefined,
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${SITE_URL}/politica-de-privacidade`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts
    .filter((post) => !post.seo?.noIndex)
    // Posts com canonical apontando para outra URL não devem entrar no sitemap
    .filter((post) => resolvePostCanonical(post.slug, post.seo?.canonicalUrl) === `${SITE_URL}/blog/${post.slug}`)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt ? new Date((post.updatedAt || post.publishedAt)!) : undefined,
      changeFrequency: "monthly",
      priority: 0.7,
      images: post.coverImage && /^https?:\/\//.test(post.coverImage) ? [post.coverImage] : undefined,
    }));

  return [...staticRoutes, ...postRoutes];
}
