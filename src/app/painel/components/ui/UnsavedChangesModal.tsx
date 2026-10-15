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
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-jm-overlay"
        style={{ animation: 'jm-fade-in 120ms ease-out' }}
        onClick={onCancel}
      />

      {/* Card */}
      <div className="jm-modal relative z-10 sm:max-w-md">
        <div className="jm-modal-header">
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-[3px] shrink-0 rounded-[1px] bg-jm-warning-fg" aria-hidden="true" />
            <h2 className="jm-modal-title">
              Alterações não salvas
            </h2>
          </div>
        </div>

        <div className="jm-modal-body space-y-1">
          <p className="text-sm text-jm-fg2">
            Você modificou informações que ainda não foram salvas.
          </p>
          <p className="text-sm text-jm-muted">
            O que deseja fazer com as alterações realizadas?
          </p>
        </div>

        {/* Ações */}
        <div className="jm-modal-footer">
          {/* Continuar Editando */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="jm-btn jm-btn-ghost sm:mr-auto"
          >
            Continuar editando
          </button>

          {/* Descartar e Sair */}
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            className="jm-btn jm-btn-danger"
          >
            <span>Descartar e sair</span>
          </button>

          {/* Salvar e Sair */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="jm-btn jm-btn-primary"
          >
            {isSaving ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Salvando...</span>
              </>
            ) : (
              <span>Salvar e sair</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
