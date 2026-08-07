"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, Bot, ShieldCheck, Zap, Sparkles } from "lucide-react";

export const HeroBentoVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "ai" | "metrics">("whatsapp");
  const [msgIndex, setMsgIndex] = useState(0);

  const messages = [
    { sender: "client", text: "Olá! Gostaria de agendar uma demonstração do WhatsApp API." },
    { sender: "bot", text: "Olá! Bem-vindo à JM MASTER GROUP 🚀 Qual o melhor horário para você?" },
    { sender: "client", text: "Pode ser hoje às 15h!" },
    { sender: "bot", text: "Perfeito! Agendamento confirmado para às 15h ✅ Qual é o segmento da sua empresa?" },
    { sender: "client", text: "Somos uma empresa querendo otimizar vendas e suporte com IA." },
    { sender: "bot", text: "Excelente! Já preparamos uma demonstração personalizada com automação e disparo oficial." },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="relative w-full">
      {/* Decorative Glow behind the visualizer Otimizado */}
      <div className="absolute -inset-2 sm:-inset-4 bg-[radial-gradient(ellipse_at_center,_rgba(230,79,20,0.1)_0%,_rgba(8,43,97,0.12)_60%,_transparent_100%)] rounded-3xl pointer-events-none -z-10" />

      {/* Main Bento Container */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-7 border border-white/90 shadow-xl space-y-4">
        
        {/* Top Header of Visualizer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#082B61] truncate">
              JM MASTER AGENT — PLATAFORMA AO VIVO
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full text-[10px] sm:text-[11px] font-bold self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`px-2.5 sm:px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                activeTab === "whatsapp" ? "bg-[#082B61] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              WhatsApp API
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-2.5 sm:px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                activeTab === "ai" ? "bg-[#E64F14] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              IA Chatbot
            </button>
            <button
              onClick={() => setActiveTab("metrics")}
              className={`px-2.5 sm:px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                activeTab === "metrics" ? "bg-slate-800 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Métricas
            </button>
          </div>
        </div>

        {/* Tab 1: WhatsApp Live Simulator */}
        {activeTab === "whatsapp" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#082B61] text-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-400/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <p className="text-[11px] sm:text-xs font-bold truncate">JM Master Official Business</p>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 text-white text-[8px] flex items-center justify-center font-black shrink-0">✓</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-emerald-300 truncate">API Oficial Meta Verificada • Uptime 99.9%</p>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-200 shrink-0 hidden sm:inline-block">
                Latência: 12ms
              </span>
            </div>

            {/* Chat Messages Container com altura controlada e scroll suave */}
            <div className="bg-slate-50/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2.5 min-h-[220px] sm:min-h-[270px] max-h-[300px] flex flex-col justify-end border border-slate-200/60 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {messages.slice(0, msgIndex + 1).map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${msg.sender === "client" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[80%] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-[11px] sm:text-xs leading-relaxed shadow-xs ${
                        msg.sender === "client"
                          ? "bg-white text-slate-800 border border-slate-200"
                          : "bg-[#082B61] text-white font-medium"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <div className="flex items-center justify-end space-x-1 mt-1 text-[8px] opacity-70">
                        <span>Agora</span>
                        {msg.sender === "bot" && <CheckCheck className="w-2.5 h-2.5 text-emerald-400 inline" />}
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
          <div className="space-y-3 min-h-[220px] sm:min-h-[270px] flex flex-col justify-between">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#E64F14]/10 to-[#082B61]/10 border border-[#E64F14]/20 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 sm:p-2.5 rounded-xl bg-[#E64F14] text-white shadow-xs shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#082B61]">Agente de Inteligência Artificial</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-600">Qualificação e Atendimento 24/7 sem pausa</p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-extrabold text-[#E64F14] bg-white px-2.5 py-1 rounded-full shadow-xs border border-[#E64F14]/20 shrink-0">
                IA Ativa
              </span>
            </div>

            {/* Grid 2x2 com métricas de IA adaptadas para mobile */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-0.5">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate block">Tempo de Resposta</span>
                <p className="text-xl sm:text-2xl font-black text-[#082B61]">0.8s</p>
                <p className="text-[9px] text-emerald-600 font-bold">⚡ Instantâneo</p>
              </div>

              <div className="p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-0.5">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate block">Conversão Leads</span>
                <p className="text-xl sm:text-2xl font-black text-[#E64F14]">+150%</p>
                <p className="text-[9px] text-slate-500 font-medium">Em relação a chat comum</p>
              </div>

              <div className="p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-0.5">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate block">Satisfação (CSAT)</span>
                <p className="text-xl sm:text-2xl font-black text-[#082B61]">99.4%</p>
                <p className="text-[9px] text-amber-500 font-bold">⭐⭐⭐⭐⭐</p>
              </div>

              <div className="p-3 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-0.5">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 truncate block">Atendimentos</span>
                <p className="text-xl sm:text-2xl font-black text-[#E64F14]">Ilimitados</p>
                <p className="text-[9px] text-emerald-600 font-bold">Sem fila de espera</p>
              </div>
            </div>

            {/* Painel Inferior de Recursos da IA */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#082B61]">
                <span>Recursos Ativos do Chatbot</span>
                <span className="text-emerald-600 text-[9px] font-bold">🟢 Em tempo real</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <span className="text-[9px] font-bold text-[#082B61] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  🧠 NLP Avançada
                </span>
                <span className="text-[9px] font-bold text-[#082B61] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  🎯 Qualificação Lead
                </span>
                <span className="text-[9px] font-bold text-[#082B61] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  🔄 Transbordo Humano
                </span>
                <span className="text-[9px] font-bold text-[#082B61] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  📊 Integração CRM
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Real-Time Performance Metrics */}
        {activeTab === "metrics" && (
          <div className="space-y-3 min-h-[220px] sm:min-h-[270px] flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900 text-white text-center shadow-xs">
                <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Entregabilidade</p>
                <p className="text-lg sm:text-2xl font-black text-emerald-400 mt-0.5">99.9%</p>
                <p className="text-[8px] text-slate-400 mt-0.5 truncate">API Oficial</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900 text-white text-center shadow-xs">
                <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Taxa SMS/Zap</p>
                <p className="text-lg sm:text-2xl font-black text-[#E64F14] mt-0.5">98.4%</p>
                <p className="text-[8px] text-slate-400 mt-0.5 truncate">Abertura</p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900 text-white text-center shadow-xs">
                <p className="text-[9px] text-slate-400 font-bold uppercase truncate">Disparos/s</p>
                <p className="text-lg sm:text-2xl font-black text-blue-400 mt-0.5">5.000+</p>
                <p className="text-[8px] text-slate-400 mt-0.5 truncate">Capacidade</p>
              </div>
            </div>

            {/* Visual Progress Bar 1 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-[#082B61]">
                <span>Desempenho Geral de Vendas</span>
                <span className="text-[#E64F14]">Alta (+94%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full w-[94%] bg-gradient-to-r from-[#082B61] via-[#E64F14] to-[#F06228] rounded-full" />
              </div>
            </div>

            {/* Visual Progress Bar 2 */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-[#082B61]">
                <span>Redução de Custo de Operação</span>
                <span className="text-emerald-600 font-extrabold">-65% Economia</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full w-[88%] bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full" />
              </div>
            </div>

            {/* Real-time Analytics Footer */}
            <div className="p-2.5 rounded-xl bg-[#082B61]/5 border border-[#082B61]/10 flex items-center justify-between text-[11px] font-bold text-[#082B61]">
              <div className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-[#E64F14] shrink-0" />
                <span className="truncate">Processando +1.2M de eventos/dia</span>
              </div>
              <span className="text-[9px] text-slate-500 font-medium shrink-0">Tempo Real</span>
            </div>
          </div>
        )}

        {/* Bottom Bento Status Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-500 font-medium">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E64F14] shrink-0" />
            <span className="truncate">Motor de Automação Homologado Meta</span>
          </div>
          <span className="text-[10px] font-bold text-[#082B61] bg-[#082B61]/10 px-2 py-0.5 rounded-full shrink-0">
            v4.8 Active
          </span>
        </div>

      </div>
    </div>
  );
};
