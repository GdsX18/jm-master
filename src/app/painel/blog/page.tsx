'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Article, ArticleCategory, ArticleStatus, ArticleSEO, ViewMode } from './types';
import {
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

function mapServerPosts(postsArray: any[]): Article[] {
  return postsArray.map((p: any) => {
    const rawSeo = p.seo && typeof p.seo === 'object' ? p.seo : {};
    
    // Normalizar keywords
    let keywords = '';
    if (Array.isArray(rawSeo.keywords)) {
      keywords = rawSeo.keywords.join(', ');
    } else if (typeof rawSeo.keywords === 'string') {
      keywords = rawSeo.keywords;
    } else if (Array.isArray(p.tags) && p.tags.length > 0) {
      keywords = p.tags.join(', ');
    }

    const seo: ArticleSEO = {
      focusKeyphrase: rawSeo.focusKeyphrase || '',
      metaTitle: rawSeo.metaTitle || rawSeo.seoTitle || p.title || '',
      seoTitle: rawSeo.seoTitle || rawSeo.metaTitle || p.title || '',
      metaDescription: rawSeo.metaDescription || rawSeo.seoDescription || p.excerpt || '',
      seoDescription: rawSeo.seoDescription || rawSeo.metaDescription || p.excerpt || '',
      canonicalUrl: rawSeo.canonicalUrl || (p.slug ? `https://www.jmmaster.com.br/blog/${p.slug}` : ''),
      noIndex: !!rawSeo.noIndex,
      noFollow: !!rawSeo.noFollow,
      keywords: keywords,
      ogTitle: rawSeo.ogTitle || rawSeo.metaTitle || rawSeo.seoTitle || p.title || '',
      ogDescription: rawSeo.ogDescription || rawSeo.metaDescription || rawSeo.seoDescription || p.excerpt || '',
      ogImage: rawSeo.ogImage || p.coverImage || p.image || '',
    };

    return {
      id: p.id,
      title: p.title || '',
      slug: p.slug || '',
      excerpt: p.excerpt || '',
      contentHtml: p.contentHtml || (Array.isArray(p.content) ? p.content.map((c: string) => `<p>${c}</p>`).join('') : ''),
      category: (p.category || 'WhatsApp API') as ArticleCategory,
      coverImage: p.coverImage || p.image || '',
      coverImageAlt: p.coverImageAlt || p.title || '',
      author: {
        name: p.author?.name || OFFICIAL_AUTHOR.name,
        role: p.author?.role || OFFICIAL_AUTHOR.role,
        avatarUrl: p.author?.avatarUrl || p.author?.avatar || OFFICIAL_AUTHOR.avatarUrl,
        isOfficialBrand: true,
      },
      publishedAt: p.publishedAt || (p.date ? new Date().toISOString() : undefined),
      readingTimeMinutes: p.readingTimeMinutes || parseInt(p.readTime) || 3,
      isFeatured: !!p.featured || !!p.isFeatured,
      status: (p.status || 'published') as ArticleStatus,
      views: p.views || 0,
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
      seo,
      faqs: Array.isArray(p.faqs) ? p.faqs : [],
    };
  });
}

export default function BlogDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editorSubMode, setEditorSubMode] = useState<'editor_meta' | 'split' | 'preview_only'>('editor_meta');
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const dirtyRef = useRef(false);
  const markDirty = (value: boolean) => {
    dirtyRef.current = value;
    setIsDirty(value);
  };

  // Carregar artigos reais da API do site oficial
  const loadPostsFromApi = async (showRefreshToast = false) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/blog/posts?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data.posts)) {
        throw new Error(data.error || 'Não foi possível carregar os artigos do servidor.');
      }
      setArticles(mapServerPosts(data.posts));
      if (showRefreshToast) {
        showToast('Artigos sincronizados em tempo real com o servidor!', 'success');
      }
    } catch (err: any) {
      console.error('Erro ao conectar com API de posts:', err);
      showToast(err.message || 'Não foi possível carregar os artigos do servidor.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadPostsFromApi();

    // Sincronização em tempo real quando o usuário volta à aba do navegador
    const handleFocus = () => {
      if (!dirtyRef.current) loadPostsFromApi();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !dirtyRef.current) {
        loadPostsFromApi();
      }
    };
    // Aviso ao fechar/recarregar a página com alterações não salvas
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sincronizar com a API real
  const syncWithApi = async (
    articleToSync: Article
  ): Promise<{ success: boolean; message?: string; posts?: Article[]; saved?: Article }> => {
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleToSync),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao sincronizar com o banco de dados.');
      }
      if (Array.isArray(data.posts)) {
        setArticles(mapServerPosts(data.posts));
      }
      const saved = data.post ? mapServerPosts([data.post])[0] : undefined;
      // O artigo aberto passa a usar o id e o slug definitivos do servidor (evita criar duplicatas)
      if (saved) {
        setCurrentArticle((current) =>
          current && (current.id === articleToSync.id || current.slug === articleToSync.slug)
            ? { ...saved, seo: current.seo }
            : current
        );
      }
      return { success: true, message: data.message, posts: data.posts, saved };
    } catch (e: any) {
      console.error('Erro de sincronização:', e);
      return { success: false, message: e.message || 'Erro de conexão com o servidor' };
    }
  };

  const prepareArticleForSync = (baseArticle: Article, status: ArticleStatus): Article => {
    const finalSlug = baseArticle.slug || slugify(baseArticle.title);
    const existingSeo = baseArticle.seo || ({} as any);

    const finalSeo: ArticleSEO = {
      focusKeyphrase: existingSeo.focusKeyphrase || '',
      metaTitle: (existingSeo.metaTitle || existingSeo.seoTitle || baseArticle.title || '').trim() || baseArticle.title,
      seoTitle: (existingSeo.seoTitle || existingSeo.metaTitle || baseArticle.title || '').trim() || baseArticle.title,
      metaDescription: (existingSeo.metaDescription || existingSeo.seoDescription || baseArticle.excerpt || '').trim() || baseArticle.excerpt,
      seoDescription: (existingSeo.seoDescription || existingSeo.metaDescription || baseArticle.excerpt || '').trim() || baseArticle.excerpt,
      canonicalUrl: (existingSeo.canonicalUrl || '').trim() || `https://www.jmmaster.com.br/blog/${finalSlug}`,
      noIndex: !!existingSeo.noIndex,
      noFollow: !!existingSeo.noFollow,
      keywords: existingSeo.keywords || '',
      ogTitle: (existingSeo.ogTitle || existingSeo.metaTitle || baseArticle.title || '').trim() || baseArticle.title,
      ogDescription: (existingSeo.ogDescription || existingSeo.metaDescription || baseArticle.excerpt || '').trim() || baseArticle.excerpt,
      ogImage: (existingSeo.ogImage || baseArticle.coverImage || '').trim() || baseArticle.coverImage,
    };

    return {
      ...baseArticle,
      slug: finalSlug,
      status,
      updatedAt: new Date().toISOString(),
      seo: finalSeo,
    };
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
        seoTitle: '',
        metaDescription: '',
        seoDescription: '',
        canonicalUrl: '',
        noIndex: false,
        noFollow: false,
        keywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
      },
      faqs: [],
    };
    setCurrentArticle(newArt);
    setViewMode('editor');
    setEditorSubMode('editor_meta');
  };

  const handleEditArticle = (art: Article) => {
    const currentSeo = art.seo || ({} as any);
    
    let keywordsStr = '';
    if (Array.isArray(currentSeo.keywords)) {
      keywordsStr = currentSeo.keywords.join(', ');
    } else if (typeof currentSeo.keywords === 'string') {
      keywordsStr = currentSeo.keywords;
    }

    const structuredSeo: ArticleSEO = {
      focusKeyphrase: currentSeo.focusKeyphrase || '',
      metaTitle: currentSeo.metaTitle || currentSeo.seoTitle || art.title || '',
      seoTitle: currentSeo.seoTitle || currentSeo.metaTitle || art.title || '',
      metaDescription: currentSeo.metaDescription || currentSeo.seoDescription || art.excerpt || '',
      seoDescription: currentSeo.seoDescription || currentSeo.metaDescription || art.excerpt || '',
      canonicalUrl: currentSeo.canonicalUrl || (art.slug ? `https://www.jmmaster.com.br/blog/${art.slug}` : ''),
      noIndex: !!currentSeo.noIndex,
      noFollow: !!currentSeo.noFollow,
      keywords: keywordsStr,
      ogTitle: currentSeo.ogTitle || currentSeo.metaTitle || art.title || '',
      ogDescription: currentSeo.ogDescription || currentSeo.metaDescription || art.excerpt || '',
      ogImage: currentSeo.ogImage || art.coverImage || '',
    };

    setCurrentArticle({
      ...art,
      seo: structuredSeo,
    });
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
    markDirty(true);
  };

  // Voltar à lista avisando se há alterações não salvas
  const handleBackToList = () => {
    if (dirtyRef.current && !confirm('Há alterações não salvas neste artigo. Sair mesmo assim e descartar?')) return;
    markDirty(false);
    setViewMode('list');
    loadPostsFromApi();
  };

  const markSaved = () => {
    markDirty(false);
    setLastSavedTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleSaveDraft = async () => {
    if (!currentArticle) return;
    setIsSaving(true);
    const finalArticle = prepareArticleForSync(currentArticle, 'draft');
    const res = await syncWithApi(finalArticle);
    setIsSaving(false);
    if (res.success) {
      markSaved();
      showToast('Rascunho salvo e sincronizado com sucesso!', 'success');
    } else {
      showToast(`Falha ao salvar rascunho: ${res.message}`, 'info');
    }
  };

  const handleSchedule = async () => {
    if (!currentArticle) return;
    if (!currentArticle.title.trim()) {
      showToast('Por favor, defina um título para o artigo antes de agendar.', 'info');
      return;
    }
    const when = currentArticle.publishedAt ? new Date(currentArticle.publishedAt) : null;
    if (!when || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      showToast('Escolha uma data e hora futuras em "Data de Publicação" para agendar.', 'info');
      return;
    }
    setIsSaving(true);
    const scheduledArticle = prepareArticleForSync(currentArticle, 'scheduled');
    const res = await syncWithApi(scheduledArticle);
    setIsSaving(false);
    if (res.success) {
      markSaved();
      showToast(
        `Artigo agendado para ${when.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}. Ele entra no ar automaticamente.`,
        'success'
      );
    } else {
      showToast(`Falha ao agendar: ${res.message}`, 'info');
    }
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

    setIsSaving(true);
    // A data de publicação é definida no servidor (agora, na primeira publicação)
    const finalArticle = prepareArticleForSync(currentArticle, 'published');

    const res = await syncWithApi(finalArticle);
    setIsSaving(false);

    if (res.success) {
      markSaved();
      showToast('🚀 Artigo publicado com sucesso e sincronizado globalmente!', 'success');
      setTimeout(() => {
        setViewMode('list');
      }, 1000);
    } else {
      showToast(`Falha ao publicar no servidor: ${res.message}`, 'info');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/blog/posts?id=${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Não foi possível excluir o artigo.');
      if (Array.isArray(data.posts)) {
        setArticles(mapServerPosts(data.posts));
      } else {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
      showToast('Artigo removido do site.', 'info');
      if (currentArticle?.id === id) {
        markDirty(false);
        setCurrentArticle(null);
        setViewMode('list');
      }
    } catch (e: any) {
      showToast(`Falha ao excluir: ${e.message}`, 'info');
    }
  };

  const handleDuplicateArticle = async (art: Article) => {
    const duplicatedSlug = `${art.slug}-copia-${Date.now().toString().slice(-4)}`;
    const duplicated: Article = {
      ...art,
      id: `post-${Date.now()}`,
      title: `${art.title} (Cópia)`,
      slug: duplicatedSlug,
      status: 'draft',
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      seo: art.seo ? {
        ...art.seo,
        metaTitle: `${art.seo.metaTitle || art.title} (Cópia)`,
        canonicalUrl: `https://www.jmmaster.com.br/blog/${duplicatedSlug}`,
      } : undefined,
    };
    const res = await syncWithApi(duplicated);
    if (res.success) {
      showToast('Artigo duplicado como rascunho!', 'success');
    } else {
      showToast(`Falha ao duplicar: ${res.message}`, 'info');
    }
  };

  const handleToggleFeatured = async (id: string) => {
    const target = articles.find((a) => a.id === id);
    if (!target) return;
    const updatedTarget = { ...target, isFeatured: !target.isFeatured };
    const res = await syncWithApi(updatedTarget);
    if (res.success) {
      if (currentArticle && currentArticle.id === id) {
        setCurrentArticle(updatedTarget);
      }
      showToast(updatedTarget.isFeatured ? 'Artigo fixado como destaque no topo do blog!' : 'Destaque removido.');
    } else {
      showToast(`Falha ao alterar destaque: ${res.message}`, 'info');
    }
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
          onRefresh={() => loadPostsFromApi(true)}
          isLoading={isLoading}
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
              onClick={handleBackToList}
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
                onClick={handleBackToList}
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
                  {isDirty ? (
                    <span className="text-amber-500 font-bold">• Alterações não salvas</span>
                  ) : (
                    lastSavedTime && <span>• Salvo no servidor às {lastSavedTime}</span>
                  )}
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
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="px-3 sm:px-4 py-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Rascunho'}</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSchedule}
                className="px-3 sm:px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Agendando...' : 'Agendar'}</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handlePublish}
                className="px-4 sm:px-5 py-2 bg-[#E85D26] hover:bg-orange-600 active:scale-95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-orange-950/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Publicando...' : 'Publicar no Site'}</span>
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
