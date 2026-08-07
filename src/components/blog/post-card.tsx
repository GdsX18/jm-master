"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowUpRight, Sparkles } from "lucide-react";
import { BlogPost } from "@/data/posts";

interface PostCardProps {
  post: BlogPost;
  index: number;
  priority?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  index,
  priority = false,
}) => {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.4) }}
      className="h-full"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group relative flex flex-col justify-between h-full bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 hover:border-[#E64F14]/40 shadow-[0_4px_20px_rgba(8,43,97,0.04)] hover:shadow-[0_16px_35px_rgba(8,43,97,0.1)] transition-all duration-300 overflow-hidden cursor-pointer block"
      >
        {/* Glow Superior Suave no Hover */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#E64F14] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

        <div>
          {/* ========================================================
              1. IMAGEM DE CAPA COM ASPECT-RATIO UNIFORME E LAZY LOAD
             ======================================================== */}
          <div className="relative w-full aspect-[16/10] overflow-hidden rounded-t-2xl sm:rounded-t-3xl bg-slate-100">
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading={priority ? undefined : "lazy"}
              priority={priority}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />

            {/* Overlay gradiente suave sobre a imagem */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />

            {/* Badge de Categoria Flutuante sobre a Imagem */}
            <div className="absolute top-3.5 left-3.5 z-10">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-md text-[#082B61] border border-white/80 shadow-xs group-hover:bg-[#E64F14] group-hover:text-white transition-colors duration-300">
                <Sparkles className="w-3 h-3 text-[#E64F14] group-hover:text-white transition-colors" />
                <span>{post.category}</span>
              </span>
            </div>

            {/* Selo de Post em Destaque */}
            {post.featured && (
              <div className="absolute top-3.5 right-3.5 z-10">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#E64F14] text-white shadow-md">
                  Destaque
                </span>
              </div>
            )}
          </div>

          {/* ========================================================
              2. CONTEÚDO DO CARD (METAS, TÍTULO E EXCERPT)
             ======================================================== */}
          <div className="p-5 sm:p-6 space-y-3.5">
            {/* Informações no Topo: Data de Publicação • Tempo de Leitura */}
            <div className="flex items-center space-x-3 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#E64F14]" />
                <span>{post.date}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-[#082B61]" />
                <span>{post.readTime}</span>
              </span>
            </div>

            {/* Título do Post com excelente hierarquia visual */}
            <h3 className="text-lg sm:text-xl font-black text-[#082B61] group-hover:text-[#E64F14] transition-colors duration-200 leading-snug line-clamp-2">
              {post.title}
            </h3>

            {/* Resumo/Excerpt limitado a 3 linhas (line-clamp) */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal line-clamp-3">
              {post.excerpt}
            </p>
          </div>
        </div>

        {/* ========================================================
            3. RODAPÉ DO CARD: LOGO DA EMPRESA + JM MASTER GROUP & CTA
           ======================================================== */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-slate-100/90 mt-auto">
          <div className="flex items-center justify-between gap-3">
            {/* Autor: Avatar com Logo JM Master + Nome Oficial e Cargo */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-slate-100 group-hover:ring-[#E64F14]/40 transition-all bg-white p-1 flex items-center justify-center shadow-2xs">
                <Image
                  src={post.author.avatar || "/logos/Icone.png"}
                  alt="JM MASTER GROUP"
                  width={36}
                  height={36}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#082B61] truncate leading-tight group-hover:text-[#E64F14] transition-colors">
                  {post.author.name}
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate leading-tight mt-0.5">
                  {post.author.role}
                </p>
              </div>
            </div>

            {/* Seta de Ação Interativa no Canto Inferior Direito */}
            <div className="shrink-0 p-2 rounded-xl bg-slate-100 text-[#082B61] group-hover:bg-[#E64F14] group-hover:text-white transition-all duration-200 shadow-xs">
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
