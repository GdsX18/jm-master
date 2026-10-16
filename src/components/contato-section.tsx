"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MessageCircle, Send } from "lucide-react";
import { SERVICES } from "@/data/services";
import { whatsappUrl } from "@/lib/site";

interface ContatoSectionProps {
  defaultInterest?: string;
}

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E64F14]/40 focus:border-[#E64F14]";

export const ContatoSection: React.FC<ContatoSectionProps> = ({ defaultInterest = "" }) => {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      company: form.get("company"),
      interest: form.get("interest"),
      message: form.get("message"),
      website: form.get("website"),
      consent: form.get("consent") === "on",
      page: window.location.pathname,
      referrerPost: (() => {
        try {
          return sessionStorage.getItem("jm_last_post") || "";
        } catch {
          return "";
        }
      })(),
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Erro ao enviar.");

      setStatus("sent");
      // Evento de conversão para GTM/GA, se estiverem ativos
      (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event: "generate_lead", interest: payload.interest });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    }
  };

  return (
    <section id="contato-form" className="py-16 sm:py-24 relative bg-slate-50/60 scroll-mt-24">
      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">
        <div className="lg:col-span-2 space-y-4">
          <span className="inline-block text-[10px] sm:text-xs font-black tracking-widest text-[#E64F14] uppercase px-3.5 py-1.5 rounded-full bg-[#E64F14]/10 border border-[#E64F14]/20">
            Fale com a gente
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#082B61] tracking-tight">
            Vamos montar a solução certa para o seu negócio
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Conte um pouco sobre a sua operação e um especialista retorna com um diagnóstico e uma proposta.
            Se preferir, chame direto no WhatsApp.
          </p>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#082B61] hover:text-[#E64F14] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Prefiro conversar pelo WhatsApp
          </a>
        </div>

        <div className="lg:col-span-3 p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-900/5">
          {status === "sent" ? (
            <div className="py-10 text-center space-y-3" role="status">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-black text-[#082B61]">Mensagem recebida!</h3>
              <p className="text-sm text-slate-600">Nossa equipe vai entrar em contato em breve.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="sm:col-span-2 space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Nome *</span>
                <input name="name" required maxLength={120} autoComplete="name" className={inputClass} />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700">E-mail</span>
                <input name="email" type="email" maxLength={160} autoComplete="email" className={inputClass} />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700">WhatsApp / Telefone</span>
                <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass} />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Empresa</span>
                <input name="company" maxLength={120} autoComplete="organization" className={inputClass} />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Interesse</span>
                <select name="interest" defaultValue={defaultInterest} className={inputClass}>
                  <option value="">Selecione</option>
                  {SERVICES.map((service) => (
                    <option key={service.slug} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                  <option value="Outro">Outro</option>
                </select>
              </label>
              <label className="sm:col-span-2 space-y-1.5">
                <span className="text-xs font-bold text-slate-700">Mensagem</span>
                <textarea name="message" rows={4} maxLength={2000} className={inputClass} />
              </label>

              {/* Honeypot anti-spam (oculto para pessoas) */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

              <label className="sm:col-span-2 flex items-start gap-2.5 text-xs text-slate-600">
                <input type="checkbox" name="consent" required className="mt-0.5 accent-[#E64F14]" />
                <span>
                  Concordo com o uso dos meus dados para contato, conforme a{" "}
                  <Link href="/politica-de-privacidade" className="underline hover:text-[#E64F14]">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>

              {status === "error" && (
                <p className="sm:col-span-2 text-sm text-rose-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="sm:col-span-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#E64F14] text-white font-bold text-sm hover:bg-[#cf4510] transition-colors disabled:opacity-60"
              >
                {status === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar mensagem
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContatoSection;
