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
import { COVER_PRESETS } from '../mockData';
import { ArticleCategory } from '../types';

interface MediaUploaderProps {
  coverImage: string;
  coverImageAlt: string;
  currentCategory: ArticleCategory;
  onCoverChange: (url: string, alt: string) => void;
  onInsertImageIntoContent?: (imageHtml: string) => void;
}

export default function MediaUploader({
  coverImage,
  coverImageAlt,
  currentCategory,
  onCoverChange,
  onInsertImageIntoContent,
}: MediaUploaderProps) {
  const [altText, setAltText] = useState(coverImageAlt || '');
  const [isDragging, setIsDragging] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showBodyImageModal, setShowBodyImageModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
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

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const defaultAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setAltText(defaultAlt);
      onCoverChange(result, defaultAlt);
    };
    reader.readAsDataURL(file);
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

  const handleSelectPreset = (preset: typeof COVER_PRESETS[0]) => {
    setAltText(preset.alt);
    onCoverChange(preset.url, preset.alt);
    setShowPresets(false);
  };

  const handleBodyFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBodyImgUrl(result);
      if (!bodyImgAlt) {
        setBodyImgAlt(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsDataURL(file);
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
    <div className="space-y-4">
      {/* CARD DE UPLOAD DA CAPA PRINCIPAL */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Imagem de Capa (Proporção 16:9)
        </label>

        {coverImage ? (
          <div className="space-y-3">
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 group shadow-xs bg-neutral-100 dark:bg-neutral-950">
              <Image
                src={coverImage}
                alt={altText || 'Capa do Artigo'}
                fill
                className="object-cover"
                unoptimized
              />

              <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white text-neutral-900 text-xs font-bold rounded-lg hover:bg-neutral-100 transition shadow cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Trocar Imagem</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPresets(true)}
                  className="px-3 py-1.5 bg-[#E85D26] text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition shadow cursor-pointer flex items-center gap-1.5"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Ver Templates</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCoverChange('', '')}
                  className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition shadow cursor-pointer"
                  title="Remover Imagem"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Input de Texto Alternativo (SEO) */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Texto Alternativo da Imagem (SEO / Alt Text):
              </label>
              <input
                type="text"
                value={altText}
                onChange={handleAltChange}
                placeholder="Descreva a imagem para motores de busca e acessibilidade..."
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
              />
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging
                ? 'border-[#E85D26] bg-orange-50/20 dark:bg-orange-950/20 scale-[0.99]'
                : 'border-neutral-300 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 hover:border-neutral-400 dark:hover:border-neutral-700'
            }`}
          >
            <div className="space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-neutral-400" />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Arraste uma imagem de capa aqui
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                PNG, JPG ou WebP (Recomendado: 1200 x 675 px)
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload do Arquivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPresets(true)}
                  className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Templates da Marca</span>
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
      </div>

      {/* BOTÃO PARA INSERIR IMAGEM NO CORPO */}
      {onInsertImageIntoContent && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowBodyImageModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-850 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-800 transition cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#E85D26]" />
            <span>Inserir Imagem no Corpo do Artigo</span>
          </button>
        </div>
      )}

      {/* MODAL DE PRESETS DE CAPAS (ISOLADO NO BODY VIA CREATEPORTAL) */}
      {showPresets && isMounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-[#E85D26]" />
                  <span>Templates Oficiais de Capa</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Imagens profissionais em proporção 16:9 alinhadas aos temas da JM Master Group
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPresets(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COVER_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="cursor-pointer border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden hover:border-[#E85D26] transition group bg-neutral-50 dark:bg-neutral-950 shadow-xs"
                >
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={preset.url}
                      alt={preset.alt}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                      unoptimized
                    />
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-600/10 text-[#E85D26] rounded">
                      {preset.category}
                    </span>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white mt-1.5 line-clamp-1">
                      {preset.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPresets(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#E85D26]" />
                <span>Inserir Imagem no Conteúdo</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBodyImageModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Origem da Imagem
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bodyImgUrl}
                    onChange={(e) => setBodyImgUrl(e.target.value)}
                    placeholder="Cole a URL da imagem ou faça upload..."
                    className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
                  />
                  <button
                    type="button"
                    onClick={() => bodyFileInputRef.current?.click()}
                    className="px-3 py-2 bg-neutral-800 dark:bg-neutral-700 text-white text-xs font-bold rounded-lg hover:opacity-90 transition shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload</span>
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
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Texto Alternativo (Alt Text)
                </label>
                <input
                  type="text"
                  value={bodyImgAlt}
                  onChange={(e) => setBodyImgAlt(e.target.value)}
                  placeholder="Descrição da imagem para acessibilidade e SEO..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Legenda (Opcional)
                </label>
                <input
                  type="text"
                  value={bodyImgCaption}
                  onChange={(e) => setBodyImgCaption(e.target.value)}
                  placeholder="Legenda exibida abaixo da imagem..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Alinhamento
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['center', 'full', 'left', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setBodyImgAlign(align)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition capitalize cursor-pointer ${
                        bodyImgAlign === align
                          ? 'bg-[#E85D26] text-white border-[#E85D26]'
                          : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      {align === 'center' ? 'Centro' : align === 'full' ? 'Largura Total' : align === 'left' ? 'Esquerda' : 'Direita'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowBodyImageModal(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInsertBodyImage}
                disabled={!bodyImgUrl}
                className="px-4 py-2 bg-[#E85D26] hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow cursor-pointer"
              >
                Inserir no Artigo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
