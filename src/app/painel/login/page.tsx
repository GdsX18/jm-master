'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { CrowdCanvas } from '@/components/ui/skiper-ui/skiper39';

export default function PainelLoginPage() {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }

      // Salva dados da sessão autenticada
      localStorage.setItem('@JMMaster:user', JSON.stringify(data.user));

      setMessage({
        type: 'success',
        text: `Autenticado como ${data.user.name} (${data.user.role})! Redirecionando...`,
      });

      setTimeout(() => {
        const next = new URLSearchParams(window.location.search).get('next');
        window.location.href = next && next.startsWith('/painel') ? next : data.redirectUrl || '/painel';
      }, 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao conectar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Não há envio de e-mail configurado: a redefinição é feita por um administrador
    setMessage({
      type: 'error',
      text: 'A redefinição de senha é feita por um administrador do sistema, em "Usuários do Sistema". Peça a ele uma nova senha.',
    });
  };

  return (
    <div className="jm-panel relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-jm-bg font-sans text-jm-fg antialiased">
      
      {/* NAVBAR SUPERIOR ELEGANTE */}
      <header className="relative z-30 flex h-16 w-full items-center justify-between gap-3 border-b border-jm-border bg-jm-surface px-4 sm:px-8">
        <Link
          href="/"
          className="jm-btn jm-btn-ghost jm-btn-sm order-last sm:order-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar para o site</span>
        </Link>

        <div className="relative h-9 w-32 sm:w-36">
          <Image
            src="/images/logo_jm.png"
            alt="JM Master Group"
            fill
            className="object-contain object-left"
            priority
            unoptimized
          />
        </div>

        <div className="hidden items-center gap-1.5 text-xs font-medium text-jm-muted md:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-jm-accent-line" strokeWidth={1.75} />
          <span>Ambiente seguro</span>
        </div>
      </header>

      {/* ÁREA CENTRAL: CARD DE LOGIN COM FUNDO TRANSPARENTE E BLUR REAL (FROSTED GLASS) */}
      <main className="relative z-30 flex w-full flex-1 items-start justify-center px-4 pb-56 pt-8 sm:px-6 sm:pt-14">
        <div className="jm-card relative w-full max-w-[400px] space-y-5 overflow-hidden p-6 shadow-jm-pop sm:p-8">
          
          <div>
            <span className="absolute inset-x-0 top-0 h-[3px] bg-jm-accent-line" aria-hidden="true" />
            <p className="jm-eyebrow mb-2 flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              <span>Acesso restrito</span>
            </p>
            <h1 className="text-xl font-semibold tracking-[-0.01em] text-jm-fg">
              {isForgotPassword ? 'Recuperar Acesso' : 'Entrar no Painel'}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-jm-muted">
              {isForgotPassword
                ? 'Informe seu e-mail cadastrado para redefinir as credenciais de acesso.'
                : 'Insira suas credenciais corporativas para gerenciar o blog, CRM e sistema.'}
            </p>
          </div>

          {message && (
            <div
              className={`jm-alert ${
                message.type === 'success'
                  ? 'jm-alert-success'
                  : 'jm-alert-danger'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {!isForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-0">
                <label className="jm-label flex items-center gap-1.5" htmlFor="email">
                  <Mail className="h-3.5 w-3.5 text-jm-muted" />
                  <span>E-mail institucional</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="seu.email@jmmaster.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="jm-input h-10"
                />
              </div>

              <div className="space-y-0">
                <div className="flex items-center justify-between">
                  <label className="jm-label flex items-center gap-1.5" htmlFor="password">
                    <Lock className="h-3.5 w-3.5 text-jm-muted" />
                    <span>Senha de acesso</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setMessage(null);
                    }}
                    className="mb-1.5 cursor-pointer text-xs font-medium text-jm-primary-text underline-offset-2 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="jm-input h-10 pr-11 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="jm-icon-btn absolute right-1 top-1/2 -translate-y-1/2"
                    title={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="jm-btn jm-btn-primary jm-btn-lg mt-1 w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-0">
                <label className="jm-label flex items-center gap-1.5" htmlFor="reset-email">
                  <Mail className="h-3.5 w-3.5 text-jm-muted" />
                  <span>E-mail cadastrado</span>
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  placeholder="seu.email@jmmaster.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="jm-input h-10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="jm-btn jm-btn-primary jm-btn-lg w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar instruções</span>
                )}
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setMessage(null);
                  }}
                  className="jm-btn jm-btn-ghost jm-btn-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o login</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      {/* ANIMAÇÃO SKIPER39: CROWD CANVAS COM BONECOS MAIORES E DESTACADOS */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-10 h-[42vh] w-full select-none overflow-hidden opacity-90 md:h-[55vh]">
        <CrowdCanvas
          src="/images/peeps/all-peeps.png"
          rows={15}
          cols={7}
          className="w-full h-full"
        />
      </div>

    </div>
  );
}
