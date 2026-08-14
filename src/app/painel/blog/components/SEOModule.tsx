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
  Info,
} from 'lucide-react';
import { Article, ArticleSEO } from '../types';
import { slugify } from '../mockData';

interface SEOModuleProps {
  article: Article;
  onChange: (updated: Partial<Article>) => void;
}

export default function SEOModule({ article, onChange }: SEOModuleProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const seo: ArticleSEO = useMemo(() => {
    return (
      article.seo || {
        focusKeyphrase: '',
        metaTitle: article.title || '',
        metaDescription: article.excerpt || '',
        canonicalUrl: '',
        noIndex: false,
      }
    );
  }, [article.seo, article.title, article.excerpt]);

  const updateSEO = (fields: Partial<ArticleSEO>) => {
    const updatedSEO = {
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
        scoreColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
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
    let scoreColor = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800';

    if (score < 50) {
      scoreLabel = 'Necessita Melhorias';
      scoreColor = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800';
    } else if (score < 75) {
      scoreLabel = 'Aceitável / Bom';
      scoreColor = 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
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
    if (titleCharCount === 0) return 'bg-neutral-300 dark:bg-neutral-700';
    if (titleCharCount < 40) return 'bg-amber-500';
    if (titleCharCount <= 60) return 'bg-emerald-500';
    return 'bg-rose-500';
  };

  const getDescBarColor = () => {
    if (descCharCount === 0) return 'bg-neutral-300 dark:bg-neutral-700';
    if (descCharCount < 100) return 'bg-amber-500';
    if (descCharCount <= 155) return 'bg-emerald-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* CABEÇALHO DO MÓDULO COM BADGE DE SCORE */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer select-none bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition border-b border-neutral-200 dark:border-neutral-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#E85D26]/10 text-[#E85D26] flex items-center justify-center font-black text-sm border border-[#E85D26]/20">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                Otimização SEO (Yoast Engine)
              </h3>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                Google Rank
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Análise de palavras-chave, metadados e preview real da SERP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {seo.focusKeyphrase && (
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${analysis.scoreColor}`}>
              <span className={`w-2 h-2 rounded-full ${analysis.score >= 75 ? 'bg-emerald-500' : analysis.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
              <span>SEO Score: {analysis.score}/100 • {analysis.scoreLabel}</span>
            </span>
          )}
          <button type="button" className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTEÚDO EXPANSÍVEL DO MÓDULO */}
      {isOpen && (
        <div className="p-5 space-y-6">
          {/* 1. PALAVRA-CHAVE FOCO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <span>Palavra-chave Foco</span>
                <span className="text-[#E85D26]">*</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-medium">
                Termo que o público busca no Google
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={seo.focusKeyphrase}
                onChange={(e) => updateSEO({ focusKeyphrase: e.target.value })}
                placeholder="Ex: WhatsApp Business API Oficial, Chatbot IA..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] transition font-medium"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 2. META TÍTULO (SEO TITLE) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Meta Título (SEO Title)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateSEO({ metaTitle: article.title })}
                  className="text-[10px] font-bold text-[#E85D26] hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Copiar do Título Principal"
                >
                  <Copy className="w-3 h-3" />
                  <span>Usar Título</span>
                </button>
                <span className="text-[11px] font-mono font-semibold text-neutral-500 dark:text-neutral-400">
                  {titleCharCount}/60
                </span>
              </div>
            </div>
            <input
              type="text"
              value={seo.metaTitle}
              onChange={(e) => updateSEO({ metaTitle: e.target.value })}
              placeholder={article.title || 'Título exibido na página de resultados do Google'}
              className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] transition font-medium"
            />
            {/* Barra de Progresso Visual */}
            <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getTitleBarColor()}`}
                style={{ width: `${titleProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Ideal: 50 a 60 caracteres</span>
              {titleCharCount > 60 && <span className="text-rose-500 font-bold">⚠️ Risco de truncamento</span>}
            </div>
          </div>

          {/* 3. META DESCRIÇÃO (META DESCRIPTION) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Meta Descrição (Snippet)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateSEO({ metaDescription: article.excerpt })}
                  className="text-[10px] font-bold text-[#E85D26] hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Copiar do Resumo do Artigo"
                >
                  <Copy className="w-3 h-3" />
                  <span>Usar Resumo</span>
                </button>
                <span className="text-[11px] font-mono font-semibold text-neutral-500 dark:text-neutral-400">
                  {descCharCount}/155
                </span>
              </div>
            </div>
            <textarea
              rows={3}
              value={seo.metaDescription}
              onChange={(e) => updateSEO({ metaDescription: e.target.value })}
              placeholder={article.excerpt || 'Descrição atrativa que resume o artigo e convence o usuário a clicar no Google...'}
              className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] resize-none transition font-medium"
            />
            {/* Barra de Progresso Visual */}
            <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getDescBarColor()}`}
                style={{ width: `${descProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Ideal: 120 a 155 caracteres</span>
              {descCharCount > 155 && <span className="text-rose-500 font-bold">⚠️ Será cortada na SERP</span>}
            </div>
          </div>

          {/* 4. GOOGLE SNIPPET PREVIEW REALISTA */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Google Snippet Preview
                </span>
              </div>
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* CARD DE SIMULAÇÃO DA BUSCA DO GOOGLE */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                previewDevice === 'mobile'
                  ? 'bg-white dark:bg-[#1f1f1f] border-neutral-300 dark:border-neutral-700 shadow-md max-w-sm mx-auto'
                  : 'bg-white dark:bg-[#202124] border-neutral-200 dark:border-neutral-800 shadow-xs'
              }`}
            >
              {/* Header do Google (Favicon + Site Name + URL) */}
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-700 shrink-0">
                  <Image
                    src="/logos/Icone.png"
                    alt="JM Master"
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[12px] leading-tight text-[#202124] dark:text-[#dadce0] font-medium truncate">
                    <span>JM Master Group</span>
                  </div>
                  <div className="text-[11px] leading-tight text-[#4d5156] dark:text-[#bdc1c6] truncate">
                    https://jmmaster.com.br › blog › {article.slug || 'slug-do-artigo'}
                  </div>
                </div>
              </div>

              {/* Título Clicável Azul do Google */}
              <h4 className="text-[17px] sm:text-[18px] leading-snug font-normal text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer line-clamp-2 mb-1">
                {displayTitle || 'Título do Artigo Aparecerá Aqui no Google'}
              </h4>

              {/* Descrição Cinza do Google */}
              <p className="text-[13px] leading-relaxed text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2">
                {displayDesc || 'A meta descrição do artigo aparecerá aqui, atraindo cliques dos usuários na página de busca.'}
              </p>
            </div>
          </div>

          {/* 5. ANÁLISE & CHECKLIST DE SEO EM TEMPO REAL (YOAST ENGINE) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E85D26]" />
                <span className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                  Checklist de Otimização em Tempo Real
                </span>
              </div>
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                {analysis.checks.filter((c) => c.status === 'good').length}/{analysis.checks.length} Aprovados
              </span>
            </div>

            <div className="space-y-2">
              {analysis.checks.map((check) => {
                const isGood = check.status === 'good';
                const isWarning = check.status === 'warning';

                return (
                  <div
                    key={check.id}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                      isGood
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
                        : isWarning
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                        : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isGood && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      {isWarning && <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                      {!isGood && !isWarning && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="font-bold text-[11px]">{check.label}</p>
                      <p className="text-[11px] opacity-90 leading-relaxed font-normal">{check.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. CONFIGURAÇÕES AVANÇADAS DE SEO (CANONICAL & INDEXAÇÃO) */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white flex items-center justify-between w-full py-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>Configurações Avançadas de Indexação & Canonicals</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3 animate-fadeIn">
                {/* CANONICAL URL */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    URL Canônica (Canonical URL)
                  </label>
                  <input
                    type="url"
                    value={seo.canonicalUrl || ''}
                    onChange={(e) => updateSEO({ canonicalUrl: e.target.value })}
                    placeholder={`https://jmmaster.com.br/blog/${article.slug || ''}`}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                  />
                  <p className="text-[10px] text-neutral-400">
                    Deixe em branco para usar automaticamente a URL padrão do artigo.
                  </p>
                </div>

                {/* NOINDEX TOGGLE */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Ocultar dos Buscadores (noindex)</span>
                    </span>
                    <p className="text-[10px] text-neutral-400">
                      Impede que o Google indexe este artigo específico.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!seo.noIndex}
                      onChange={(e) => updateSEO({ noIndex: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-neutral-600 peer-checked:bg-rose-600" />
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
