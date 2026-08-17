'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Calendar,
  Save,
  CheckCircle2,
  Info,
  Edit,
  Eye,
  Columns,
  FileEdit,
} from 'lucide-react';
import { Article, ArticleCategory, ArticleStatus, ViewMode } from './types';
import {
  getStoredArticles,
  saveStoredArticles,
  OFFICIAL_AUTHOR,
  slugify,
  calculateReadingTime,
} from './mockData';
import ArticleList from './components/ArticleList';
import BlogEditor from './components/BlogEditor';
import ArticleMetadata from './components/ArticleMetadata';
import LivePreview from './components/LivePreview';
import FAQModule from './components/FAQModule';
import TrackingSettingsModal from './components/TrackingSettingsModal';

export default function BlogDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editorSubMode, setEditorSubMode] = useState<'editor_meta' | 'split' | 'preview_only'>('editor_meta');
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  // Carregar artigos reais da API do site oficial
  const loadPostsFromApi = async () => {
    try {
      const res = await fetch('/api/blog/posts', { cache: 'no-store' });
      const data = await res.json();
      const postsArray = data.posts || (Array.isArray(data) ? data : []);

      if (Array.isArray(postsArray)) {
        const mapped: Article[] = postsArray.map((p: any) => ({
          id: p.id,
          title: p.title || '',
          slug: p.slug || '',
          excerpt: p.excerpt || '',
          contentHtml: p.contentHtml || (Array.isArray(p.content) ? p.content.map((c: string) => `<p>${c}</p>`).join('') : ''),
          category: (p.category || 'WhatsApp API') as ArticleCategory,
          coverImage: p.coverImage || p.image || '',
          coverImageAlt: p.coverImageAlt || p.title || '',
          author: OFFICIAL_AUTHOR,
          publishedAt: p.publishedAt || (p.date ? new Date().toISOString() : undefined),
          readingTimeMinutes: p.readingTimeMinutes || parseInt(p.readTime) || 3,
          isFeatured: !!p.isFeatured,
          status: (p.status || 'published') as ArticleStatus,
          views: p.views || 0,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
          seo: p.seo || undefined,
          faqs: Array.isArray(p.faqs) ? p.faqs : [],
        }));

        setArticles(mapped);
        saveStoredArticles(mapped);
        return;
      }
    } catch (err) {
      console.error('Erro ao conectar com API de posts:', err);
    }

    const local = getStoredArticles();
    setArticles(local);
  };

  useEffect(() => {
    setIsMounted(true);
    loadPostsFromApi();
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sincronizar com a API real
  const syncWithApi = async (articleToSync: Article) => {
    try {
      await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleToSync),
      });
    } catch (e) {
      console.error('Erro de sincronização:', e);
    }
  };

  const handleNewArticle = () => {
    const newArt: Article = {
      id: `post-${Date.now()}`,
      title: '',
      slug: '',
      excerpt: '',
      contentHtml: '',
      category: 'WhatsApp API',
      coverImage: '',
      coverImageAlt: '',
      author: OFFICIAL_AUTHOR,
      publishedAt: undefined,
      readingTimeMinutes: 1,
      isFeatured: false,
      status: 'draft',
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      seo: {
        focusKeyphrase: '',
        metaTitle: '',
        metaDescription: '',
        canonicalUrl: '',
        noIndex: false,
      },
      faqs: [],
    };
    setCurrentArticle(newArt);
    setViewMode('editor');
    setEditorSubMode('editor_meta');
  };

  const handleEditArticle = (art: Article) => {
    setCurrentArticle({ ...art });
    setViewMode('editor');
    setEditorSubMode('editor_meta');
  };

  const handlePreviewFromList = (art: Article) => {
    setCurrentArticle({ ...art });
    setViewMode('preview');
  };

  const handleUpdateCurrentArticle = (updatedFields: Partial<Article>) => {
    if (!currentArticle) return;
    const updated = {
      ...currentArticle,
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    };
    setCurrentArticle(updated);

    // Atualização otimista
    const updatedList = articles.map((a) => (a.id === updated.id ? updated : a));
    if (!articles.some((a) => a.id === updated.id)) {
      updatedList.unshift(updated);
    }
    setArticles(updatedList);
    saveStoredArticles(updatedList);

    const now = new Date();
    setLastSavedTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleSaveDraft = async () => {
    if (!currentArticle) return;
    const finalArticle: Article = {
      ...currentArticle,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    handleUpdateCurrentArticle(finalArticle);
    await syncWithApi(finalArticle);
    showToast('Rascunho salvo com sucesso!');
  };

  const handleSchedule = async () => {
    if (!currentArticle) return;
    if (!currentArticle.title.trim()) {
      showToast('Por favor, defina um título para o artigo antes de agendar.', 'info');
      return;
    }
    const finalArticle: Article = {
      ...currentArticle,
      status: 'scheduled',
      publishedAt: new Date(Date.now() + 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    handleUpdateCurrentArticle(finalArticle);
    await syncWithApi(finalArticle);
    showToast('Artigo agendado para publicação automática!');
  };

  const handlePublish = async () => {
    if (!currentArticle) return;
    if (!currentArticle.title.trim()) {
      showToast('Por favor, informe um título para o artigo.', 'info');
      return;
    }
    if (!currentArticle.contentHtml.trim() || currentArticle.contentHtml === '<p><br></p>') {
      showToast('O corpo do artigo não pode estar vazio.', 'info');
      return;
    }

    const finalSlug = currentArticle.slug || slugify(currentArticle.title);
    const finalArticle: Article = {
      ...currentArticle,
      slug: finalSlug,
      status: 'published',
      publishedAt: currentArticle.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    handleUpdateCurrentArticle(finalArticle);
    await syncWithApi(finalArticle);
    showToast('🚀 Artigo publicado com sucesso no Blog oficial da JM Master Group!');
    
    // Retornar para a lista após breve confirmação
    setTimeout(() => {
      setViewMode('list');
    }, 1200);
  };

  const handleDeleteArticle = async (id: string) => {
    const updated = articles.filter((a) => a.id !== id);
    setArticles(updated);
    saveStoredArticles(updated);

    try {
      await fetch(`/api/blog/posts?id=${id}`, { method: 'DELETE' });
    } catch (e) {}

    if (currentArticle?.id === id) {
      setCurrentArticle(null);
      setViewMode('list');
    }
    showToast('Artigo removido com sucesso.', 'info');
  };

  const handleDuplicateArticle = async (art: Article) => {
    const duplicated: Article = {
      ...art,
      id: `post-${Date.now()}`,
      title: `${art.title} (Cópia)`,
      slug: `${art.slug}-copia`,
      status: 'draft',
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...articles];
    setArticles(updated);
    saveStoredArticles(updated);
    await syncWithApi(duplicated);
    showToast('Artigo duplicado com sucesso!');
  };

  const handleToggleFeatured = async (id: string) => {
    const target = articles.find((a) => a.id === id);
    if (!target) return;
    const updatedTarget = { ...target, isFeatured: !target.isFeatured };
    const updated = articles.map((a) => (a.id === id ? updatedTarget : a));
    setArticles(updated);
    saveStoredArticles(updated);
    if (currentArticle && currentArticle.id === id) {
      setCurrentArticle(updatedTarget);
    }
    await syncWithApi(updatedTarget);
    showToast(updatedTarget.isFeatured ? 'Artigo fixado como destaque no topo do blog!' : 'Destaque removido.');
  };

  if (!isMounted) {
    return <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 p-8" />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#f8fafc] text-neutral-900 dark:bg-neutral-950 dark:text-white min-h-screen transition-colors duration-300">
      {/* TOAST DE NOTIFICAÇÃO */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-3 rounded-2xl shadow-2xl border border-neutral-700 dark:border-neutral-200 flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-400 dark:text-sky-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 1. MODO LISTAGEM */}
      {viewMode === 'list' && (
        <ArticleList
          articles={articles}
          onNewArticle={handleNewArticle}
          onEditArticle={handleEditArticle}
          onDeleteArticle={handleDeleteArticle}
          onDuplicateArticle={handleDuplicateArticle}
          onToggleFeatured={handleToggleFeatured}
          onPreviewArticle={handlePreviewFromList}
          onOpenTracking={() => setIsTrackingOpen(true)}
        />
      )}

      {/* MODAL DE CONFIGURAÇÕES DE PIXELS & TAGS */}
      <TrackingSettingsModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        onSuccessToast={showToast}
      />

      {/* 2. MODO PRÉVIA TELA CHEIA */}
      {viewMode === 'preview' && currentArticle && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar à Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className="px-4 py-2 bg-[#E85D26] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar Artigo</span>
            </button>
          </div>
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 p-6 sm:p-10 shadow-xs">
            <LivePreview article={currentArticle} />
          </div>
        </div>
      )}

      {/* 3. MODO EDITOR COMPLETO COM WORKSPACE */}
      {viewMode === 'editor' && currentArticle && (
        <div className="space-y-6">
          {/* HEADER DO EDITOR */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs transition-colors duration-300">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </button>

              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
                  {currentArticle.title || 'Novo Artigo'}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  <span className="capitalize">{currentArticle.status === 'published' ? 'Publicado' : currentArticle.status === 'scheduled' ? 'Agendado' : 'Rascunho'}</span>
                  {lastSavedTime && <span>• Salvo às {lastSavedTime}</span>}
                </div>
              </div>
            </div>

            {/* SELETOR DE SUB-MODO & BOTÕES DE SALVAMENTO */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Abas de Visualização do Workspace */}
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditorSubMode('editor_meta')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    editorSubMode === 'editor_meta'
                      ? 'bg-[#E85D26] text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Editor & Meta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorSubMode('split')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    editorSubMode === 'split'
                      ? 'bg-[#E85D26] text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Lado a Lado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorSubMode('preview_only')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    editorSubMode === 'preview_only'
                      ? 'bg-[#E85D26] text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Prévia Live</span>
                </button>
              </div>

              {/* Botões de Ação */}
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-3 sm:px-4 py-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Rascunho</span>
              </button>

              <button
                type="button"
                onClick={handleSchedule}
                className="px-3 sm:px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agendar</span>
              </button>

              <button
                type="button"
                onClick={handlePublish}
                className="px-4 sm:px-5 py-2 bg-[#E85D26] hover:bg-orange-600 active:scale-95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-orange-950/20 cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publicar no Site</span>
              </button>
            </div>
          </div>

          {/* CORPO DO WORKSPACE DE EDIÇÃO */}
          {editorSubMode === 'editor_meta' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <BlogEditor
                  key={currentArticle.id}
                  title={currentArticle.title}
                  contentHtml={currentArticle.contentHtml}
                  onTitleChange={(title: string) => {
                    handleUpdateCurrentArticle({
                      title,
                      slug: currentArticle.slug || slugify(title),
                    });
                  }}
                  onContentChange={(contentHtml: string) => {
                    const time = calculateReadingTime(contentHtml);
                    handleUpdateCurrentArticle({ contentHtml, readingTimeMinutes: time });
                  }}
                />

                {/* FAQ & PERGUNTAS FREQUENTES (POSICIONADO ABAIXO DO TEXTO DO ARTIGO) */}
                <FAQModule
                  article={currentArticle}
                  onChange={handleUpdateCurrentArticle}
                />
              </div>

              <div className="lg:col-span-4 sticky top-6">
                <ArticleMetadata
                  article={currentArticle}
                  onChange={handleUpdateCurrentArticle}
                />
              </div>
            </div>
          )}

          {editorSubMode === 'split' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <div className="space-y-6">
                <BlogEditor
                  key={currentArticle.id}
                  title={currentArticle.title}
                  contentHtml={currentArticle.contentHtml}
                  onTitleChange={(title: string) => {
                    handleUpdateCurrentArticle({
                      title,
                      slug: currentArticle.slug || slugify(title),
                    });
                  }}
                  onContentChange={(contentHtml: string) => {
                    const time = calculateReadingTime(contentHtml);
                    handleUpdateCurrentArticle({ contentHtml, readingTimeMinutes: time });
                  }}
                />

                {/* FAQ & PERGUNTAS FREQUENTES */}
                <FAQModule
                  article={currentArticle}
                  onChange={handleUpdateCurrentArticle}
                />

                <ArticleMetadata
                  article={currentArticle}
                  onChange={handleUpdateCurrentArticle}
                />
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 p-6 sticky top-6 shadow-xs">
                <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Prévia em Tempo Real
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live
                  </span>
                </div>
                <LivePreview article={currentArticle} />
              </div>
            </div>
          )}

          {editorSubMode === 'preview_only' && (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 p-6 sm:p-10 shadow-xs">
              <LivePreview article={currentArticle} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
