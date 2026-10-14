// Dados institucionais centralizados — altere aqui e o site inteiro acompanha.

export const SITE_URL = 'https://www.jmmaster.com.br';
export const SITE_NAME = 'JM MASTER GROUP';
export const SITE_DESCRIPTION =
  'Elevando a presença digital do seu negócio com automações avançadas, chatbots inteligentes, API Oficial do WhatsApp, SMS e E-mail Marketing.';

export const DEFAULT_OG_IMAGE = '/images/og-default.jpg';

export const WHATSAPP_NUMBER = '5521998567051';
export const WHATSAPP_DISPLAY = '(21) 99856-7051';
export const CONTACT_EMAIL = 'contato@jmmastergroup.com.br';
export const CITY = 'Rio de Janeiro';
export const STATE = 'RJ';

// Preencha com as URLs reais; links vazios não são exibidos no site
export const SOCIAL_LINKS = {
  instagram: '',
  linkedin: '',
};

// Preencha para exibir no rodapé e na política de privacidade
export const LEGAL_NAME = '';
export const CNPJ = '';

export function whatsappUrl(message = 'Olá! Vim pelo site da JM MASTER GROUP e gostaria de saber mais sobre as soluções.') {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// Canonicals antigos foram salvos sem "www"; o domínio oficial redireciona para www
export function normalizeSiteUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  return url.replace(/^https?:\/\/(www\.)?jmmaster\.com\.br/i, SITE_URL);
}

// Canonical de um post: links internos do blog sempre seguem o slug atual
// (slugs renomeados deixavam o canonical apontando para uma URL 404).
// Canonicals externos (outro domínio ou outra seção) são respeitados.
export function resolvePostCanonical(slug: string, canonical?: string | null): string {
  const selfUrl = `${SITE_URL}/blog/${slug}`;
  const normalized = normalizeSiteUrl(canonical?.trim());
  if (!normalized || normalized.startsWith(`${SITE_URL}/blog/`) || normalized === `${SITE_URL}/blog`) {
    return selfUrl;
  }
  return normalized;
}

// Serializa JSON-LD sem permitir que o conteúdo feche a tag <script>
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
