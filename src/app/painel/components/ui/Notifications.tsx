'use client';

import { useState, useCallback, useEffect } from 'react';

// ─── TIPOS ─────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

// ─── HOOK: useToastState ─────────────────────────────────────────────────────

export function useToastState() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// ─── COMPONENTE: ToastContainer ─────────────────────────────────────────────

const toastConfig: Record<ToastType, { border: string; icon: string; iconColor: string; barColor: string }> = {
  success: { border: 'border-emerald-200 dark:border-emerald-800/60', icon: '✓', iconColor: 'text-emerald-600 dark:text-emerald-400', barColor: 'bg-emerald-500' },
  error:   { border: 'border-rose-200 dark:border-rose-800/60',   icon: '✕', iconColor: 'text-rose-600 dark:text-rose-400',   barColor: 'bg-rose-500'   },
  warning: { border: 'border-amber-200 dark:border-amber-800/60', icon: '⚠', iconColor: 'text-amber-600 dark:text-amber-400', barColor: 'bg-amber-500' },
  info:    { border: 'border-sky-200 dark:border-sky-800/60',   icon: 'ℹ', iconColor: 'text-sky-600 dark:text-sky-400',   barColor: 'bg-sky-500'   },
};

export function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => {
        const cfg = toastConfig[t.type];
        return (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-start gap-3 min-w-[320px] max-w-[440px]
              jm-card ${cfg.border} rounded-xl shadow-lg px-4 py-3
            `}
            style={{ animation: 'jm-slide-in 0.3s ease-out forwards' }}
          >
            <span className={`text-base font-bold mt-0.5 flex-shrink-0 ${cfg.iconColor}`}>
              {cfg.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-jm-text leading-snug">{t.title}</p>
              {t.message && (
                <p className="text-xs text-jm-muted mt-0.5 leading-snug">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-jm-muted hover:text-jm-text transition text-lg leading-none flex-shrink-0 mt-0.5 ml-1 cursor-pointer"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── HOOK: useConfirm ────────────────────────────────────────────────────────

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setOptions(opts);
      setIsOpen(true);
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolver?.(true);
    setResolver(null);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolver?.(false);
    setResolver(null);
  }, [resolver]);

  return { confirm, isOpen, options, handleConfirm, handleCancel };
}

// ─── COMPONENTE: ConfirmModal ────────────────────────────────────────────────

const variantCfg = {
  danger:  { icon: '🗑️', confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white', iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
  warning: { icon: '⚠️', confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white', iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800' },
  default: { icon: '❓', confirmBtn: 'jm-btn-primary', iconBg: 'bg-orange-50 text-jm-orange dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800' },
};

export function ConfirmModal({
  isOpen,
  options,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen || !options) return null;

  const v = variantCfg[options.variant ?? 'default'];

  return (
    <>
      <style>{`
        @keyframes jm-slide-in {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes jm-scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        onClick={onCancel}
      >
        <div
          className="jm-card border border-jm-border rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
          onClick={e => e.stopPropagation()}
          style={{ animation: 'jm-scale-in 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl ${v.iconBg} flex items-center justify-center text-lg flex-shrink-0`}>
              {v.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-jm-text">{options.title}</h3>
              <p className="text-xs text-jm-muted mt-1 leading-relaxed">{options.message}</p>
            </div>
          </div>

          <div className="border-t border-jm-border mx-6" />

          {/* Actions */}
          <div className="px-6 py-4 flex gap-2.5 justify-end">
            <button
              onClick={onCancel}
              className="jm-btn jm-btn-secondary"
            >
              {options.cancelLabel ?? 'Cancelar'}
            </button>
            <button
              onClick={onConfirm}
              className={`jm-btn ${v.confirmBtn}`}
            >
              {options.confirmLabel ?? 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
