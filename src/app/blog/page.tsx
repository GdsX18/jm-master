import type { Metadata } from "next";
import { BlogPageContent } from "@/components/blog/blog-page-content";

export const metadata: Metadata = {
  title: "Blog & Notícias | JM MASTER GROUP — Estratégias & Automação",
  description:
    "Artigos, novidades e tutoriais práticos sobre WhatsApp Business API Oficial, automações inteligentes de atendimento, IA conversacional e funis de vendas.",
  keywords: [
    "Blog JM Master Group",
    "WhatsApp API Oficial",
    "Chatbot IA",
    "Automação de Atendimento",
    "Marketing Conversacional",
    "SMS Marketing",
    "E-mail Marketing Estratégico",
    "CRM de Vendas",
  ],
  openGraph: {
    title: "Blog & Notícias | JM MASTER GROUP",
    description:
      "Aprenda como escalar seu negócio com automações avançadas, inteligência conversacional e API Oficial do WhatsApp.",
    type: "website",
    locale: "pt_BR",
    siteName: "JM MASTER GROUP",
  },
};

export default function BlogPage() {
  return <BlogPageContent />;
}
