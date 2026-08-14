"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageCircle, Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { HeroBentoVisualizer } from "@/components/hero-bento-visualizer";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const WHATSAPP_NUMBER = "5521998567051";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Quero%20acelerar%20meu%20neg%C3%B3cio%20com%20as%20solu%C3%A7%C3%B5es%20da%20JM%20MASTER%20GROUP.`;

const HIGHLIGHT_CARDS = [
  {
    icon: <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
    title: "API Oficial Meta",
    subtitle: "WhatsApp Verificado",
    color: "#082B61",
    bg: "bg-[#082B61]/10 text-[#082B61]",
  },
  {
    icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />,
    title: "Automação 24/7",
    subtitle: "Chatbot Inteligente",
    color: "#E64F14",
    bg: "bg-[#E64F14]/10 text-[#E64F14]",
  },
  {
    icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />,
    title: "Alta Performance",
    subtitle: "Funis de Vendas",
    color: "#082B61",
    bg: "bg-[#082B61]/10 text-[#082B61]",
  },
  {
    icon: <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />,
    title: "Precisão Omnichannel",
    subtitle: "WhatsApp, SMS, E-mail",
    color: "#E64F14",
    bg: "bg-[#E64F14]/10 text-[#E64F14]",
  },
];

export const HeroSection: React.FC = () => {
  return (
    <section id="sobre" className="relative pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12 overflow-hidden bg-slate-50/50">
      {/* Orbes de Iluminação Ambiente flutuantes ao fundo com GPU otimizada */}
      <div className="ambient-orb-laranja top-[-50px] left-[-50px] sm:left-[-100px] animate-pulse-glow" />
      <div className="ambient-orb-azul top-[150px] right-[-50px] sm:right-[-150px] animate-pulse-glow" />

      {/* Container Scroll Animation Component */}
      <div className="flex flex-col overflow-hidden w-full">
        <ContainerScroll
          titleComponent={
            <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 px-2 sm:px-4">
              
              {/* ========================================================
                  CARDS FLUTUANTES ESQUERDA (Telas Grandes >= 1280px)
                 ======================================================== */}
              <div className="hidden xl:flex flex-col gap-6 absolute left-[-20px] 2xl:left-[-50px] top-16 z-20 pointer-events-auto">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="group relative w-52 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/90 shadow-[0_10px_25px_rgba(8,43,97,0.06)] hover:shadow-[0_15px_30px_rgba(8,43,97,0.12)] transition-all duration-300 -rotate-2 hover:rotate-0"
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2.5 rounded-xl bg-[#082B61]/10 text-[#082B61] shrink-0 group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#082B61]">API Oficial Meta</p>
                      <p className="text-[10px] font-medium text-slate-500">WhatsApp Verificado</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="group relative w-52 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/90 shadow-[0_10px_25px_rgba(230,79,20,0.06)] hover:shadow-[0_15px_30px_rgba(230,79,20,0.12)] transition-all duration-300 translate-x-2 rotate-2 hover:rotate-0"
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2.5 rounded-xl bg-[#E64F14]/10 text-[#E64F14] shrink-0 group-hover:scale-105 transition-transform">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#082B61]">Automação 24/7</p>
                      <p className="text-[10px] font-medium text-slate-500">Chatbot Automatizado</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ========================================================
                  CARDS FLUTUANTES DIREITA (Telas Grandes >= 1280px)
                 ======================================================== */}
              <div className="hidden xl:flex flex-col gap-6 absolute right-[-20px] 2xl:right-[-50px] top-16 z-20 pointer-events-auto">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="group relative w-52 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/90 shadow-[0_10px_25px_rgba(8,43,97,0.06)] hover:shadow-[0_15px_30px_rgba(8,43,97,0.12)] transition-all duration-300 rotate-2 hover:rotate-0"
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2.5 rounded-xl bg-[#082B61]/10 text-[#082B61] shrink-0 group-hover:scale-105 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#082B61]">Alta Performance</p>
                      <p className="text-[10px] font-medium text-slate-500">Funis de Vendas</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="group relative w-52 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/90 shadow-[0_10px_25px_rgba(230,79,20,0.06)] hover:shadow-[0_15px_30px_rgba(230,79,20,0.12)] transition-all duration-300 -translate-x-2 -rotate-1 hover:rotate-0"
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2.5 rounded-xl bg-[#E64F14]/10 text-[#E64F14] shrink-0 group-hover:scale-105 transition-transform">
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-xs backdrop-blur-md z-10 max-w-full"
              >
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#082B61] truncate">
                  JM MASTER GROUP • MARKETING DIGITAL & AUTOMAÇÃO
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#E64F14] shrink-0" />
              </motion.div>

              {/* Imposing Main H1 Title */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#082B61] tracking-tight leading-[1.15] max-w-3xl lg:max-w-4xl mx-auto z-10 px-1"
              >
                Comunicação que engaja e{" "}
                <span className="relative inline-block text-[#E64F14]">
                  converte.
                  <motion.svg
                    className="absolute -bottom-1.5 left-0 w-full h-2.5 text-[#E64F14]/80 pointer-events-none"
                    viewBox="0 0 200 12"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                    <path d="M2 9C50 3 150 3 198 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </motion.svg>
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed font-normal z-10 px-2"
              >
                Elevamos a presença digital e a taxa de conversão do seu negócio com automações avançadas de atendimento, chatbots automatizados 24/7 e gestão de tráfego de alta performance.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-1 w-full sm:w-auto z-10 max-w-md sm:max-w-none mx-auto"
              >
                {/* Primary CTA Laranja */}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center justify-center space-x-2.5 bg-gradient-to-r from-[#E64F14] via-[#F06228] to-[#C43E0A] hover:from-[#c43e0a] hover:to-[#E64F14] text-white text-sm sm:text-base font-extrabold px-6 py-3.5 rounded-full transition-all duration-200 shadow-lg shadow-[#E64F14]/25 hover:shadow-xl hover:shadow-[#E64F14]/35 active:scale-95 text-center"
                >
                  <span>Acelerar Meu Negócio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* Secondary CTA Outline Azul */}
                <a
                  href="#solucoes"
                  className="inline-flex items-center justify-center space-x-2 border-2 border-[#082B61] text-[#082B61] hover:bg-[#082B61] hover:text-white text-sm sm:text-base font-extrabold px-6 py-3.5 rounded-full transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 text-center"
                >
                  <span>Ver Soluções</span>
                </a>
              </motion.div>

              {/* Mobile / Tablet View dos 4 Cards (Grid 2x2 ou 1x4 responsivo abaixo dos CTAs) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="xl:hidden pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl w-full text-left"
              >
                {HIGHLIGHT_CARDS.map((card, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center space-x-3"
                  >
                    <div className={`p-2 rounded-xl ${card.bg} shrink-0`}>
                      {card.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#082B61] truncate">{card.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{card.subtitle}</p>
                    </div>
                  </div>
                ))}
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
