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
import { useNotify } from '../../components/ui/Notifications';

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
  const { toast } = useNotify();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'pixels' | 'scripts'>('pixels');
  // Permissões vindas do servidor: IDs exigem "Gerenciamento estrutural"; scripts, Super administrador
  const [canEdit, setCanEdit] = useState(false);
  const [canEditScripts, setCanEditScripts] = useState(false);

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
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.success) throw new Error(data.error || 'Erro ao carregar configurações');
          return data;
        })
        .then((data) => {
          setCanEdit(!!data.canEdit);
          setCanEditScripts(!!data.canEditScripts);
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
        .catch((err) => {
          console.error('Erro ao buscar configurações:', err);
          toast.error(`${err.message}. Feche e tente novamente antes de salvar, para não sobrescrever as tags atuais.`);
          onClose();
        })
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
        toast.error('Erro ao salvar: ' + (data.error || 'Tente novamente'));
      }
    } catch (e: any) {
      toast.error('Erro de conexão ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div className="jm-overlay !z-[99999]">
      <div className="jm-modal sm:max-w-2xl">
        
        {/* HEADER */}
        <div className="jm-modal-header">
          <div className="flex items-center gap-3">
            <div className="jm-icon-chip jm-icon-chip-accent">
              <Radio className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="jm-modal-title flex items-center gap-2">
                <span>Pixels & Tags de Rastreamento</span>
                <span className="jm-badge jm-badge-success">
                  Online
                </span>
              </h3>
              <p className="text-xs text-jm-muted mt-0.5">
                Configure Meta Pixel, Google Analytics e tags para todo o site oficial.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="jm-icon-btn"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ABAS DE NAVEGAÇÃO */}
        <div className="jm-tabs shrink-0 px-4 pt-3 md:px-5">
          <button
            type="button"
            onClick={() => setActiveTab('pixels')}
            className={`jm-tab ${
              activeTab === 'pixels'
                ? 'jm-tab-active'
                : ''
            }`}
          >
            <BarChart3 className="h-4 w-4" strokeWidth={1.75} />
            <span>Pixels e IDs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scripts')}
            className={`jm-tab ${
              activeTab === 'scripts'
                ? 'jm-tab-active'
                : ''
            }`}
          >
            <Code2 className="h-4 w-4" strokeWidth={1.75} />
            <span>Scripts (HTML/JS)</span>
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL (COM SCROLL) */}
        <div className="jm-modal-body space-y-5">
          {loading ? (
            <div className="jm-empty">
              Carregando configurações do banco...
            </div>
          ) : activeTab === 'pixels' ? (
            <div className="space-y-4">
              
              {/* 1. META / FACEBOOK PIXEL */}
              <div className="space-y-1.5 border-b border-jm-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[13px] font-medium text-jm-fg">
                      Meta Pixel ID (Facebook & Instagram Ads)
                    </label>
                  </div>
                  <span className="jm-badge jm-badge-neutral">Recomendado</span>
                </div>
                <input
                  type="text"
                  value={formData.metaPixelId}
                  onChange={(e) => setFormData({ ...formData, metaPixelId: e.target.value })}
                  placeholder="Ex: 123456789012345"
                  className="jm-input font-mono"
                />
                <p className="jm-help">
                  Rastreia conversões de anúncios e gera públicos de remarketing no Gerenciador de Anúncios da Meta.
                </p>
              </div>

              {/* 2. GOOGLE TAG MANAGER */}
              <div className="space-y-1.5 border-b border-jm-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[13px] font-medium text-jm-fg">
                      Google Tag Manager (GTM ID)
                    </label>
                  </div>
                  <span className="jm-badge jm-badge-neutral">Contêiner</span>
                </div>
                <input
                  type="text"
                  value={formData.gtmId}
                  onChange={(e) => setFormData({ ...formData, gtmId: e.target.value })}
                  placeholder="Ex: GTM-XXXXXXX"
                  className="jm-input font-mono"
                />
                <p className="jm-help">
                  Permite gerenciar todas as tags do Google e ferramentas terceiras em um único local.
                </p>
              </div>

              {/* 3. GOOGLE ANALYTICS 4 */}
              <div className="space-y-1.5 border-b border-jm-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[13px] font-medium text-jm-fg">
                      Google Analytics 4 (ID de Medição GA4)
                    </label>
                  </div>
                  <span className="jm-badge jm-badge-neutral">Métricas</span>
                </div>
                <input
                  type="text"
                  value={formData.gaId}
                  onChange={(e) => setFormData({ ...formData, gaId: e.target.value })}
                  placeholder="Ex: G-XXXXXXXXXX"
                  className="jm-input font-mono"
                />
                <p className="jm-help">
                  Monitora visualizações de páginas, tempo de leitura de posts e comportamento dos visitantes.
                </p>
              </div>

              {/* 4. TIKTOK PIXEL */}
              <div className="space-y-1.5 border-b border-jm-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-[13px] font-medium text-jm-fg">
                      TikTok Pixel ID (Opcional)
                    </label>
                  </div>
                  <span className="jm-badge jm-badge-neutral">Ads</span>
                </div>
                <input
                  type="text"
                  value={formData.tiktokPixelId}
                  onChange={(e) => setFormData({ ...formData, tiktokPixelId: e.target.value })}
                  placeholder="Ex: CXXXXXXXXXXXXXXXXX"
                  className="jm-input font-mono"
                />
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              
              {/* SCRIPT HEADER */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="jm-label !mb-0 flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-jm-muted" strokeWidth={1.75} />
                    <span>Scripts adicionais no Cabeçalho (&lt;head&gt;)</span>
                  </label>
                  <span className="text-[11px] text-jm-muted">HTML / JavaScript</span>
                </div>
                <textarea
                  rows={5}
                  value={formData.customHeaderScript}
                  onChange={(e) => setFormData({ ...formData, customHeaderScript: e.target.value })}
                  placeholder="<!-- Cole aqui scripts como Hotjar, Microsoft Clarity, RD Station... -->&#10;<script>...</script>"
                  className="jm-input font-mono text-xs disabled:opacity-60"
                  disabled={!canEditScripts}
                />
                {!canEditScripts && (
                  <p className="text-[11px] text-jm-muted">
                    Somente o Super administrador pode alterar scripts personalizados (eles executam código em todo o site).
                  </p>
                )}
              </div>

              {/* SCRIPT BODY */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="jm-label !mb-0 flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-jm-muted" strokeWidth={1.75} />
                    <span>Scripts adicionais no Corpo (&lt;body&gt;)</span>
                  </label>
                  <span className="text-[11px] text-jm-muted">HTML / NoScript</span>
                </div>
                <textarea
                  rows={5}
                  value={formData.customBodyScript}
                  onChange={(e) => setFormData({ ...formData, customBodyScript: e.target.value })}
                  placeholder="<!-- Cole aqui tags que devem rodar no body -->&#10;<script>...</script>"
                  className="jm-input font-mono text-xs disabled:opacity-60"
                  disabled={!canEditScripts}
                />
              </div>

            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="jm-modal-footer sm:!justify-between sm:items-center">
          <div className="hidden items-center gap-2 text-xs text-jm-muted sm:flex">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">
              {canEdit ? 'Toda alteração fica registrada na auditoria.' : 'Somente leitura: seu perfil não pode alterar as tags.'}
            </span>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onClose}
              className="jm-btn jm-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving || loading || !canEdit}
              onClick={handleSave}
              className="jm-btn jm-btn-accent"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Salvando...' : 'Salvar configurações'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
