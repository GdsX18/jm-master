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

const toastConfig: Record<ToastType, { icon: string; iconColor: string; barColor: string }> = {
  success: { icon: '✓', iconColor: 'text-jm-success-fg', barColor: 'bg-jm-success-fg' },
  error:   { icon: '✕', iconColor: 'text-jm-danger-fg',  barColor: 'bg-jm-danger-fg'  },
  warning: { icon: '!', iconColor: 'text-jm-warning-fg', barColor: 'bg-jm-warning-fg' },
  info:    { icon: 'i', iconColor: 'text-jm-primary-text', barColor: 'bg-jm-primary' },
};

export function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[9999] flex flex-col gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5">
      {toasts.map(t => {
        const cfg = toastConfig[t.type];
        return (
          <div
            key={t.id}
            className="pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-[4px] border border-jm-border bg-jm-surface py-2.5 pl-4 pr-3 text-jm-fg shadow-jm-pop sm:w-[380px]"
            style={{ animation: 'jm-pop-in 140ms ease-out' }}
          >
            <span className={`absolute inset-y-0 left-0 w-[3px] ${cfg.barColor}`} aria-hidden="true" />
            <span className={`mt-px w-3 shrink-0 text-center text-sm font-semibold ${cfg.iconColor}`}>
              {cfg.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-snug text-jm-fg">{t.title}</p>
              {t.message && (
                <p className="mt-0.5 text-xs leading-snug text-jm-muted">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="-mr-1 inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[3px] text-base leading-none text-jm-muted transition-colors hover:bg-jm-hover hover:text-jm-fg"
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
  danger:  { confirmBtn: 'jm-btn-danger-solid', bar: 'bg-jm-danger-fg' },
  warning: { confirmBtn: 'jm-btn-accent',       bar: 'bg-jm-warning-fg' },
  default: { confirmBtn: 'jm-btn-primary',      bar: 'bg-jm-primary' },
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
    <div className="jm-overlay !z-[9998]" onClick={onCancel}>
      <div
        className="jm-modal sm:max-w-md"
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="jm-modal-body flex items-start gap-3">
          <span className={`mt-1 h-4 w-[3px] shrink-0 rounded-[1px] ${v.bar}`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="jm-modal-title">{options.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-jm-muted">{options.message}</p>
          </div>
        </div>

        <div className="jm-modal-footer">
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
  );
}
