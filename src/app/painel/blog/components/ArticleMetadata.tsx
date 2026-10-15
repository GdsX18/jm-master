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
import { DEFAULT_CATEGORIES, slugify } from '../mockData';
import MediaUploader from './MediaUploader';
import SEOModule from './SEOModule';

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

  const [categoryError, setCategoryError] = useState('');

  // Categorias compartilhadas por todos os usuários (banco de dados)
  const loadCategories = async () => {
    try {
      const res = await fetch('/api/blog/categories', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.categories)) throw new Error(data.error || 'Erro ao carregar categorias');
      setCategories(data.categories);
    } catch (e: any) {
      setCategoryError(e.message);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    setCategoryError('');
    try {
      const res = await fetch('/api/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao criar categoria');
      await loadCategories();
      onChange({ category: data.name });
      setIsAddingCategory(false);
      setNewCategoryName('');
    } catch (e: any) {
      setCategoryError(e.message);
    }
  };

  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Exclui a categoria movendo os artigos que a usam para outra categoria
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const fallback = categories.find((c) => c !== categoryToDelete) || 'WhatsApp API';
    setCategoryError('');
    try {
      const res = await fetch(
        `/api/blog/categories?name=${encodeURIComponent(categoryToDelete)}&moveTo=${encodeURIComponent(fallback)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao excluir categoria');
      if (article.category === categoryToDelete) {
        onChange({ category: fallback });
      }
      await loadCategories();
    } catch (e: any) {
      setCategoryError(e.message);
    } finally {
      setCategoryToDelete(null);
    }
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
    <div className="space-y-4">
      {/* 1. METADADOS PRINCIPAIS */}
      <div className="jm-card">
        <div className="jm-card-header">
          <span className="jm-card-title">Configurações do artigo</span>
          <span className="text-xs text-jm-muted">SEO e classificação</span>
        </div>

        <div className="jm-card-body space-y-5">
          {/* CATEGORIA PRINCIPAL COM BOTÃO DE CRIAR NOVA CATEGORIA */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-medium text-jm-fg2">
                Categoria
              </label>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="jm-link flex cursor-pointer items-center gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  <span>Nova categoria</span>
                </button>
              )}
            </div>

            {/* INPUT PARA CRIAR NOVA CATEGORIA */}
            {categoryError && (
              <p className="mb-2 text-xs font-medium text-jm-danger-fg">{categoryError}</p>
            )}
            {isAddingCategory && (
              <div className="mb-3 space-y-1.5 rounded-[4px] border border-jm-border bg-jm-subtle p-3">
                <span className="block text-xs font-medium text-jm-fg2">
                  Nome da nova categoria
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
                    className="jm-input h-8 min-w-0 flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="jm-btn jm-btn-primary jm-btn-sm"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    className="jm-icon-btn"
                    aria-label="Cancelar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PILLS DAS CATEGORIAS */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((catName) => {
                const isSelected = article.category === catName;
                const isDefault = DEFAULT_CATEGORIES.includes(catName as any);
                return (
                  <div
                    key={catName}
                    onClick={() => onChange({ category: catName })}
                    className={`group relative flex h-7 cursor-pointer select-none items-center gap-1.5 rounded-[4px] border px-2.5 text-xs font-medium transition-colors duration-100 ${
                      isSelected
                        ? 'border-jm-primary bg-jm-primary text-jm-primary-fg'
                        : 'border-jm-border bg-jm-surface text-jm-fg2 hover:border-jm-border-strong hover:text-jm-fg'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-jm-accent-line' : 'bg-jm-border-strong'}`} />
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
                        className={`-mr-1 ml-0.5 cursor-pointer rounded-[3px] p-0.5 leading-none transition-colors ${
                          isSelected
                            ? 'text-white/75 hover:bg-white/15 hover:text-white'
                            : 'text-jm-muted hover:bg-jm-danger-bg hover:text-jm-danger-fg'
                        }`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOGGLE ARTIGO EM DESTAQUE */}
          <div className="flex items-center justify-between gap-3 rounded-[4px] border border-jm-border bg-jm-subtle px-3 py-2.5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-jm-fg">
                  Artigo em destaque
                </span>
                {article.isFeatured && (
                  <span className="jm-badge jm-badge-accent">
                    Destaque ativo
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-jm-muted">
                Exibe a badge laranja e fixa o artigo no topo do feed do blog
              </p>
            </div>

            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                checked={article.isFeatured}
                onChange={(e) => onChange({ isFeatured: e.target.checked })}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-jm-border-strong transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:bg-jm-primary peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-jm-ring" />
            </label>
          </div>

          {/* SUBTÍTULO / RESUMO (EXCERPT) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-[13px] font-medium text-jm-fg2">
                Resumo / subtítulo
              </label>
              <span
                className={`text-xs tabular-nums ${
                  isExcerptOver
                    ? 'font-medium text-jm-danger-fg'
                    : 'text-jm-muted'
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
              className="jm-input resize-none text-[13px]"
            />
            {isExcerptOver && (
              <p className="mt-1 text-xs text-jm-danger-fg">
                Recomendamos até 180 caracteres para melhor legibilidade nos cards de feed.
              </p>
            )}
          </div>

          {/* SLUG / URL AMIGÁVEL */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-[13px] font-medium text-jm-fg2">
                Slug da URL
              </label>
              <button
                type="button"
                onClick={handleRegenerateSlug}
                className="jm-link cursor-pointer text-xs"
              >
                Regerar do título
              </button>
            </div>
            <div className="flex h-9 items-center overflow-hidden rounded-[4px] border border-jm-border-strong bg-jm-surface text-xs focus-within:border-jm-primary focus-within:ring-2 focus-within:ring-jm-ring">
              <span className="flex h-full shrink-0 select-none items-center border-r border-jm-border bg-jm-subtle px-2.5 font-mono text-[11px] text-jm-muted">
                <span className="hidden sm:inline">www.jmmaster.com.br</span>/blog/
              </span>
              <input
                type="text"
                value={article.slug}
                onChange={(e) => onChange({ slug: slugify(e.target.value) })}
                placeholder="url-amigavel-do-artigo"
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 font-mono text-xs text-jm-fg placeholder:text-jm-placeholder focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. GESTÃO DE MÍDIA / CAPA */}
      <div className="jm-card">
        <MediaUploader
          coverImage={article.coverImage}
          coverImageAlt={article.coverImageAlt}
          currentCategory={article.category}
          onCoverChange={(url, alt) => onChange({ coverImage: url, coverImageAlt: alt })}
          onInsertImageIntoContent={onInsertImageIntoContent}
        />
      </div>

      {/* 3. MÓDULO DE SEO AVANÇADO (ESTILO YOAST SEO) */}
      <SEOModule article={article} onChange={onChange} />

      {/* 4. AUTORIA & PUBLICAÇÃO 100% AUTOMÁTICAS */}
      <div className="jm-card">
        <div className="jm-card-header">
          <span className="jm-card-title">Autoria e publicação</span>
          <span className="jm-badge jm-badge-success">
            <CheckCircle2 className="h-3 w-3" />
            <span>Automático</span>
          </span>
        </div>

        <div className="jm-card-body space-y-3">
          {/* CARD DO AUTOR OFICIAL FIXO DA MARCA */}
          <div className="flex items-center gap-3 rounded-[4px] border border-jm-border bg-jm-subtle p-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[4px] border border-jm-border bg-jm-side-bg">
              <Image
                src="/logos/Icone.png"
                alt="JM Master Group"
                fill
                className="object-contain p-1.5"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[13px] font-medium text-jm-fg">
                  JM Master Group
                </p>
                <span className="jm-badge jm-badge-primary">
                  Oficial
                </span>
              </div>
              <p className="truncate text-xs text-jm-muted">
                Especialistas em Mensageria & IA
              </p>
            </div>
          </div>

          {/* CARDS DINÂMICOS AUTOMÁTICOS: TEMPO DE LEITURA & DATA */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {/* TEMPO DE LEITURA AUTOMÁTICO */}
            <div className="space-y-1 rounded-[4px] border border-jm-border p-3">
              <span className="block text-xs text-jm-muted">
                Tempo de leitura
              </span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-jm-muted" />
                <span className="text-sm font-semibold tabular-nums text-jm-fg">
                  {article.readingTimeMinutes || 1} min
                </span>
              </div>
              <span className="block text-[11px] text-jm-muted">
                Calculado automaticamente do texto
              </span>
            </div>

            {/* DATA DE PUBLICAÇÃO AUTOMÁTICA */}
            <div className="space-y-1 rounded-[4px] border border-jm-border p-3">
              <span className="block text-xs text-jm-muted">
                Data de publicação
              </span>
              {article.status === 'published' ? (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-jm-muted" />
                  <span className="text-[13px] font-medium text-jm-fg">
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                  </span>
                </div>
              ) : (
                <input
                  type="datetime-local"
                  value={
                    article.publishedAt && article.status === 'scheduled'
                      ? new Date(new Date(article.publishedAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                      : ''
                  }
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  onChange={(e) =>
                    onChange({
                      publishedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      status: e.target.value ? 'scheduled' : 'draft',
                    })
                  }
                  className="jm-input h-8 px-2 text-xs"
                />
              )}
              <span className="block text-[11px] text-jm-muted">
                {article.status === 'published'
                  ? 'Publicado'
                  : 'Defina para usar “Agendar”; vazio = publicar agora'}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CATEGORIA */}
      {categoryToDelete && (
        <div className="jm-overlay">
          <div className="jm-modal sm:max-w-md">
            <div className="jm-modal-header">
              <div className="flex items-center gap-2.5">
                <Trash2 className="h-4 w-4 text-jm-danger-fg" />
                <h3 className="jm-modal-title">
                  Excluir categoria
                </h3>
              </div>
            </div>

            <div className="jm-modal-body space-y-2">
              <p className="text-xs text-jm-muted">
                Esta ação removerá a categoria do sistema.
              </p>
              <p className="text-sm leading-relaxed text-jm-fg2">
                Tem certeza que deseja apagar a categoria <strong className="font-semibold text-jm-fg">"{categoryToDelete}"</strong>? Caso algum artigo esteja com ela selecionada, ele será reatribuído para a categoria oficial.
              </p>
            </div>

            <div className="jm-modal-footer">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="jm-btn jm-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="jm-btn jm-btn-danger-solid"
              >
                Sim, excluir categoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
