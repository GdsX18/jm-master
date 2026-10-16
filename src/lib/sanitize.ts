import sanitizeHtml from 'sanitize-html';

// Conteúdo rico dos artigos: mantém a formatação do editor (classes Tailwind, estilos
// vindos do Word, tabelas, imagens, callouts) e remove tudo que executa código
// (<script>, on*="...", javascript:, <iframe>, <form>...).

// Valores de CSS sem url()/expression() — evitam carregar recursos externos via estilo
const SAFE_CSS_VALUE = [/^(?!.*(?:url|expression|image-set)\s*\().*$/i];

const ALLOWED_STYLE_PROPS = [
  'color', 'background-color', 'font-size', 'font-weight', 'font-style', 'font-family', 'font-variant',
  'text-align', 'text-decoration', 'text-indent', 'text-transform', 'line-height', 'letter-spacing',
  'vertical-align', 'white-space', 'width', 'height', 'max-width', 'min-width',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-width', 'border-style', 'border-color', 'border-collapse', 'border-radius', 'border-spacing',
  'float', 'clear', 'display', 'list-style-type',
];

const allowedStyles = Object.fromEntries(ALLOWED_STYLE_PROPS.map((prop) => [prop, SAFE_CSS_VALUE]));

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'div', 'span', 'section', 'article',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark', 'small', 'sub', 'sup', 'font',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'blockquote', 'q', 'cite', 'pre', 'code', 'kbd',
    'a', 'img', 'figure', 'figcaption', 'picture', 'source',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    'details', 'summary', 'o:p',
  ],
  allowedAttributes: {
    '*': ['class', 'style', 'id', 'title', 'dir', 'lang', 'align'],
    a: ['href', 'target', 'rel', 'name'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
    source: ['srcset', 'type', 'media'],
    table: ['border', 'cellspacing', 'cellpadding', 'width'],
    td: ['colspan', 'rowspan', 'valign', 'width'],
    th: ['colspan', 'rowspan', 'valign', 'width', 'scope'],
    col: ['span', 'width'],
    font: ['size', 'color', 'face'],
    ol: ['start', 'type', 'reversed'],
    li: ['value'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowProtocolRelative: false,
  allowedStyles: { '*': allowedStyles },
  transformTags: {
    // Links externos abertos em nova aba nunca dão acesso à janela de origem
    a: (tagName, attribs) => {
      if (attribs.target === '_blank') {
        const rel = new Set((attribs.rel || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        attribs.rel = Array.from(rel).join(' ');
      }
      return { tagName, attribs };
    },
  },
};

export function sanitizeArticleHtml(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, OPTIONS);
}

// Texto simples (títulos, nomes, descrições): remove qualquer marcação
export function stripTags(value: string | null | undefined): string {
  if (!value) return '';
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}
