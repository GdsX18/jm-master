'use client';

import { useEffect } from 'react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function UnsavedChangesModal({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  isSaving = false,
}: UnsavedChangesModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl jm-card border border-jm-border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho com ícone */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-jm-border">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-jm-text">
              Alterações não salvas
            </h2>
            <p className="text-xs text-jm-muted mt-0.5">
              Você modificou informações que ainda não foram salvas.
            </p>
          </div>
        </div>

        {/* Corpo */}
        <div className="px-6 py-4">
          <p className="text-xs text-jm-muted">
            O que deseja fazer com as alterações realizadas?
          </p>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2 px-6 pb-6">
          {/* Salvar e Sair */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="jm-btn jm-btn-primary w-full py-2.5 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span>Salvar e Sair</span>
              </>
            )}
          </button>

          {/* Descartar e Sair */}
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            className="jm-btn jm-btn-secondary text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 w-full py-2.5 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            <span>Descartar Alterações e Sair</span>
          </button>

          {/* Continuar Editando */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="jm-btn jm-btn-ghost w-full py-2 text-jm-muted hover:text-jm-text"
          >
            Continuar Editando
          </button>
        </div>
      </div>
    </div>
  );
}
