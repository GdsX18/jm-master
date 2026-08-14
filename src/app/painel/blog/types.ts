export type ArticleCategory =
  | 'WhatsApp API'
  | 'Automação'
  | 'Inteligência Artificial'
  | 'Marketing Digital'
  | 'Vendas & CRM'
  | (string & {});

export type ArticleStatus = 'draft' | 'published' | 'scheduled';

export interface ArticleAuthor {
  name: string;
  role: string;
  avatarUrl: string;
  isOfficialBrand: boolean;
}

export interface ArticleCallout {
  id: string;
  type: 'info' | 'tip' | 'warning';
  title: string;
  content: string;
}

export interface ArticleImageInsert {
  url: string;
  alt: string;
  caption?: string;
  alignment: 'center' | 'full' | 'left' | 'right';
}

export interface ArticleSEO {
  focusKeyphrase: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface ArticleFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  category: ArticleCategory;
  isFeatured: boolean;
  coverImage: string;
  coverImageAlt: string;
  author: ArticleAuthor;
  readingTimeMinutes: number;
  publishedAt?: string;
  status: ArticleStatus;
  views?: number;
  createdAt: string;
  updatedAt: string;
  seo?: ArticleSEO;
  faqs?: ArticleFAQ[];
}

export type ViewMode = 'list' | 'editor' | 'split' | 'preview';
export type PreviewDevice = 'desktop' | 'mobile';
export type PreviewTab = 'feed_card' | 'full_post';
