"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, ShieldCheck, Sparkles, Building2 } from "lucide-react";

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  company?: string;
  avatar: string;
  rating: number;
  quote: string;
  highlightBadge?: string;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Ricardo M.",
    role: "Diretor de Operações",
    company: "Grupo LogisTech",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
    rating: 5,
    quote:
      "Automatizamos todo o nosso atendimento via WhatsApp. A velocidade de resposta e a retenção de leads aumentaram drasticamente já no primeiro mês!",
    highlightBadge: "+185% Retenção de Leads",
  },
  {
    id: 2,
    name: "Fernanda S.",
    role: "Head de Marketing",
    company: "Veloce SaaS",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250",
    rating: 5,
    quote:
      "O chatbot com IA realmente parece humano. Qualifica nossos prospects 24/7 e passa para a equipe de vendas apenas quem tem real potencial de compra.",
    highlightBadge: "Qualificação 24/7 com IA",
  },
  {
    id: 3,
    name: "Lucas T.",
    role: "Gerente Comercial",
    company: "Nexus Soluções",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
    rating: 5,
    quote:
      "Com as réguas de automação e SMS, reduzimos o no-show de reuniões em mais de 40%. A integração foi perfeita.",
    highlightBadge: "-40% No-Show em Reuniões",
  },
  {
    id: 4,
    name: "Carla B.",
    role: "CEO & Fundadora",
    company: "Fintech Evolve",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250",
    rating: 5,
    quote:
      "Se eu pudesse dar 6 estrelas, daria. A plataforma homologada pela Meta nos deu a segurança necessária para escalar sem risco de banimento.",
    highlightBadge: "API Oficial Meta 100% Segura",
  },
];

interface StaggerTestimonialsProps {
  testimonials?: Testimonial[];
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const StaggerTestimonials: React.FC<StaggerTestimonialsProps> = ({
  testimonials = DEFAULT_TESTIMONIALS,
  title = "Resultados Reais de Quem Confia na JM MASTER GROUP",
  subtitle = "Empresas que aceleraram vendas e revolucionaram o atendimento com automação inteligente e IA conversacional.",
  autoPlay = true,
  autoPlayInterval = 6000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!autoPlay || isHovered) return;
    const timer = setInterval(() => {
      handleNext();
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, isHovered, currentIndex]);

  return (
    <section className="relative py-24 md:py-32 bg-[#040814] text-white overflow-hidden border-t border-b border-white/5">
      {/* Background Decorative Glows Otimizados */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 bg-[radial-gradient(ellipse_at_center,_rgba(0,112,243,0.15)_0%,_rgba(255,87,34,0.08)_50%,_transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,_rgba(0,112,243,0.12)_0%,_transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-[#FF5722] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5722]" />
            <span>Depoimentos & Casos de Sucesso</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {title}
          </h2>

          <p className="text-slate-400 text-base md:text-lg font-normal leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Staggered Testimonials Stack Container */}
        <div 
          className="relative min-h-[420px] md:min-h-[380px] flex items-center justify-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative w-full max-w-2xl h-[340px] md:h-[300px] flex items-center justify-center">
            {testimonials.map((item, index) => {
              // Calculate offset relative to current index
              const total = testimonials.length;
              const position = (index - currentIndex + total) % total;
              
              // Only render front 3 visible cards in stack
              if (position > 3) return null;

              const isFront = position === 0;

              return (
                <motion.div
                  key={item.id}
                  style={{
                    zIndex: total - position,
                  }}
                  initial={false}
                  animate={{
                    scale: 1 - position * 0.05,
                    y: position * 18,
                    rotate: position === 0 ? 0 : position % 2 === 1 ? position * 2 : position * -2,
                    opacity: position === 0 ? 1 : 1 - position * 0.25,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 24,
                  }}
                  className={`absolute top-0 w-full p-6 md:p-8 rounded-2xl border bg-[#0a1224]/90 backdrop-blur-xl shadow-2xl transition-shadow duration-300 ${
                    isFront
                      ? "border-[#0070F3]/40 shadow-blue-950/50"
                      : "border-white/10"
                  }`}
                >
                  <div className="flex flex-col justify-between h-full space-y-6">
                    {/* Top Row: Stars + Highlight Badge */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#FF5722] text-[#FF5722]" />
                        ))}
                      </div>

                      {item.highlightBadge && (
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0070F3]/15 border border-[#0070F3]/30 text-xs font-bold text-[#0070F3]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{item.highlightBadge}</span>
                        </div>
                      )}
                    </div>

                    {/* Quote Content */}
                    <div className="relative pl-6">
                      <Quote className="absolute top-0 left-0 w-5 h-5 text-[#FF5722]/50 -translate-x-1" />
                      <p className="text-base md:text-lg text-slate-100 font-medium leading-relaxed italic">
                        "{item.quote}"
                      </p>
                    </div>

                    {/* Author Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-[#0070F3]/40 shadow-md"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-white leading-snug">
                            {item.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                            <span>{item.role}</span>
                            {item.company && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300">{item.company}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Verified Badge */}
                      <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/20">
                        ✓ Cliente Verificado
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Controls: Prev / Next Buttons & Indicators */}
        <div className="flex items-center justify-center space-x-6 pt-4">
          <button
            onClick={handlePrev}
            className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-[#0070F3] hover:text-white text-slate-300 transition-all duration-200 shadow-md active:scale-95"
            aria-label="Depoimento Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? "w-8 bg-gradient-to-r from-[#0070F3] to-[#FF5722]"
                    : "w-2.5 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Ir para depoimento ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-[#FF5722] hover:text-white text-slate-300 transition-all duration-200 shadow-md active:scale-95"
            aria-label="Próximo Depoimento"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default StaggerTestimonials;
