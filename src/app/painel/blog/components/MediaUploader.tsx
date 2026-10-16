'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  LayoutTemplate,
  Camera,
  X,
} from 'lucide-react';
import { COVER_PRESETS } from '../constants';
import { ArticleCategory } from '../types';
import { useNotify } from '../../components/ui/Notifications';

interface MediaUploaderProps {
  coverImage: string;
  coverImageAlt: string;
  currentCategory: ArticleCategory;
  onCoverChange: (url: string, alt: string) => void;
  onInsertImageIntoContent?: (imageHtml: string) => void;
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export default function MediaUploader({
  coverImage,
  coverImageAlt,
  currentCategory,
  onCoverChange,
  onInsertImageIntoContent,
}: MediaUploaderProps) {
  const { toast, confirm: confirmDialog } = useNotify();
  const [altText, setAltText] = useState(coverImageAlt || '');
  const [isDragging, setIsDragging] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showBodyImageModal, setShowBodyImageModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBody, setIsUploadingBody] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Body image modal state
  const [bodyImgUrl, setBodyImgUrl] = useState('');
  const [bodyImgAlt, setBodyImgAlt] = useState('');
  const [bodyImgCaption, setBodyImgCaption] = useState('');
  const [bodyImgAlign, setBodyImgAlign] = useState<'center' | 'full' | 'left' | 'right'>('center');
  const bodyFileInputRef = useRef<HTMLInputElement>(null);

  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAltText(val);
    onCoverChange(coverImage, val);
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      toast.error('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('A imagem deve ter no máximo 4 MB. Comprima a imagem e tente novamente.');
      return;
    }
    const defaultAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setAltText(defaultAlt);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'blog-images');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Falha no envio da imagem.');
      }
      onCoverChange(data.url, defaultAlt);
    } catch (err: any) {
      // Sem "plano B" em base64: a imagem precisa estar no Storage para aparecer no site
      console.error('Erro no upload para o Supabase Storage:', err);
      toast.error(`Não foi possível enviar a imagem: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const [library, setLibrary] = useState<{ name: string; url: string; size: number }[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');

  const loadLibrary = async () => {
    setLibraryLoading(true);
    setLibraryError('');
    try {
      const res = await fetch('/api/media', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao carregar a biblioteca');
      setLibrary(data.files);
    } catch (e: any) {
      setLibraryError(e.message);
    } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => {
    if (showPresets) loadLibrary();
  }, [showPresets]);

  const handleSelectLibraryImage = (url: string) => {
    onCoverChange(url, altText);
    setShowPresets(false);
  };

  const handleDeleteLibraryImage = async (name: string) => {
    if (!(await confirmDialog({ title: 'Excluir imagem', message: 'Excluir esta imagem da biblioteca? Artigos que ainda a usam ficarão sem a imagem.', confirmLabel: 'Excluir', variant: 'danger' }))) return;
    const res = await fetch(`/api/media?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      toast.error(data.error || 'Erro ao excluir imagem');
      return;
    }
    setLibrary((prev) => prev.filter((f) => f.name !== name));
  };

  const handleSelectPreset = (preset: typeof COVER_PRESETS[0]) => {
    setAltText(preset.alt);
    onCoverChange(preset.url, preset.alt);
    setShowPresets(false);
  };

  const handleBodyFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      toast.error('Selecione uma imagem válida.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('A imagem deve ter no máximo 4 MB.');
      return;
    }
    const defaultAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!bodyImgAlt) {
      setBodyImgAlt(defaultAlt);
    }
    setIsUploadingBody(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'blog-images');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Falha no envio da imagem.');
      }
      setBodyImgUrl(data.url);
    } catch (err: any) {
      console.error('Erro no upload da imagem:', err);
      toast.error(`Não foi possível enviar a imagem: ${err.message}`);
    } finally {
      setIsUploadingBody(false);
    }
  };

  const handleInsertBodyImage = () => {
    if (!bodyImgUrl) return;
    const alignClasses = {
      center: 'my-6 mx-auto max-w-2xl text-center',
      full: 'my-8 w-full text-center',
      left: 'my-4 md:float-left md:mr-6 max-w-md text-center',
      right: 'my-4 md:float-right md:ml-6 max-w-md text-center',
    };

    const captionHtml = bodyImgCaption
      ? `<figcaption class="text-xs text-neutral-500 dark:text-neutral-400 mt-2 italic">${bodyImgCaption}</figcaption>`
      : '';

    const figureHtml = `
      <figure class="article-figure ${alignClasses[bodyImgAlign]}">
        <img src="${bodyImgUrl}" alt="${bodyImgAlt || 'Imagem do artigo'}" class="rounded-xl shadow-md max-w-full h-auto mx-auto border border-neutral-200 dark:border-neutral-800" />
        ${captionHtml}
      </figure>
      <p><br></p>
    `;

    if (onInsertImageIntoContent) {
      onInsertImageIntoContent(figureHtml);
    }

    setBodyImgUrl('');
    setBodyImgAlt('');
    setBodyImgCaption('');
    setShowBodyImageModal(false);
  };


  return (
    <div>
      {/* CARD DE UPLOAD DA CAPA PRINCIPAL */}
      <div className="jm-card-header">
        <span className="jm-card-title">Imagem de capa</span>
        <span className="text-xs text-jm-muted">Proporção 16:9</span>
      </div>

      <div className="jm-card-body space-y-3">
        {coverImage ? (
          <div className="space-y-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-[4px] border border-jm-border bg-jm-subtle">
              <Image
                src={coverImage}
                alt={altText || 'Capa do Artigo'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="jm-btn jm-btn-secondary jm-btn-sm"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Trocar imagem</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPresets(true)}
                className="jm-btn jm-btn-secondary jm-btn-sm"
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                <span>Biblioteca</span>
              </button>
              <button
                type="button"
                onClick={() => onCoverChange('', '')}
                className="jm-btn jm-btn-ghost jm-btn-sm ml-auto text-jm-danger-fg hover:bg-jm-danger-bg hover:text-jm-danger-fg"
                title="Remover Imagem"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remover</span>
              </button>
            </div>

            {/* Input de Texto Alternativo (SEO) */}
            <div>
              <label className="jm-label text-xs">
                Texto alternativo (alt)
              </label>
              <input
                type="text"
                value={altText}
                onChange={handleAltChange}
                placeholder="Descreva a imagem para motores de busca e acessibilidade..."
                className="jm-input text-[13px]"
              />
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`rounded-[4px] border border-dashed px-4 py-6 text-center transition-colors duration-100 ${
              isDragging
                ? 'border-jm-primary bg-jm-primary-soft'
                : 'border-jm-border-strong bg-jm-subtle hover:border-jm-muted'
            }`}
          >
            <div className="space-y-1.5">
              <ImageIcon className="mx-auto h-6 w-6 text-jm-muted" strokeWidth={1.5} />
              <p className="text-[13px] font-medium text-jm-fg">
                Arraste uma imagem de capa aqui
              </p>
              <p className="text-xs text-jm-muted">
                PNG, JPG ou WebP (recomendado: 1200 x 675 px)
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="jm-btn jm-btn-primary jm-btn-sm"
                >
                  <UploadCloud className={`h-3.5 w-3.5 ${isUploading ? 'animate-pulse' : ''}`} />
                  <span>{isUploading ? 'Enviando...' : 'Enviar arquivo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPresets(true)}
                  className="jm-btn jm-btn-secondary jm-btn-sm"
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  <span>Biblioteca</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        {/* BOTÃO PARA INSERIR IMAGEM NO CORPO */}
        {onInsertImageIntoContent && (
          <button
            type="button"
            onClick={() => setShowBodyImageModal(true)}
            className="jm-btn jm-btn-secondary w-full"
          >
            <Camera className="h-4 w-4" />
            <span>Inserir imagem no corpo do artigo</span>
          </button>
        )}
      </div>

      {/* MODAL DE PRESETS DE CAPAS (ISOLADO NO BODY VIA CREATEPORTAL) */}
      {showPresets && isMounted && createPortal(
        <div className="jm-overlay z-[99999]">
          <div className="jm-modal sm:max-w-2xl">
            <div className="jm-modal-header">
              <div className="min-w-0">
                <h3 className="jm-modal-title">
                  Biblioteca de imagens
                </h3>
                <p className="text-xs text-jm-muted">
                  Imagens profissionais em proporção 16:9 alinhadas aos temas da JM Master Group
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPresets(false)}
                className="jm-icon-btn"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="jm-modal-body space-y-5">
              <div className="space-y-2">
                <h4 className="jm-eyebrow">Imagens já enviadas</h4>
                {libraryLoading && <p className="text-xs text-jm-muted">Carregando biblioteca...</p>}
                {libraryError && <p className="text-xs font-medium text-jm-danger-fg">{libraryError}</p>}
                {!libraryLoading && !libraryError && library.length === 0 && (
                  <p className="text-xs text-jm-muted">Nenhuma imagem enviada ainda.</p>
                )}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {library.map((file) => (
                    <div
                      key={file.name}
                      className="group relative overflow-hidden rounded-[4px] border border-jm-border transition-colors hover:border-jm-primary"
                    >
                      <button type="button" onClick={() => handleSelectLibraryImage(file.url)} className="relative block aspect-video w-full cursor-pointer">
                        <Image src={file.url} alt={file.name} fill className="object-cover" sizes="200px" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLibraryImage(file.name)}
                        title="Excluir da biblioteca"
                        className="absolute right-1 top-1 cursor-pointer rounded-[3px] bg-black/65 p-1 text-white opacity-100 transition-opacity hover:bg-[#B42318] focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="jm-eyebrow">Templates</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {COVER_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className="cursor-pointer overflow-hidden rounded-[4px] border border-jm-border bg-jm-surface transition-colors hover:border-jm-primary"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-jm-subtle">
                        <Image
                          src={preset.url}
                          alt={preset.alt}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="space-y-1 px-3 py-2">
                        <span className="jm-badge jm-badge-neutral">
                          {preset.category}
                        </span>
                        <h4 className="line-clamp-1 text-[13px] font-medium text-jm-fg">
                          {preset.name}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="jm-modal-footer">
              <button
                type="button"
                onClick={() => setShowPresets(false)}
                className="jm-btn jm-btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PARA INSERÇÃO DE IMAGEM NO CORPO (ISOLADO NO BODY VIA CREATEPORTAL) */}
      {showBodyImageModal && isMounted && createPortal(
        <div className="jm-overlay z-[99999]">
          <div className="jm-modal">
            <div className="jm-modal-header">
              <h3 className="jm-modal-title">
                Inserir imagem no conteúdo
              </h3>
              <button
                type="button"
                onClick={() => setShowBodyImageModal(false)}
                className="jm-icon-btn"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="jm-modal-body space-y-4">
              <div>
                <label className="jm-label">
                  Origem da imagem
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bodyImgUrl}
                    onChange={(e) => setBodyImgUrl(e.target.value)}
                    placeholder="Cole a URL da imagem ou faça upload..."
                    className="jm-input min-w-0 flex-1"
                  />
                  <button
                    type="button"
                    disabled={isUploadingBody}
                    onClick={() => bodyFileInputRef.current?.click()}
                    className="jm-btn jm-btn-secondary shrink-0"
                  >
                    <UploadCloud className={`h-3.5 w-3.5 ${isUploadingBody ? 'animate-pulse' : ''}`} />
                    <span>{isUploadingBody ? 'Enviando...' : 'Upload'}</span>
                  </button>
                  <input
                    ref={bodyFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleBodyFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="jm-label">
                  Texto alternativo (alt)
                </label>
                <input
                  type="text"
                  value={bodyImgAlt}
                  onChange={(e) => setBodyImgAlt(e.target.value)}
                  placeholder="Descrição da imagem para acessibilidade e SEO..."
                  className="jm-input"
                />
              </div>

              <div>
                <label className="jm-label">
                  Legenda <span className="font-normal text-jm-muted">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={bodyImgCaption}
                  onChange={(e) => setBodyImgCaption(e.target.value)}
                  placeholder="Legenda exibida abaixo da imagem..."
                  className="jm-input"
                />
              </div>

              <div>
                <label className="jm-label">
                  Alinhamento
                </label>
                <div className="jm-segmented grid w-full grid-cols-2 sm:grid-cols-4">
                  {(['center', 'full', 'left', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setBodyImgAlign(align)}
                      className={`jm-segment justify-center ${
                        bodyImgAlign === align ? 'jm-segment-active' : ''
                      }`}
                    >
                      {align === 'center' ? 'Centro' : align === 'full' ? 'Largura Total' : align === 'left' ? 'Esquerda' : 'Direita'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="jm-modal-footer">
              <button
                type="button"
                onClick={() => setShowBodyImageModal(false)}
                className="jm-btn jm-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInsertBodyImage}
                disabled={!bodyImgUrl}
                className="jm-btn jm-btn-primary"
              >
                Inserir no artigo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
