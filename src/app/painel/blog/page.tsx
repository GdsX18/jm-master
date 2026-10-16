'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Calendar,
  Save,
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
} from './constants';
import ArticleList from './components/ArticleList';
import BlogEditor from './components/BlogEditor';
import ArticleMetadata from './components/ArticleMetadata';
import LivePreview from './components/LivePreview';
import FAQModule from './components/FAQModule';
import TrackingSettingsModal from './components/TrackingSettingsModal';
import BlogAnalytics from './components/BlogAnalytics';
import { peekCache, setCache } from '../lib/cache';
import { useNotify } from '../components/ui/Notifications';
import { clearQueryParams, useQueryParams } from '../hooks/useQueryParams';

// Rascunhos são salvos sozinhos alguns segundos depois da última alteração
const AUTOSAVE_DELAY_MS = 20_000;

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

const POSTS_CACHE_KEY = '/api/blog/posts';

export default function BlogDashboardPage() {
  const { toast, confirm } = useNotify();
  const params = useQueryParams();
  const [listTab, setListTab] = useState<'artigos' | 'desempenho'>('artigos');
  const [autoSaving, setAutoSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editorSubMode, setEditorSubMode] = useState<'editor_meta' | 'split' | 'preview_only'>('editor_meta');
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
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
      setCache(POSTS_CACHE_KEY, data.posts);
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
    // Mostra a última lista conhecida na hora; a busca abaixo atualiza em segundo plano
    const cachedPosts = peekCache<any[]>(POSTS_CACHE_KEY);
    if (cachedPosts) setArticles(mapServerPosts(cachedPosts));
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

  // Avisos no sistema global de notificações do painel
  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    if (type === 'success') toast.success(text);
    else if (/falha|erro|não foi possível/i.test(text)) toast.error(text);
    else toast.info(text);
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
      const saved = data.post ? mapServerPosts([data.post])[0] : undefined;
      // O servidor devolve só o artigo salvo: atualiza a lista localmente
      if (Array.isArray(data.posts)) {
        setArticles(mapServerPosts(data.posts));
      } else if (saved) {
        setArticles((list) => {
          const rest = list.filter((a) => a.id !== saved.id && a.id !== articleToSync.id);
          return [saved, ...rest];
        });
      }
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
  const handleBackToList = async () => {
    if (
      dirtyRef.current &&
      !(await confirm({
        title: 'Descartar alterações?',
        message: 'Há alterações não salvas neste artigo. Sair mesmo assim e descartar?',
        confirmLabel: 'Sair sem salvar',
        variant: 'warning',
      }))
    )
      return;
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

  // Atalhos vindos do dashboard: ?new=1 abre um artigo novo; ?tab=desempenho abre as métricas
  useEffect(() => {
    if (!params) return;
    if (params.get('tab') === 'desempenho') setListTab('desempenho');
    if (params.get('new') === '1') handleNewArticle();
    if (params.get('tab') || params.get('new')) clearQueryParams('tab', 'new');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Salvamento automático de rascunhos (artigos publicados/agendados só salvam pelo botão, para não alterar o site sem querer)
  useEffect(() => {
    if (viewMode !== 'editor' || !currentArticle || !isDirty || isSaving) return;
    if (currentArticle.status !== 'draft' || !currentArticle.title.trim()) return;
    const timer = setTimeout(async () => {
      setAutoSaving(true);
      const res = await syncWithApi(prepareArticleForSync(currentArticle, 'draft'));
      setAutoSaving(false);
      if (res.success) markSaved();
      else toast.error('Falha no salvamento automático', res.message);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentArticle, isDirty, viewMode, isSaving]);

  if (!isMounted) {
    return <div className="min-h-screen bg-jm-bg" />;
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] min-h-screen px-4 py-5 text-jm-fg sm:px-6 lg:px-8 lg:py-7">
      {/* 1. MODO LISTAGEM */}
      {viewMode === 'list' && (
        <div className="jm-tabs mb-5">
          <button onClick={() => setListTab('artigos')} className={`jm-tab ${listTab === 'artigos' ? 'jm-tab-active' : ''}`}>
            Artigos
          </button>
          <button onClick={() => setListTab('desempenho')} className={`jm-tab ${listTab === 'desempenho' ? 'jm-tab-active' : ''}`}>
            Desempenho & leads
          </button>
        </div>
      )}
      {viewMode === 'list' && listTab === 'desempenho' && <BlogAnalytics onEditArticle={(id) => {
        const art = articles.find((a) => a.id === id);
        if (art) handleEditArticle(art);
      }} />}
      {viewMode === 'list' && listTab === 'artigos' && (
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
          <div className="flex items-center justify-between gap-3 border-b border-jm-border pb-4">
            <button
              type="button"
              onClick={handleBackToList}
              className="jm-btn jm-btn-secondary"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar à lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className="jm-btn jm-btn-primary"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar artigo</span>
            </button>
          </div>
          <div className="jm-card overflow-hidden p-4 sm:p-8">
            <LivePreview article={currentArticle} />
          </div>
        </div>
      )}

      {/* 3. MODO EDITOR COMPLETO COM WORKSPACE */}
      {viewMode === 'editor' && currentArticle && (
        <div className="space-y-5">
          {/* HEADER DO EDITOR */}
          <div className="flex flex-col gap-3 border-b border-jm-border pb-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className="jm-btn jm-btn-secondary"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </button>

              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold text-jm-fg sm:max-w-md md:max-w-lg">
                  {currentArticle.title || 'Novo Artigo'}
                </h2>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-jm-muted">
                  <span>{currentArticle.status === 'published' ? 'Publicado' : currentArticle.status === 'scheduled' ? 'Agendado' : 'Rascunho'}</span>
                  {autoSaving ? (
                    <span>• Salvando automaticamente...</span>
                  ) : isDirty ? (
                    <span className="font-medium text-jm-warning-fg">
                      • Alterações não salvas{currentArticle.status === 'draft' && currentArticle.title.trim() ? ' (salvamento automático em instantes)' : ''}
                    </span>
                  ) : (
                    lastSavedTime && <span>• Salvo no servidor às {lastSavedTime}</span>
                  )}
                </div>
              </div>
            </div>

            {/* SELETOR DE SUB-MODO & BOTÕES DE SALVAMENTO */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Abas de Visualização do Workspace */}
              <div className="jm-segmented max-w-full overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setEditorSubMode('editor_meta')}
                  className={`jm-segment ${editorSubMode === 'editor_meta' ? 'jm-segment-active' : ''}`}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorSubMode('split')}
                  className={`jm-segment ${editorSubMode === 'split' ? 'jm-segment-active' : ''}`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Lado a Lado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorSubMode('preview_only')}
                  className={`jm-segment ${editorSubMode === 'preview_only' ? 'jm-segment-active' : ''}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Prévia</span>
                </button>
              </div>

              {/* Botões de Ação */}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="jm-btn jm-btn-secondary"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Salvando...' : 'Salvar rascunho'}</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSchedule}
                className="jm-btn jm-btn-secondary"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Agendando...' : 'Agendar'}</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handlePublish}
                className="jm-btn jm-btn-accent"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Publicando...' : 'Publicar no site'}</span>
              </button>
            </div>
          </div>

          {/* CORPO DO WORKSPACE DE EDIÇÃO */}
          {editorSubMode === 'editor_meta' && (
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
              <div className="space-y-5 lg:col-span-8">
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

              <div className="lg:sticky lg:top-6 lg:col-span-4">
                <ArticleMetadata
                  article={currentArticle}
                  onChange={handleUpdateCurrentArticle}
                />
              </div>
            </div>
          )}

          {editorSubMode === 'split' && (
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
              <div className="space-y-5">
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

              <div className="jm-card overflow-hidden xl:sticky xl:top-6">
                <div className="jm-card-header">
                  <span className="jm-card-title">Prévia em tempo real</span>
                  <span className="jm-badge jm-badge-success">
                    <span className="jm-dot" />
                    Ao vivo
                  </span>
                </div>
                <div className="p-4 sm:p-6">
                  <LivePreview article={currentArticle} />
                </div>
              </div>
            </div>
          )}

          {editorSubMode === 'preview_only' && (
            <div className="jm-card overflow-hidden p-4 sm:p-8">
              <LivePreview article={currentArticle} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
