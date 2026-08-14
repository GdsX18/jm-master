"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Search, X } from "lucide-react";
import { CATEGORIES, CategoryType } from "@/data/posts";

interface BlogHeroProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalPosts: number;
}

export const BlogHero: React.FC<BlogHeroProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalPosts,
}) => {
  return (
    <section className="relative pt-28 sm:pt-32 md:pt-40 pb-10 sm:pb-14 overflow-hidden bg-slate-50/60 border-b border-slate-200/60">
      {/* Orbes de Iluminação Ambiente flutuantes ao fundo */}
      <div className="ambient-orb-laranja top-[-80px] left-1/2 -translate-x-1/2 opacity-30 animate-pulse-glow" />
      <div className="ambient-orb-azul top-[100px] left-[10%] opacity-25" />

      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1400px] mx-auto relative z-10">
        <div className="flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          
          {/* Top Badge Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-xs backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#E64F14] animate-ping shrink-0" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#082B61]">
              JM MASTER BLOG • INSIGHTS & TENDÊNCIAS
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#E64F14] shrink-0" />
          </motion.div>

          {/* Imposing Main H1 Title (Centralizado) */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#082B61] tracking-tight leading-[1.15]"
          >
            Blog &{" "}
            <span className="relative inline-block text-[#E64F14]">
              Notícias
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

          {/* Subtítulo explicativo centralizado em tom suave */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Estratégias avançadas, chatbots de atendimento, WhatsApp API Oficial e metodologias comprovadas para transformar a comunicação e acelerar o faturamento da sua empresa.
          </motion.p>

          {/* Barra de Pesquisa Rápida com Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="w-full max-w-md mx-auto pt-2"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar artigos por título, tema ou tecnologia..."
                className="w-full pl-11 pr-10 py-3 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E64F14]/50 focus:border-[#E64F14] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Pílulas/Tags de filtro de categoria centralizadas logo abaixo */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-4 sm:pt-6 w-full"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-w-3xl mx-auto">
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => onSelectCategory(category)}
                    className={`relative px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 shadow-xs cursor-pointer select-none ${
                      isSelected
                        ? "bg-gradient-to-r from-[#E64F14] via-[#F06228] to-[#C43E0A] text-white shadow-md shadow-[#E64F14]/25 scale-105"
                        : "bg-white/80 hover:bg-white text-slate-700 hover:text-[#E64F14] border border-slate-200/80 hover:border-[#E64F14]/30 hover:scale-[1.02]"
                    }`}
                  >
                    <span>{category}</span>
                    {isSelected && (
                      <motion.span
                        layoutId="activePillIndicator"
                        className="ml-1.5 text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full"
                      >
                        {totalPosts}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
