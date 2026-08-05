"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, CheckCheck, Bot, ShieldCheck, Zap, TrendingUp, Users, Sparkles, Send } from "lucide-react";

export const HeroBentoVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "ai" | "metrics">("whatsapp");
  const [msgIndex, setMsgIndex] = useState(0);

  const messages = [
    { sender: "client", text: "Olá! Vi a oferta e gostaria de agendar uma demonstração do WhatsApp API." },
    { sender: "bot", text: "Olá! Bem-vindo à JM MASTER GROUP 🚀 Nosso chatbot já qualificou seu lead! Qual o melhor horário?" },
    { sender: "client", text: "Pode ser hoje às 15h!" },
    { sender: "bot", text: "Perfeito! Agendamento confirmado para às 15h ✅ Qual é o segmento da sua empresa?" },
    { sender: "client", text: "Somos uma empresa de médio porte querendo otimizar vendas e suporte." },
    { sender: "bot", text: "Excelente! Já preparamos uma demonstração com IA Conversacional e envio massivo para o seu segmento." },
    { sender: "bot", text: "Enviamos todos os detalhes da reunião e o convite de acesso para o seu WhatsApp! 🎯" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="relative w-full">
      {/* Decorative Glow behind the visualizer Otimizado */}
      <div className="absolute -inset-4 bg-[radial-gradient(ellipse_at_center,_rgba(230,79,20,0.12)_0%,_rgba(8,43,97,0.15)_60%,_transparent_100%)] rounded-[40px] pointer-events-none -z-10" />

      {/* Main Bento Container */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 md:p-8 border border-white/90 shadow-2xl space-y-5">
        
        {/* Top Header of Visualizer */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#082B61]">
              JM MASTER AGENT — PLATAFORMA AO VIVO
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-full text-[11px] font-bold">
            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === "whatsapp" ? "bg-[#082B61] text-white shadow" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              WhatsApp API
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === "ai" ? "bg-[#E64F14] text-white shadow" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              IA Chatbot
            </button>
            <button
              onClick={() => setActiveTab("metrics")}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === "metrics" ? "bg-slate-800 text-white shadow" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Métricas
            </button>
          </div>
        </div>

        {/* Tab 1: WhatsApp Live Simulator */}
        {activeTab === "whatsapp" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#082B61] text-white p-3.5 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-400/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <p className="text-xs font-bold">JM Master Official Business</p>
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-black">✓</span>
                  </div>
                  <p className="text-[10px] text-emerald-300">API Oficial Meta Verificada • Uptime 99.9%</p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-slate-200">
                Latência: 12ms
              </span>
            </div>

            {/* Chat Messages Container com altura expandida */}
            <div className="bg-slate-50/90 rounded-2xl p-4 space-y-3 min-h-[290px] sm:min-h-[330px] md:min-h-[360px] flex flex-col justify-end border border-slate-200/60 overflow-y-auto max-h-[380px]">
              <AnimatePresence mode="popLayout">
                {messages.slice(0, msgIndex + 1).map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.sender === "client" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                        msg.sender === "client"
                          ? "bg-white text-slate-800 border border-slate-200"
                          : "bg-[#082B61] text-white font-medium"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] opacity-70">
                        <span>Agora</span>
                        {msg.sender === "bot" && <CheckCheck className="w-3 h-3 text-emerald-400 inline" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Tab 2: AI Chatbot Feature Highlight */}
        {activeTab === "ai" && (
          <div className="space-y-4 min-h-[290px] sm:min-h-[330px] md:min-h-[360px] flex flex-col justify-between">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#E64F14]/10 to-[#082B61]/10 border border-[#E64F14]/20 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-[#E64F14] text-white shadow-md">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#082B61]">Agente de Inteligência Artificial</h4>
                  <p className="text-[11px] text-slate-600">Qualificação e Atendimento 24 horas sem pausa</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#E64F14] bg-white px-3 py-1.5 rounded-full shadow-sm border border-[#E64F14]/20">
                IA Ativa
              </span>
            </div>

            {/* Grid 2x2 com métricas de IA */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1 hover:border-[#082B61]/30 transition-colors">
                <span className="text-[10px] font-bold uppercase text-slate-400">Tempo Médio de Resposta</span>
                <p className="text-2xl sm:text-3xl font-black text-[#082B61]">0.8s</p>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span>⚡ Instantâneo</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1 hover:border-[#E64F14]/30 transition-colors">
                <span className="text-[10px] font-bold uppercase text-slate-400">Conversão de Leads</span>
                <p className="text-2xl sm:text-3xl font-black text-[#E64F14]">+150%</p>
                <p className="text-[10px] text-slate-500 font-medium">Em relação a chats comuns</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1 hover:border-[#082B61]/30 transition-colors">
                <span className="text-[10px] font-bold uppercase text-slate-400">Satisfação (CSAT)</span>
                <p className="text-2xl sm:text-3xl font-black text-[#082B61]">99.4%</p>
                <p className="text-[10px] text-amber-500 font-bold">⭐⭐⭐⭐⭐ Excelente</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1 hover:border-[#E64F14]/30 transition-colors">
                <span className="text-[10px] font-bold uppercase text-slate-400">Atendimentos Simultâneos</span>
                <p className="text-2xl sm:text-3xl font-black text-[#E64F14]">Ilimitados</p>
                <p className="text-[10px] text-emerald-600 font-bold">Sem fila de espera</p>
              </div>
            </div>

            {/* Painel Inferior de Recursos da IA */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#082B61]">
                <span>Recursos Ativos do Chatbot</span>
                <span className="text-emerald-600 text-[10px] font-bold">🟢 Operando em tempo real</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[10px] font-bold text-[#082B61] bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  🧠 NLP Avançada
                </span>
                <span className="text-[10px] font-bold text-[#082B61] bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  🎯 Qualificação de Lead
                </span>
                <span className="text-[10px] font-bold text-[#082B61] bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  🔄 Transbordo Humano
                </span>
                <span className="text-[10px] font-bold text-[#082B61] bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  📊 Integração CRM
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Real-Time Performance Metrics */}
        {activeTab === "metrics" && (
          <div className="space-y-4 min-h-[290px] sm:min-h-[330px] md:min-h-[360px] flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 text-white text-center shadow-md">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Entregabilidade</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">99.9%</p>
                <p className="text-[9px] text-slate-400 mt-1">API Oficial Meta</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 text-white text-center shadow-md">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Taxa SMS/Zap</p>
                <p className="text-2xl sm:text-3xl font-black text-[#E64F14] mt-1">98.4%</p>
                <p className="text-[9px] text-slate-400 mt-1">Taxa de Abertura</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 text-white text-center shadow-md">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Disparos/s</p>
                <p className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">5.000+</p>
                <p className="text-[9px] text-slate-400 mt-1">Alta Capacidade</p>
              </div>
            </div>

            {/* Visual Progress Bar 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#082B61]">
                <span>Desempenho Geral de Vendas</span>
                <span className="text-[#E64F14]">Alta Performance (+94%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full w-[94%] bg-gradient-to-r from-[#082B61] via-[#E64F14] to-[#F06228] rounded-full animate-pulse" />
              </div>
            </div>

            {/* Visual Progress Bar 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#082B61]">
                <span>Redução de Custo de Operação</span>
                <span className="text-emerald-600 font-extrabold">-65% de Economia</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full w-[88%] bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full" />
              </div>
            </div>

            {/* Real-time Analytics Footer */}
            <div className="p-3 rounded-xl bg-[#082B61]/5 border border-[#082B61]/10 flex items-center justify-between text-xs font-bold text-[#082B61]">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-[#E64F14]" />
                <span>Processando +1.2M de eventos por dia</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Relatórios em Tempo Real</span>
            </div>
          </div>
        )}

        {/* Bottom Bento Status Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#E64F14]" />
            <span>Motor de Automação Homologado Meta API</span>
          </div>
          <span className="text-[11px] font-bold text-[#082B61] bg-[#082B61]/10 px-2.5 py-0.5 rounded-full">
            v4.8 Active
          </span>
        </div>

      </div>
    </div>
  );
};
