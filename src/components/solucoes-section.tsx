"use client";

import React from "react";
import { motion } from "framer-motion";
import { CardStacking, StackingCardItem } from "@/components/ui/card-stacking";
import { MessageCircle, Bot, Mail, Smartphone, Layers } from "lucide-react";

const WHATSAPP_NUMBER = "5521951011616";

const SOLUCOES_ITEMS: StackingCardItem[] = [
  {
    id: "whatsapp",
    title: "WhatsApp Business & Automação",
    subtitle: "API OFICIAL META",
    badge: "Mais Popular",
    description:
      "Conecte sua empresa à API Oficial do WhatsApp. Atendimento em equipe, disparos segmentados em massa e automações que vendem por você.",
    list: [
      "API Oficial Meta com selo de verificação",
      "Múltiplos atendentes em um único número",
      "Fluxos automatizados de vendas e pós-venda",
      "Relatórios e métricas de desempenho em tempo real",
    ],
    icon: <MessageCircle className="w-7 h-7 text-[#E64F14]" />,
    whatsappMsg: "Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20a%20solu%C3%A7%C3%A3o%20de%20WhatsApp%20Business%20%26%20Automa%C3%A7%C3%A3o.",
  },
  {
    id: "chatbot",
    title: "Chatbot Inteligente com IA",
    subtitle: "INTELIGÊNCIA CONVERSACIONAL",
    badge: "Atendimento 24/7",
    description:
      "Atendimento automatizado sem parecer robô. Responda clientes instantaneamente, qualifique leads e transfira chamados para atendentes de forma fluida.",
    list: [
      "Qualificação automática de prospects",
      "Integração com CRM e bases de conhecimento",
      "Transição inteligente para atendimento humano",
    ],
    icon: <Bot className="w-7 h-7 text-[#E64F14]" />,
    whatsappMsg: "Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20Chatbot%20Inteligente%20com%20IA.",
  },
  {
    id: "email",
    title: "E-mail Marketing Estratégico",
    subtitle: "RÉGUAS DE RELACIONAMENTO",
    badge: "Alta Entregabilidade",
    description:
      "Crie réguas de relacionamento altamente personalizadas. Aumente a retenção de clientes com newsletters e e-mails transacionais de alto engajamento.",
    list: [
      "Garantia de alta entregabilidade na caixa de entrada",
      "Automação de boas-vindas, carrinho abandonado e pós-venda",
      "Testes A/B para assuntos e conteúdos",
    ],
    icon: <Mail className="w-7 h-7 text-[#E64F14]" />,
    whatsappMsg: "Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20E-mail%20Marketing%20Estrat%C3%A9gico.",
  },
  {
    id: "sms",
    title: "SMS Marketing Corporativo",
    subtitle: "DISPARO INSTANTÂNEO",
    badge: "98% Taxa de Abertura",
    description:
      "A comunicação mais rápida e direta com seu cliente. Ideal para lembretes de agendamentos, validação de tokens (2FA) e ofertas relâmpago.",
    list: [
      "Entregabilidade instantânea em segundos",
      "Cobrança inteligente e avisos operacionais",
      "Relatórios de confirmação de leitura",
    ],
    icon: <Smartphone className="w-7 h-7 text-[#E64F14]" />,
    whatsappMsg: "Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20SMS%20Marketing%20Corporativo.",
  },
];

export const SolucoesSection: React.FC = () => {
  const handleCardClick = (item: StackingCardItem) => {
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${item.whatsappMsg}`,
      "_blank"
    );
  };

  return (
    <section id="solucoes" className="py-24 md:py-32 relative bg-slate-50/60">
      {/* Glow de Iluminação ambiente */}
      <div className="ambient-orb-laranja top-1/3 left-1/4 animate-pulse-glow" />
      <div className="ambient-orb-azul bottom-1/4 right-1/4 animate-pulse-glow" />

      <div className="w-full px-4 sm:px-6 md:px-12 lg:px-16 max-w-[1400px] mx-auto relative z-10">
        
        {/* Header da Seção */}
        <div className="flex flex-col items-center text-center space-y-4 mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#E64F14]/10 border border-[#E64F14]/20 backdrop-blur-md"
          >
            <Layers className="w-4 h-4 text-[#E64F14]" />
            <span className="text-xs font-black tracking-widest text-[#E64F14] uppercase">
              SOLUÇÕES & SERVIÇOS DE ALTA PERFORMANCE
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#082B61] tracking-tight max-w-4xl"
          >
            Tecnologia de ponta para automatizar e escalar suas vendas
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base md:text-xl text-slate-600 max-w-3xl leading-relaxed"
          >
            Role a página para explorar a nossa suite completa de automações corporativas e clique no card para iniciar seu projeto.
          </motion.p>
        </div>

        {/* Animação de Card Stacking (Empilhamento Fluido ao dar Scroll) */}
        <CardStacking items={SOLUCOES_ITEMS} onCardClick={handleCardClick} />

      </div>
    </section>
  );
};

