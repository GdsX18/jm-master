import type { Metadata } from "next";
import { BlogPageContent } from "@/components/blog/blog-page-content";
import { getPublishedPosts } from "@/lib/blog-storage";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

// ISR: o painel chama revalidatePath('/blog') ao salvar; o intervalo é só uma rede de segurança
export const revalidate = 300; // 5 min: posts agendados entram no ar perto do horário

export const metadata: Metadata = {
  title: "Blog & Notícias | JM MASTER GROUP — Estratégias & Automação",
  description:
    "Artigos, novidades e tutoriais práticos sobre WhatsApp Business API Oficial, automações de atendimento, chatbots e funis de vendas.",
  keywords: [
    "Blog JM Master Group",
    "WhatsApp API Oficial",
    "Chatbot",
    "Automação de Atendimento",
    "Marketing Conversacional",
    "SMS Marketing",
    "E-mail Marketing Estratégico",
    "CRM de Vendas",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog & Notícias | JM MASTER GROUP",
    description:
      "Aprenda como escalar seu negócio com automações avançadas, chatbots de atendimento e API Oficial do WhatsApp.",
    type: "website",
    locale: "pt_BR",
    siteName: "JM MASTER GROUP",
    url: "/blog",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Blog JM MASTER GROUP" }],
  },
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return <BlogPageContent initialPosts={posts} />;
}
