"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  ArrowUpRight,
  Instagram,
  Linkedin,
  ShieldCheck,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Magnetic } from "@/components/ui/magnetic-cursor";

const WHATSAPP_NUMBER = "5521951011616";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20JM%20MASTER%20GROUP.`;

export const RuixenGradientFooter: React.FC = () => {
  return (
    <footer
      id="contato"
      className="relative bg-[#040914] text-white pt-20 pb-28 md:pb-32 overflow-hidden border-t border-white/10"
    >
      {/* ---------------------------------------------------- */}
      {/* 1. TOP AMBIENT GLOW & ACCENT LIGHTING                */}
      {/* ---------------------------------------------------- */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#0070F3] to-transparent opacity-70" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-24 bg-gradient-to-b from-[#0070F3]/20 via-[#FF5722]/10 to-transparent blur-3xl pointer-events-none" />

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN FOOTER CONTENT CONTAINER                     */}
      {/* ---------------------------------------------------- */}
      <div className="w-full px-6 md:px-12 lg:px-16 max-w-[1400px] mx-auto relative z-10 space-y-16">
        
        {/* Main Grid: 12 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 lg:gap-16 items-start">
          
          {/* Coluna 1 (4 Colunas): Logo, Badge, Slogan e Interatividade */}
          <div className="md:col-span-4 space-y-6">
            <Magnetic intensity={0.2}>
              <a href="#" className="inline-block">
                <Logo variant="dark" size="lg" />
              </a>
            </Magnetic>

            <p className="text-sm md:text-base text-slate-300 font-normal max-w-md leading-relaxed">
              Comunicação que engaja e converte através de automações inteligentes, IA conversacional e tráfego de alta performance.
            </p>

            {/* Badge Homologado Meta */}
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-4 py-2 rounded-full border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-950/40">
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Plataforma Homologada Meta API Oficial</span>
            </div>

            {/* Quick Contact CTA Box */}
            <div className="pt-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 px-5 py-3 rounded-xl bg-gradient-to-r from-[#0070F3] to-[#082B61] hover:from-[#FF5722] hover:to-[#E64F14] text-white text-xs md:text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-900/30 hover:shadow-orange-950/50 group"
              >
                <MessageCircle className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>Falar com Especialista</span>
                <ArrowUpRight className="w-4 h-4 text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Coluna 2 (3 Colunas): Soluções */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#0070F3] flex items-center space-x-2">
              <span>SOLUÇÕES</span>
              <Sparkles className="w-3 h-3 text-[#FF5722]" />
            </h4>
            <ul className="space-y-3 text-sm text-slate-300 font-medium">
              <li>
                <a href="#solucoes" className="hover:text-white hover:translate-x-1 transition-all inline-block duration-200">
                  WhatsApp Business API
                </a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-white hover:translate-x-1 transition-all inline-block duration-200">
                  Chatbot Inteligente com IA
                </a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-white hover:translate-x-1 transition-all inline-block duration-200">
                  E-mail Marketing Estratégico
                </a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-white hover:translate-x-1 transition-all inline-block duration-200">
                  SMS Marketing Corporativo
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3 (2 Colunas): Empresa */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#0070F3]">
              EMPRESA
            </h4>
            <ul className="space-y-3 text-sm text-slate-300 font-medium">
              <li>
                <a href="#sobre" className="hover:text-white hover:translate-x-1 transition-all inline-block duration-200">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#metodologia" className="hover:text-white hover:translate-x-1 transition-all inline-block duration-200">
                  Metodologia
                </a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-white hover:translate-x-1 transition-all inline-block duration-200">
                  Soluções
                </a>
              </li>
              <li>
                <a href="#clientes" className="hover:text-white hover:translate-x-1 transition-all inline-block duration-200">
                  Clientes
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 4 (3 Colunas): Contato */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#FF5722]">
              CONTATO
            </h4>
            <ul className="space-y-3 text-sm text-slate-300 font-medium">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FF5722] transition-colors flex items-center space-x-2 font-bold text-white group"
                >
                  <Phone className="w-3.5 h-3.5 text-[#0070F3] group-hover:text-[#FF5722] shrink-0" />
                  <span>(21) 95101-1616</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@jmmastergroup.com.br"
                  className="text-slate-300 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <Mail className="w-3.5 h-3.5 text-[#0070F3] shrink-0" />
                  <span className="whitespace-nowrap font-medium text-slate-300 hover:text-white transition-colors">
                    contato@jmmastergroup.com.br
                  </span>
                </a>
              </li>
              <li className="text-slate-300 flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF5722] shrink-0" />
                <span className="whitespace-nowrap">Rio de Janeiro, RJ</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Separador Horizontal Sofisticado */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* ---------------------------------------------------- */}
        {/* 3. BOTTOM FOOTER BAR                                 */}
        {/* ---------------------------------------------------- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400 font-medium">
          {/* Copyright */}
          <p>© 2026 JM MASTER GROUP. Todos os direitos reservados.</p>

          {/* Status Indicator / Meta Certification */}
          <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="tracking-wider uppercase font-semibold text-[11px]">
              SISTEMAS HOMOLOGADOS META API 100% ATIVOS
            </span>
          </div>

          {/* Redes Sociais com Efeito Magnético */}
          <div className="flex items-center space-x-3">
            <Magnetic intensity={0.3}>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-[#FF5722] hover:text-white text-slate-300 transition-all duration-300 flex items-center justify-center shadow-sm"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </Magnetic>

            <Magnetic intensity={0.3}>
              <a
                href="#"
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-[#FF5722] hover:text-white text-slate-300 transition-all duration-300 flex items-center justify-center shadow-sm"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </Magnetic>

            <Magnetic intensity={0.3}>
              <a
                href="#"
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-[#0070F3] hover:text-white text-slate-300 transition-all duration-300 flex items-center justify-center shadow-sm"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </Magnetic>
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. RUIXEN SIGNATURE BOTTOM GRADIENT GLOW (AURA)     */}
      {/* ---------------------------------------------------- */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none h-44 md:h-56 overflow-hidden z-0 flex items-end justify-center">
        {/* Layer 1: Base Deep Blue & Electric Cyan Glow */}
        <div 
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[110%] md:w-[90%] h-48 rounded-[100%] bg-gradient-to-t from-[#082B61] via-[#0070F3] to-transparent blur-3xl opacity-80"
        />

        {/* Layer 2: Radiant Brand Orange & Magenta Aurora Curve */}
        <div 
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[95%] md:w-[75%] h-36 rounded-[100%] bg-gradient-to-t from-[#FF5722] via-[#E64F14] to-transparent blur-2xl opacity-75 mix-blend-screen"
        />

        {/* Layer 3: High-Intensity Golden/Coral Center Highlight Wave */}
        <div 
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[80%] md:w-[55%] h-28 rounded-[100%] bg-gradient-to-t from-[#FFB800] via-[#FF5722] to-transparent blur-xl opacity-90 mix-blend-color-dodge"
        />

        {/* Layer 4: Crisp Linear Bottom Border Ribbon */}
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#0070F3] via-[#FF5722] to-[#0070F3] opacity-90 shadow-[0_0_25px_#FF5722]" />
      </div>
    </footer>
  );
};

export default RuixenGradientFooter;
