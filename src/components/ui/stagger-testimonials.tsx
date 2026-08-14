"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, ShieldCheck, Sparkles } from "lucide-react";

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
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250",
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
      "O chatbot automatizado transformou nosso fluxo de mensagens. Qualifica nossos prospects 24/7 e passa para a equipe de vendas apenas quem tem real potencial de compra.",
    highlightBadge: "Qualificação 24/7 Automática",
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
  subtitle = "Empresas que aceleraram vendas e revolucionaram o atendimento com automação inteligente e chatbots.",
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

  const current = testimonials[currentIndex];

  return (
    <section className="relative py-16 sm:py-24 md:py-32 bg-[#040814] text-white overflow-hidden border-t border-b border-white/5">
      {/* Background Decorative Glows Otimizados */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-72 bg-[radial-gradient(ellipse_at_center,_rgba(0,112,243,0.12)_0%,_rgba(255,87,34,0.06)_50%,_transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 relative z-10 space-y-10 sm:space-y-14">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#FF5722] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5722]" />
            <span>Depoimentos & Casos de Sucesso</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            {title}
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Testimonial Active Display Card com animação suave e sem corte */}
        <div
          className="relative max-w-3xl mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-[#0070F3]/30 bg-[#0a1224]/95 backdrop-blur-xl shadow-2xl shadow-blue-950/40 space-y-5 sm:space-y-6"
            >
              {/* Top Row: Stars + Highlight Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#FF5722] text-[#FF5722]" />
                  ))}
                </div>

                {current.highlightBadge && (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0070F3]/15 border border-[#0070F3]/30 text-[11px] sm:text-xs font-bold text-[#0070F3]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{current.highlightBadge}</span>
                  </div>
                )}
              </div>

              {/* Quote Content */}
              <div className="relative pl-5 sm:pl-7">
                <Quote className="absolute top-0 left-0 w-4 h-4 sm:w-5 sm:h-5 text-[#FF5722]/50" />
                <p className="text-sm sm:text-base md:text-lg text-slate-100 font-medium leading-relaxed italic">
                  "{current.quote}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center space-x-3 sm:space-x-3.5">
                  <img
                    src={current.avatar}
                    alt={current.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#0070F3]/40 shadow-xs"
                  />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {current.name}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium flex items-center space-x-1">
                      <span>{current.role}</span>
                      {current.company && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-300">{current.company}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  ✓ Cliente Verificado
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls: Prev / Next Buttons & Indicators */}
          <div className="flex items-center justify-center space-x-5 pt-6">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-[#0070F3] hover:text-white text-slate-300 transition-all duration-200 shadow-xs active:scale-95 touch-manipulation"
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
                  className={`h-2.5 rounded-full transition-all duration-300 touch-manipulation ${
                    currentIndex === idx
                      ? "w-7 bg-gradient-to-r from-[#0070F3] to-[#FF5722]"
                      : "w-2.5 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Ir para depoimento ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-[#FF5722] hover:text-white text-slate-300 transition-all duration-200 shadow-xs active:scale-95 touch-manipulation"
              aria-label="Próximo Depoimento"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default StaggerTestimonials;
