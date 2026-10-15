'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Star,
  Copy,
  Trash2,
  Clock,
  Calendar,
  User as UserIcon,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { Article, ArticleCategory, ArticleStatus } from '../types';
import { getStoredCategories } from '../mockData';

interface ArticleListProps {
  articles: Article[];
  onNewArticle: () => void;
  onEditArticle: (article: Article) => void;
  onPreviewArticle: (article: Article) => void;
  onDeleteArticle: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onDuplicateArticle: (article: Article) => void;
  onOpenTracking?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function ArticleList({
  articles,
  onNewArticle,
  onEditArticle,
  onPreviewArticle,
  onDeleteArticle,
  onToggleFeatured,
  onDuplicateArticle,
  onOpenTracking,
  onRefresh,
  isLoading = false,
}: ArticleListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  useEffect(() => {
    setCategories(getStoredCategories());
  }, []);

  // Filtros combinados
  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || art.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'all' || art.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Métricas do Blog
  const totalArticles = articles.length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;
  const scheduledCount = articles.filter((a) => a.status === 'scheduled').length;

  const getStatusBadge = (status: ArticleStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="jm-badge jm-badge-success">
            Publicado
          </span>
        );
      case 'draft':
        return (
          <span className="jm-badge jm-badge-neutral">
            Rascunho
          </span>
        );
      case 'scheduled':
        return (
          <span className="jm-badge jm-badge-primary">
            Agendado
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">

      {/* CABEÇALHO DO MÓDULO */}
      <div className="jm-page-header">
        <div>
          <h1 className="jm-page-title">
            Blog
          </h1>
          <p className="jm-page-desc">
            Redija, formate e publique artigos oficiais diretamente no blog da JM Master Group.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="jm-btn jm-btn-secondary"
              title="Sincronizar artigos em tempo real com o banco de dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          )}

          {onOpenTracking && (
            <button
              type="button"
              onClick={onOpenTracking}
              className="jm-btn jm-btn-secondary"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Pixels & Tags</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewArticle}
            className="jm-btn jm-btn-accent shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo artigo</span>
          </button>
        </div>
      </div>

      {/* MÉTRICAS REAIS */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-jm-border bg-jm-border lg:grid-cols-4">
        <div className="bg-jm-surface px-4 py-3.5 md:px-5">
          <p className="jm-stat-label">
            Total de artigos
          </p>
          <p className="jm-stat-value">
            {totalArticles}
          </p>
        </div>

        <div className="bg-jm-surface px-4 py-3.5 md:px-5">
          <p className="jm-stat-label flex items-center gap-1.5">
            <span className="jm-dot text-jm-success-fg" />
            Publicados
          </p>
          <p className="jm-stat-value">
            {publishedCount}
          </p>
        </div>

        <div className="bg-jm-surface px-4 py-3.5 md:px-5">
          <p className="jm-stat-label flex items-center gap-1.5">
            <span className="jm-dot text-jm-primary-text" />
            Agendados
          </p>
          <p className="jm-stat-value">
            {scheduledCount}
          </p>
        </div>

        <div className="bg-jm-surface px-4 py-3.5 md:px-5">
          <p className="jm-stat-label flex items-center gap-1.5">
            <span className="jm-dot text-jm-muted" />
            Rascunhos
          </p>
          <p className="jm-stat-value">
            {draftCount}
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        {/* BUSCA */}
        <div className="relative w-full flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jm-placeholder" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou resumo..."
            className="jm-input pl-9"
          />
        </div>

        {/* FILTRO DE CATEGORIA */}
        <div className="grid grid-cols-2 gap-2 md:flex">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="jm-input cursor-pointer md:w-48"
          >
            <option value="all">Todas as categorias</option>
            {categories.map((catName) => (
              <option key={catName} value={catName}>
                {catName}
              </option>
            ))}
          </select>

          {/* FILTRO DE STATUS */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="jm-input cursor-pointer md:w-40"
          >
            <option value="all">Todos os status</option>
            <option value="published">Publicados</option>
            <option value="scheduled">Agendados</option>
            <option value="draft">Rascunhos</option>
          </select>
        </div>
      </div>

      {/* LISTAGEM DE ARTIGOS */}
      <div className="jm-card overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="jm-empty">
            <FileText className="h-6 w-6 text-jm-placeholder" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-jm-fg">
              Nenhum artigo encontrado
            </h3>
            <p className="max-w-sm text-xs text-jm-muted">
              {search || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Tente ajustar os filtros ou os termos da sua pesquisa.'
                : 'Clique no botão acima para criar o primeiro artigo do blog oficial.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-jm-border">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                className="flex flex-col items-start justify-between gap-3 px-4 py-3 transition-colors duration-75 hover:bg-jm-hover md:flex-row md:items-center md:px-5"
              >
                {/* INFORMAÇÕES DO ARTIGO */}
                <div className="flex min-w-0 flex-1 items-start gap-3.5">

                  {/* CAPA MINIATURA */}
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-[4px] border border-jm-border bg-jm-subtle sm:h-[60px] sm:w-24">
                    {art.coverImage ? (
                      <Image
                        src={art.coverImage}
                        alt={art.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-jm-placeholder">
                        Sem capa
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getStatusBadge(art.status)}
                      <span className="jm-badge jm-badge-neutral">
                        {art.category}
                      </span>
                      {art.isFeatured && (
                        <span className="jm-badge jm-badge-accent">
                          Destaque
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onEditArticle(art)}
                      className="cursor-pointer truncate text-sm font-semibold text-jm-fg hover:text-jm-primary-text hover:underline underline-offset-2"
                    >
                      {art.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-jm-muted">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        <span>{art.author.name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{art.readingTimeMinutes} min</span>
                      </span>
                      <span className="flex items-center gap-1 tabular-nums" title="Visualizações no site">
                        <Eye className="w-3 h-3" />
                        <span>{(art.views || 0).toLocaleString('pt-BR')} visualizações</span>
                      </span>
                      {art.publishedAt && (
                        <span className="flex items-center gap-1 tabular-nums">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {art.status === 'scheduled' ? 'Agendado: ' : ''}
                            {new Date(art.publishedAt).toLocaleString('pt-BR', { dateStyle: 'short', ...(art.status === 'scheduled' ? { timeStyle: 'short' as const } : {}) })}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="flex w-full items-center justify-end gap-1 md:w-auto">
                  <button
                    type="button"
                    onClick={() => onPreviewArticle(art)}
                    title="Pré-visualizar Artigo"
                    className="jm-btn jm-btn-ghost jm-btn-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Prévia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFeatured(art.id)}
                    title={art.isFeatured ? 'Remover Destaque' : 'Marcar como Destaque'}
                    className={`jm-icon-btn ${
                      art.isFeatured
                        ? 'text-jm-accent-line hover:text-jm-accent-line'
                        : ''
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" fill={art.isFeatured ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicateArticle(art)}
                    title="Duplicar Artigo"
                    className="jm-icon-btn"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setArticleToDelete(art)}
                    title="Excluir Artigo"
                    className="jm-icon-btn hover:bg-jm-danger-bg hover:text-jm-danger-fg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditArticle(art)}
                    className="jm-btn jm-btn-secondary jm-btn-sm ml-1"
                  >
                    Editar
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE ARTIGO */}
      {articleToDelete && typeof window !== 'undefined' && createPortal(
        <div className="jm-overlay">
          <div className="jm-modal sm:max-w-md" role="alertdialog" aria-modal="true">
            <div className="jm-modal-header">
              <h3 className="jm-modal-title">
                Excluir artigo do blog
              </h3>
            </div>

            <div className="jm-modal-body space-y-2">
              <p className="text-sm leading-relaxed text-jm-fg2">
                Deseja realmente excluir o artigo <strong className="font-semibold text-jm-fg">"{articleToDelete.title || 'Sem Título'}"</strong>? Todos os dados associados serão apagados.
              </p>
              <p className="text-xs text-jm-muted">
                Esta ação removerá o artigo permanentemente.
              </p>
            </div>

            <div className="jm-modal-footer">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                className="jm-btn jm-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteArticle(articleToDelete.id);
                  setArticleToDelete(null);
                }}
                className="jm-btn jm-btn-danger-solid"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir artigo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
