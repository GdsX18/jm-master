"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Flame } from "lucide-react";

export interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
  number?: string;
  subtitle?: string;
  highlight?: string;
}

export function DisplayCard({
  className,
  icon,
  title,
  description,
  date,
  iconClassName,
  titleClassName,
  number,
  subtitle,
  highlight,
}: DisplayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative flex flex-col justify-between w-full h-full min-h-[300px] sm:min-h-[340px] md:min-h-[360px] p-5 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl bg-[#0d1627] border border-slate-800 shadow-xl hover:border-[#E64F14]/60 hover:shadow-[#E64F14]/15 transition-all duration-300 group overflow-hidden select-none",
        className
      )}
    >
      {/* Ambient Radial Lighting on Hover */}
      <div className="absolute top-0 right-0 w-36 sm:w-48 h-36 sm:h-48 bg-gradient-to-br from-[#E64F14]/10 via-transparent to-transparent rounded-bl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          {number && (
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white/20 group-hover:text-white/40 transition-colors">
              {number}
            </span>
          )}

          {icon && (
            <div
              className={cn(
                "p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/10 text-white border border-white/10 group-hover:bg-[#E64F14] group-hover:text-white group-hover:border-[#E64F14] transition-all duration-300 shadow-sm",
                iconClassName
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Subtitle Uppercase Laranja */}
        {subtitle && (
          <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#E64F14] uppercase block mb-1.5">
            {subtitle}
          </span>
        )}

        {/* Title */}
        <h3
          className={cn(
            "text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight mb-2.5 sm:mb-3 group-hover:text-[#E64F14] transition-colors leading-snug",
            titleClassName
          )}
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal mb-4">
          {description}
        </p>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        {highlight ? (
          <span className="inline-flex items-center text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 group-hover:bg-[#E64F14]/20 group-hover:text-white transition-colors">
            <Flame className="w-3 h-3 text-[#E64F14] mr-1" />
            {highlight}
          </span>
        ) : date ? (
          <span className="text-xs font-medium text-slate-400">{date}</span>
        ) : (
          <span />
        )}

        <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 group-hover:bg-[#E64F14] transition-colors">
          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

export interface DisplayCardsProps {
  cards?: DisplayCardProps[];
  children?: React.ReactNode;
  className?: string;
}

export function DisplayCards({ cards, children, className }: DisplayCardsProps) {
  if (children) {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full", className)}>
        {children}
      </div>
    );
  }

  if (!cards || cards.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full", className)}>
      {cards.map((card, idx) => (
        <DisplayCard key={idx} {...card} />
      ))}
    </div>
  );
}
