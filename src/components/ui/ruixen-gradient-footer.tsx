"use client";

import React from "react";
import {
  MessageCircle,
  ArrowUpRight,
  Instagram,
  Linkedin,
  ShieldCheck,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Magnetic } from "@/components/ui/magnetic-cursor";

const WHATSAPP_NUMBER = "5521998567051";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20JM%20MASTER%20GROUP.`;

export const RuixenGradientFooter: React.FC = () => {
  return (
    <footer
      id="contato"
      className="relative bg-[#040914] text-white pt-16 sm:pt-20 pb-20 md:pb-28 overflow-hidden border-t border-white/10"
    >
      {/* ---------------------------------------------------- */}
      {/* 1. TOP AMBIENT GLOW & ACCENT LIGHTING                */}
      {/* ---------------------------------------------------- */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#0070F3] to-transparent opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-20 bg-gradient-to-b from-[#0070F3]/15 via-[#FF5722]/10 to-transparent blur-2xl pointer-events-none" />

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN FOOTER CONTENT CONTAINER                     */}
      {/* ---------------------------------------------------- */}
      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1400px] mx-auto relative z-10 space-y-12 sm:space-y-16">
        
        {/* Main Grid: Responsivo 1 col no mobile, 2 cols em telas pequenas/tablets, 12 cols no desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-start">
          
          {/* Coluna 1: Logo, Badge, Slogan e Contato */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-5">
            <Magnetic intensity={0.2}>
              <a href="#" className="inline-block" aria-label="JM Master Group Home">
                <Logo variant="dark" size="lg" />
              </a>
            </Magnetic>

            <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-md leading-relaxed">
              Comunicação que engaja e converte através de automações inteligentes, IA conversacional e tráfego de alta performance.
            </p>

            {/* Badge Homologado Meta */}
            <div className="inline-flex items-center space-x-2 text-[11px] sm:text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">Plataforma Homologada Meta API Oficial</span>
            </div>

            {/* Quick Contact CTA Box */}
            <div className="pt-1">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-[#0070F3] to-[#082B61] hover:from-[#FF5722] hover:to-[#E64F14] text-white text-xs sm:text-sm font-bold transition-all duration-200 shadow-md group"
              >
                <MessageCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>Falar com Especialista</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Soluções */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#0070F3] flex items-center space-x-1.5">
              <span>SOLUÇÕES</span>
              <Sparkles className="w-3 h-3 text-[#FF5722]" />
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 font-medium">
              <li>
                <a href="#solucoes" className="hover:text-white hover:translate-x-1 transition-all inline-block py-0.5">
                  WhatsApp Business API
                </a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-white hover:translate-x-1 transition-all inline-block py-0.5">
                  Chatbot Inteligente com IA
                </a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-white hover:translate-x-1 transition-all inline-block py-0.5">
                  E-mail Marketing Estratégico
                </a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-white hover:translate-x-1 transition-all inline-block py-0.5">
                  SMS Marketing Corporativo
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Empresa */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#0070F3]">
              EMPRESA
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 font-medium">
              <li>
                <a href="#sobre" className="hover:text-white hover:translate-x-1 transition-all inline-block py-0.5">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#metodologia" className="hover:text-white hover:translate-x-1 transition-all inline-block py-0.5">
                  Metodologia
                </a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-white hover:translate-x-1 transition-all inline-block py-0.5">
                  Soluções
                </a>
              </li>
              <li>
                <a href="#clientes" className="hover:text-white hover:translate-x-1 transition-all inline-block py-0.5">
                  Clientes
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Contato */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#FF5722]">
              CONTATO
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 font-medium">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FF5722] transition-colors flex items-center space-x-2 font-bold text-white group py-0.5"
                >
                  <Phone className="w-3.5 h-3.5 text-[#0070F3] group-hover:text-[#FF5722] shrink-0" />
                  <span>(21) 99856-7051</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@jmmastergroup.com.br"
                  className="text-slate-300 hover:text-white transition-colors flex items-center space-x-2 py-0.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#0070F3] shrink-0" />
                  <span className="truncate">contato@jmmastergroup.com.br</span>
                </a>
              </li>
              <li className="text-slate-300 flex items-center space-x-2 py-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF5722] shrink-0" />
                <span>Rio de Janeiro, RJ</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Separador Horizontal Sofisticado */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* ---------------------------------------------------- */}
        {/* 3. BOTTOM FOOTER BAR                                 */}
        {/* ---------------------------------------------------- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-[11px] sm:text-xs text-slate-400 font-medium">
          {/* Copyright */}
          <p>© 2026 JM MASTER GROUP. Todos os direitos reservados.</p>

          {/* Status Indicator / Meta Certification */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wider uppercase font-semibold text-[10px] truncate">
              SISTEMAS HOMOLOGADOS META API ATIVOS
            </span>
          </div>

          {/* Redes Sociais com Efeito Magnético */}
          <div className="flex items-center space-x-2.5">
            <Magnetic intensity={0.25}>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-[#FF5722] hover:text-white text-slate-300 transition-all flex items-center justify-center"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </Magnetic>

            <Magnetic intensity={0.25}>
              <a
                href="#"
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-[#FF5722] hover:text-white text-slate-300 transition-all flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </Magnetic>

            <Magnetic intensity={0.25}>
              <a
                href="#"
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-[#0070F3] hover:text-white text-slate-300 transition-all flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </Magnetic>
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. RUIXEN SIGNATURE BOTTOM GRADIENT GLOW             */}
      {/* ---------------------------------------------------- */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none h-32 overflow-hidden z-0 flex items-end justify-center">
        <div 
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-full max-w-5xl h-32 rounded-[100%] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#0070F3]/25 via-[#082B61]/10 to-transparent pointer-events-none"
        />
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-[#0070F3] via-[#FF5722] to-[#0070F3] opacity-80" />
      </div>
    </footer>
  );
};

export default RuixenGradientFooter;
