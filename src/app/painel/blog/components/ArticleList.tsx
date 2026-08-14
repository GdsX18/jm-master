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
          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Publicado
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">
            Rascunho
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Agendado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <PenTool className="w-7 h-7 text-[#E85D26]" />
            <span>Criador de Blog</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Redija, formate e publique artigos oficiais diretamente no blog da JM Master Group.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenTracking && (
            <button
              type="button"
              onClick={onOpenTracking}
              className="bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 font-bold text-xs sm:text-sm px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Radio className="w-4 h-4 text-[#E85D26]" />
              <span>Pixels & Tags</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewArticle}
            className="bg-[#E85D26] hover:bg-orange-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CRIAR NOVO ARTIGO</span>
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS REAIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Total de Artigos
          </p>
          <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {totalArticles}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Artigos Publicados
          </p>
          <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {publishedCount}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Agendados
          </p>
          <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {scheduledCount}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Rascunhos em Edição
          </p>
          <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {draftCount}
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* BUSCA */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar artigos por título, resumo ou palavra-chave..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] transition"
          />
        </div>

        {/* FILTRO DE CATEGORIA */}
        <div className="w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-48 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26] cursor-pointer"
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
            className="w-full md:w-40 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26] cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="published">Publicados</option>
            <option value="scheduled">Agendados</option>
            <option value="draft">Rascunhos</option>
          </select>
        </div>
      </div>

      {/* LISTAGEM DE ARTIGOS */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 mx-auto text-neutral-400" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Nenhum artigo encontrado
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              {search || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Tente ajustar os filtros ou os termos da sua pesquisa.'
                : 'Clique no botão acima para criar o primeiro artigo do blog oficial.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-850/40 transition"
              >
                {/* INFORMAÇÕES DO ARTIGO */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  
                  {/* CAPA MINIATURA */}
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shrink-0">
                    {art.coverImage ? (
                      <Image
                        src={art.coverImage}
                        alt={art.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500 font-bold">
                        SEM CAPA
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {art.category}
                      </span>
                      {art.isFeatured && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#E85D26] text-white rounded">
                          DESTAQUE
                        </span>
                      )}
                      {getStatusBadge(art.status)}
                    </div>

                    <h3
                      onClick={() => onEditArticle(art)}
                      className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate cursor-pointer hover:text-[#E85D26] transition"
                    >
                      {art.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        <span>{art.author.name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{art.readingTimeMinutes} min</span>
                      </span>
                      {art.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(art.publishedAt).toLocaleDateString('pt-BR')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AÇÕES */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => onPreviewArticle(art)}
                    title="Pré-visualizar Artigo"
                    className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Ver Prévia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFeatured(art.id)}
                    title={art.isFeatured ? 'Remover Destaque' : 'Marcar como Destaque'}
                    className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      art.isFeatured
                        ? 'text-[#E85D26] bg-orange-500/10'
                        : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" fill={art.isFeatured ? '#E85D26' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicateArticle(art)}
                    title="Duplicar Artigo"
                    className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditArticle(art)}
                    className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => setArticleToDelete(art)}
                    title="Excluir Artigo"
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-xs font-bold transition cursor-pointer"
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Excluir Artigo do Blog
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Esta ação removerá o artigo permanentemente.
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Deseja realmente excluir o artigo <strong className="text-neutral-900 dark:text-white font-bold">"{articleToDelete.title || 'Sem Título'}"</strong>? Todos os dados associados serão apagados.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteArticle(articleToDelete.id);
                  setArticleToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-lg shadow-rose-950/20 cursor-pointer"
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
