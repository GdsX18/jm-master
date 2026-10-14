import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { MetodologiaSection } from "@/components/metodologia-section";
import { SolucoesSection } from "@/components/solucoes-section";
import { ClientesSection } from "@/components/clientes-section";
import { ContatoSection } from "@/components/contato-section";
import { Footer } from "@/components/footer";
import { SERVICES } from "@/data/services";
import {
  CITY,
  CONTACT_EMAIL,
  LEGAL_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
  STATE,
  WHATSAPP_NUMBER,
  absoluteUrl,
  jsonLd,
} from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const sameAs = Object.values(SOCIAL_LINKS).filter(Boolean);

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    ...(LEGAL_NAME ? { legalName: LEGAL_NAME } : {}),
    url: SITE_URL,
    logo: absoluteUrl("/logos/Icone.png"),
    description: SITE_DESCRIPTION,
    email: CONTACT_EMAIL,
    telephone: `+${WHATSAPP_NUMBER}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: CITY,
      addressRegion: STATE,
      addressCountry: "BR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+${WHATSAPP_NUMBER}`,
      contactType: "sales",
      areaServed: "BR",
      availableLanguage: "Portuguese",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    makesOffer: SERVICES.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        url: absoluteUrl(`/solucoes/${service.slug}`),
      },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "pt-BR",
    publisher: { "@id": `${SITE_URL}/#organization` },
  },
];

export default function Home() {
  return (
    <main className="min-h-screen relative z-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <Navbar />
      <HeroSection />
      <MetodologiaSection />
      <SolucoesSection />
      {/* Depoimentos removidos até termos depoimentos reais e autorizados (ver depoimentos-section.tsx) */}
      <ClientesSection />
      <ContatoSection />
      <Footer />
    </main>
  );
}
