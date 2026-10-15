'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Globe,
  Smartphone,
  Monitor,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Link2,
  EyeOff,
  Copy,
  Share2,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { Article, ArticleSEO } from '../types';
import { slugify } from '../mockData';

interface SEOModuleProps {
  article: Article;
  onChange: (updated: Partial<Article>) => void;
}

export default function SEOModule({ article, onChange }: SEOModuleProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [previewTab, setPreviewTab] = useState<'google' | 'social'>('google');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Normalizar keywords de string ou array
  const currentKeywordsStr = useMemo(() => {
    if (Array.isArray(article.seo?.keywords)) {
      return article.seo.keywords.join(', ');
    }
    if (typeof article.seo?.keywords === 'string') {
      return article.seo.keywords;
    }
    return '';
  }, [article.seo?.keywords]);

  const seo: ArticleSEO = useMemo(() => {
    return {
      focusKeyphrase: article.seo?.focusKeyphrase || '',
      metaTitle: article.seo?.metaTitle || article.seo?.seoTitle || article.title || '',
      seoTitle: article.seo?.seoTitle || article.seo?.metaTitle || article.title || '',
      metaDescription: article.seo?.metaDescription || article.seo?.seoDescription || article.excerpt || '',
      seoDescription: article.seo?.seoDescription || article.seo?.metaDescription || article.excerpt || '',
      canonicalUrl: article.seo?.canonicalUrl || (article.slug ? `https://www.jmmaster.com.br/blog/${article.slug}` : ''),
      noIndex: !!article.seo?.noIndex,
      noFollow: !!article.seo?.noFollow,
      keywords: currentKeywordsStr,
      ogTitle: article.seo?.ogTitle || article.seo?.metaTitle || article.title || '',
      ogDescription: article.seo?.ogDescription || article.seo?.metaDescription || article.excerpt || '',
      ogImage: article.seo?.ogImage || article.coverImage || '',
    };
  }, [article.seo, article.title, article.excerpt, article.slug, article.coverImage, currentKeywordsStr]);

  const updateSEO = (fields: Partial<ArticleSEO>) => {
    const updatedSEO: ArticleSEO = {
      ...seo,
      ...fields,
    };
    onChange({ seo: updatedSEO });
  };

  // Texto limpo do artigo para cálculo de densidade e palavras
  const plainContent = useMemo(() => {
    return (article.contentHtml || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [article.contentHtml]);

  const totalWords = useMemo(() => {
    return plainContent ? plainContent.split(/\s+/).filter(Boolean).length : 0;
  }, [plainContent]);

  // Primeiro parágrafo do artigo
  const firstParagraph = useMemo(() => {
    const match = (article.contentHtml || '').match(/<p[^>]*>(.*?)<\/p>/i);
    if (match && match[1]) {
      return match[1].replace(/<[^>]*>/g, '').trim();
    }
    return article.excerpt || '';
  }, [article.contentHtml, article.excerpt]);

  // Análise em tempo real estilo Yoast
  const analysis = useMemo(() => {
    const keyphrase = (seo.focusKeyphrase || '').trim().toLowerCase();
    const checks: Array<{
      id: string;
      label: string;
      status: 'good' | 'warning' | 'bad';
      message: string;
    }> = [];

    if (!keyphrase) {
      return {
        checks: [
          {
            id: 'no-keyphrase',
            label: 'Palavra-chave Foco',
            status: 'warning' as const,
            message: 'Defina uma palavra-chave foco para ativar a análise profunda de SEO.',
          },
        ],
        score: 0,
        scoreLabel: 'Não Configurado',
        scoreColor: 'jm-badge-warning',
      };
    }

    const keyphraseWords = keyphrase.split(/\s+/).filter(Boolean);

    // 1. Palavra-chave no H1 (Título)
    const titleLower = (article.title || '').toLowerCase();
    const hasInTitle = titleLower.includes(keyphrase);
    checks.push({
      id: 'title-keyphrase',
      label: 'Palavra-chave no Título Principal (H1)',
      status: hasInTitle ? 'good' : 'bad',
      message: hasInTitle
        ? 'A palavra-chave foco aparece no título principal.'
        : 'A palavra-chave foco não foi encontrada no título principal (H1).',
    });

    // 2. Palavra-chave no primeiro parágrafo
    const firstParaLower = firstParagraph.toLowerCase();
    const hasInFirstPara = firstParaLower.includes(keyphrase);
    checks.push({
      id: 'first-para-keyphrase',
      label: 'Palavra-chave na Introdução',
      status: hasInFirstPara ? 'good' : 'warning',
      message: hasInFirstPara
        ? 'A palavra-chave foco aparece logo no primeiro parágrafo.'
        : 'Inclua a palavra-chave no primeiro parágrafo para que o leitor e os buscadores identifiquem o tema rapidamente.',
    });

    // 3. Palavra-chave na Slug / URL
    const slugLower = (article.slug || '').toLowerCase();
    const keyphraseSlug = slugify(keyphrase);
    const hasInSlug = slugLower.includes(keyphraseSlug) || keyphraseWords.every((w) => slugLower.includes(slugify(w)));
    checks.push({
      id: 'slug-keyphrase',
      label: 'Palavra-chave na Slug (URL)',
      status: hasInSlug ? 'good' : 'warning',
      message: hasInSlug
        ? 'A URL amigável contém os termos da sua palavra-chave foco.'
        : 'A slug da URL deve conter a palavra-chave para melhor indexação.',
    });

    // 4. Palavra-chave na Meta Descrição
    const metaDesc = (seo.metaDescription || article.excerpt || '').toLowerCase();
    const hasInMetaDesc = metaDesc.includes(keyphrase);
    checks.push({
      id: 'meta-desc-keyphrase',
      label: 'Palavra-chave na Meta Descrição',
      status: hasInMetaDesc ? 'good' : 'bad',
      message: hasInMetaDesc
        ? 'A meta descrição contém a palavra-chave foco (ganho em CTR na SERP).'
        : 'A meta descrição não contém a palavra-chave foco.',
    });

    // 5. Densidade da palavra-chave no texto
    let occurrences = 0;
    if (plainContent && keyphrase) {
      try {
        const regex = new RegExp(keyphrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = plainContent.match(regex);
        occurrences = matches ? matches.length : 0;
      } catch {
        occurrences = 0;
      }
    }

    const density = totalWords > 0 ? (occurrences * keyphraseWords.length / totalWords) * 100 : 0;
    let densityStatus: 'good' | 'warning' | 'bad' = 'good';
    let densityMsg = '';

    if (occurrences === 0) {
      densityStatus = 'bad';
      densityMsg = 'A palavra-chave não foi encontrada no corpo do artigo.';
    } else if (density >= 0.5 && density <= 2.8) {
      densityStatus = 'good';
      densityMsg = `Densidade ideal de ${density.toFixed(1)}% (${occurrences} ${occurrences === 1 ? 'ocorrência' : 'ocorrências'}).`;
    } else if (density < 0.5) {
      densityStatus = 'warning';
      densityMsg = `Densidade baixa de ${density.toFixed(1)}% (${occurrences} ${occurrences === 1 ? 'ocorrência' : 'ocorrências'}). Recomendamos repetir o termo naturalmente ao longo do texto.`;
    } else {
      densityStatus = 'warning';
      densityMsg = `Densidade alta de ${density.toFixed(1)}% (${occurrences} ocorrências). Cuidado com excesso de repetição (keyword stuffing).`;
    }

    checks.push({
      id: 'keyphrase-density',
      label: 'Densidade da Palavra-chave',
      status: densityStatus,
      message: densityMsg,
    });

    // 6. Imagens e Alt text
    const hasCoverAlt = !!(article.coverImageAlt && article.coverImageAlt.trim().length > 0);
    const contentImgsWithoutAlt = (article.contentHtml || '').match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi);
    const hasContentImgsWithoutAlt = contentImgsWithoutAlt && contentImgsWithoutAlt.length > 0;

    let imageStatus: 'good' | 'warning' | 'bad' = 'good';
    let imageMsg = '';

    if (!article.coverImage) {
      imageStatus = 'warning';
      imageMsg = 'Adicione uma imagem de capa atrativa para compartilhamento em redes sociais e rich cards do Google.';
    } else if (!hasCoverAlt || hasContentImgsWithoutAlt) {
      imageStatus = 'warning';
      imageMsg = 'Existem imagens sem texto alternativo (Alt Text). O Google valoriza imagens com descrições acessíveis.';
    } else {
      imageStatus = 'good';
      imageMsg = 'Todas as imagens possuem texto alternativo (Alt Text) configurado.';
    }

    checks.push({
      id: 'image-alt',
      label: 'Atributos Alt nas Imagens',
      status: imageStatus,
      message: imageMsg,
    });

    // 7. Tamanho do conteúdo (Contagem de palavras)
    let lengthStatus: 'good' | 'warning' | 'bad' = 'good';
    let lengthMsg = '';
    if (totalWords >= 300) {
      lengthStatus = 'good';
      lengthMsg = `Ótimo volume de texto: ${totalWords} palavras (mínimo recomendado de 300).`;
    } else if (totalWords >= 150) {
      lengthStatus = 'warning';
      lengthMsg = `Artigo com ${totalWords} palavras. Artigos com mais de 300 palavras possuem chances muito maiores de ranquear na primeira página.`;
    } else {
      lengthStatus = 'bad';
      lengthMsg = `Conteúdo muito curto (${totalWords} palavras). Desenvolva melhor o artigo para agregar valor real ao leitor.`;
    }

    checks.push({
      id: 'content-length',
      label: 'Comprimento do Conteúdo',
      status: lengthStatus,
      message: lengthMsg,
    });

    // 8. Tamanho do Meta Título (50-60 chars)
    const titleLength = (seo.metaTitle || article.title || '').length;
    let titleLenStatus: 'good' | 'warning' | 'bad' = 'good';
    let titleLenMsg = '';
    if (titleLength >= 45 && titleLength <= 60) {
      titleLenStatus = 'good';
      titleLenMsg = `Tamanho perfeito do Meta Título (${titleLength} caracteres).`;
    } else if (titleLength > 60) {
      titleLenStatus = 'warning';
      titleLenMsg = `Meta Título longo (${titleLength} caracteres). O Google cortará após ~60 caracteres.`;
    } else if (titleLength === 0) {
      titleLenStatus = 'bad';
      titleLenMsg = 'Defina um Meta Título para a página.';
    } else {
      titleLenStatus = 'warning';
      titleLenMsg = `Meta Título curto (${titleLength} caracteres). Aproveite até 60 caracteres para incluir termos relevantes.`;
    }

    checks.push({
      id: 'title-length',
      label: 'Comprimento do Meta Título',
      status: titleLenStatus,
      message: titleLenMsg,
    });

    // 9. Tamanho da Meta Descrição (120-155 chars)
    const descLength = (seo.metaDescription || article.excerpt || '').length;
    let descLenStatus: 'good' | 'warning' | 'bad' = 'good';
    let descLenMsg = '';
    if (descLength >= 120 && descLength <= 155) {
      descLenStatus = 'good';
      descLenMsg = `Tamanho perfeito da Meta Descrição (${descLength} caracteres).`;
    } else if (descLength > 155) {
      descLenStatus = 'warning';
      descLenMsg = `Meta Descrição longa (${descLength} caracteres). O Google exibirá reticências após ~155 caracteres.`;
    } else if (descLength === 0) {
      descLenStatus = 'bad';
      descLenMsg = 'A meta descrição está vazia.';
    } else {
      descLenStatus = 'warning';
      descLenMsg = `Meta Descrição com ${descLength} caracteres. O ideal para preencher o snippet na busca é entre 120 e 155 caracteres.`;
    }

    checks.push({
      id: 'desc-length',
      label: 'Comprimento da Meta Descrição',
      status: descLenStatus,
      message: descLenMsg,
    });

    // Cálculo da Pontuação Geral (Score 0 - 100)
    const goodCount = checks.filter((c) => c.status === 'good').length;
    const warningCount = checks.filter((c) => c.status === 'warning').length;
    const score = Math.round(((goodCount * 1 + warningCount * 0.5) / checks.length) * 100);

    let scoreLabel = 'Excelente';
    let scoreColor = 'jm-badge-success';

    if (score < 50) {
      scoreLabel = 'Necessita Melhorias';
      scoreColor = 'jm-badge-danger';
    } else if (score < 75) {
      scoreLabel = 'Aceitável / Bom';
      scoreColor = 'jm-badge-warning';
    }

    return {
      checks,
      score,
      scoreLabel,
      scoreColor,
    };
  }, [
    seo.focusKeyphrase,
    seo.metaTitle,
    seo.metaDescription,
    article.title,
    article.excerpt,
    article.slug,
    article.contentHtml,
    article.coverImage,
    article.coverImageAlt,
    firstParagraph,
    plainContent,
    totalWords,
  ]);

  // Cálculos visuais dos contadores
  const displayTitle = seo.metaTitle || article.title || '';
  const displayDesc = seo.metaDescription || article.excerpt || '';
  const titleCharCount = displayTitle.length;
  const descCharCount = displayDesc.length;

  const titleProgress = Math.min(100, (titleCharCount / 60) * 100);
  const descProgress = Math.min(100, (descCharCount / 155) * 100);

  const getTitleBarColor = () => {
    if (titleCharCount === 0) return 'bg-jm-border-strong';
    if (titleCharCount < 40) return 'bg-jm-warning-fg';
    if (titleCharCount <= 60) return 'bg-jm-success-fg';
    return 'bg-jm-danger-fg';
  };

  const getDescBarColor = () => {
    if (descCharCount === 0) return 'bg-jm-border-strong';
    if (descCharCount < 100) return 'bg-jm-warning-fg';
    if (descCharCount <= 155) return 'bg-jm-success-fg';
    return 'bg-jm-danger-fg';
  };

  return (
    <div className="jm-card overflow-hidden">
      {/* CABEÇALHO DO MÓDULO COM BADGE DE SCORE */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex cursor-pointer select-none flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 transition-colors duration-100 hover:bg-jm-hover md:px-5 ${isOpen ? 'border-b border-jm-border' : ''}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Search className="h-4 w-4 shrink-0 text-jm-muted" />
          <div className="min-w-0">
            <h3 className="jm-card-title">
              Otimização SEO
            </h3>
            <p className="mt-0.5 text-xs text-jm-muted">
              Palavras-chave, metadados e prévia da SERP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {seo.focusKeyphrase && (
            <span className={`jm-badge ${analysis.scoreColor}`}>
              <span className="jm-dot" />
              <span className="tabular-nums">{analysis.score}/100</span>
              <span className="hidden sm:inline">· {analysis.scoreLabel}</span>
            </span>
          )}
          <button type="button" className="jm-icon-btn h-7 w-7" aria-label={isOpen ? 'Recolher' : 'Expandir'}>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* CONTEÚDO EXPANSÍVEL DO MÓDULO */}
      {isOpen && (
        <div className="space-y-5 p-4 md:p-5">
          {/* 1. PALAVRA-CHAVE FOCO */}
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2">
              <label className="text-[13px] font-medium text-jm-fg2">
                Palavra-chave foco <span className="text-jm-accent-text">*</span>
              </label>
              <span className="text-[11px] text-jm-muted">
                Termo que o público busca no Google
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={seo.focusKeyphrase}
                onChange={(e) => updateSEO({ focusKeyphrase: e.target.value })}
                placeholder="Ex: WhatsApp Business API Oficial, Chatbot de Atendimento..."
                className="jm-input pl-8 text-[13px]"
              />
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-jm-placeholder" />
            </div>
          </div>

          {/* 2. PALAVRAS-CHAVE ADICIONAIS / TAGS DE BUSCA (KEYWORDS) */}
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2">
              <label className="flex items-center gap-1.5 text-[13px] font-medium text-jm-fg2">
                <Tag className="h-3.5 w-3.5 text-jm-muted" />
                <span>Palavras-chave adicionais</span>
              </label>
              <span className="text-[11px] text-jm-muted">Separadas por vírgula</span>
            </div>
            <input
              type="text"
              value={typeof seo.keywords === 'string' ? seo.keywords : Array.isArray(seo.keywords) ? (seo.keywords as string[]).join(', ') : ''}
              onChange={(e) => updateSEO({ keywords: e.target.value })}
              placeholder="Ex: whatsapp api, atendimento automatico, meta business, vendas"
              className="jm-input text-[13px]"
            />
          </div>

          {/* 3. META TÍTULO (SEO TITLE) */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-x-2">
              <label className="text-[13px] font-medium text-jm-fg2">
                Meta título
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateSEO({ metaTitle: article.title, seoTitle: article.title })}
                  className="jm-link flex cursor-pointer items-center gap-1 text-xs"
                  title="Copiar do Título Principal"
                >
                  <Copy className="h-3 w-3" />
                  <span>Usar título</span>
                </button>
                <span className="font-mono text-[11px] tabular-nums text-jm-muted">
                  {titleCharCount}/60
                </span>
              </div>
            </div>
            <input
              type="text"
              value={seo.metaTitle}
              onChange={(e) => updateSEO({ metaTitle: e.target.value, seoTitle: e.target.value })}
              placeholder={article.title || 'Título exibido na página de resultados do Google'}
              className="jm-input text-[13px]"
            />
            {/* Barra de Progresso Visual */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-jm-hover">
              <div
                className={`h-full transition-[width] duration-200 ${getTitleBarColor()}`}
                style={{ width: `${titleProgress}%` }}
              />
            </div>
            <div className="flex justify-between gap-2 text-[11px] text-jm-muted">
              <span>Ideal: 50 a 60 caracteres</span>
              {titleCharCount > 60 && <span className="font-medium text-jm-danger-fg">Risco de truncamento</span>}
            </div>
          </div>

          {/* 4. META DESCRIÇÃO (META DESCRIPTION) */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-x-2">
              <label className="text-[13px] font-medium text-jm-fg2">
                Meta descrição
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateSEO({ metaDescription: article.excerpt, seoDescription: article.excerpt })}
                  className="jm-link flex cursor-pointer items-center gap-1 text-xs"
                  title="Copiar do Resumo do Artigo"
                >
                  <Copy className="h-3 w-3" />
                  <span>Usar resumo</span>
                </button>
                <span className="font-mono text-[11px] tabular-nums text-jm-muted">
                  {descCharCount}/155
                </span>
              </div>
            </div>
            <textarea
              rows={3}
              value={seo.metaDescription}
              onChange={(e) => updateSEO({ metaDescription: e.target.value, seoDescription: e.target.value })}
              placeholder={
                article.excerpt ||
                'Descrição atrativa que resume o artigo e convence o usuário a clicar no Google...'
              }
              className="jm-input resize-none text-[13px]"
            />
            {/* Barra de Progresso Visual */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-jm-hover">
              <div
                className={`h-full transition-[width] duration-200 ${getDescBarColor()}`}
                style={{ width: `${descProgress}%` }}
              />
            </div>
            <div className="flex justify-between gap-2 text-[11px] text-jm-muted">
              <span>Ideal: 120 a 155 caracteres</span>
              {descCharCount > 155 && <span className="font-medium text-jm-danger-fg">Será cortada na SERP</span>}
            </div>
          </div>

          {/* 5. PRÉVIA EM TEMPO REAL (GOOGLE SNIPPET & OPEN GRAPH SOCIAL) */}
          <div className="space-y-3 border-t border-jm-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="jm-segmented">
                <button
                  type="button"
                  onClick={() => setPreviewTab('google')}
                  className={`jm-segment ${previewTab === 'google' ? 'jm-segment-active' : ''}`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('social')}
                  className={`jm-segment ${previewTab === 'social' ? 'jm-segment-active' : ''}`}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Redes / WhatsApp</span>
                </button>
              </div>

              {previewTab === 'google' && (
                <div className="jm-segmented">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`jm-segment ${previewDevice === 'desktop' ? 'jm-segment-active' : ''}`}
                    aria-label="Desktop"
                  >
                    <Monitor className="h-3 w-3" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`jm-segment ${previewDevice === 'mobile' ? 'jm-segment-active' : ''}`}
                    aria-label="Mobile"
                  >
                    <Smartphone className="h-3 w-3" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>
              )}
            </div>

            {/* TAB GOOGLE (cores imitam a página de resultados do Google) */}
            {previewTab === 'google' && (
              <div
                className={`rounded-[6px] border p-4 ${
                  previewDevice === 'mobile'
                    ? 'mx-auto max-w-sm border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#1f1f1f]'
                    : 'border-jm-border bg-white dark:bg-[#202124]'
                }`}
              >
                {/* Header do Google (Favicon + Site Name + URL) */}
                <div className="mb-1.5 flex items-center gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
                    <Image
                      src="/logos/Icone.png"
                      alt="JM Master"
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 truncate text-[12px] font-medium leading-tight text-[#202124] dark:text-[#dadce0]">
                      <span>JM Master Group</span>
                    </div>
                    <div className="truncate text-[11px] leading-tight text-[#4d5156] dark:text-[#bdc1c6]">
                      https://www.jmmaster.com.br › blog › {article.slug || 'slug-do-artigo'}
                    </div>
                  </div>
                </div>

                {/* Título Clicável Azul do Google */}
                <h4 className="mb-1 line-clamp-2 cursor-pointer text-[17px] font-normal leading-snug text-[#1a0dab] hover:underline dark:text-[#8ab4f8] sm:text-[18px]">
                  {displayTitle || 'Título do Artigo Aparecerá Aqui no Google'}
                </h4>

                {/* Descrição Cinza do Google */}
                <p className="line-clamp-2 text-[13px] leading-relaxed text-[#4d5156] dark:text-[#bdc1c6]">
                  {displayDesc ||
                    'A meta descrição do artigo aparecerá aqui, atraindo cliques dos usuários na página de busca.'}
                </p>
              </div>
            )}

            {/* TAB OPEN GRAPH SOCIAL PREVIEW */}
            {previewTab === 'social' && (
              <div className="space-y-3">
                <div className="mx-auto max-w-md overflow-hidden rounded-[6px] border border-jm-border bg-jm-subtle">
                  {/* Card de Imagem OG */}
                  <div className="relative flex aspect-[1.91/1] w-full items-center justify-center overflow-hidden border-b border-jm-border bg-jm-hover">
                    {seo.ogImage || article.coverImage ? (
                      <img
                        src={seo.ogImage || article.coverImage}
                        alt="Open Graph Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-jm-muted">
                        <Share2 className="h-4 w-4" />
                        <span>Nenhuma imagem de capa selecionada</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-jm-muted">
                      JMMASTER.COM.BR
                    </span>
                    <h5 className="line-clamp-2 text-sm font-semibold leading-snug text-jm-fg">
                      {seo.ogTitle || seo.metaTitle || article.title || 'Título do Artigo'}
                    </h5>
                    <p className="line-clamp-2 text-xs leading-relaxed text-jm-muted">
                      {seo.ogDescription || seo.metaDescription || article.excerpt || 'Resumo do artigo para compartilhamento em redes sociais e mensageiros.'}
                    </p>
                  </div>
                </div>

                {/* Customizações Opcionais de OG */}
                <div className="space-y-3 rounded-[4px] border border-jm-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-jm-fg">
                      Personalizar Open Graph <span className="font-normal text-jm-muted">(opcional)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        updateSEO({
                          ogTitle: article.title,
                          ogDescription: article.excerpt,
                          ogImage: article.coverImage,
                        });
                      }}
                      className="jm-link cursor-pointer text-xs"
                    >
                      Sincronizar com artigo
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="jm-label text-xs">
                        Título Open Graph
                      </label>
                      <input
                        type="text"
                        value={seo.ogTitle || ''}
                        onChange={(e) => updateSEO({ ogTitle: e.target.value })}
                        placeholder={article.title || 'Título nas redes'}
                        className="jm-input h-8 text-xs"
                      />
                    </div>

                    <div>
                      <label className="jm-label text-xs">
                        Descrição Open Graph
                      </label>
                      <input
                        type="text"
                        value={seo.ogDescription || ''}
                        onChange={(e) => updateSEO({ ogDescription: e.target.value })}
                        placeholder={article.excerpt || 'Descrição nas redes'}
                        className="jm-input h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. ANÁLISE & CHECKLIST DE SEO EM TEMPO REAL (YOAST ENGINE) */}
          <div className="space-y-2.5 border-t border-jm-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="jm-section-title">
                Checklist de otimização
              </span>
              <span className="text-xs tabular-nums text-jm-muted">
                {analysis.checks.filter((c) => c.status === 'good').length}/{analysis.checks.length} aprovados
              </span>
            </div>

            <div className="overflow-hidden rounded-[4px] border border-jm-border">
              <div className="divide-y divide-jm-border">
                {analysis.checks.map((check) => {
                  const isGood = check.status === 'good';
                  const isWarning = check.status === 'warning';

                  return (
                    <div
                      key={check.id}
                      className="flex items-start gap-2.5 px-3 py-2.5 text-xs"
                    >
                      <div className="mt-px shrink-0">
                        {isGood && <CheckCircle2 className="h-4 w-4 text-jm-success-fg" />}
                        {isWarning && <AlertCircle className="h-4 w-4 text-jm-warning-fg" />}
                        {!isGood && !isWarning && <XCircle className="h-4 w-4 text-jm-danger-fg" />}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-medium text-jm-fg">{check.label}</p>
                        <p className="text-xs leading-relaxed text-jm-muted">{check.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 7. CONFIGURAÇÕES AVANÇADAS DE SEO (CANONICAL, NOINDEX & NOFOLLOW) */}
          <div className="border-t border-jm-border pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full cursor-pointer items-center justify-between py-1 text-xs font-medium text-jm-muted hover:text-jm-fg"
            >
              <div className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                <span>Indexação e URL canônica</span>
              </div>
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 rounded-[4px] border border-jm-border bg-jm-subtle p-3">
                {/* CANONICAL URL */}
                <div>
                  <label className="jm-label text-xs">
                    URL canônica
                  </label>
                  <input
                    type="url"
                    value={seo.canonicalUrl || ''}
                    onChange={(e) => updateSEO({ canonicalUrl: e.target.value })}
                    placeholder={`https://www.jmmaster.com.br/blog/${article.slug || ''}`}
                    className="jm-input h-8 text-xs"
                  />
                  <p className="jm-help">
                    Deixe em branco para usar automaticamente a URL padrão do artigo.
                  </p>
                </div>

                {/* NOINDEX TOGGLE */}
                <div className="flex items-center justify-between gap-3 border-t border-jm-border pt-3">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-jm-fg">
                      <EyeOff className="h-3.5 w-3.5 text-jm-muted" />
                      <span>Ocultar dos buscadores (noindex)</span>
                    </span>
                    <p className="mt-0.5 text-xs text-jm-muted">
                      Impede que o Google e outros motores indexem este artigo.
                    </p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={!!seo.noIndex}
                      onChange={(e) => updateSEO({ noIndex: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-jm-border-strong transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:bg-jm-danger-fg peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-jm-ring" />
                  </label>
                </div>

                {/* NOFOLLOW TOGGLE */}
                <div className="flex items-center justify-between gap-3 border-t border-jm-border pt-3">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-jm-fg">
                      <ShieldAlert className="h-3.5 w-3.5 text-jm-muted" />
                      <span>Não seguir links (nofollow)</span>
                    </span>
                    <p className="mt-0.5 text-xs text-jm-muted">
                      Instrui os robôs a não seguirem links presentes no artigo.
                    </p>
                  </div>
                  <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={!!seo.noFollow}
                      onChange={(e) => updateSEO({ noFollow: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-jm-border-strong transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:bg-jm-warning-fg peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-jm-ring" />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
