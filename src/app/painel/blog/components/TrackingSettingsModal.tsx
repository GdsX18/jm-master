'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sliders,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code2,
  BarChart3,
  Globe,
  Sparkles,
  Save,
  Radio,
} from 'lucide-react';

interface TrackingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export default function TrackingSettingsModal({
  isOpen,
  onClose,
  onSuccessToast,
}: TrackingSettingsModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'pixels' | 'scripts'>('pixels');

  const [formData, setFormData] = useState({
    gtmId: '',
    gaId: '',
    metaPixelId: '',
    tiktokPixelId: '',
    customHeaderScript: '',
    customBodyScript: '',
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Carrega configurações atuais do banco Supabase
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/settings/tracking')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setFormData({
              gtmId: data.settings.gtmId || '',
              gaId: data.settings.gaId || '',
              metaPixelId: data.settings.metaPixelId || '',
              tiktokPixelId: data.settings.tiktokPixelId || '',
              customHeaderScript: data.settings.customHeaderScript || '',
              customBodyScript: data.settings.customBodyScript || '',
            });
          }
        })
        .catch((err) => console.error('Erro ao buscar configurações:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        if (onSuccessToast) {
          onSuccessToast('Configurações de Pixels e Tags salvas com sucesso!');
        }
        onClose();
      } else {
        alert('Erro ao salvar: ' + (data.error || 'Tente novamente'));
      }
    } catch (e: any) {
      alert('Erro de conexão ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#E85D26]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Pixels & Tags de Rastreamento</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Online
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Configure Meta Pixel, Google Analytics e tags para todo o site oficial.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ABAS DE NAVEGAÇÃO */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 bg-white dark:bg-neutral-900">
          <button
            type="button"
            onClick={() => setActiveTab('pixels')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'pixels'
                ? 'border-[#E85D26] text-[#E85D26]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Pixels & IDs de Ferramentas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scripts')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'scripts'
                ? 'border-[#E85D26] text-[#E85D26]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Scripts Customizados (HTML/JS)</span>
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL (COM SCROLL) */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white dark:bg-neutral-900">
          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-400 font-semibold animate-pulse">
              Carregando configurações do banco...
            </div>
          ) : activeTab === 'pixels' ? (
            <div className="space-y-5">
              
              {/* 1. META / FACEBOOK PIXEL */}
              <div className="bg-neutral-50 dark:bg-neutral-950/60 p-4.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔵</span>
                    <label className="text-xs font-bold text-neutral-900 dark:text-white">
                      Meta Pixel ID (Facebook & Instagram Ads)
                    </label>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">Recomendado</span>
                </div>
                <input
                  type="text"
                  value={formData.metaPixelId}
                  onChange={(e) => setFormData({ ...formData, metaPixelId: e.target.value })}
                  placeholder="Ex: 123456789012345"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] transition font-mono"
                />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Rastreia conversões de anúncios e gera públicos de remarketing no Gerenciador de Anúncios da Meta.
                </p>
              </div>

              {/* 2. GOOGLE TAG MANAGER */}
              <div className="bg-neutral-50 dark:bg-neutral-950/60 p-4.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔷</span>
                    <label className="text-xs font-bold text-neutral-900 dark:text-white">
                      Google Tag Manager (GTM ID)
                    </label>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">Contêiner</span>
                </div>
                <input
                  type="text"
                  value={formData.gtmId}
                  onChange={(e) => setFormData({ ...formData, gtmId: e.target.value })}
                  placeholder="Ex: GTM-XXXXXXX"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] transition font-mono"
                />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Permite gerenciar todas as tags do Google e ferramentas terceiras em um único local.
                </p>
              </div>

              {/* 3. GOOGLE ANALYTICS 4 */}
              <div className="bg-neutral-50 dark:bg-neutral-950/60 p-4.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📊</span>
                    <label className="text-xs font-bold text-neutral-900 dark:text-white">
                      Google Analytics 4 (ID de Medição GA4)
                    </label>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">Métricas</span>
                </div>
                <input
                  type="text"
                  value={formData.gaId}
                  onChange={(e) => setFormData({ ...formData, gaId: e.target.value })}
                  placeholder="Ex: G-XXXXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] transition font-mono"
                />
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Monitora visualizações de páginas, tempo de leitura de posts e comportamento dos visitantes.
                </p>
              </div>

              {/* 4. TIKTOK PIXEL */}
              <div className="bg-neutral-50 dark:bg-neutral-950/60 p-4.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎵</span>
                    <label className="text-xs font-bold text-neutral-900 dark:text-white">
                      TikTok Pixel ID (Opcional)
                    </label>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">Ads</span>
                </div>
                <input
                  type="text"
                  value={formData.tiktokPixelId}
                  onChange={(e) => setFormData({ ...formData, tiktokPixelId: e.target.value })}
                  placeholder="Ex: CXXXXXXXXXXXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] transition font-mono"
                />
              </div>

            </div>
          ) : (
            <div className="space-y-5">
              
              {/* SCRIPT HEADER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#E85D26]" />
                    <span>Scripts adicionais no Cabeçalho (&lt;head&gt;)</span>
                  </label>
                  <span className="text-[10px] text-neutral-400">HTML / JavaScript</span>
                </div>
                <textarea
                  rows={5}
                  value={formData.customHeaderScript}
                  onChange={(e) => setFormData({ ...formData, customHeaderScript: e.target.value })}
                  placeholder="<!-- Cole aqui scripts como Hotjar, Microsoft Clarity, RD Station... -->&#10;<script>...</script>"
                  className="w-full p-3 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] font-mono leading-relaxed"
                />
              </div>

              {/* SCRIPT BODY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#E85D26]" />
                    <span>Scripts adicionais no Corpo (&lt;body&gt;)</span>
                  </label>
                  <span className="text-[10px] text-neutral-400">HTML / NoScript</span>
                </div>
                <textarea
                  rows={5}
                  value={formData.customBodyScript}
                  onChange={(e) => setFormData({ ...formData, customBodyScript: e.target.value })}
                  placeholder="<!-- Cole aqui tags que devem rodar no body -->&#10;<script>...</script>"
                  className="w-full p-3 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] font-mono leading-relaxed"
                />
              </div>

            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Sparkles className="w-4 h-4 text-[#E85D26]" />
            <span className="hidden sm:inline">Salvo com criptografia no Supabase.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="px-5 py-2.5 bg-[#E85D26] hover:bg-orange-600 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-orange-900/20 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
