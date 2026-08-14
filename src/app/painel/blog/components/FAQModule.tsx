'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Code2,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { Article, ArticleFAQ } from '../types';

interface FAQModuleProps {
  article: Article;
  onChange: (updated: Partial<Article>) => void;
}

export default function FAQModule({ article, onChange }: FAQModuleProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(0);

  const faqs: ArticleFAQ[] = article.faqs || [];

  const handleAddFaq = () => {
    const newFaq: ArticleFAQ = {
      id: `faq-${Date.now()}`,
      question: '',
      answer: '',
    };
    const updated = [...faqs, newFaq];
    onChange({ faqs: updated });
    setActivePreviewIndex(updated.length - 1);
  };

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange({ faqs: updated });
  };

  const handleDeleteFaq = (index: number) => {
    const updated = faqs.filter((_, i) => i !== index);
    onChange({ faqs: updated });
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === faqs.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...faqs];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);

    onChange({ faqs: updated });
  };

  // Gerar o JSON-LD estruturado de FAQPage
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs
      .filter((f) => f.question.trim() && f.answer.trim())
      .map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
  };

  const jsonLdString = JSON.stringify(jsonLdSchema, null, 2);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(jsonLdString);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* CABEÇALHO DO MÓDULO */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer select-none bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition border-b border-neutral-200 dark:border-neutral-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm border border-purple-500/20">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white">
                FAQ & Perguntas Frequentes
              </h3>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Rich Snippets JSON-LD
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Gera Accordion visual no artigo e Schema estruturado para o Google
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700">
            {faqs.length} {faqs.length === 1 ? 'Pergunta' : 'Perguntas'}
          </span>
          <button type="button" className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTEÚDO DO MÓDULO */}
      {isOpen && (
        <div className="p-5 space-y-6">
          {/* BOTÃO ADICIONAR PERGUNTA & CALLOUT EXPLICATIVO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Adicione dúvidas comuns para responder aos leitores e habilitar o formato sanfona na busca do Google.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFaq}
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#E85D26] hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Pergunta</span>
            </button>
          </div>

          {/* LISTA DINÂMICA DE PERGUNTAS & RESPOSTAS */}
          {faqs.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-center space-y-3 bg-neutral-50/50 dark:bg-neutral-950/50">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Nenhuma pergunta frequente cadastrada
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Artigos com FAQ estruturada têm até 30% mais visibilidade nos resultados orgânicos através dos Rich Cards do Google.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="inline-flex items-center space-x-1 text-xs font-bold text-[#E85D26] hover:underline cursor-pointer pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Clique para criar a 1ª pergunta</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id || index}
                  className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-2xs group"
                >
                  {/* BARRA DE CONTROLE DO ITEM */}
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        Pergunta #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Subir */}
                      <button
                        type="button"
                        onClick={() => handleMoveFaq(index, 'up')}
                        disabled={index === 0}
                        title="Mover para cima"
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      {/* Descer */}
                      <button
                        type="button"
                        onClick={() => handleMoveFaq(index, 'down')}
                        disabled={index === faqs.length - 1}
                        title="Mover para baixo"
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {/* Remover */}
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(index)}
                        title="Remover pergunta"
                        className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* CAMPO PERGUNTA (H3) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                      Pergunta (Tag H3 Semântica)
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleUpdateFaq(index, 'question', e.target.value)}
                      placeholder="Ex: Como funciona a cobrança por mensagens da API Oficial?"
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] font-medium"
                    />
                  </div>

                  {/* CAMPO RESPOSTA */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                      Resposta Completa
                    </label>
                    <textarea
                      rows={3}
                      value={faq.answer}
                      onChange={(e) => handleUpdateFaq(index, 'answer', e.target.value)}
                      placeholder="Ex: A Meta cobra por janelas de conversação de 24 horas iniciadas pelo cliente ou pela empresa..."
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26] resize-none font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PREVIEW DO ACCORDION INTERATIVO NO EDITOR */}
          {faqs.length > 0 && (
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E85D26]" />
                  <span>Prévia do Accordion no Artigo</span>
                </span>
                <span className="text-[10px] text-neutral-400">Clique para testar a abertura</span>
              </div>

              <div className="space-y-2 bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                {faqs.map((faq, idx) => {
                  const isExpanded = activePreviewIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setActivePreviewIndex(isExpanded ? null : idx)}
                        className="w-full p-3 text-left font-bold text-xs text-neutral-900 dark:text-white flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition"
                      >
                        <span className="pr-2">
                          {faq.question || `Pergunta #${idx + 1} (sem título)`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-[#E85D26] shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-3 text-xs text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800 leading-relaxed">
                          {faq.answer || 'Resposta não preenchida ainda.'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISUALIZADOR DO SCHEMA JSON-LD ESTRUTURADO */}
          {faqs.length > 0 && (
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowSchemaPreview(!showSchemaPreview)}
                className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white flex items-center justify-between w-full py-1 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Injeção Automática de Schema JSON-LD (schema.org/FAQPage)</span>
                </div>
                {showSchemaPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showSchemaPreview && (
                <div className="mt-3 p-3.5 bg-neutral-900 text-neutral-100 rounded-xl border border-neutral-800 space-y-2 animate-fadeIn font-mono text-[11px]">
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                    <span className="text-neutral-400 text-[10px]">
                      application/ld+json injetado no HTML público
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySchema}
                      className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-[10px] text-white flex items-center gap-1 cursor-pointer transition"
                    >
                      {copiedSchema ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto p-1 text-[10px] text-emerald-400 max-h-48">
                    {jsonLdString}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
