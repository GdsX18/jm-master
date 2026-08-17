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
  Type,
  ChevronDown,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface BlogEditorProps {
  initialContent?: string;
  contentHtml?: string;
  onChange?: (htmlContent: string) => void;
  onContentChange?: (htmlContent: string) => void;
  title: string;
  onTitleChange: (newTitle: string) => void;
}

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

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
  const savedSelectionRef = useRef<Range | null>(null);
  const lastInternalHtmlRef = useRef<string | null>(null);
  const fontSizeMenuRef = useRef<HTMLDivElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState({ words: 0, chars: 0, readingTime: 1 });
  const [isContentEmpty, setIsContentEmpty] = useState(true);
  const [currentFontSize, setCurrentFontSize] = useState('16px');
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);

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

  // Modal de Inserção de Imagem / Upload Supabase
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');
  const [modalImageCaption, setModalImageCaption] = useState('');
  const [modalImageAlign, setModalImageAlign] = useState<'center' | 'full' | 'left' | 'right'>('center');
  const [isUploadingModalImage, setIsUploadingModalImage] = useState(false);
  const [uploadStatusMessage, setUploadStatusMessage] = useState('');
  const [isEditorDraggingImage, setIsEditorDraggingImage] = useState(false);

  // Fechar dropdown de fontes ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(e.target as Node)) {
        setIsFontSizeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Inicializar e sincronizar conteúdo inicial sem quebrar a digitação ativa
  useEffect(() => {
    if (editorRef.current) {
      if (lastInternalHtmlRef.current === null || effectiveInitial !== lastInternalHtmlRef.current) {
        editorRef.current.innerHTML = effectiveInitial || '';
        lastInternalHtmlRef.current = effectiveInitial || '';
        updateStats();
      }
    }
  }, [effectiveInitial]);

  // Salvar e Restaurar Seleção do Cursor / Range
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  // Detectar tamanho de fonte na posição do cursor
  const updateCurrentFontSizeFromSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    if (node && editorRef.current && editorRef.current.contains(node)) {
      const el = node as HTMLElement;
      const fontSpan = el.closest('span[style*="font-size"]') as HTMLElement | null;
      if (fontSpan && fontSpan.style.fontSize) {
        setCurrentFontSize(fontSpan.style.fontSize);
        return;
      }
    }
  };

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
      lastInternalHtmlRef.current = html;
      if (onChange) onChange(html);
      if (onContentChange) onContentChange(html);
      updateStats();
    }
  };

  // Função para fazer upload direto no Supabase Storage via API
  const uploadImageFileToSupabase = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP, GIF).');
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB.');
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'blog-images');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.success && data.url) {
      return data.url;
    } else {
      throw new Error(data.error || 'Falha no envio para o Supabase');
    }
  };

  // Inserir elemento de imagem formatado no editor
  const insertImageIntoEditor = (
    url: string,
    alt: string = '',
    caption: string = '',
    align: 'center' | 'full' | 'left' | 'right' = 'center'
  ) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();

    let alignClass = 'text-center my-6';
    let imgClass = 'rounded-2xl max-w-full h-auto mx-auto shadow-md border border-neutral-200 dark:border-neutral-800';

    if (align === 'full') {
      alignClass = 'w-full my-6 text-center';
      imgClass = 'w-full rounded-2xl h-auto shadow-md border border-neutral-200 dark:border-neutral-800';
    } else if (align === 'left') {
      alignClass = 'float-left mr-6 mb-4 my-2 max-w-sm';
    } else if (align === 'right') {
      alignClass = 'float-right ml-6 mb-4 my-2 max-w-sm';
    }

    const imageHtml = `
      <figure class="article-figure ${alignClass}">
        <img src="${url}" alt="${alt || 'Ilustração do artigo'}" class="${imgClass}" />
        ${caption ? `<figcaption class="text-xs text-neutral-500 dark:text-neutral-400 mt-2.5 italic text-center">${caption}</figcaption>` : ''}
      </figure>
      <p><br></p>
    `;

    document.execCommand('insertHTML', false, imageHtml);
    setShowImageModal(false);
    setModalImageUrl('');
    setModalImageAlt('');
    setModalImageCaption('');
    setUploadStatusMessage('');
    handleInput();
    saveSelection();
  };

  // Limpeza de cores e upload automático de imagens ao colar (Paste)
  const handlePaste = async (e: React.ClipboardEvent) => {
    // 1. Se colou uma imagem direta (print screen ou arquivo de imagem do clipboard)
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            saveSelection();
            try {
              const uploadedUrl = await uploadImageFileToSupabase(file);
              if (uploadedUrl) {
                const autoAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Imagem anexada ao artigo';
                insertImageIntoEditor(uploadedUrl, autoAlt, '', 'center');
              }
            } catch (err: any) {
              console.error('Erro ao enviar imagem colada para o Supabase:', err);
              alert('Erro ao enviar a imagem colada para o Supabase Storage.');
            }
            return;
          }
        }
      }
    }

    // 2. Se colou HTML ou texto com estilos
    const clipboardHtml = e.clipboardData.getData('text/html');
    const clipboardText = e.clipboardData.getData('text/plain');

    if (clipboardHtml) {
      e.preventDefault();
      const parser = new DOMParser();
      const doc = parser.parseFromString(clipboardHtml, 'text/html');

      // Se houver imagens em base64 no HTML colado, faz upload automático
      const base64Imgs = doc.body.querySelectorAll<HTMLImageElement>('img[src^="data:image/"]');
      if (base64Imgs.length > 0) {
        for (let i = 0; i < base64Imgs.length; i++) {
          const img = base64Imgs[i];
          try {
            const res = await fetch(img.src);
            const blob = await res.blob();
            const ext = blob.type.split('/')[1] || 'png';
            const file = new File([blob], `pasted-${Date.now()}-${i}.${ext}`, { type: blob.type });
            const uploadedUrl = await uploadImageFileToSupabase(file);
            if (uploadedUrl) {
              img.src = uploadedUrl;
            }
          } catch (err) {
            console.error('Erro ao enviar base64 para o Supabase:', err);
          }
        }
      }

      // Remover cores fixas indesejadas (azul escuro, cinzas fixos ou fundos)
      doc.body.querySelectorAll('*').forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.color = '';
          el.style.backgroundColor = '';
          el.style.fontFamily = '';
          if (!el.getAttribute('style') || el.getAttribute('style')?.trim() === '') {
            el.removeAttribute('style');
          }
        }
        if (el.tagName.toLowerCase() === 'font') {
          el.removeAttribute('color');
        }
      });

      const cleanHtml = doc.body.innerHTML;
      document.execCommand('insertHTML', false, cleanHtml);
      handleInput();
    } else if (clipboardText) {
      e.preventDefault();
      const paragraphs = clipboardText
        .split(/\r?\n\r?\n/)
        .map((p) => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`)
        .join('');
      document.execCommand('insertHTML', false, paragraphs);
      handleInput();
    }
  };

  // Arrastar e soltar imagens diretamente no editor (Drag and Drop)
  const handleEditorDrop = async (e: React.DragEvent) => {
    setIsEditorDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        saveSelection();
        try {
          const uploadedUrl = await uploadImageFileToSupabase(file);
          if (uploadedUrl) {
            const autoAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Imagem anexada ao artigo';
            insertImageIntoEditor(uploadedUrl, autoAlt, '', 'center');
          }
        } catch (err) {
          console.error('Erro no upload de imagem arrastada:', err);
          alert('Erro ao enviar a imagem para o Supabase Storage.');
        }
      }
    }
  };

  // Upload a partir do modal de imagem
  const handleModalFileUpload = async (file: File) => {
    setIsUploadingModalImage(true);
    setUploadStatusMessage('Enviando para o Supabase Storage...');
    try {
      const defaultAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setModalImageAlt((prev) => prev || defaultAlt);
      const url = await uploadImageFileToSupabase(file);
      if (url) {
        setModalImageUrl(url);
        setUploadStatusMessage('Imagem enviada com sucesso ao Supabase!');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar imagem.');
      setUploadStatusMessage('');
    } finally {
      setIsUploadingModalImage(false);
    }
  };

  // Comandos de Formatação com preservação de foco
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if ((!sel || sel.rangeCount === 0) && savedSelectionRef.current) {
      restoreSelection();
    }
    document.execCommand(command, false, value);
    handleInput();
    saveSelection();
  };

  // Alterar tamanho da fonte de forma robusta e persistente
  const applyFontSize = (size: string) => {
    setCurrentFontSize(size);

    if (editorRef.current) {
      editorRef.current.focus();
    }

    let sel = window.getSelection();
    let range: Range | null = null;

    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(r.commonAncestorContainer)) {
        range = r;
      }
    }

    if (!range && savedSelectionRef.current) {
      restoreSelection();
      sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        range = sel.getRangeAt(0);
      }
    }

    if (!range || !editorRef.current) return;

    // Caso 1: Cursor posicionado sem seleção de texto (colapsado)
    if (range.collapsed) {
      let node: Node | null = range.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      const existingSpan = (node as HTMLElement)?.closest('span[style*="font-size"]') as HTMLElement | null;
      if (existingSpan && editorRef.current.contains(existingSpan)) {
        existingSpan.style.fontSize = size;
        handleInput();
        return;
      }

      const span = document.createElement('span');
      span.style.fontSize = size;
      const textNode = document.createTextNode('\u200B'); // zero-width space
      span.appendChild(textNode);
      range.insertNode(span);

      const newRange = document.createRange();
      newRange.setStart(textNode, 1);
      newRange.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(newRange);
      savedSelectionRef.current = newRange.cloneRange();
      handleInput();
      return;
    }

    // Caso 2: Há texto selecionado
    try {
      (document as any).execCommand('styleWithCSS', false, false);
    } catch (e) {}

    // Usar '7' como marcador transitório para capturar todos os nós particionados pelo browser
    document.execCommand('fontSize', false, '7');

    const fontTags = editorRef.current.querySelectorAll('font[size="7"], font[size="xxx-large"]');
    if (fontTags.length > 0) {
      fontTags.forEach((font) => {
        const span = document.createElement('span');
        span.style.fontSize = size;

        while (font.firstChild) {
          span.appendChild(font.firstChild);
        }

        // Limpar tamanhos conflitantes aninhados
        span.querySelectorAll<HTMLElement>('[style*="font-size"]').forEach((child) => {
          child.style.fontSize = '';
          if (!child.getAttribute('style')) {
            child.removeAttribute('style');
          }
        });

        font.parentNode?.replaceChild(span, font);
      });
    } else {
      // Fallback para variações de motores WebKit/Gecko com CSS inline
      const spans = editorRef.current.querySelectorAll<HTMLElement>(
        'span[style*="-webkit-xxx-large"], span[style*="xxx-large"], span[style*="font-size: 48px"]'
      );
      spans.forEach((s) => {
        s.style.fontSize = size;
        s.querySelectorAll<HTMLElement>('[style*="font-size"]').forEach((child) => {
          if (child !== s) {
            child.style.fontSize = '';
            if (!child.getAttribute('style')) {
              child.removeAttribute('style');
            }
          }
        });
      });
    }

    handleInput();
    saveSelection();
  };

  const increaseFontSize = () => {
    const currentIndex = FONT_SIZES.indexOf(currentFontSize);
    if (currentIndex < FONT_SIZES.length - 1 && currentIndex >= 0) {
      applyFontSize(FONT_SIZES[currentIndex + 1]);
    } else if (currentIndex === -1) {
      applyFontSize('18px');
    }
  };

  const decreaseFontSize = () => {
    const currentIndex = FONT_SIZES.indexOf(currentFontSize);
    if (currentIndex > 0) {
      applyFontSize(FONT_SIZES[currentIndex - 1]);
    } else if (currentIndex === -1) {
      applyFontSize('14px');
    }
  };

  // Formatação de Títulos
  const formatHeading = (tag: 'H2' | 'H3' | 'H4' | 'P') => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if ((!sel || sel.rangeCount === 0) && savedSelectionRef.current) {
      restoreSelection();
    }
    if (tag === 'P') {
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, `<${tag.toLowerCase()}>`);
    }
    handleInput();
    saveSelection();
  };

  // Abrir Modal de Link
  const openLinkModal = () => {
    saveSelection();
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
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
    const textToDisplay = linkText.trim() || linkUrl;
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const relAttr = linkNofollow ? ' rel="nofollow"' : '';
    
    const linkHtml = `<a href="${linkUrl}"${targetAttr}${relAttr} class="text-[#E85D26] underline font-medium hover:text-orange-600 transition">${textToDisplay}</a>`;
    document.execCommand('insertHTML', false, linkHtml);
    setShowLinkModal(false);
    handleInput();
    saveSelection();
  };

  // Inserir Callout / Caixa de Aviso
  const insertCalloutBox = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
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
    saveSelection();
  };

  // Inserir Citação
  const insertQuote = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
    const quoteHtml = `
      <blockquote class="my-6 pl-4 border-l-4 border-[#E85D26] italic text-neutral-700 dark:text-neutral-300 text-base leading-relaxed bg-orange-500/5 p-3 rounded-r-xl">
        "Insira aqui uma declaração marcante ou depoimento relevante para o artigo..."
      </blockquote>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, quoteHtml);
    handleInput();
    saveSelection();
  };

  // Inserir Bloco de Código
  const insertCodeBlock = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
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
    saveSelection();
  };

  // Inserir Divisor
  const insertDivider = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    restoreSelection();
    const hrHtml = `<hr class="my-8 border-t border-neutral-200 dark:border-neutral-800" /><p><br></p>`;
    document.execCommand('insertHTML', false, hrHtml);
    handleInput();
    saveSelection();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
      
      {/* TOOLBAR FIXA EXPANDIDA COM ALTA VISIBILIDADE */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 p-3 flex flex-wrap items-center gap-2 sticky top-0 z-20 backdrop-blur-md select-none shadow-xs">
        
        {/* GRUPO: HISTÓRICO */}
        <div className="flex items-center gap-1 pr-2.5 border-r border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('undo')}
            title="Desfazer (Ctrl+Z)"
            className="h-9 px-2.5 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('P')}
            title="Texto Normal de Parágrafo"
            className="h-9 px-3 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            Texto
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('H2')}
            title="Título de Seção (H2 - Grande)"
            className="h-9 px-3 rounded-xl text-xs font-black bg-neutral-100 dark:bg-neutral-800/70 text-neutral-900 dark:text-white hover:bg-orange-500/10 hover:text-[#E85D26] hover:border-[#E85D26]/40 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            H2
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('H3')}
            title="Subtítulo (H3 - Médio)"
            className="h-9 px-3 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200 hover:bg-orange-500/10 hover:text-[#E85D26] hover:border-[#E85D26]/40 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            H3
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('H4')}
            title="Tópico Menor (H4)"
            className="h-9 px-3 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            H4
          </button>
        </div>

        {/* GRUPO: CONTROLE DE TAMANHO DA LETRA (A- / A▾ / A+) */}
        <div 
          ref={fontSizeMenuRef}
          className="relative flex items-center gap-1.5 px-2 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-1 rounded-xl border border-neutral-200/80 dark:border-neutral-800"
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={decreaseFontSize}
            title="Diminuir Tamanho da Letra (A-)"
            className="h-7 px-2 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-extrabold shadow-xs transition cursor-pointer"
          >
            A-
          </button>

          {/* DROPDOWN CUSTOMIZADO COM BOTÃO A▾ E TAMANHO ATUAL */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={() => setIsFontSizeOpen((prev) => !prev)}
              title="Menu de Tamanho da Fonte (A▾)"
              className="h-7 px-2.5 flex items-center gap-1.5 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold border border-neutral-200 dark:border-neutral-700 shadow-xs transition cursor-pointer"
            >
              <Type className="w-3.5 h-3.5 text-[#E85D26]" />
              <span className="font-mono text-[11px] font-bold">{currentFontSize}</span>
              <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${isFontSizeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFontSizeOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-32 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800/80 mb-1">
                  Tamanho da Fonte
                </div>
                {FONT_SIZES.map((size) => {
                  const isSelected = currentFontSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyFontSize(size);
                        setIsFontSizeOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#E85D26]/10 text-[#E85D26] font-extrabold'
                          : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium'
                      }`}
                    >
                      <span style={{ fontSize: size }} className="leading-tight">{size}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E85D26]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('bold')}
            title="Negrito (Ctrl+B)"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('italic')}
            title="Itálico (Ctrl+I)"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('underline')}
            title="Sublinhado (Ctrl+U)"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('strikeThrough')}
            title="Tachado"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyLeft')}
            title="Alinhar à Esquerda"
            className="h-9 w-8 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyCenter')}
            title="Centralizar"
            className="h-9 w-8 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition cursor-pointer"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('insertUnorderedList')}
            title="Lista com Marcadores"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <List className="w-4 h-4" />
            <span>Marcadores</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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
          {/* BOTÃO DE INSERIR IMAGEM (UPLOAD / SUPABASE STORAGE) */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
            }}
            onClick={() => {
              saveSelection();
              setShowImageModal(true);
            }}
            title="Inserir Imagem / Ilustração no Texto"
            className="h-9 px-3 rounded-xl bg-[#E85D26]/10 text-[#E85D26] hover:bg-[#E85D26] hover:text-white border border-[#E85D26]/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagem</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLinkModal}
            title="Inserir Link"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Link</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertQuote}
            title="Inserir Citação em Destaque (Blockquote)"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Quote className="w-4 h-4" />
            <span>Citação</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowCalloutModal(true)}
            title="Inserir Caixa de Aviso ou Destaque"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Dica / Aviso</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertCodeBlock}
            title="Inserir Bloco de Código"
            className="h-9 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-4 h-4" />
            <span>Código</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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
      <div 
        onDragOver={(e) => {
          e.preventDefault();
          setIsEditorDraggingImage(true);
        }}
        onDragLeave={() => setIsEditorDraggingImage(false)}
        onDrop={handleEditorDrop}
        className={`flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 max-w-4xl w-full mx-auto relative transition-colors ${
          isEditorDraggingImage ? 'bg-orange-500/5 ring-2 ring-dashed ring-[#E85D26]' : ''
        }`}
      >
        {isEditorDraggingImage && (
          <div className="absolute inset-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center z-30 pointer-events-none">
            <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-dashed border-[#E85D26] shadow-xl text-center space-y-2">
              <UploadCloud className="w-10 h-10 text-[#E85D26] mx-auto animate-bounce" />
              <p className="text-sm font-bold text-neutral-900 dark:text-white">Solte a imagem aqui</p>
              <p className="text-xs text-neutral-500">Ela será enviada automaticamente para o Supabase Storage</p>
            </div>
          </div>
        )}

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
            onPaste={handlePaste}
            onBlur={() => {
              saveSelection();
              handleInput();
            }}
            onMouseUp={() => {
              saveSelection();
              updateCurrentFontSizeFromSelection();
            }}
            onKeyUp={() => {
              saveSelection();
              updateCurrentFontSizeFromSelection();
            }}
            onSelect={() => {
              saveSelection();
              updateCurrentFontSizeFromSelection();
            }}
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

      {/* MODAL PARA INSERIR IMAGEM / UPLOAD SUPABASE STORAGE */}
      {showImageModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/80 p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#E85D26]" />
                <span>Inserir Imagem / Ilustração no Artigo</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ABAS: UPLOAD SUPABASE OU URL DIRETA */}
            <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  imageTab === 'upload'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                Upload do Computador (Supabase)
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  imageTab === 'url'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                URL da Imagem
              </button>
            </div>

            <div className="space-y-3">
              {imageTab === 'upload' ? (
                <div>
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleModalFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  {modalImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-2 space-y-2">
                      <div className="relative h-44 w-full rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={modalImageUrl}
                          alt="Pré-visualização"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pronta no Supabase Storage
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setModalImageUrl('');
                            setUploadStatusMessage('');
                            imageFileInputRef.current?.click();
                          }}
                          className="text-[11px] font-bold text-[#E85D26] hover:underline cursor-pointer"
                        >
                          Trocar Imagem
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isUploadingModalImage && imageFileInputRef.current?.click()}
                      className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#E85D26] dark:hover:border-[#E85D26] rounded-xl p-6 text-center cursor-pointer transition bg-neutral-50 dark:bg-neutral-950/60"
                    >
                      {isUploadingModalImage ? (
                        <div className="space-y-2 py-4">
                          <Loader2 className="w-8 h-8 text-[#E85D26] animate-spin mx-auto" />
                          <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{uploadStatusMessage}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <UploadCloud className="w-8 h-8 text-[#E85D26] mx-auto" />
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            Clique para escolher uma imagem do seu dispositivo
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            PNG, JPG, WebP ou GIF até 10MB (Salvo permanentemente no Supabase)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    URL Pública da Imagem
                  </label>
                  <input
                    type="url"
                    value={modalImageUrl}
                    onChange={(e) => setModalImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/grafico-vendas.png"
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
                  />
                </div>
              )}

              {/* CAMPOS ADICIONAIS: ALT TEXT, LEGENDA E ALINHAMENTO */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Texto Alternativo / Descrição da Imagem (Alt Text para SEO)
                  </label>
                  <input
                    type="text"
                    value={modalImageAlt}
                    onChange={(e) => setModalImageAlt(e.target.value)}
                    placeholder="Ex: Gráfico demonstrando o crescimento de retenção..."
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Legenda Opcional (Exibida abaixo da imagem)
                  </label>
                  <input
                    type="text"
                    value={modalImageCaption}
                    onChange={(e) => setModalImageCaption(e.target.value)}
                    placeholder="Ex: Fonte: Pesquisa Harvard Business Review"
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-[#E85D26]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Alinhamento no Texto
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'center', label: 'Centralizado' },
                      { id: 'full', label: 'Largura Total' },
                      { id: 'left', label: 'À Esquerda' },
                      { id: 'right', label: 'À Direita' },
                    ].map((align) => (
                      <button
                        key={align.id}
                        type="button"
                        onClick={() => setModalImageAlign(align.id as any)}
                        className={`px-2 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                          modalImageAlign === align.id
                            ? 'bg-[#E85D26] text-white border-[#E85D26]'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        {align.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => insertImageIntoEditor(modalImageUrl, modalImageAlt, modalImageCaption, modalImageAlign)}
                disabled={!modalImageUrl || isUploadingModalImage}
                className="px-4 py-2 text-xs font-bold bg-[#E85D26] text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Inserir no Artigo</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
