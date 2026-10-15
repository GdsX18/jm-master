'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  PenTool,
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
  CheckCircle2,
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
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Publicado
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            Rascunho
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Agendado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-jm-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-jm-text flex items-center gap-2.5">
            <PenTool className="w-6 h-6 text-jm-orange" />
            <span>Criador de Blog</span>
          </h1>
          <p className="text-xs text-jm-muted mt-1">
            Redija, formate e publique artigos oficiais diretamente no blog da JM Master Group.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="jm-btn jm-btn-secondary"
              title="Sincronizar artigos em tempo real com o banco de dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-jm-orange ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>
          )}

          {onOpenTracking && (
            <button
              type="button"
              onClick={onOpenTracking}
              className="jm-btn jm-btn-secondary"
            >
              <Radio className="w-3.5 h-3.5 text-jm-orange" />
              <span>Pixels & Tags</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewArticle}
            className="jm-btn jm-btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Artigo</span>
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS REAIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="jm-card p-5">
          <p className="text-xs font-medium text-jm-muted">
            Total de Artigos
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-jm-text mt-1.5">
            {totalArticles}
          </p>
        </div>

        <div className="jm-card p-5">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Artigos Publicados
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-jm-text mt-1.5">
            {publishedCount}
          </p>
        </div>

        <div className="jm-card p-5">
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
            Agendados
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-jm-text mt-1.5">
            {scheduledCount}
          </p>
        </div>

        <div className="jm-card p-5">
          <p className="text-xs font-medium text-jm-muted">
            Rascunhos em Edição
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-jm-text mt-1.5">
            {draftCount}
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="jm-card p-3 sm:p-4 flex flex-col md:flex-row items-center gap-3">
        {/* BUSCA */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-jm-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar artigos por título, resumo ou palavra-chave..."
            className="jm-input pl-10 text-xs w-full"
          />
        </div>

        {/* FILTRO DE CATEGORIA */}
        <div className="w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="jm-input text-xs w-full md:w-48 font-semibold cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((catName) => (
              <option key={catName} value={catName}>
                {catName}
              </option>
            ))}
          </select>
        </div>

        {/* FILTRO DE STATUS */}
        <div className="w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="jm-input text-xs w-full md:w-40 font-semibold cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="published">Publicados</option>
            <option value="scheduled">Agendados</option>
            <option value="draft">Rascunhos</option>
          </select>
        </div>
      </div>

      {/* LISTAGEM DE ARTIGOS */}
      <div className="jm-card overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 mx-auto text-jm-muted" />
            <h3 className="text-sm font-semibold text-jm-text">
              Nenhum artigo encontrado
            </h3>
            <p className="text-xs text-jm-muted max-w-sm mx-auto">
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
                className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 transition"
              >
                {/* INFORMAÇÕES DO ARTIGO */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  
                  {/* CAPA MINIATURA */}
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-neutral-900 border border-jm-border shrink-0">
                    {art.coverImage ? (
                      <Image
                        src={art.coverImage}
                        alt={art.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-jm-muted font-semibold">
                        SEM CAPA
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-jm-blue-50 text-jm-blue-900 dark:bg-neutral-800 dark:text-neutral-300 border border-jm-border">
                        {art.category}
                      </span>
                      {art.isFeatured && (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded">
                          DESTAQUE
                        </span>
                      )}
                      {getStatusBadge(art.status)}
                    </div>

                    <h3
                      onClick={() => onEditArticle(art)}
                      className="text-sm sm:text-base font-semibold text-jm-text truncate cursor-pointer hover:text-jm-orange transition"
                    >
                      {art.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-jm-muted">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        <span>{art.author.name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{art.readingTimeMinutes} min</span>
                      </span>
                      <span className="flex items-center gap-1" title="Visualizações no site">
                        <Eye className="w-3 h-3" />
                        <span>{(art.views || 0).toLocaleString('pt-BR')} visualizações</span>
                      </span>
                      {art.publishedAt && (
                        <span className="flex items-center gap-1">
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
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-jm-border">
                  <button
                    type="button"
                    onClick={() => onPreviewArticle(art)}
                    title="Pré-visualizar Artigo"
                    className="p-2 text-jm-muted hover:text-jm-text hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Ver Prévia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFeatured(art.id)}
                    title={art.isFeatured ? 'Remover Destaque' : 'Marcar como Destaque'}
                    className={`p-2 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                      art.isFeatured
                        ? 'text-jm-orange bg-orange-50 dark:bg-orange-950/30'
                        : 'text-jm-muted hover:text-jm-text hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" fill={art.isFeatured ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicateArticle(art)}
                    title="Duplicar Artigo"
                    className="p-2 text-jm-muted hover:text-jm-text hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditArticle(art)}
                    className="jm-btn jm-btn-secondary jm-btn-sm"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => setArticleToDelete(art)}
                    title="Excluir Artigo"
                    className="p-2 text-jm-muted hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE ARTIGO ESTILIZADO */}
      {articleToDelete && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="jm-card border border-jm-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-jm-text">
                  Excluir Artigo do Blog
                </h3>
                <p className="text-xs text-jm-muted">
                  Esta ação removerá o artigo permanentemente.
                </p>
              </div>
            </div>

            <p className="text-xs text-jm-muted leading-relaxed">
              Deseja realmente excluir o artigo <strong className="text-jm-text font-semibold">"{articleToDelete.title || 'Sem Título'}"</strong>? Todos os dados associados serão apagados.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
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
                className="jm-btn bg-rose-600 hover:bg-rose-700 text-white"
              >
                Sim, Excluir Artigo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
