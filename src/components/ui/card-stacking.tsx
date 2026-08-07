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
  const rangeStart = index / total;
  const rangeEnd = 1;

  // Redução sutil de escala (scale) quando os próximos cards chegam no topo
  const targetScale = 1 - (total - index - 1) * 0.03;
  const scale = useTransform(progress, [rangeStart, rangeEnd], [1, targetScale]);
  const opacity = useTransform(progress, [rangeStart, rangeEnd], [1, 0.88 + index * 0.03]);

  // Offset dinâmico acumulativo para empilhar como um baralho no topo
  const topOffset = 110 + index * 24;

  return (
    <div
      className="sticky flex items-center justify-center mb-24 sm:mb-32 md:mb-40 last:mb-0 w-full"
      style={{
        top: `${topOffset}px`,
        zIndex: index + 1,
      }}
    >
      <motion.div
        style={{
          scale,
          opacity,
          willChange: "transform, opacity",
        }}
        className="group relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/90 shadow-[0_15px_40px_rgba(8,43,97,0.09)] hover:shadow-[0_25px_60px_rgba(8,43,97,0.16)] transition-shadow duration-300 overflow-hidden origin-top"
      >
        {/* Glow decorativo no topo direito */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle_at_top_right,_rgba(230,79,20,0.08)_0%,_rgba(8,43,97,0.05)_50%,_transparent_70%)] pointer-events-none group-hover:scale-110 transition-transform duration-500" />

        {/* Cabeçalho com Ícone e Badge */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#E64F14]/10 text-[#E64F14] border border-[#E64F14]/20 shadow-2xs group-hover:scale-105 transition-transform duration-300">
            {item.icon}
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs font-black text-[#082B61] tracking-wide shadow-2xs">
            {item.badge}
          </span>
        </div>

        {/* Título & Descrição */}
        <div className="space-y-2 relative z-10 mb-5 sm:mb-6">
          <p className="text-xs font-black uppercase tracking-wider text-[#E64F14]">
            {item.subtitle}
          </p>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#082B61] tracking-tight leading-tight">
            {item.title}
          </h3>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl pt-1 font-normal">
            {item.description}
          </p>
        </div>

        {/* Grid de Benefícios com Ícones Laranjas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 pt-1 mb-5 sm:mb-6 relative z-10">
          {item.list.map((beneficio, idx) => (
            <div key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#E64F14] shrink-0 mt-0.5" />
              <span>{beneficio}</span>
            </div>
          ))}
        </div>

        <div className="w-full h-px bg-slate-100 my-4" />

        {/* Rodapé do Card com CTA interativo */}
        <div className="pt-1 relative z-10 flex items-center justify-between">
          <button
            onClick={() => onCardClick && onCardClick(item)}
            className="inline-flex items-center space-x-2.5 text-[#E64F14] group-hover:text-[#c43e0a] font-black text-sm sm:text-base transition-colors py-1"
          >
            <span>Saiba mais sobre esta solução</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>

          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
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

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-8 sm:py-12">
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
