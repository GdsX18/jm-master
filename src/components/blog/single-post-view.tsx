"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BlogPost, BLOG_POSTS } from "@/data/posts";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Share2,
  Check,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const WHATSAPP_NUMBER = "5521998567051";

interface SinglePostViewProps {
  post: BlogPost;
}

export const SinglePostView: React.FC<SinglePostViewProps> = ({ post }) => {
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0); // Primeira FAQ aberta por padrão
  const relatedPosts = BLOG_POSTS.filter((p) => p.id !== post.id).slice(0, 3);

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      const shareData = {
        title: post.seo?.metaTitle || post.title,
        text: post.seo?.metaDescription || post.excerpt,
        url: window.location.href,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          // Fallback para cópia
        }
      }

      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        const dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.value = window.location.href;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Olá! Estava lendo o artigo "${post.title}" no Blog da JM MASTER GROUP e gostaria de saber mais sobre as soluções.`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  const validFaqs = (post.faqs || []).filter(
    (f) => f.question && f.question.trim() && f.answer && f.answer.trim()
  );

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-slate-900 relative z-10 flex flex-col justify-between">
      {/* Navbar Oficial */}
      <Navbar />

      <article className="pt-28 sm:pt-36 md:pt-40 pb-16 sm:pb-24">
        {/* Glow Ambiente de Fundo */}
        <div className="ambient-orb-laranja top-10 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none" />

        <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1000px] mx-auto relative z-10 space-y-8 sm:space-y-12">
          
          {/* ========================================================
              1. NAVEGAÇÃO DE VOLTA & BADGES
             ======================================================== */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/blog"
              className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#E64F14] bg-white/90 border border-slate-200 shadow-2xs px-4 py-2 rounded-full transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 text-[#E64F14]" />
              <span>Voltar ao Blog</span>
            </Link>

            <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#E64F14]/10 text-[#E64F14] border border-[#E64F14]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{post.category}</span>
            </span>
          </div>

          {/* ========================================================
              2. CABEÇALHO DO ARTIGO (TÍTULO, METAS & AUTOR)
             ======================================================== */}
          <div className="space-y-6">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#082B61] tracking-tight leading-[1.2]">
              {post.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              {post.excerpt}
            </p>

            {/* Metadados e Autor Oficial JM MASTER */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-y border-slate-200/80 py-4">
              {/* Autor Oficial JM MASTER GROUP com Logo Oficial */}
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-white ring-2 ring-[#E64F14]/30 shadow-xs p-1.5 flex items-center justify-center shrink-0">
                  <Image
                    src={post.author.avatar || "/logos/Icone.png"}
                    alt={post.author.name}
                    width={40}
                    height={40}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div>
                  <p className="text-sm font-black text-[#082B61] leading-tight">
                    {post.author.name}
                  </p>
                  <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                    {post.author.role}
                  </p>
                </div>
              </div>

              {/* Data de Publicação e Tempo de Leitura */}
              <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-[#E64F14]" />
                  <span>{post.date}</span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-[#082B61]" />
                  <span>{post.readTime}</span>
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              3. IMAGEM DE CAPA PRINCIPAL DO ARTIGO
             ======================================================== */}
          <div className="relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80">
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1000px"
              className="object-cover"
            />
          </div>

          {/* ========================================================
              4. CONTEÚDO DO ARTIGO (SUPORTE A HTML RICO DO EDITOR)
             ======================================================== */}
          {post.contentHtml ? (
            <div
              className="blog-wysiwyg-rendered-content text-slate-800 leading-relaxed font-normal text-base sm:text-lg space-y-4"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
          ) : (
            <div className="space-y-6 text-slate-700 leading-relaxed font-normal text-base sm:text-lg">
              {post.content && post.content.length > 0 ? (
                post.content.map((paragraph, index) => (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="leading-relaxed">{post.excerpt}</p>
              )}
            </div>
          )}

          {/* ========================================================
              5. SEÇÃO DE PERGUNTAS FREQUENTES (FAQ ACCORDION)
             ======================================================== */}
          {validFaqs.length > 0 && (
            <section className="pt-8 sm:pt-12 border-t border-slate-200/80 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-[#E64F14]/10 text-[#E64F14] border border-[#E64F14]/20 shadow-2xs">
                  <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#082B61] tracking-tight">
                    Perguntas Frequentes sobre o Tema
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Tire as principais dúvidas técnicas e comerciais abordadas neste artigo
                  </p>
                </div>
              </div>

              {/* Accordion List */}
              <div className="space-y-3 pt-2">
                {validFaqs.map((faq, idx) => {
                  const isExpanded = openFaqIndex === idx;

                  return (
                    <div
                      key={faq.id || idx}
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-2xs ${
                        isExpanded
                          ? "bg-white border-[#E64F14]/40 ring-2 ring-[#E64F14]/10 shadow-md"
                          : "bg-white/80 hover:bg-white border-slate-200/90"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isExpanded ? null : idx)}
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                        aria-expanded={isExpanded}
                      >
                        <h3 className="text-sm sm:text-base font-extrabold text-[#082B61] leading-snug">
                          {faq.question}
                        </h3>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                            isExpanded
                              ? "bg-[#E64F14] text-white rotate-180"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 font-normal animate-fadeIn">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ========================================================
              6. TAGS E BOTÃO DE COMPARTILHAMENTO INTERATIVO
             ======================================================== */}
          <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1">
                Tags:
              </span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Botão de Compartilhar Artigo com Cópia de Link e Feedback Visual */}
            <button
              onClick={handleShare}
              className={`inline-flex items-center space-x-2 text-xs font-extrabold px-4 py-2 rounded-full border shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer ${
                copied
                  ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                  : "bg-white/90 hover:bg-white border-slate-200 text-[#082B61] hover:text-[#E64F14] hover:border-[#E64F14]/40"
              }`}
              title="Copiar link para enviar às pessoas"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
                  <span>Link Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#E64F14]" />
                  <span>Compartilhar Artigo</span>
                </>
              )}
            </button>
          </div>

          {/* ========================================================
              7. CARD CTA EXECUTIVO PARA O WHATSAPP (CLEAN GLASSMORPHISM)
             ======================================================== */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_15px_40px_rgba(8,43,97,0.06)] relative overflow-hidden mt-12">
            {/* Orbes de Iluminação Translúcidas Sutis */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#E64F14]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#082B61]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4 max-w-2xl">
              <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 text-[#082B61] text-[11px] font-black uppercase tracking-wider border border-slate-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>ATENDIMENTO OFICIAL JM MASTER GROUP</span>
              </span>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#082B61] tracking-tight leading-tight">
                Deseja implementar essa tecnologia no seu negócio?
              </h3>

              <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
                Nossos consultores estão prontos para desenhar a régua de automação ideal para sua empresa via WhatsApp API Oficial e IA Conversacional.
              </p>

              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#E64F14] via-[#F06228] to-[#C43E0A] hover:from-[#c43e0a] hover:to-[#E64F14] text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-lg shadow-[#E64F14]/25 hover:shadow-xl hover:shadow-[#E64F14]/35 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>Falar com o Time de Engenharia</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* ========================================================
              8. ARTIGOS RELACIONADOS
             ======================================================== */}
          <div className="pt-12 sm:pt-16 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-black text-[#082B61] tracking-tight">
                Outros Artigos Recomendados
              </h3>
              <Link
                href="/blog"
                className="text-xs font-bold text-[#E64F14] hover:underline flex items-center space-x-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md hover:border-[#E64F14]/40 transition-all space-y-3 block"
                >
                  <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-slate-100">
                    <Image
                      src={related.coverImage}
                      alt={related.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase text-[#E64F14]">
                    {related.category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#082B61] group-hover:text-[#E64F14] transition-colors line-clamp-2 leading-snug">
                    {related.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </article>

      {/* Footer Oficial com Gradiente */}
      <Footer />
    </main>
  );
};
