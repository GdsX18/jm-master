import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ChevronRight, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ContatoSection } from "@/components/contato-section";
import { SERVICES, getServiceBySlug } from "@/data/services";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, absoluteUrl, jsonLd, whatsappUrl } from "@/lib/site";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};

  const path = `/solucoes/${service.slug}`;
  return {
    title: service.metaTitle,
    description: service.metaDescription,
    keywords: service.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: service.metaTitle,
      description: service.metaDescription,
      url: path,
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: service.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: service.metaTitle,
      description: service.metaDescription,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const pageUrl = absoluteUrl(`/solucoes/${service.slug}`);
  const ctaUrl = whatsappUrl(service.whatsappMessage);
  const otherServices = SERVICES.filter((s) => s.slug !== service.slug);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.name,
      serviceType: service.name,
      description: service.metaDescription,
      url: pageUrl,
      areaServed: { "@type": "Country", name: "Brasil" },
      provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: service.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Soluções", item: absoluteUrl("/#solucoes") },
        { "@type": "ListItem", position: 3, name: service.name, item: pageUrl },
      ],
    },
  ];

  return (
    <main className="min-h-screen relative z-10 bg-slate-50/60">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 sm:pt-36 pb-14 sm:pb-20 overflow-hidden">
        <div className="ambient-orb-laranja top-10 left-0 opacity-30" />
        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1100px] mx-auto relative z-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-500 mb-6">
            <Link href="/" className="hover:text-[#E64F14]">Início</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/#solucoes" className="hover:text-[#E64F14]">Soluções</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-semibold">{service.name}</span>
          </nav>

          <span className="inline-block text-[10px] sm:text-xs font-black tracking-widest text-[#E64F14] uppercase px-3.5 py-1.5 rounded-full bg-[#E64F14]/10 border border-[#E64F14]/20">
            {service.eyebrow}
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl md:text-6xl font-black text-[#082B61] tracking-tight leading-[1.05]">
            {service.h1}
          </h1>
          <div className="mt-6 space-y-4 max-w-3xl">
            {service.intro.map((paragraph) => (
              <p key={paragraph} className="text-sm sm:text-lg text-slate-600 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#E64F14] text-white font-bold text-sm hover:bg-[#cf4510] transition-colors shadow-lg shadow-orange-900/20"
            >
              <MessageCircle className="w-4 h-4" />
              Falar com um especialista
            </a>
            <a
              href="#contato-form"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-slate-300 text-[#082B61] font-bold text-sm hover:bg-white transition-colors"
            >
              Solicitar proposta
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-14 sm:py-20 bg-white border-y border-slate-200/80">
        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1100px] mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black text-[#082B61] tracking-tight">
            O que a sua empresa ganha
          </h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {service.benefits.map((benefit) => (
              <div key={benefit.title} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60">
                <h3 className="text-base sm:text-lg font-bold text-[#082B61]">{benefit.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Casos de uso + Como funciona */}
      <section className="py-14 sm:py-20">
        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#082B61] tracking-tight">Onde aplicar</h2>
            <ul className="mt-6 space-y-3">
              {service.useCases.map((useCase) => (
                <li key={useCase} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-[#E64F14] shrink-0 mt-0.5" />
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#082B61] tracking-tight">Como trabalhamos</h2>
            <ol className="mt-6 space-y-5">
              {service.steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="w-8 h-8 shrink-0 rounded-full bg-[#082B61] text-white text-sm font-black flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-[#082B61]">{step.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 sm:py-20 bg-white border-y border-slate-200/80">
        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[900px] mx-auto">
          <h2 className="text-2xl sm:text-4xl font-black text-[#082B61] tracking-tight">Perguntas frequentes</h2>
          <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {service.faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-bold text-[#082B61] text-sm sm:text-base">
                  {faq.question}
                  <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Outras soluções */}
      <section className="py-14 sm:py-20">
        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1100px] mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-[#082B61] tracking-tight">Conheça também</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherServices.map((other) => (
              <Link
                key={other.slug}
                href={`/solucoes/${other.slug}`}
                className="group p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#E64F14]/50 transition-colors"
              >
                <span className="text-[10px] font-black tracking-widest text-[#E64F14] uppercase">{other.eyebrow}</span>
                <p className="mt-1 font-bold text-[#082B61] flex items-center justify-between gap-2">
                  {other.name}
                  <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ContatoSection defaultInterest={service.name} />
      <Footer />
    </main>
  );
}
