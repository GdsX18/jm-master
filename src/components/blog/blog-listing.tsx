"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Filter, MessageSquare, RotateCcw } from "lucide-react";
import { BlogPost, CategoryType, BLOG_POSTS } from "@/data/posts";
import { PostCard } from "@/components/blog/post-card";

const WHATSAPP_NUMBER = "5521998567051";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!%20Vim%20pelo%20Blog%20da%20JM%20MASTER%20GROUP%20e%20gostaria%20de%20conversar%20sobre%20as%20solu%C3%A7%C3%B5es.`;

interface BlogListingProps {
  initialPosts?: BlogPost[];
  selectedCategory: CategoryType;
  onResetFilter: () => void;
  searchQuery: string;
}

export const BlogListing: React.FC<BlogListingProps> = ({
  initialPosts = BLOG_POSTS,
  selectedCategory,
  onResetFilter,
  searchQuery,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(6);

  // Filtragem dos posts por Categoria e Busca em tempo real
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      const matchesCategory =
        selectedCategory === "Todos" || post.category === selectedCategory;

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.author.name.toLowerCase().includes(query) ||
        post.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [initialPosts, selectedCategory, searchQuery]);

  const displayedPosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 3);
  };

  return (
    <section id="posts" className="py-12 sm:py-16 md:py-20 relative bg-slate-50/40">
      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1400px] mx-auto relative z-10">
        
        {/* ========================================================
            1. CABEÇALHO DA SEÇÃO: Título Alinhado à Esquerda ("Últimos Posts")
           ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 pb-4 border-b border-slate-200/80">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest text-[#E64F14]">
              <BookOpen className="w-3.5 h-3.5 text-[#E64F14]" />
              <span>PUBLICAÇÕES RECENTES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#082B61] tracking-tight">
              {selectedCategory === "Todos"
                ? "Últimos Posts"
                : `Posts em "${selectedCategory}"`}
            </h2>
          </div>

          {/* Contador de Posts e Informação de Filtro */}
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <span className="px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
              {filteredPosts.length} {filteredPosts.length === 1 ? "artigo encontrado" : "artigos encontrados"}
            </span>
            {(selectedCategory !== "Todos" || searchQuery !== "") && (
              <button
                onClick={onResetFilter}
                className="inline-flex items-center space-x-1 text-[#E64F14] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            2. GRID RESPONSIVO DE POSTS (3 cols desktop, 2 tablet, 1 mobile)
           ======================================================== */}
        {displayedPosts.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch"
          >
            <AnimatePresence mode="popLayout">
              {displayedPosts.map((post, idx) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={idx}
                  priority={idx < 3}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Empty State Amigável */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-16 px-6 rounded-3xl bg-white/80 border border-dashed border-slate-300 text-center max-w-lg mx-auto space-y-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E64F14]/10 text-[#E64F14] flex items-center justify-center mx-auto">
              <Filter className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#082B61]">Nenhum artigo encontrado</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Não encontramos posts para os critérios selecionados. Tente buscar por outros termos ou redefina os filtros.
              </p>
            </div>
            <button
              onClick={onResetFilter}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#082B61] hover:bg-[#E64F14] text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ver Todos os Posts</span>
            </button>
          </motion.div>
        )}

        {/* ========================================================
            3. BOTÃO CARREGAR MAIS (Caso haja mais de 6 posts)
           ======================================================== */}
        {hasMore && (
          <div className="mt-12 sm:mt-16 flex justify-center">
            <button
              onClick={handleLoadMore}
              className="group relative inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-white hover:bg-slate-900 hover:text-white text-[#082B61] border border-slate-300 font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <span>Carregar Mais Artigos</span>
              <ArrowRight className="w-4 h-4 text-[#E64F14] group-hover:text-white group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* ========================================================
            4. BANNER CTA DE CONVERSÃO (CLEAN GLASSMORPHISM)
           ======================================================== */}
        <div className="mt-16 sm:mt-24 p-8 sm:p-12 rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_15px_40px_rgba(8,43,97,0.06)] relative overflow-hidden">
          {/* Luzes decorativas translúcidas suaves */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#E64F14]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#082B61]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 text-[#082B61] text-[11px] font-black uppercase tracking-wider border border-slate-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>CONSULTORIA ESTRATÉGICA GRATUITA</span>
            </span>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#082B61] tracking-tight leading-tight">
              Pronto para aplicar essas estratégias e multiplicar seus resultados?
            </h3>

            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
              Fale agora com nosso time de especialistas e receba um diagnóstico personalizado do seu funil de atendimento e automação via WhatsApp API Oficial.
            </p>

            <div className="pt-2">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#E64F14] via-[#F06228] to-[#C43E0A] hover:from-[#c43e0a] hover:to-[#E64F14] text-white text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-lg shadow-[#E64F14]/25 hover:shadow-xl hover:shadow-[#E64F14]/35 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Conversar com Especialista</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
