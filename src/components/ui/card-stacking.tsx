"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export interface StackingCardItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  list: string[];
  icon: React.ReactNode;
  whatsappMsg: string;
}

interface SingleCardProps {
  item: StackingCardItem;
  index: number;
  total: number;
  progress: MotionValue<number>;
  onCardClick?: (item: StackingCardItem) => void;
}

const SingleCard: React.FC<SingleCardProps> = ({
  item,
  index,
  total,
  progress,
  onCardClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Range de scroll individual para o efeito de empilhamento e redução de escala
  const rangeStart = index / total;
  const rangeEnd = 1;

  // Redução suave de escala (scale) conforme os cards posteriores sobrepõem
  const targetScale = 1 - (total - index - 1) * 0.04;
  const scale = useTransform(progress, [rangeStart, rangeEnd], [1, targetScale]);

  // Opacidade sutil para destacar o card ativo da frente
  const opacity = useTransform(progress, [rangeStart, rangeEnd], [1, 0.8 + index * 0.05]);

  // Offset fixo no topo para o empilhamento acumulativo (position: sticky)
  const topOffset = 100 + index * 26;

  return (
    <div
      ref={cardRef}
      className="sticky flex items-center justify-center mb-16 sm:mb-24 last:mb-0"
      style={{
        top: `${topOffset}px`,
      }}
    >
      <motion.div
        style={{
          scale,
          opacity,
          willChange: "transform, opacity",
        }}
        className="group relative w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/90 shadow-[0_15px_35px_rgba(8,43,97,0.06)] hover:shadow-[0_20px_45px_rgba(8,43,97,0.12)] transition-shadow duration-300 overflow-hidden origin-top"
      >
        {/* Brilho decorativo no topo direito do card Otimizado */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle_at_top_right,_rgba(230,79,20,0.06)_0%,_rgba(8,43,97,0.04)_50%,_transparent_70%)] pointer-events-none group-hover:scale-110 transition-transform duration-500" />

        {/* Cabeçalho: Ícone em destaque + Badge */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="p-3.5 rounded-2xl bg-[#E64F14]/10 text-[#E64F14] border border-[#E64F14]/20 shadow-sm group-hover:scale-105 transition-transform duration-300">
            {item.icon}
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs font-black text-[#082B61] tracking-wide shadow-2xs">
            {item.badge}
          </span>
        </div>

        {/* Título & Descrição */}
        <div className="space-y-2 relative z-10 mb-6">
          <p className="text-xs font-black uppercase tracking-wider text-[#E64F14]">
            {item.subtitle}
          </p>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#082B61] tracking-tight leading-tight">
            {item.title}
          </h3>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl pt-1">
            {item.description}
          </p>
        </div>

        {/* Benefícios em Grid com Ícones de Checagem Laranjas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 mb-6 relative z-10">
          {item.list.map((beneficio, idx) => (
            <div key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm font-semibold text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-[#E64F14] shrink-0 mt-0.5" />
              <span>{beneficio}</span>
            </div>
          ))}
        </div>

        {/* Divisor Limpo */}
        <div className="w-full h-px bg-slate-100 my-4" />

        {/* Rodapé com CTA */}
        <div className="pt-1 relative z-10 flex items-center justify-between">
          <button
            onClick={() => onCardClick && onCardClick(item)}
            className="inline-flex items-center space-x-2 text-[#E64F14] group-hover:text-[#c43e0a] font-extrabold text-sm sm:text-base transition-colors"
          >
            <span>Saiba mais sobre esta solução</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>

          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest hidden sm:inline-block">
            {index + 1} DE {total}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

interface CardStackingProps {
  items: StackingCardItem[];
  onCardClick?: (item: StackingCardItem) => void;
}

export const CardStacking: React.FC<CardStackingProps> = ({ items, onCardClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Conexão com o hook useScroll do framer-motion referenciando o container pai das soluções
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-8">
      {items.map((item, index) => (
        <SingleCard
          key={item.id || item.title}
          item={item}
          index={index}
          total={items.length}
          progress={scrollYProgress}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
};
