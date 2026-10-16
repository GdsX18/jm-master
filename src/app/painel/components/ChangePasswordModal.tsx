'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { api } from '../lib/api';
import { useNotify } from './ui/Notifications';

// Troca da própria senha (qualquer perfil). As outras sessões abertas são encerradas.
export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useNotify();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmNext, setConfirmNext] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const close = () => {
    setCurrent('');
    setNext('');
    setConfirmNext('');
    setError('');
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) return setError('A nova senha deve ter pelo menos 8 caracteres.');
    if (next !== confirmNext) return setError('A confirmação não confere com a nova senha.');
    setSaving(true);
    try {
      await api('/api/auth/password', { method: 'POST', json: { currentPassword: current, newPassword: next } });
      toast.success('Senha alterada', 'As outras sessões abertas foram encerradas.');
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar a senha');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="jm-overlay !z-[9990]" onClick={close}>
      <form className="jm-modal sm:max-w-sm" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="jm-modal-header">
          <div className="flex items-center gap-3">
            <div className="jm-icon-chip jm-icon-chip-primary">
              <KeyRound className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <h3 className="jm-modal-title">Alterar minha senha</h3>
          </div>
        </div>
        <div className="jm-modal-body space-y-3">
          {error && <div className="jm-alert jm-alert-danger">{error}</div>}
          <div>
            <label className="jm-label">Senha atual</label>
            <input type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className="jm-input" />
          </div>
          <div>
            <label className="jm-label">Nova senha (mín. 8 caracteres)</label>
            <input type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} className="jm-input" />
          </div>
          <div>
            <label className="jm-label">Confirmar nova senha</label>
            <input type="password" autoComplete="new-password" required value={confirmNext} onChange={(e) => setConfirmNext(e.target.value)} className="jm-input" />
          </div>
        </div>
        <div className="jm-modal-footer">
          <button type="button" onClick={close} className="jm-btn jm-btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="jm-btn jm-btn-primary">
            {saving ? 'Salvando...' : 'Alterar senha'}
          </button>
        </div>
      </form>
    </div>
  );
}
