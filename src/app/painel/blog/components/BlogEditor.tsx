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
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { useNotify } from '../../components/ui/Notifications';

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
  const { toast } = useNotify();
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
      toast.error('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP, GIF).');
      return null;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 4MB.');
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
              toast.error('Erro ao enviar a imagem colada para o Supabase Storage.');
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

      // Remove scripts/handlers do HTML colado (Word, sites, e-mails)
      const cleanHtml = sanitizeArticleHtml(doc.body.innerHTML);
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
          toast.error('Erro ao enviar a imagem para o Supabase Storage.');
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
      toast.error(err.message || 'Erro ao enviar imagem.');
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
    <div className="flex h-full flex-col overflow-hidden rounded-[6px] border border-jm-border bg-jm-surface">
      
      {/* TOOLBAR FIXA EXPANDIDA COM ALTA VISIBILIDADE */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-y-1 border-b border-jm-border bg-jm-subtle px-2 py-1.5 select-none">
        
        {/* GRUPO: HISTÓRICO */}
        <div className="flex items-center gap-0.5 border-r border-jm-border pr-1.5 mr-1.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('undo')}
            title="Desfazer (Ctrl+Z)"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('redo')}
            title="Refazer (Ctrl+Y)"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* GRUPO: HIERARQUIA DE TÍTULOS */}
        <div className="flex items-center gap-0.5 border-r border-jm-border pr-1.5 mr-1.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('P')}
            title="Texto Normal de Parágrafo"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            Texto
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('H2')}
            title="Título de Seção (H2 - Grande)"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            H2
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('H3')}
            title="Subtítulo (H3 - Médio)"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            H3
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => formatHeading('H4')}
            title="Tópico Menor (H4)"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            H4
          </button>
        </div>

        {/* GRUPO: CONTROLE DE TAMANHO DA LETRA (A- / A▾ / A+) */}
        <div 
          ref={fontSizeMenuRef}
          className="relative flex items-center gap-0.5 border-r border-jm-border pr-1.5 mr-1.5"
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={decreaseFontSize}
            title="Diminuir Tamanho da Letra (A-)"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg font-semibold"
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
              className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-jm-border bg-jm-surface px-2 text-xs text-jm-fg2 transition-colors duration-100 cursor-pointer hover:border-jm-border-strong hover:text-jm-fg"
            >
              <Type className="w-3.5 h-3.5 text-jm-muted" />
              <span className="font-mono text-[11px] tabular-nums">{currentFontSize}</span>
              <ChevronDown className={`w-3 h-3 text-jm-muted ${isFontSizeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFontSizeOpen && (
              <div className="jm-menu absolute top-full left-0 z-50 mt-1 w-32 min-w-0">
                <div className="mb-1 border-b border-jm-border px-3 pb-1.5 pt-0.5 text-[11px] font-medium text-jm-muted">
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
                      className={`jm-menu-item justify-between text-xs ${
                        isSelected
                          ? 'bg-jm-primary-soft font-semibold text-jm-primary-text hover:bg-jm-primary-soft hover:text-jm-primary-text'
                          : ''
                      }`}
                    >
                      <span style={{ fontSize: size }} className="leading-tight">{size}</span>
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-jm-accent-line" />
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
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg font-semibold"
          >
            A+
          </button>
        </div>

        {/* GRUPO: FORMATAÇÃO BÁSICA */}
        <div className="flex items-center gap-0.5 border-r border-jm-border pr-1.5 mr-1.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('bold')}
            title="Negrito (Ctrl+B)"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('italic')}
            title="Itálico (Ctrl+I)"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('underline')}
            title="Sublinhado (Ctrl+U)"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('strikeThrough')}
            title="Tachado"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('removeFormat')}
            title="Limpar Formatação"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* GRUPO: ALINHAMENTOS */}
        <div className="flex items-center gap-0.5 border-r border-jm-border pr-1.5 mr-1.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyLeft')}
            title="Alinhar à Esquerda"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyCenter')}
            title="Centralizar"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('justifyRight')}
            title="Alinhar à Direita"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* GRUPO: LISTAS */}
        <div className="flex items-center gap-0.5 border-r border-jm-border pr-1.5 mr-1.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('insertUnorderedList')}
            title="Lista com Marcadores"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <List className="w-4 h-4" />
            <span>Marcadores</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => executeCommand('insertOrderedList')}
            title="Lista Numerada"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Numerada</span>
          </button>
        </div>

        {/* GRUPO: ELEMENTOS RICOS */}
        <div className="flex flex-wrap items-center gap-0.5">
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
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagem</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLinkModal}
            title="Inserir Link"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Link</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertQuote}
            title="Inserir Citação em Destaque (Blockquote)"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <Quote className="w-4 h-4" />
            <span>Citação</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowCalloutModal(true)}
            title="Inserir Caixa de Aviso ou Destaque"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Dica / Aviso</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertCodeBlock}
            title="Inserir Bloco de Código"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
          >
            <Code className="w-4 h-4" />
            <span>Código</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertDivider}
            title="Inserir Linha Divisória"
            className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-[4px] px-2 text-xs font-medium text-jm-fg2 transition-colors duration-100 cursor-pointer hover:bg-jm-hover hover:text-jm-fg"
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
        className={`relative mx-auto w-full max-w-4xl flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-10 sm:py-10 ${
          isEditorDraggingImage ? 'bg-jm-accent-soft outline-2 outline-dashed -outline-offset-8 outline-jm-accent-line' : ''
        }`}
      >
        {isEditorDraggingImage && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-jm-surface/85">
            <div className="space-y-1.5 rounded-[6px] border border-dashed border-jm-accent-line bg-jm-surface px-6 py-5 text-center">
              <UploadCloud className="mx-auto h-7 w-7 text-jm-accent-text" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-jm-fg">Solte a imagem aqui</p>
              <p className="text-xs text-jm-muted">Ela será enviada automaticamente para o Supabase Storage</p>
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
            className="w-full border-none bg-transparent text-2xl font-bold leading-tight tracking-tight text-jm-fg placeholder:text-jm-placeholder focus:outline-none sm:text-3xl md:text-[34px]"
          />
          <div className="mt-4 h-px w-full bg-jm-border" />
        </div>

        {/* CORPO DO ARTIGO COM CONTENT EDITABLE & PLACEHOLDER SUAVE */}
        <div className="relative min-h-[450px]">
          {isContentEmpty && (
            <div
              onClick={() => editorRef.current?.focus()}
              className="pointer-events-none absolute top-0 left-0 z-0 w-full select-none text-base leading-relaxed text-jm-placeholder"
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
            className="blog-wysiwyg-editor relative z-10 min-h-[450px] text-base leading-relaxed text-jm-fg2 focus:outline-none"
          />
        </div>
      </div>

      {/* RODAPÉ DO EDITOR COM CONTADORES DIDÁTICOS */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-jm-border bg-jm-subtle px-4 py-2 text-xs text-jm-muted sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold tabular-nums text-jm-fg">{stats.words}</span>
            <span>palavras</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold tabular-nums text-jm-fg">{stats.chars}</span>
            <span>caracteres</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Tempo estimado:</span>
            <span className="font-semibold tabular-nums text-jm-fg">{stats.readingTime} min</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="jm-dot text-jm-success-fg" />
          <span>Editor Ativo (Sincronizado)</span>
        </div>
      </div>

      {/* MODAL PARA INSERIR IMAGEM / UPLOAD SUPABASE STORAGE */}
      {showImageModal && typeof window !== 'undefined' && createPortal(
        <div className="jm-overlay z-[99999]">
          <div className="jm-modal space-y-4 overflow-y-auto p-4 sm:p-5">
            <div className="-mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-jm-border px-4 py-3 sm:-mx-5 sm:-mt-5 sm:px-5">
              <h3 className="jm-modal-title flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-jm-muted" />
                <span>Inserir Imagem / Ilustração no Artigo</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="jm-icon-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ABAS: UPLOAD SUPABASE OU URL DIRETA */}
            <div className="jm-segmented flex w-full">
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`jm-segment flex-1 justify-center ${imageTab === 'upload' ? 'jm-segment-active' : ''}`}
              >
                Upload do Computador (Supabase)
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`jm-segment flex-1 justify-center ${imageTab === 'url' ? 'jm-segment-active' : ''}`}
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
                    <div className="relative space-y-2 overflow-hidden rounded-[4px] border border-jm-border bg-jm-subtle p-2">
                      <div className="relative h-44 w-full overflow-hidden rounded-[3px] bg-jm-hover">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={modalImageUrl}
                          alt="Pré-visualização"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="flex items-center gap-1 text-xs font-medium text-jm-success-fg">
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
                          className="jm-link cursor-pointer text-xs"
                        >
                          Trocar Imagem
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isUploadingModalImage && imageFileInputRef.current?.click()}
                      className="cursor-pointer rounded-[4px] border border-dashed border-jm-border-strong bg-jm-subtle p-6 text-center transition-colors duration-100 hover:border-jm-primary hover:bg-jm-hover"
                    >
                      {isUploadingModalImage ? (
                        <div className="space-y-2 py-4">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-jm-muted" />
                          <p className="text-xs font-medium text-jm-fg2">{uploadStatusMessage}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <UploadCloud className="mx-auto h-6 w-6 text-jm-muted" strokeWidth={1.5} />
                          <p className="text-sm font-medium text-jm-fg">
                            Clique para escolher uma imagem do seu dispositivo
                          </p>
                          <p className="text-xs text-jm-muted">
                            PNG, JPG, WebP ou GIF até 4MB (Salvo permanentemente no Supabase)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="jm-label">
                    URL Pública da Imagem
                  </label>
                  <input
                    type="url"
                    value={modalImageUrl}
                    onChange={(e) => setModalImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/grafico-vendas.png"
                    className="jm-input"
                  />
                </div>
              )}

              {/* CAMPOS ADICIONAIS: ALT TEXT, LEGENDA E ALINHAMENTO */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="jm-label">
                    Texto Alternativo / Descrição da Imagem (Alt Text para SEO)
                  </label>
                  <input
                    type="text"
                    value={modalImageAlt}
                    onChange={(e) => setModalImageAlt(e.target.value)}
                    placeholder="Ex: Gráfico demonstrando o crescimento de retenção..."
                    className="jm-input"
                  />
                </div>

                <div>
                  <label className="jm-label">
                    Legenda Opcional (Exibida abaixo da imagem)
                  </label>
                  <input
                    type="text"
                    value={modalImageCaption}
                    onChange={(e) => setModalImageCaption(e.target.value)}
                    placeholder="Ex: Fonte: Pesquisa Harvard Business Review"
                    className="jm-input"
                  />
                </div>

                <div>
                  <label className="jm-label">
                    Alinhamento no Texto
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
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
                        className={`h-8 rounded-[4px] border px-2 text-xs font-medium transition-colors duration-100 cursor-pointer ${
                          modalImageAlign === align.id
                            ? 'border-jm-primary bg-jm-primary-soft text-jm-primary-text'
                            : 'border-jm-border bg-jm-surface text-jm-fg2 hover:bg-jm-hover'
                        }`}
                      >
                        {align.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-jm-border bg-jm-subtle px-4 py-3 sm:-mx-5 sm:-mb-5 sm:flex-row sm:justify-end sm:px-5">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="jm-btn jm-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => insertImageIntoEditor(modalImageUrl, modalImageAlt, modalImageCaption, modalImageAlign)}
                disabled={!modalImageUrl || isUploadingModalImage}
                className="jm-btn jm-btn-primary"
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
        <div className="jm-overlay z-[99999]">
          <div className="jm-modal space-y-4 overflow-y-auto p-4 sm:max-w-md sm:p-5">
            <div className="-mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-jm-border px-4 py-3 sm:-mx-5 sm:-mt-5 sm:px-5">
              <h3 className="jm-modal-title flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-jm-muted" />
                <span>Inserir Link no Texto</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="jm-icon-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="jm-label">
                  Texto Âncora (Exibido no texto)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Texto clicável..."
                  className="jm-input"
                />
              </div>

              <div>
                <label className="jm-label">
                  URL de Destino
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://www.jmmaster.com.br/solucoes"
                  className="jm-input"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-jm-fg2">
                  <input
                    type="checkbox"
                    checked={linkNewTab}
                    onChange={(e) => setLinkNewTab(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded-[3px]"
                  />
                  <span>Abrir link em nova aba (target="_blank")</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-jm-fg2">
                  <input
                    type="checkbox"
                    checked={linkNofollow}
                    onChange={(e) => setLinkNofollow(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded-[3px]"
                  />
                  <span>Adicionar rel="nofollow" (Links externos não endossados)</span>
                </label>
              </div>
            </div>

            <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-jm-border bg-jm-subtle px-4 py-3 sm:-mx-5 sm:-mb-5 sm:flex-row sm:justify-end sm:px-5">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="jm-btn jm-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={insertCustomLink}
                disabled={!linkUrl}
                className="jm-btn jm-btn-primary"
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
        <div className="jm-overlay z-[99999]">
          <div className="jm-modal space-y-4 overflow-y-auto p-4 sm:max-w-md sm:p-5">
            <div className="-mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-jm-border px-4 py-3 sm:-mx-5 sm:-mt-5 sm:px-5">
              <h3 className="jm-modal-title flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-jm-muted" />
                <span>Inserir Caixa de Aviso / Dica</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCalloutModal(false)}
                className="jm-icon-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="jm-label">
                  Tipo de Aviso
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCalloutType('info');
                      setCalloutTitle('Ponto de Atenção');
                    }}
                    className={`h-8 rounded-[4px] border px-2 text-xs font-medium transition-colors duration-100 cursor-pointer ${
                      calloutType === 'info'
                        ? 'border-jm-primary bg-jm-primary-soft text-jm-primary-text'
                        : 'border-jm-border bg-jm-surface text-jm-fg2 hover:bg-jm-hover'
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
                    className={`h-8 rounded-[4px] border px-2 text-xs font-medium transition-colors duration-100 cursor-pointer ${
                      calloutType === 'tip'
                        ? 'border-jm-primary bg-jm-primary-soft text-jm-primary-text'
                        : 'border-jm-border bg-jm-surface text-jm-fg2 hover:bg-jm-hover'
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
                    className={`h-8 rounded-[4px] border px-2 text-xs font-medium transition-colors duration-100 cursor-pointer ${
                      calloutType === 'warning'
                        ? 'border-jm-primary bg-jm-primary-soft text-jm-primary-text'
                        : 'border-jm-border bg-jm-surface text-jm-fg2 hover:bg-jm-hover'
                    }`}
                  >
                    Alerta
                  </button>
                </div>
              </div>

              <div>
                <label className="jm-label">
                  Título do Aviso
                </label>
                <input
                  type="text"
                  value={calloutTitle}
                  onChange={(e) => setCalloutTitle(e.target.value)}
                  className="jm-input"
                />
              </div>

              <div>
                <label className="jm-label">
                  Mensagem / Conteúdo
                </label>
                <textarea
                  rows={3}
                  value={calloutContent}
                  onChange={(e) => setCalloutContent(e.target.value)}
                  className="jm-input resize-none"
                />
              </div>
            </div>

            <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-jm-border bg-jm-subtle px-4 py-3 sm:-mx-5 sm:-mb-5 sm:flex-row sm:justify-end sm:px-5">
              <button
                type="button"
                onClick={() => setShowCalloutModal(false)}
                className="jm-btn jm-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={insertCalloutBox}
                className="jm-btn jm-btn-primary"
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
