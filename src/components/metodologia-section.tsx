"use client";

import React from "react";
import { motion } from "framer-motion";
import { Compass, TrendingUp, Zap, Radio, Target } from "lucide-react";
import { DisplayCards, DisplayCard } from "@/components/ui/display-cards";

const PILARES = [
  {
    number: "01",
    subtitle: "NAVEGAÇÃO SEM DESVIOS",
    title: "Direção Estratégica",
    description:
      "Definimos a rota exata da sua comunicação para atingir os clientes certos com máxima eficiência e sem desperdício de verba.",
    highlight: "Foco total no ICP",
    icon: <Compass className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    number: "02",
    subtitle: "VETOR CONTÍNUO DE ESCALA",
    title: "Crescimento Acelerado",
    description:
      "Transformamos tráfego e interações em receita previsível através de funis otimizados de alta conversão.",
    highlight: "+150% em Engajamento",
    icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    number: "03",
    subtitle: "RESPOSTAS EM TEMPO REAL",
    title: "Rapidez de Disparo",
    description:
      "Engaje leads no exato momento da intenção com automação instantânea no WhatsApp, SMS e E-mail Marketing.",
    highlight: "Automação 24/7",
    icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
  {
    number: "04",
    subtitle: "ALCANCE SEM RUÍDO",
    title: "Precisão Omnichannel",
    description:
      "Conecte todos os seus canais em uma única plataforma inteligente de mensagens corporativas integradas.",
    highlight: "Visão 360° do Cliente",
    icon: <Radio className="w-5 h-5 sm:w-6 sm:h-6" />,
  },
];

export const MetodologiaSection: React.FC = () => {
  return (
    <section id="metodologia" className="py-16 sm:py-24 md:py-32 relative overflow-hidden bg-[#070d19] text-white">
      {/* Ambient Lighting Orbs Otimizadas */}
      <div className="ambient-orb-laranja top-1/4 left-0 sm:left-1/4 opacity-40" />
      <div className="ambient-orb-azul bottom-1/4 right-0 sm:right-1/4 opacity-40" />

      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1400px] mx-auto relative z-10">
        
        {/* Header da Seção */}
        <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 mb-12 sm:mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <Target className="w-3.5 h-3.5 text-[#E64F14]" />
            <span className="text-[10px] sm:text-xs font-black tracking-widest text-[#E64F14] uppercase">
              METODOLOGIA EXCLUSIVA JM MASTER GROUP
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
          >
            O PODER DAS SETAS NO MARKETING
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm md:text-lg text-slate-300 max-w-2xl sm:max-w-3xl leading-relaxed font-normal"
          >
            Uma seta representa direção, velocidade e alvo certeiro. Na JM MASTER GROUP, orientamos a comunicação da sua empresa para atingir o resultado com máxima precisão.
          </motion.p>
        </div>

        {/* Display Cards Component */}
        <DisplayCards>
          {PILARES.map((pilar) => (
            <DisplayCard
              key={pilar.number}
              number={pilar.number}
              subtitle={pilar.subtitle}
              title={pilar.title}
              description={pilar.description}
              highlight={pilar.highlight}
              icon={pilar.icon}
            />
          ))}
        </DisplayCards>

      </div>
    </section>
  );
};
