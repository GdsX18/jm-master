"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageCircle, Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { HeroBentoVisualizer } from "@/components/hero-bento-visualizer";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const WHATSAPP_NUMBER = "5521951011616";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Quero%20acelerar%20meu%20neg%C3%B3cio%20com%20as%20solu%C3%A7%C3%B5es%20da%20JM%20MASTER%20GROUP.`;

export const HeroSection: React.FC = () => {
  return (
    <section id="sobre" className="relative pt-12 pb-12 overflow-hidden bg-slate-50/50">
      {/* Orbes de Iluminação Ambiente flutuantes ao fundo */}
      <div className="ambient-orb-laranja top-[-100px] left-[-100px] animate-pulse-glow" />
      <div className="ambient-orb-azul top-[200px] right-[-150px] animate-pulse-glow" />

      {/* Container Scroll Animation Component */}
      <div className="flex flex-col overflow-hidden">
        <ContainerScroll
          titleComponent={
            <div className="relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-6 px-4">
              
              {/* ========================================================
                  CARDS FLUTUANTES ESQUERDA (Desktop - Abstratos & Fluidos)
                 ======================================================== */}
              <div className="hidden lg:flex flex-col gap-12 absolute left-0 xl:-left-6 top-2 z-20 pointer-events-auto">
                {/* Card 1 - Esquerda Superior */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
                  transition={{
                    opacity: { duration: 0.6 },
                    x: { duration: 0.6 },
                    y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="group relative w-56 p-4 rounded-2xl bg-white/40 backdrop-blur-2xl border border-white/80 shadow-[0_12px_32px_rgba(8,43,97,0.08)] hover:shadow-[0_20px_40px_rgba(8,43,97,0.16)] hover:bg-white/65 transition-all duration-300 -rotate-3 hover:rotate-0"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#082B61]/10 to-[#E64F14]/10 rounded-2xl blur-lg opacity-40 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center space-x-3 text-left">
                    <div className="p-2.5 rounded-xl bg-[#082B61]/10 text-[#082B61] shrink-0 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#082B61]">API Oficial Meta</p>
                      <p className="text-[10px] font-medium text-slate-500">WhatsApp Verificado</p>
                    </div>
                  </div>
                </motion.div>

                {/* Card 2 - Esquerda Inferior */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0, y: [0, -12, 0] }}
                  transition={{
                    opacity: { duration: 0.6, delay: 0.2 },
                    x: { duration: 0.6, delay: 0.2 },
                    y: { duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                  }}
                  className="group relative w-56 p-4 rounded-2xl bg-white/40 backdrop-blur-2xl border border-white/80 shadow-[0_12px_32px_rgba(230,79,20,0.08)] hover:shadow-[0_20px_40px_rgba(230,79,20,0.16)] hover:bg-white/65 transition-all duration-300 translate-x-4 rotate-2 hover:rotate-0"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#E64F14]/10 to-[#082B61]/10 rounded-2xl blur-lg opacity-40 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center space-x-3 text-left">
                    <div className="p-2.5 rounded-xl bg-[#E64F14]/10 text-[#E64F14] shrink-0 group-hover:scale-110 transition-transform">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#082B61]">Automação 24/7</p>
                      <p className="text-[10px] font-medium text-slate-500">IA Conversacional</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ========================================================
                  CARDS FLUTUANTES DIREITA (Desktop - Abstratos & Fluidos)
                 ======================================================== */}
              <div className="hidden lg:flex flex-col gap-12 absolute right-0 xl:-right-6 top-2 z-20 pointer-events-auto">
                {/* Card 3 - Direita Superior */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0, y: [0, -9, 0] }}
                  transition={{
                    opacity: { duration: 0.6, delay: 0.1 },
                    x: { duration: 0.6, delay: 0.1 },
                    y: { duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
                  }}
                  className="group relative w-56 p-4 rounded-2xl bg-white/40 backdrop-blur-2xl border border-white/80 shadow-[0_12px_32px_rgba(8,43,97,0.08)] hover:shadow-[0_20px_40px_rgba(8,43,97,0.16)] hover:bg-white/65 transition-all duration-300 rotate-3 hover:rotate-0"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#082B61]/10 to-[#E64F14]/10 rounded-2xl blur-lg opacity-40 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center space-x-3 text-left">
                    <div className="p-2.5 rounded-xl bg-[#082B61]/10 text-[#082B61] shrink-0 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#082B61]">Alta Performance</p>
                      <p className="text-[10px] font-medium text-slate-500">Funis de Vendas</p>
                    </div>
                  </div>
                </motion.div>

                {/* Card 4 - Direita Inferior */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0, y: [0, -11, 0] }}
                  transition={{
                    opacity: { duration: 0.6, delay: 0.3 },
                    x: { duration: 0.6, delay: 0.3 },
                    y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 },
                  }}
                  className="group relative w-56 p-4 rounded-2xl bg-white/40 backdrop-blur-2xl border border-white/80 shadow-[0_12px_32px_rgba(230,79,20,0.08)] hover:shadow-[0_20px_40px_rgba(230,79,20,0.16)] hover:bg-white/65 transition-all duration-300 -translate-x-4 -rotate-2 hover:rotate-0"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#E64F14]/10 to-[#082B61]/10 rounded-2xl blur-lg opacity-40 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center space-x-3 text-left">
                    <div className="p-2.5 rounded-xl bg-[#E64F14]/10 text-[#E64F14] shrink-0 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#082B61]">Precisão Omnichannel</p>
                      <p className="text-[10px] font-medium text-slate-500">WhatsApp, SMS, E-mail</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Top Badge Glassmorphism */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-white/90 border border-slate-200 shadow-md backdrop-blur-xl z-10"
              >
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#082B61]">
                  JM MASTER GROUP • MARKETING DIGITAL & AUTOMAÇÃO CORPORATIVA
                </span>
                <Sparkles className="w-4 h-4 text-[#E64F14]" />
              </motion.div>

              {/* Imposing Main H1 Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#082B61] tracking-tight leading-[1.1] max-w-3xl lg:max-w-4xl mx-auto z-10"
              >
                Comunicação que engaja e{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-[#E64F14] via-[#F06228] to-[#C43E0A] bg-clip-text text-transparent">
                    converte.
                  </span>
                  <motion.svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-[#E64F14]"
                    viewBox="0 0 200 12"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                  >
                    <path d="M2 9C50 3 150 3 198 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </motion.svg>
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm sm:text-base md:text-xl text-slate-600 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed font-normal z-10"
              >
                Elevamos a presença digital e a taxa de conversão do seu negócio com automações avançadas de atendimento, inteligência conversacional 24/7 e gestão de tráfego de alta performance.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-2 w-full sm:w-auto z-10"
              >
                {/* Primary CTA Laranja */}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-[#E64F14] via-[#F06228] to-[#C43E0A] hover:from-[#c43e0a] hover:to-[#E64F14] text-white text-base font-extrabold px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-[#E64F14]/30 hover:shadow-2xl hover:shadow-[#E64F14]/40 hover:-translate-y-1 active:translate-y-0"
                >
                  <span>Acelerar Meu Negócio</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* Secondary CTA Outline Azul */}
                <a
                  href="#solucoes"
                  className="inline-flex items-center justify-center space-x-2 border-2 border-[#082B61] text-[#082B61] hover:bg-[#082B61] hover:text-white text-base font-extrabold px-8 py-4 rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Ver Soluções</span>
                </a>
              </motion.div>

              {/* Mobile / Tablet View dos 4 Cards (Grid 2x2 abaixo dos CTAs) */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:hidden pt-4 grid grid-cols-2 gap-3 max-w-xl w-full text-left"
              >
                <div className="p-3.5 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-md flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#082B61]/10 text-[#082B61] shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#082B61]">API Oficial Meta</p>
                    <p className="text-[10px] text-slate-500">WhatsApp Verificado</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-md flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#E64F14]/10 text-[#E64F14] shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#082B61]">Automação 24/7</p>
                    <p className="text-[10px] text-slate-500">IA Conversacional</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-md flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#082B61]/10 text-[#082B61] shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#082B61]">Alta Performance</p>
                    <p className="text-[10px] text-slate-500">Funis de Vendas</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-md flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#E64F14]/10 text-[#E64F14] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#082B61]">Precisão Omnichannel</p>
                    <p className="text-[10px] text-slate-500">WhatsApp, SMS, E-mail</p>
                  </div>
                </div>
              </motion.div>

            </div>
          }
        >
          <HeroBentoVisualizer />
        </ContainerScroll>
      </div>
    </section>
  );
};

