'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Article, ArticleCategory } from '../types';
import { getStoredCategories, saveStoredCategories, DEFAULT_CATEGORIES, slugify } from '../mockData';
import MediaUploader from './MediaUploader';

interface ArticleMetadataProps {
  article: Article;
  onChange: (updated: Partial<Article>) => void;
  onInsertImageIntoContent?: (imageHtml: string) => void;
}

export default function ArticleMetadata({
  article,
  onChange,
  onInsertImageIntoContent,
}: ArticleMetadataProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    setCategories(getStoredCategories());
  }, []);

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const exists = categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      const existing = categories.find((c) => c.toLowerCase() === trimmed.toLowerCase()) || trimmed;
      onChange({ category: existing });
      setIsAddingCategory(false);
      setNewCategoryName('');
      return;
    }

    const updated = [...categories, trimmed];
    setCategories(updated);
    saveStoredCategories(updated);
    onChange({ category: trimmed });
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const updated = categories.filter((c) => c !== categoryToDelete);
    setCategories(updated);
    saveStoredCategories(updated);
    if (article.category === categoryToDelete) {
      onChange({ category: updated[0] || 'WhatsApp API' });
    }
    setCategoryToDelete(null);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const newSlug = article.slug === slugify(article.title) || !article.slug
      ? slugify(newTitle)
      : article.slug;
    onChange({ title: newTitle, slug: newSlug });
  };

  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ excerpt: e.target.value });
  };

  const handleRegenerateSlug = () => {
    onChange({ slug: slugify(article.title) });
  };

  const maxExcerptLength = 180;
  const excerptLength = article.excerpt.length;
  const isExcerptOver = excerptLength > maxExcerptLength;

  return (
    <div className="space-y-6">
      {/* 1. METADADOS PRINCIPAIS */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              Configurações do Artigo
            </span>
          </div>
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            SEO & Classificação
          </span>
        </div>

        {/* CATEGORIA PRINCIPAL COM BOTÃO DE CRIAR NOVA CATEGORIA */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Categoria Oficial
            </label>
            {!isAddingCategory && (
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="text-[11px] font-bold text-[#E85D26] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Nova Categoria</span>
              </button>
            )}
          </div>

          {/* INPUT PARA CRIAR NOVA CATEGORIA */}
          {isAddingCategory && (
            <div className="mb-3 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-[#E85D26]/40 space-y-2">
              <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 block">
                Nome da Nova Categoria
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    } else if (e.key === 'Escape') {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }
                  }}
                  placeholder="Ex: LGPD & Segurança, Tecnologia, Cases..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="px-3 py-1.5 bg-[#E85D26] text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 cursor-pointer"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PILLS DAS CATEGORIAS */}
          <div className="flex flex-wrap gap-2">
            {categories.map((catName) => {
              const isSelected = article.category === catName;
              const isDefault = DEFAULT_CATEGORIES.includes(catName as any);
              return (
                <div
                  key={catName}
                  onClick={() => onChange({ category: catName })}
                  className={`group relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#E85D26] text-white border-[#E85D26] shadow-xs'
                      : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-neutral-400'}`} />
                  <span>{catName}</span>
                  
                  {/* BOTÃO PARA APAGAR CATEGORIA CRIADA */}
                  {!isDefault && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryToDelete(catName);
                      }}
                      title={`Apagar categoria "${catName}"`}
                      className={`ml-1 px-1 py-0.5 rounded text-[10px] font-black leading-none transition cursor-pointer ${
                        isSelected
                          ? 'text-white/80 hover:text-white hover:bg-black/20'
                          : 'text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TOGGLE ARTIGO EM DESTAQUE */}
        <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                Artigo em Destaque
              </span>
              {article.isFeatured && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#E85D26] text-white rounded">
                  DESTAQUE ATIVO
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Exibe a badge laranja e fixa o artigo no topo do feed do blog
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={article.isFeatured}
              onChange={(e) => onChange({ isFeatured: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-[#E85D26]" />
          </label>
        </div>

        {/* SUBTÍTULO / RESUMO (EXCERPT) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Resumo / Subtítulo (Excerpt)
            </label>
            <span
              className={`text-[11px] font-semibold ${
                isExcerptOver
                  ? 'text-rose-500 font-bold'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {excerptLength}/{maxExcerptLength} caracteres
            </span>
          </div>
          <textarea
            rows={3}
            value={article.excerpt}
            onChange={handleExcerptChange}
            placeholder="Texto curto e objetivo que resume o tema principal do artigo para o card do feed e snippets de SEO..."
            className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] resize-none transition"
          />
          {isExcerptOver && (
            <p className="text-[11px] text-rose-500 mt-1">
              Recomendamos até 180 caracteres para melhor legibilidade nos cards de feed.
            </p>
          )}
        </div>

        {/* SLUG / URL AMIGÁVEL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Slug da URL (SEO)
            </label>
            <button
              type="button"
              onClick={handleRegenerateSlug}
              className="text-[11px] font-semibold text-[#E85D26] hover:underline cursor-pointer"
            >
              Regerar do Título
            </button>
          </div>
          <div className="flex items-center bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs">
            <span className="text-neutral-400 select-none mr-1 font-mono text-[11px]">
              jmmaster.com.br/blog/
            </span>
            <input
              type="text"
              value={article.slug}
              onChange={(e) => onChange({ slug: slugify(e.target.value) })}
              placeholder="url-amigavel-do-artigo"
              className="flex-1 bg-transparent text-neutral-900 dark:text-white font-mono text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. GESTÃO DE MÍDIA / CAPA */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
        <MediaUploader
          coverImage={article.coverImage}
          coverImageAlt={article.coverImageAlt}
          currentCategory={article.category}
          onCoverChange={(url, alt) => onChange({ coverImage: url, coverImageAlt: alt })}
          onInsertImageIntoContent={onInsertImageIntoContent}
        />
      </div>

      {/* 3. AUTORIA & PUBLICAÇÃO 100% AUTOMÁTICAS */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
            Autoria & Publicação
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Automático</span>
          </span>
        </div>

        {/* CARD DO AUTOR OFICIAL FIXO DA MARCA */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-lg bg-neutral-900 p-1 flex items-center justify-center border border-neutral-700 shrink-0 overflow-hidden">
            <Image
              src="/logos/Icone.png"
              alt="JM Master Group"
              fill
              className="object-contain p-1"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                JM Master Group
              </p>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-orange-600/10 text-[#E85D26] rounded border border-orange-500/20">
                OFICIAL
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              Especialistas em Mensageria & IA
            </p>
          </div>
        </div>

        {/* CARDS DINÂMICOS AUTOMÁTICOS: TEMPO DE LEITURA & DATA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          
          {/* TEMPO DE LEITURA AUTOMÁTICO */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 block">
              Tempo de Leitura
            </span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#E85D26]" />
              <span className="text-sm font-black text-[#E85D26]">
                {article.readingTimeMinutes || 1} min
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 block">
              Calculado automaticamente do texto
            </span>
          </div>

          {/* DATA DE PUBLICAÇÃO AUTOMÁTICA */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 block">
              Data de Publicação
            </span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('pt-BR') : 'Publicação Imediata'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
              Automático ao publicar
            </span>
          </div>

        </div>

      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CATEGORIA ESTILIZADO */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Excluir Categoria
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Esta ação removerá a categoria do sistema.
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Tem certeza que deseja apagar a categoria <strong className="text-[#E85D26] font-bold">"{categoryToDelete}"</strong>? Caso algum artigo esteja com ela selecionada, ele será reatribuído para a categoria oficial.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-lg shadow-rose-950/20 cursor-pointer"
              >
                Sim, Excluir Categoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
