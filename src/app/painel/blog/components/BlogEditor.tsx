'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  Lightbulb,
  Code,
  Minus,
  X,
  Clock,
  Eraser,
} from 'lucide-react';

interface BlogEditorProps {
  initialContent?: string;
  contentHtml?: string;
  onChange?: (htmlContent: string) => void;
  onContentChange?: (htmlContent: string) => void;
  title: string;
  onTitleChange: (newTitle: string) => void;
}

export default function BlogEditor({
  initialContent = '',
  contentHtml,
  onChange,
  onContentChange,
  title,
  onTitleChange,
}: BlogEditorProps) {
  const effectiveInitial = contentHtml !== undefined ? contentHtml : initialContent;
  const editorRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ words: 0, chars: 0, readingTime: 1 });
  const [isContentEmpty, setIsContentEmpty] = useState(true);
  const [currentFontSize, setCurrentFontSize] = useState('16px');

  // Modais de Inserção Rica
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [linkNofollow, setLinkNofollow] = useState(false);

  const [showCalloutModal, setShowCalloutModal] = useState(false);
  const [calloutType, setCalloutType] = useState<'info' | 'tip' | 'warning'>('tip');
  const [calloutTitle, setCalloutTitle] = useState('Dica Prática JM Master');
  const [calloutContent, setCalloutContent] = useState('Personalize esta mensagem de destaque com orientações corporativas...');

  // Inicializar conteúdo inicial
  useEffect(() => {
    if (editorRef.current && effectiveInitial !== editorRef.current.innerHTML) {
      if (editorRef.current.innerHTML === '' || effectiveInitial) {
        editorRef.current.innerHTML = effectiveInitial || '';
        updateStats();
      }
    }
  }, [effectiveInitial]);

  // Atualizar estatísticas e estado de vazio
  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const cleanText = text.trim();
    setIsContentEmpty(cleanText.length === 0);

    const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const chars = cleanText.length;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    setStats({ words, chars, readingTime });
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (onChange) onChange(html);
      if (onContentChange) onContentChange(html);
      updateStats();
    }
  };

  // Comandos de Formatação
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  // Alterar tamanho da fonte
  const applyFontSize = (size: string) => {
    setCurrentFontSize(size);
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = size;
    
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      handleInput();
    } catch (e) {
      executeCommand('fontSize', '3');
    }
  };

  const increaseFontSize = () => {
    const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
    const currentIndex = sizes.indexOf(currentFontSize);
    if (currentIndex < sizes.length - 1) {
      applyFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
    const currentIndex = sizes.indexOf(currentFontSize);
    if (currentIndex > 0) {
      applyFontSize(sizes[currentIndex - 1]);
    }
  };

  // Formatação de Títulos
  const formatHeading = (tag: 'H2' | 'H3' | 'H4' | 'P') => {
    if (tag === 'P') {
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, `<${tag.toLowerCase()}>`);
    }
    handleInput();
    editorRef.current?.focus();
  };

  // Abrir Modal de Link
  const openLinkModal = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    setLinkText(selectedText);
    setLinkUrl('');
    setLinkNewTab(true);
    setLinkNofollow(false);
    setShowLinkModal(true);
  };

  // Inserir Link Personalizado
  const insertCustomLink = () => {
    if (!linkUrl) return;
    const textToDisplay = linkText.trim() || linkUrl;
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const relAttr = linkNofollow ? ' rel="nofollow"' : '';
    
    const linkHtml = `<a href="${linkUrl}"${targetAttr}${relAttr} class="text-[#E85D26] underline font-medium hover:text-orange-600 transition">${textToDisplay}</a>`;
    document.execCommand('insertHTML', false, linkHtml);
    setShowLinkModal(false);
    handleInput();
  };

  // Inserir Callout / Caixa de Aviso
  const insertCalloutBox = () => {
    let styleClasses = '';
    let borderClass = '';
    let badgeText = '';

    switch (calloutType) {
      case 'tip':
        styleClasses = 'bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 border-emerald-500/30';
        borderClass = 'bg-emerald-500';
        badgeText = 'DICA PRÁTICA';
        break;
      case 'warning':
        styleClasses = 'bg-amber-500/10 text-amber-950 dark:text-amber-200 border-amber-500/30';
        borderClass = 'bg-amber-500';
        badgeText = 'ALERTA / ATENÇÃO';
        break;
      case 'info':
      default:
        styleClasses = 'bg-sky-500/10 text-sky-950 dark:text-sky-200 border-sky-500/30';
        borderClass = 'bg-sky-500';
        badgeText = 'INFORMATIVO';
        break;
    }

    const calloutHtml = `
      <div class="my-6 p-4 sm:p-5 rounded-2xl border ${styleClasses} relative overflow-hidden shadow-xs">
        <div class="absolute top-0 left-0 w-1.5 h-full ${borderClass}"></div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/50 dark:bg-neutral-900/50 border border-current tracking-wider">${badgeText}</span>
          <strong class="text-sm font-bold text-neutral-900 dark:text-white">${calloutTitle}</strong>
        </div>
        <p class="text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 font-normal m-0">${calloutContent}</p>
      </div>
      <p><br></p>
    `;

    document.execCommand('insertHTML', false, calloutHtml);
    setShowCalloutModal(false);
    handleInput();
  };

  // Inserir Citação
  const insertQuote = () => {
    const quoteHtml = `
      <blockquote class="my-6 pl-4 border-l-4 border-[#E85D26] italic text-neutral-700 dark:text-neutral-300 text-base leading-relaxed bg-orange-500/5 p-3 rounded-r-xl">
        "Insira aqui uma declaração marcante ou depoimento relevante para o artigo..."
      </blockquote>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, quoteHtml);
    handleInput();
  };

  // Inserir Bloco de Código
  const insertCodeBlock = () => {
    const codeHtml = `
      <pre class="my-6 p-4 rounded-xl bg-neutral-950 text-neutral-200 font-mono text-xs overflow-x-auto border border-neutral-800">
<code>// Exemplo de código ou configuração corporativa
const client = new JMClient({
  apiKey: "jm_api_key_exemplo",
  environment: "production"
});</code></pre>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, codeHtml);
    handleInput();
  };

  // Inserir Divisor
  const insertDivider = () => {
    const hrHtml = `<hr class="my-8 border-t border-neutral-200 dark:border-neutral-800" /><p><br></p>`;
    document.execCommand('insertHTML', false, hrHtml);
    handleInput();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
      
      {/* TOOLBAR FIXA EXPANDIDA COM ALTA VISIBILIDADE */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 p-3 flex flex-wrap items-center gap-2 sticky top-0 z-20 backdrop-blur-md select-none shadow-xs">
        
        {/* GRUPO: HISTÓRICO */}
        <div className="flex items-center gap-1 pr-2.5 border-r border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => executeCommand('undo')}
            title="Desfazer (Ctrl+Z)"
            className="h-9 px-2.5 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('redo')}
            title="Refazer (Ctrl+Y)"
            className="h-9 px-2.5 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* GRUPO: HIERARQUIA DE TÍTULOS */}
        <div className="flex items-center gap-1.5 px-2.5 border-r border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => formatHeading('P')}
            title="Texto Normal de Parágrafo"
            className="h-9 px-3 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            Texto
          </button>
          <button
            type="button"
            onClick={() => formatHeading('H2')}
            title="Título de Seção (H2 - Grande)"
            className="h-9 px-3 rounded-xl text-xs font-black bg-neutral-100 dark:bg-neutral-800/70 text-neutral-900 dark:text-white hover:bg-orange-500/10 hover:text-[#E85D26] hover:border-[#E85D26]/40 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => formatHeading('H3')}
            title="Subtítulo (H3 - Médio)"
            className="h-9 px-3 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200 hover:bg-orange-500/10 hover:text-[#E85D26] hover:border-[#E85D26]/40 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => formatHeading('H4')}
            title="Tópico Menor (H4)"
            className="h-9 px-3 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            H4
          </button>
        </div>

        {/* GRUPO: CONTROLE DE TAMANHO DA LETRA (A- / A+) */}
        <div className="flex items-center gap-1.5 px-2.5 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-1 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
          <button
            type="button"
            onClick={decreaseFontSize}
            title="Diminuir Tamanho da Letra (A-)"
            className="h-7 px-2 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-extrabold shadow-xs transition cursor-pointer"
          >
            A-
          </button>

          <select
            value={currentFontSize}
            onChange={(e) => applyFontSize(e.target.value)}
            title="Seletor de Tamanho da Letra"
            className="h-7 px-2 text-xs font-bold bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-[#E85D26] cursor-pointer"
          >
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="28px">28px</option>
            <option value="32px">32px</option>
          </select>

          <button
            type="button"
            onClick={increaseFontSize}
            title="Aumentar Tamanho da Letra (A+)"
            className="h-7 px-2 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-extrabold shadow-xs transition cursor-pointer"
          >
            A+
          </button>
        </div>

        {/* GRUPO: FORMATAÇÃO BÁSICA */}
        <div className="flex items-center gap-1 px-2.5 border-r border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            title="Negrito (Ctrl+B)"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            title="Itálico (Ctrl+I)"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            title="Sublinhado (Ctrl+U)"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('strikeThrough')}
            title="Tachado"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('removeFormat')}
            title="Limpar Formatação"
            className="h-9 px-2.5 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* GRUPO: ALINHAMENTOS */}
        <div className="flex items-center gap-1 px-2.5 border-r border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => executeCommand('justifyLeft')}
            title="Alinhar à Esquerda"
            className="h-9 w-8 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyCenter')}
            title="Centralizar"
            className="h-9 w-8 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('justifyRight')}
            title="Alinhar à Direita"
            className="h-9 w-8 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* GRUPO: LISTAS */}
        <div className="flex items-center gap-1 px-2.5 border-r border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            title="Lista com Marcadores"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <List className="w-4 h-4" />
            <span>Marcadores</span>
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            title="Lista Numerada"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Numerada</span>
          </button>
        </div>

        {/* GRUPO: ELEMENTOS RICOS */}
        <div className="flex items-center gap-1.5 pl-2">
          <button
            type="button"
            onClick={openLinkModal}
            title="Inserir Link"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Link</span>
          </button>
          <button
            type="button"
            onClick={insertQuote}
            title="Inserir Citação em Destaque (Blockquote)"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Quote className="w-4 h-4" />
            <span>Citação</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCalloutModal(true)}
            title="Inserir Caixa de Aviso ou Destaque"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Dica / Aviso</span>
          </button>
          <button
            type="button"
            onClick={insertCodeBlock}
            title="Inserir Bloco de Código"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-4 h-4" />
            <span>Código</span>
          </button>
          <button
            type="button"
            onClick={insertDivider}
            title="Inserir Linha Divisória"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Minus className="w-4 h-4" />
            <span>Divisor</span>
          </button>
        </div>
      </div>

      {/* ÁREA DO CANVAS DE ESCRITA */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 max-w-4xl w-full mx-auto">
        
        {/* TÍTULO PRINCIPAL (H1) */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Digite aqui o título principal do artigo (H1)..."
            className="w-full text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white placeholder-neutral-300 dark:placeholder-neutral-700 bg-transparent border-none focus:outline-none tracking-tight leading-tight"
          />
          <div className="h-px w-full bg-neutral-200 dark:border-neutral-800 mt-4" />
        </div>

        {/* CORPO DO ARTIGO COM CONTENT EDITABLE & PLACEHOLDER SUAVE */}
        <div className="relative min-h-[450px]">
          {isContentEmpty && (
            <div
              onClick={() => editorRef.current?.focus()}
              className="absolute top-0 left-0 w-full text-neutral-400 dark:text-neutral-500 pointer-events-none select-none text-base leading-relaxed opacity-60 z-0"
            >
              <p>
                Escreva aqui o conteúdo do seu artigo... Use a barra de ferramentas superior para títulos, negrito, listas e imagens.
              </p>
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            className="blog-wysiwyg-editor min-h-[450px] text-base leading-relaxed text-neutral-800 dark:text-neutral-200 focus:outline-none selection:bg-orange-500/20 relative z-10"
          />
        </div>
      </div>

      {/* RODAPÉ DO EDITOR COM CONTADORES DIDÁTICOS */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-neutral-800 dark:text-neutral-200">{stats.words}</span>
            <span>palavras</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-neutral-800 dark:text-neutral-200">{stats.chars}</span>
            <span>caracteres</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Tempo estimado:</span>
            <span className="font-bold text-[#E85D26]">{stats.readingTime} min</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Editor Ativo (Sincronizado)</span>
        </div>
      </div>

      {/* MODAL PARA INSERIR LINK */}
      {showLinkModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#E85D26]" />
                <span>Inserir Link no Texto</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Texto Âncora (Exibido no texto)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Texto clicável..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  URL de Destino
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://jmmaster.com.br/solucoes"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={linkNewTab}
                    onChange={(e) => setLinkNewTab(e.target.checked)}
                    className="rounded border-neutral-300 text-[#E85D26] focus:ring-[#E85D26]"
                  />
                  <span>Abrir link em nova aba (target="_blank")</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={linkNofollow}
                    onChange={(e) => setLinkNofollow(e.target.checked)}
                    className="rounded border-neutral-300 text-[#E85D26] focus:ring-[#E85D26]"
                  />
                  <span>Adicionar rel="nofollow" (Links externos não endossados)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={insertCustomLink}
                disabled={!linkUrl}
                className="px-4 py-2 text-xs font-bold bg-[#E85D26] text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 cursor-pointer"
              >
                Inserir Link
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PARA INSERIR CALLOUT */}
      {showCalloutModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#E85D26]" />
                <span>Inserir Caixa de Aviso / Dica</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCalloutModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Tipo de Aviso
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCalloutType('info');
                      setCalloutTitle('Ponto de Atenção');
                    }}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      calloutType === 'info'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    Informativo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalloutType('tip');
                      setCalloutTitle('Dica Prática');
                    }}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      calloutType === 'tip'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    Dica Prática
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalloutType('warning');
                      setCalloutTitle('Alerta Importante');
                    }}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      calloutType === 'warning'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    Alerta
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Título do Aviso
                </label>
                <input
                  type="text"
                  value={calloutTitle}
                  onChange={(e) => setCalloutTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Mensagem / Conteúdo
                </label>
                <textarea
                  rows={3}
                  value={calloutContent}
                  onChange={(e) => setCalloutContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-[#E85D26] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowCalloutModal(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={insertCalloutBox}
                className="px-4 py-2 text-xs font-bold bg-[#E85D26] text-white rounded-lg hover:bg-orange-600 transition cursor-pointer"
              >
                Inserir Caixa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
