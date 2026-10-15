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
    <div className="jm-card overflow-hidden">
      {/* CABEÇALHO DO MÓDULO */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer select-none items-center justify-between gap-3 border-b border-jm-border px-4 py-3 transition-colors hover:bg-jm-hover md:px-5"
      >
        <div className="flex items-center gap-3">
          <div className="jm-icon-chip jm-icon-chip-neutral hidden sm:grid">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="jm-card-title">
                FAQ & Perguntas Frequentes
              </h3>
              <span className="jm-badge jm-badge-neutral">
                Rich Snippets JSON-LD
              </span>
            </div>
            <p className="mt-0.5 text-xs text-jm-muted">
              Gera Accordion visual no artigo e Schema estruturado para o Google
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="jm-badge jm-badge-neutral tabular-nums">
            {faqs.length} {faqs.length === 1 ? 'Pergunta' : 'Perguntas'}
          </span>
          <button type="button" className="jm-icon-btn">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CONTEÚDO DO MÓDULO */}
      {isOpen && (
        <div className="jm-card-body space-y-5">
          {/* BOTÃO ADICIONAR PERGUNTA & CALLOUT EXPLICATIVO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm text-jm-muted">
                Adicione dúvidas comuns para responder aos leitores e habilitar o formato sanfona na busca do Google.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFaq}
              className="jm-btn jm-btn-primary jm-btn-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Pergunta</span>
            </button>
          </div>

          {/* LISTA DINÂMICA DE PERGUNTAS & RESPOSTAS */}
          {faqs.length === 0 ? (
            <div className="space-y-3 rounded-[6px] border border-dashed border-jm-border-strong bg-jm-subtle p-6 text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center text-jm-muted">
                <HelpCircle className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <p className="text-sm font-medium text-jm-fg">
                  Nenhuma pergunta frequente cadastrada
                </p>
                <p className="text-xs leading-relaxed text-jm-muted">
                  Artigos com FAQ estruturada têm até 30% mais visibilidade nos resultados orgânicos através dos Rich Cards do Google.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="jm-link inline-flex cursor-pointer items-center gap-1 pt-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Clique para criar a 1ª pergunta</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={faq.id || index}
                  className="group space-y-3 rounded-[6px] border border-jm-border bg-jm-subtle p-3 md:p-4"
                >
                  {/* BARRA DE CONTROLE DO ITEM */}
                  <div className="flex items-center justify-between border-b border-jm-border pb-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-5 min-w-5 place-items-center rounded-[3px] bg-jm-primary px-1 text-[10px] font-semibold tabular-nums text-white">
                        {index + 1}
                      </span>
                      <span className="text-[13px] font-medium text-jm-fg">
                        Pergunta #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {/* Subir */}
                      <button
                        type="button"
                        onClick={() => handleMoveFaq(index, 'up')}
                        disabled={index === 0}
                        title="Mover para cima"
                        className="jm-icon-btn !h-7 !w-7"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      {/* Descer */}
                      <button
                        type="button"
                        onClick={() => handleMoveFaq(index, 'down')}
                        disabled={index === faqs.length - 1}
                        title="Mover para baixo"
                        className="jm-icon-btn !h-7 !w-7"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {/* Remover */}
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(index)}
                        title="Remover pergunta"
                        className="jm-icon-btn !h-7 !w-7 hover:!bg-jm-danger-bg hover:!text-jm-danger-fg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* CAMPO PERGUNTA (H3) */}
                  <div className="space-y-1">
                    <label className="jm-label !mb-1 !text-xs">
                      Pergunta (Tag H3 Semântica)
                    </label>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleUpdateFaq(index, 'question', e.target.value)}
                      placeholder="Ex: Como funciona a cobrança por mensagens da API Oficial?"
                      className="jm-input"
                    />
                  </div>

                  {/* CAMPO RESPOSTA */}
                  <div className="space-y-1">
                    <label className="jm-label !mb-1 !text-xs">
                      Resposta Completa
                    </label>
                    <textarea
                      rows={3}
                      value={faq.answer}
                      onChange={(e) => handleUpdateFaq(index, 'answer', e.target.value)}
                      placeholder="Ex: A Meta cobra por janelas de conversação de 24 horas iniciadas pelo cliente ou pela empresa..."
                      className="jm-input resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PREVIEW DO ACCORDION INTERATIVO NO EDITOR */}
          {faqs.length > 0 && (
            <div className="space-y-3 border-t border-jm-border pt-4">
              <div className="flex items-center justify-between">
                <span className="jm-eyebrow flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Prévia do Accordion no Artigo</span>
                </span>
                <span className="hidden text-[11px] text-jm-muted sm:inline">Clique para testar a abertura</span>
              </div>

              <div className="divide-y divide-jm-border overflow-hidden rounded-[6px] border border-jm-border bg-jm-surface">
                {faqs.map((faq, idx) => {
                  const isExpanded = activePreviewIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setActivePreviewIndex(isExpanded ? null : idx)}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] font-medium text-jm-fg transition-colors hover:bg-jm-hover"
                      >
                        <span className="pr-2">
                          {faq.question || `Pergunta #${idx + 1} (sem título)`}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-jm-accent-text" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-jm-muted shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 text-[13px] leading-relaxed text-jm-muted">
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
            <div className="border-t border-jm-border pt-3">
              <button
                type="button"
                onClick={() => setShowSchemaPreview(!showSchemaPreview)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 py-1 text-left text-xs font-medium text-jm-muted hover:text-jm-fg"
              >
                <div className="flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span>Injeção Automática de Schema JSON-LD (schema.org/FAQPage)</span>
                </div>
                {showSchemaPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showSchemaPreview && (
                <div className="mt-3 space-y-2 rounded-[4px] border border-[#1C2535] bg-[#0A1220] p-3 font-mono text-[11px] text-[#E8ECF2]">
                  <div className="flex items-center justify-between gap-2 border-b border-[#1C2535] pb-1.5">
                    <span className="text-[10px] text-[#8590A3]">
                      application/ld+json injetado no HTML público
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySchema}
                      className="flex shrink-0 cursor-pointer items-center gap-1 rounded-[3px] bg-white/10 px-2 py-1 text-[10px] text-white transition-colors hover:bg-white/15"
                    >
                      {copiedSchema ? (
                        <>
                          <Check className="h-3 w-3 text-[#4CCB8A]" />
                          <span className="text-[#4CCB8A]">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="max-h-48 overflow-x-auto p-1 text-[10px] text-[#4CCB8A]">
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
