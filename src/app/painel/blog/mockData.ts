import { Article, ArticleCategory } from './types';

export const OFFICIAL_AUTHOR = {
  name: 'JM Master Group',
  role: 'Especialistas em Mensageria & Automação',
  avatarUrl: '/logos/Icone.png',
  isOfficialBrand: true,
};

export const CATEGORIES_LIST: { name: ArticleCategory; color: string; bg: string; border: string }[] = [
  { name: 'WhatsApp API', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
  { name: 'Automação', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800' },
  { name: 'Chatbots', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800' },
  { name: 'Marketing Digital', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' },
  { name: 'Vendas & CRM', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-800' },
];

export const COVER_PRESETS = [
  {
    id: 'whatsapp-cloud',
    name: 'WhatsApp Cloud API Enterprise',
    category: 'WhatsApp API' as ArticleCategory,
    url: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=1200&q=80',
    alt: 'Interface de comunicação corporativa via WhatsApp e inteligência de dados',
  },
  {
    id: 'chatbots-flows',
    name: 'Chatbots & Fluxos de Atendimento',
    category: 'Chatbots' as ArticleCategory,
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    alt: 'Fluxos de mensagens e automação de atendimento digital',
  },
  {
    id: 'workflow-automation',
    name: 'Automação de Processos & SLA',
    category: 'Automação' as ArticleCategory,
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    alt: 'Gráficos de análise de performance operacional e fluxo de processos',
  },
  {
    id: 'sales-crm',
    name: 'CRM & Pipeline de Vendas',
    category: 'Vendas & CRM' as ArticleCategory,
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Dashboard analítico de CRM e conversão de leads empresariais',
  },
  {
    id: 'digital-strategy',
    name: 'Estratégia de Marketing Digital',
    category: 'Marketing Digital' as ArticleCategory,
    url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&w=1200&q=80',
    alt: 'Planejamento de campanhas digitais e mensageria estratégica',
  },
];

export const INITIAL_ARTICLES: Article[] = [];

const STORAGE_KEY = '@JMMaster:blog_articles_v2';

export function getStoredArticles(): Article[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredArticles(articles: Article[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  } catch (err) {
    console.error('Erro ao salvar artigos no localStorage:', err);
  }
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function calculateReadingTime(textOrHtml: string): number {
  const plainText = textOrHtml.replace(/<[^>]*>/g, ' ').trim();
  const words = plainText.split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;
  const minutes = Math.ceil(words / 200);
  return Math.max(1, minutes);
}

export function countWordsAndChars(textOrHtml: string): { words: number; chars: number } {
  const plainText = textOrHtml.replace(/<[^>]*>/g, ' ').trim();
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const chars = plainText.length;
  return { words, chars };
}

export const DEFAULT_CATEGORIES: string[] = [
  'WhatsApp API',
  'Automação',
  'Chatbots',
  'Marketing Digital',
  'Vendas & CRM',
];

const CATEGORIES_STORAGE_KEY = '@JMMaster:blog_categories_v2';

export function getStoredCategories(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return Array.from(new Set([...DEFAULT_CATEGORIES, ...parsed]));
    }
    return DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveStoredCategories(categories: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Erro ao salvar categorias no localStorage:', err);
  }
}
