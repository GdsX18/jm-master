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
    icon: <Compass className="w-6 h-6" />,
  },
  {
    number: "02",
    subtitle: "VETOR CONTÍNUO DE ESCALA",
    title: "Crescimento Acelerado",
    description:
      "Transformamos tráfego e interações em receita previsível através de funis otimizados de alta conversão.",
    highlight: "+150% em Engajamento",
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    number: "03",
    subtitle: "RESPOSTAS EM TEMPO REAL",
    title: "Rapidez de Disparo",
    description:
      "Engaje leads no exato momento da intenção com automação instantânea no WhatsApp, SMS e E-mail Marketing.",
    highlight: "Automação 24/7",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    number: "04",
    subtitle: "ALCANCE SEM RUÍDO",
    title: "Precisão Omnichannel",
    description:
      "Conecte todos os seus canais em uma única plataforma inteligente de mensagens corporativas integradas.",
    highlight: "Visão 360° do Cliente",
    icon: <Radio className="w-6 h-6" />,
  },
];

export const MetodologiaSection: React.FC = () => {
  return (
    <section id="metodologia" className="py-32 relative overflow-hidden bg-[#070d19] text-white">
      {/* Ambient Lighting Orbs Otimizadas */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,_rgba(230,79,20,0.12)_0%,_transparent_70%)] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(8,43,97,0.25)_0%,_transparent_70%)] rounded-full pointer-events-none" />

      <div className="w-full px-6 md:px-12 lg:px-16 max-w-[1500px] mx-auto relative z-10">
        
        {/* Header da Seção */}
        <div className="flex flex-col items-center text-center space-y-5 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <Target className="w-4 h-4 text-[#E64F14]" />
            <span className="text-xs font-black tracking-widest text-[#E64F14] uppercase">
              METODOLOGIA EXCLUSIVA JM MASTER GROUP
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight"
          >
            O PODER DAS SETAS NO MARKETING
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-xl text-slate-300 max-w-3xl leading-relaxed"
          >
            Uma seta representa direção, velocidade e alvo certeiro. Na JM MASTER group, orientamos a comunicação da sua empresa para atingir o resultado com máxima precisão.
          </motion.p>
        </div>

        {/* Display Cards Component (21st.dev) */}
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
