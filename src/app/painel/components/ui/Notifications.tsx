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
  success: { border: 'border-l-4 border-green-500', icon: '✓', iconColor: 'text-green-400', barColor: 'bg-green-500' },
  error:   { border: 'border-l-4 border-red-500',   icon: '✕', iconColor: 'text-red-400',   barColor: 'bg-red-500'   },
  warning: { border: 'border-l-4 border-amber-500', icon: '⚠', iconColor: 'text-amber-400', barColor: 'bg-amber-500' },
  info:    { border: 'border-l-4 border-sky-500',   icon: 'ℹ', iconColor: 'text-sky-400',   barColor: 'bg-sky-500'   },
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
              bg-neutral-900 ${cfg.border} rounded-xl shadow-2xl px-4 py-3
            `}
            style={{ animation: 'jm-slide-in 0.3s ease-out forwards' }}
          >
            <span className={`text-lg font-bold mt-0.5 flex-shrink-0 ${cfg.iconColor}`}>
              {cfg.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-snug">{t.title}</p>
              {t.message && (
                <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-neutral-500 hover:text-white transition text-xl leading-none flex-shrink-0 mt-0.5 ml-1 cursor-pointer"
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
  danger:  { icon: '🗑️', confirmBtn: 'bg-red-600 hover:bg-red-700 text-white', iconBg: 'bg-red-950/60 text-red-400 border border-red-900/50' },
  warning: { icon: '⚠️', confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-black font-bold', iconBg: 'bg-amber-950/60 text-amber-400 border border-amber-900/50' },
  default: { icon: '❓', confirmBtn: 'bg-[#E85D26] hover:bg-orange-600 text-white', iconBg: 'bg-orange-950/60 text-orange-400 border border-orange-900/50' },
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
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        className="fixed inset-0 z-[9998] flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
        onClick={onCancel}
      >
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          onClick={e => e.stopPropagation()}
          style={{ animation: 'jm-scale-in 0.22s ease-out' }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full ${v.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}>
              {v.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white">{options.title}</h3>
              <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{options.message}</p>
            </div>
          </div>

          <div className="border-t border-neutral-800 mx-6" />

          {/* Actions */}
          <div className="px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white transition text-sm font-medium cursor-pointer"
            >
              {options.cancelLabel ?? 'Cancelar'}
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2 rounded-lg transition text-sm font-semibold cursor-pointer ${v.confirmBtn}`}
            >
              {options.confirmLabel ?? 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
