'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Article, PreviewDevice, PreviewTab } from '../types';

interface LivePreviewProps {
  article: Article;
}

export default function LivePreview({ article }: LivePreviewProps) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [tab, setTab] = useState<PreviewTab>('full_post');

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Rascunho não publicado';

  return (
    <div className="flex flex-col h-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
      
      {/* BARRA DE CONTROLE DO PREVIEW */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* ABAS: CARD DO FEED vs PÁGINA COMPLETA */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setTab('full_post')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === 'full_post'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            📄 Página do Artigo
          </button>
          <button
            type="button"
            onClick={() => setTab('feed_card')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === 'feed_card'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            🎴 Card do Feed
          </button>
        </div>

        {/* CONTROLE DE DISPOSITIVO: DESKTOP vs MOBILE */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            title="Visualização Desktop"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              device === 'desktop'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>🖥️</span>
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            title="Visualização Mobile (390px)"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              device === 'mobile'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>📱</span>
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* SELO DE SIMULAÇÃO DO SITE OFICIAL */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-[#E85D26]" />
          <span>Simulação Oficial Blog JM Master</span>
        </div>
      </div>

      {/* ÁREA DE SCROLL DO PREVIEW */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
        
        {/* CONTAINER DO DISPOSITIVO */}
        <div
          className={`transition-all duration-300 w-full ${
            device === 'mobile'
              ? 'max-w-[400px] border-4 border-neutral-800 rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-neutral-900 my-2'
              : 'max-w-4xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm'
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
                dangerouslySetInnerHTML={{ __html: article.contentHtml || '<p>Nenhum conteúdo inserido ainda.</p>' }}
              />

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
