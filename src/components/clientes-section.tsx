"use client";

import React from "react";
import { motion } from "framer-motion";
import { Marquee } from "@/components/ui/marquee";
import { Users, Award, ShieldCheck, Sparkles } from "lucide-react";

export const ClientesSection: React.FC = () => {
  return (
    <section id="clientes" className="py-16 sm:py-24 relative overflow-hidden bg-slate-50 border-y border-slate-200/80">
      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1400px] mx-auto text-center space-y-8 sm:space-y-12">
        
        {/* Header */}
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#082B61]/10 text-[#082B61] text-[10px] sm:text-xs font-black tracking-widest uppercase"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E64F14]" />
            <span>ECOSSISTEMA & EMPRESAS QUE CONFIAM</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black text-[#082B61] tracking-tight"
          >
            Tecnologia aprovada por grandes marcas
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl"
          >
            Conectamos negócios de alto impacto à API Oficial do WhatsApp e plataformas omnichannel com máxima segurança e estabilidade.
          </motion.p>
        </div>

        {/* Carrossel Infinito Marquee para Logos e Clientes */}
        <Marquee />

        {/* Bento Grid Prova Social e Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-md sm:shadow-lg flex items-center space-x-4 sm:space-x-5 text-left"
          >
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#E64F14]/10 text-[#E64F14] shrink-0">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#082B61]">+1 MILHÃO</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5">Mensagens / Mês</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-md sm:shadow-lg flex items-center space-x-4 sm:space-x-5 text-left"
          >
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#082B61]/10 text-[#082B61] shrink-0">
              <Award className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#082B61]">99.9%</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5">Uptime API Oficial Meta</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-md sm:shadow-lg flex items-center space-x-4 sm:space-x-5 text-left"
          >
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#E64F14]/10 text-[#E64F14] shrink-0">
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#082B61]">100% LGPD</p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5">Criptografia & Privacidade</p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};
