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
      localStorage.setItem('@JMMaster:token', data.token);
      localStorage.setItem('@JMMaster:user', JSON.stringify(data.user));

      setMessage({
        type: 'success',
        text: `Autenticado como ${data.user.name} (${data.user.role})! Redirecionando...`,
      });

      setTimeout(() => {
        window.location.href = data.redirectUrl || '/painel';
      }, 800);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao conectar.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    setTimeout(() => {
      setMessage({
        type: 'success',
        text: 'Se o e-mail estiver cadastrado, as instruções foram enviadas!',
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen w-screen relative flex flex-col justify-between bg-gradient-to-b from-[#F4F6F9] via-[#F8FAFC] to-white text-[#0C1E38] font-sans antialiased selection:bg-[#E85D26]/20 overflow-x-hidden">
      
      {/* NAVBAR SUPERIOR ELEGANTE */}
      <header className="w-full relative z-30 px-6 sm:px-12 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-[#0C1E38] transition px-3.5 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-neutral-200/60 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Site Oficial</span>
        </Link>

        <div className="relative w-36 sm:w-44 h-10">
          <Image
            src="/images/logo_jm.png"
            alt="JM Master Group"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-neutral-600 bg-white/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-neutral-200/60 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[#E85D26]" />
          <span>Ambiente Corporativo Seguro</span>
        </div>
      </header>

      {/* ÁREA CENTRAL: CARD DE LOGIN COM FUNDO TRANSPARENTE E BLUR REAL (FROSTED GLASS) */}
      <main className="flex-1 w-full flex items-start justify-center px-4 sm:px-6 relative z-30 pt-4 sm:pt-8 md:pt-10 pb-56">
        <div className="w-full max-w-[490px] bg-white/35 backdrop-blur-2xl border border-white/75 rounded-[32px] p-8 sm:p-10 md:p-11 shadow-[0_30px_70px_-15px_rgba(12,30,56,0.18)] space-y-7 animate-fadeIn transition-all duration-300">
          
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-500/15 text-[#E85D26] border border-orange-500/25 rounded-full text-xs font-black uppercase tracking-wider mb-3 backdrop-blur-sm">
              <Lock className="w-3.5 h-3.5" />
              <span>Acesso Restrito</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#0C1E38]">
              {isForgotPassword ? 'Recuperar Acesso' : 'Entrar no Painel'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed font-medium">
              {isForgotPassword
                ? 'Informe seu e-mail cadastrado para redefinir as credenciais de acesso.'
                : 'Insira suas credenciais corporativas para gerenciar o blog, CRM e sistema.'}
            </p>
          </div>

          {message && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-bold border flex items-center gap-3 animate-fadeIn ${
                message.type === 'success'
                  ? 'bg-emerald-50/90 backdrop-blur-md text-emerald-800 border-emerald-200 shadow-xs'
                  : 'bg-rose-50/90 backdrop-blur-md text-rose-800 border-rose-200 shadow-xs'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {!isForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider text-[#0C1E38] flex items-center gap-1.5" htmlFor="email">
                  <Mail className="w-4 h-4 text-neutral-500" />
                  <span>E-mail institucional</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@amoadvogados.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-md border border-neutral-300/80 rounded-2xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent transition font-medium shadow-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase font-extrabold tracking-wider text-[#0C1E38] flex items-center gap-1.5" htmlFor="password">
                    <Lock className="w-4 h-4 text-neutral-500" />
                    <span>Senha de acesso</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setMessage(null);
                    }}
                    className="text-xs font-bold text-[#E85D26] hover:underline focus:outline-none cursor-pointer"
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
                    className="w-full pl-4 pr-12 py-3.5 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-md border border-neutral-300/80 rounded-2xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent transition font-medium font-mono shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#E85D26] transition p-1.5 cursor-pointer"
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
                className="w-full py-4 bg-[#E85D26] hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition shadow-xl shadow-orange-900/25 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <span>Acessar Painel Corporativo</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-wider text-[#0C1E38] flex items-center gap-1.5" htmlFor="reset-email">
                  <Mail className="w-4 h-4 text-neutral-500" />
                  <span>E-mail cadastrado</span>
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  placeholder="admin@amoadvogados.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/60 hover:bg-white/80 focus:bg-white/95 backdrop-blur-md border border-neutral-300/80 rounded-2xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent transition font-medium shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#E85D26] hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition shadow-xl shadow-orange-900/25 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar Instruções</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setMessage(null);
                  }}
                  className="text-xs font-bold text-neutral-600 hover:text-[#0C1E38] transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      {/* ANIMAÇÃO SKIPER39: CROWD CANVAS COM BONECOS MAIORES E DESTACADOS */}
      <div className="fixed bottom-0 left-0 right-0 w-screen h-[58vh] md:h-[65vh] pointer-events-none z-10 overflow-hidden select-none">
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
