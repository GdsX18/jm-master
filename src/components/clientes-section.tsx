"use client";

import React from "react";
import { motion } from "framer-motion";
import { Marquee } from "@/components/ui/marquee";
import { Users, Award, ShieldCheck, Zap, Sparkles } from "lucide-react";

export const ClientesSection: React.FC = () => {
  return (
    <section id="clientes" className="py-24 relative overflow-hidden bg-slate-50 border-y border-slate-200/80">
      <div className="w-full px-6 md:px-12 lg:px-16 max-w-[1500px] mx-auto text-center space-y-12">
        
        {/* Header */}
        <div className="flex flex-col items-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#082B61]/10 text-[#082B61] text-xs font-black tracking-widest uppercase"
          >
            <Sparkles className="w-4 h-4 text-[#E64F14]" />
            <span>ECOSSISTEMA & EMPRESAS QUE CONFIAM</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-[#082B61] tracking-tight"
          >
            Tecnologia aprovada por grandes marcas
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-slate-600 max-w-2xl"
          >
            Conectamos negócios de alto impacto à API Oficial do WhatsApp e plataformas omnichannel com máxima segurança e estabilidade.
          </motion.p>
        </div>

        {/* Carrossel Infinito Marquee para Logos e Clientes de public/logos */}
        <Marquee />

        {/* Bento Grid Prova Social e Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl flex items-center space-x-5 text-left"
          >
            <div className="p-4 rounded-2xl bg-[#E64F14]/10 text-[#E64F14]">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-black text-[#082B61]">+1 MILHÃO</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Mensagens Disparadas / Mês</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl flex items-center space-x-5 text-left"
          >
            <div className="p-4 rounded-2xl bg-[#082B61]/10 text-[#082B61]">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-black text-[#082B61]">99.9%</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Uptime API Oficial Meta</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl flex items-center space-x-5 text-left"
          >
            <div className="p-4 rounded-2xl bg-[#E64F14]/10 text-[#E64F14]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-black text-[#082B61]">100% LGPD</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Criptografia & Privacidade</p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};
