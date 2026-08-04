"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const THEMES = {
  primary: "from-[#082B61] via-[#0D3B82] to-[#051C42]",
  accent: "from-[#E64F14] via-[#F06228] to-[#C43E0A]",
  light: "from-slate-800 via-slate-900 to-slate-950",
} as const;

type ThemeType = keyof typeof THEMES;

interface MousePos {
  readonly x: number;
  readonly y: number;
}

export interface Card3DProps {
  title: string;
  subtitle?: string;
  description: string;
  badge?: string;
  list?: string[];
  icon?: React.ReactNode;
  theme?: ThemeType;
  onClick?: () => void;
  className?: string;
}

export const Card3D: React.FC<Card3DProps> = ({
  title,
  subtitle,
  description,
  badge,
  list,
  icon,
  onClick,
  className,
}) => {
  const [mousePos, setMousePos] = useState<MousePos>({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Suavizada a rotação para manter nitidez absoluta (crisp font rendering)
    setMousePos({
      x: (x / rect.width - 0.5) * 16,
      y: (y / rect.height - 0.5) * -16,
    });
  }, []);

  return (
    <div className="w-full h-full min-h-[400px] perspective-[1000px]">
      <motion.div
        className={cn(
          "group relative w-full h-full rounded-3xl p-8 transition-shadow duration-300 ease-out border-2 border-slate-200/90 bg-white shadow-xl hover:shadow-2xl hover:border-[#E64F14] cursor-pointer text-slate-800 antialiased select-none",
          className
        )}
        onMouseMove={handleMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setMousePos({ x: 0, y: 0 });
        }}
        animate={{
          rotateX: mousePos.y,
          rotateY: mousePos.x,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{
          transformStyle: "preserve-3d",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          backfaceVisibility: "hidden",
        }}
        onClick={onClick}
      >
        {/* Glow sutil na borda sem afetar o texto */}
        <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
          <div>
            <div className="flex justify-between items-center mb-6">
              {icon && (
                <div className="p-3.5 rounded-2xl bg-[#E64F14]/10 text-[#E64F14] text-2xl font-bold flex items-center justify-center border border-[#E64F14]/20 group-hover:bg-[#E64F14] group-hover:text-white transition-colors duration-300">
                  {icon}
                </div>
              )}
              {badge && (
                <span className="text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-[#082B61]/10 text-[#082B61] border border-[#082B61]/20 group-hover:bg-[#082B61] group-hover:text-white transition-colors duration-300">
                  {badge}
                </span>
              )}
            </div>

            {subtitle && (
              <span className="text-xs font-black tracking-widest text-[#E64F14] uppercase block mb-1.5">
                {subtitle}
              </span>
            )}

            <h3 className="text-2xl font-black text-[#082B61] tracking-tight mb-3 group-hover:text-[#E64F14] transition-colors">
              {title}
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
              {description}
            </p>

            {list && list.length > 0 && (
              <ul className="space-y-2.5 my-4">
                {list.map((item, idx) => (
                  <li key={idx} className="flex items-center text-xs font-bold text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-[#E64F14] text-white flex items-center justify-center text-[10px] mr-2.5 font-black flex-shrink-0">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center text-xs font-black text-[#E64F14] group-hover:translate-x-2 transition-transform duration-300">
            <span>Saiba mais sobre esta solução</span>
            <span className="ml-2 text-sm">→</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
