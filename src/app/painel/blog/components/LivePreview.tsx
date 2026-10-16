'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Article, PreviewDevice, PreviewTab } from '../types';
import { sanitizeArticleHtml } from '@/lib/sanitize';

interface LivePreviewProps {
  article: Article;
}

export default function LivePreview({ article }: LivePreviewProps) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [tab, setTab] = useState<PreviewTab>('full_post');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Rascunho não publicado';

  const validFaqs = (article.faqs || []).filter(
    (f) => f.question && f.question.trim() && f.answer && f.answer.trim()
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[6px] border border-jm-border bg-jm-subtle">
      
      {/* BARRA DE CONTROLE DO PREVIEW */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-jm-border bg-jm-surface px-3 py-2">
        
        {/* ABAS: CARD DO FEED vs PÁGINA COMPLETA */}
        <div className="jm-segmented">
          <button
            type="button"
            onClick={() => setTab('full_post')}
            className={`jm-segment ${
              tab === 'full_post'
                ? 'jm-segment-active'
                : ''
            }`}
          >
            Página do artigo
          </button>
          <button
            type="button"
            onClick={() => setTab('feed_card')}
            className={`jm-segment ${
              tab === 'feed_card'
                ? 'jm-segment-active'
                : ''
            }`}
          >
            Card do feed
          </button>
        </div>

        {/* CONTROLE DE DISPOSITIVO: DESKTOP vs MOBILE */}
        <div className="jm-segmented">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            title="Visualização Desktop"
            className={`jm-segment ${
              device === 'desktop'
                ? 'jm-segment-active'
                : ''
            }`}
          >
                        <span className="">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            title="Visualização Mobile (390px)"
            className={`jm-segment ${
              device === 'mobile'
                ? 'jm-segment-active'
                : ''
            }`}
          >
                        <span className="">Mobile</span>
          </button>
        </div>

        {/* SELO DE SIMULAÇÃO DO SITE OFICIAL */}
        <div className="hidden items-center gap-1.5 text-[11px] font-medium text-jm-muted md:flex">
          <span className="jm-dot text-jm-accent-line" />
          <span>Simulação do blog oficial</span>
        </div>
      </div>

      {/* ÁREA DE SCROLL DO PREVIEW */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto p-3 sm:p-6">
        
        {/* CONTAINER DO DISPOSITIVO */}
        <div
          className={`w-full ${
            device === 'mobile'
              ? 'my-1 max-w-[400px] overflow-hidden rounded-[18px] border-[6px] border-[#1A2230] bg-white dark:bg-neutral-900'
              : 'max-w-4xl rounded-[6px] border border-jm-border bg-white dark:bg-neutral-900'
          }`}
        >
          
          {/* MODO 1: CARD DO FEED */}
          {tab === 'feed_card' && (
            <div className="p-6 sm:p-10 flex flex-col items-center justify-center">
              <div className="text-center mb-6">
                <p className="text-xs uppercase font-extrabold tracking-wider text-neutral-400">
                  Prévia do Card no Feed Principal
                </p>
              </div>

              {/* CARD DE FEED DO SITE JM MASTER GROUP */}
              <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group">
                
                {/* IMAGEM DE CAPA COM BADGE DESTAQUE */}
                <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                  {article.coverImage ? (
                    <Image
                      src={article.coverImage}
                      alt={article.coverImageAlt || article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                      Sem imagem de capa
                    </div>
                  )}

                  {/* BADGE DESTAQUE */}
                  {article.isFeatured && (
                    <div className="absolute top-3 left-3 bg-[#E85D26] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md shadow-md tracking-wider">
                      DESTAQUE
                    </div>
                  )}

                  {/* PILL CATEGORIA */}
                  <div className="absolute bottom-3 left-3 bg-neutral-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-neutral-700">
                    {article.category}
                  </div>
                </div>

                {/* CONTEÚDO DO CARD */}
                <div className="p-5 space-y-3">
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#E85D26] transition">
                    {article.title || 'Título do Artigo em Destaque'}
                  </h3>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                    {article.excerpt || 'Resumo do artigo com descrição dos tópicos abordados para os leitores do blog...'}
                  </p>

                  {/* RODAPÉ DO CARD: AUTOR & METADADOS */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-7 h-7 rounded-full bg-neutral-900 p-0.5 flex items-center justify-center border border-neutral-700 overflow-hidden shrink-0">
                        <Image
                          src="/logos/Icone.png"
                          alt="JM Master Group"
                          fill
                          className="object-contain p-0.5"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-neutral-900 dark:text-white truncate">
                          {article.author.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {formattedDate}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                      {article.readingTimeMinutes} min de leitura
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* MODO 2: PÁGINA COMPLETA DO ARTIGO */}
          {tab === 'full_post' && (
            <article className="p-6 sm:p-10 space-y-8">
              
              {/* CABEÇALHO DO ARTIGO */}
              <div className="space-y-4">
                
                {/* BREADCRUMB & CATEGORIA */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-neutral-400">Início</span>
                  <span className="text-neutral-400">/</span>
                  <span className="text-neutral-400">Blog</span>
                  <span className="text-neutral-400">/</span>
                  <span className="font-bold text-[#E85D26]">{article.category}</span>

                  {article.isFeatured && (
                    <span className="ml-2 bg-[#E85D26] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                      DESTAQUE
                    </span>
                  )}
                </div>

                {/* TÍTULO H1 DO ARTIGO */}
                <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
                  {article.title || 'Título Principal do Artigo'}
                </h1>

                {/* RESUMO / SUBTÍTULO */}
                {article.excerpt && (
                  <p className="text-base text-neutral-600 dark:text-neutral-300 font-normal leading-relaxed">
                    {article.excerpt}
                  </p>
                )}

                {/* AUTORIA E METADADOS */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-neutral-200 dark:border-neutral-800 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full bg-neutral-900 p-1 flex items-center justify-center border border-neutral-700 overflow-hidden shrink-0">
                      <Image
                        src="/logos/Icone.png"
                        alt="JM Master Group"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                          {article.author.name}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-orange-600/10 text-[#E85D26] rounded border border-orange-500/20">
                          Oficial
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {article.author.role}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    <span>📅 {formattedDate}</span>
                    <span>⏱️ {article.readingTimeMinutes} min de leitura</span>
                  </div>
                </div>
              </div>

              {/* IMAGEM DE CAPA AMPLA */}
              {article.coverImage && (
                <div className="space-y-2">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-md bg-neutral-950">
                    <Image
                      src={article.coverImage}
                      alt={article.coverImageAlt || article.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {article.coverImageAlt && (
                    <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 italic">
                      {article.coverImageAlt}
                    </p>
                  )}
                </div>
              )}

              {/* CORPO DO ARTIGO RENDERIZADO */}
              <div
                className="blog-wysiwyg-rendered-content text-base leading-relaxed text-neutral-800 dark:text-neutral-200 space-y-4"
                dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.contentHtml) || '<p>Nenhum conteúdo inserido ainda.</p>' }}
              />

              {/* SEÇÃO DE PERGUNTAS FREQUENTES (FAQ ACCORDION) NO PREVIEW */}
              {validFaqs.length > 0 && (
                <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#E85D26]/10 text-[#E85D26] border border-[#E85D26]/20">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight">
                        Perguntas Frequentes sobre o Tema
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {validFaqs.length} {validFaqs.length === 1 ? 'dúvida respondida' : 'dúvidas respondidas'} neste artigo
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {validFaqs.map((faq, idx) => {
                      const isExpanded = openFaqIndex === idx;

                      return (
                        <div
                          key={faq.id || idx}
                          className={`rounded-xl border transition-all ${
                            isExpanded
                              ? 'bg-white dark:bg-neutral-900 border-[#E85D26]/40 shadow-xs'
                              : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isExpanded ? null : idx)}
                            className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer select-none"
                          >
                            <span className="text-xs font-bold text-neutral-900 dark:text-white">
                              {faq.question}
                            </span>
                            <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3 text-[#E85D26]" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-neutral-500" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-3.5 pb-3.5 pt-1 text-xs text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800/60 leading-relaxed font-normal">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BANNER DE CTA OFICIAL JM MASTER GROUP */}
              <div className="mt-12 bg-[#0C1E38] text-white rounded-2xl p-6 sm:p-8 border border-neutral-800 space-y-4 relative overflow-hidden">
                <div className="relative z-10 max-w-xl space-y-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-[#E85D26] text-white rounded tracking-wider">
                    Solução Corporativa
                  </span>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    Transforme sua comunicação com a API Oficial do WhatsApp e IA
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Acelere o tempo de resposta, automatize tarefas repetitivas e centralize todas as conversas da sua empresa em uma única plataforma robusta.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      className="bg-[#E85D26] hover:bg-orange-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-orange-950/30 cursor-pointer"
                    >
                      Falar com um Especialista JM Master
                    </button>
                  </div>
                </div>
              </div>

            </article>
          )}

        </div>
      </div>
    </div>
  );
}
