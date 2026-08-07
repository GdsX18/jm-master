export interface Author {
  name: string;
  role: string;
  avatar: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "Todos" | "WhatsApp API" | "Automação" | "Inteligência Artificial" | "Marketing Digital" | "Vendas & CRM";
  date: string;
  readTime: string;
  coverImage: string;
  coverImageAlt: string;
  author: Author;
  featured?: boolean;
  tags: string[];
}

export const CATEGORIES = [
  "Todos",
  "WhatsApp API",
  "Automação",
  "Inteligência Artificial",
  "Marketing Digital",
  "Vendas & CRM",
] as const;

export type CategoryType = (typeof CATEGORIES)[number];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "post-1",
    slug: "whatsapp-business-api-oficial-guia-completo-2026",
    title: "WhatsApp Business API Oficial: Como Escalar o Atendimento sem Risco de Bloqueio",
    excerpt:
      "Descubra como a integração com a API Oficial da Meta transforma o suporte da sua empresa, garantindo múltiplos atendentes simultâneos, selo de verificação e estabilidade operacional ininterrupta.",
    category: "WhatsApp API",
    date: "28 de Jan, 2026",
    readTime: "5 min de leitura",
    coverImage:
      "https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Smartphone com tela de chat e automação de mensagens corporativas",
    featured: true,
    author: {
      name: "Juliana Moreira",
      role: "Head de Automação & Parcerias Meta",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    },
    tags: ["WhatsApp API", "Meta", "Atendimento", "Automação"],
  },
  {
    id: "post-2",
    slug: "chatbot-ia-conversacional-aumento-conversao",
    title: "Chatbots com IA Generativa: Como Criar Atendimentos que Convertem 3x Mais",
    excerpt:
      "Esqueça os robôs com menus engessados. Veja como treinar modelos de inteligência conversacional para responder dúvidas complexas e qualificar leads em tempo recorde.",
    category: "Inteligência Artificial",
    date: "22 de Jan, 2026",
    readTime: "6 min de leitura",
    coverImage:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Conceito visual de inteligência artificial e processamento de linguagem natural",
    featured: false,
    author: {
      name: "Rodrigo Carvalho",
      role: "Especialista em IA Conversacional",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    tags: ["Inteligência Artificial", "Chatbots", "Vendas", "Atendimento 24/7"],
  },
  {
    id: "post-3",
    slug: "regua-relacionamento-email-sms-whatsapp",
    title: "Omnichannel na Prática: Orquestrando E-mail, SMS e WhatsApp em Funis de Vendas",
    excerpt:
      "Aprenda a sincronizar canais de mensageria para criar uma jornada de compra sem atritos, reduzindo a taxa de abandono de carrinho e maximizando o Lifetime Value (LTV).",
    category: "Marketing Digital",
    date: "17 de Jan, 2026",
    readTime: "4 min de leitura",
    coverImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Gráficos de marketing digital, análise de métricas e conversão",
    featured: false,
    author: {
      name: "Camila Guimarães",
      role: "Estrategista de Growth & Mensageria",
      avatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    },
    tags: ["Omnichannel", "E-mail Marketing", "SMS", "Funil de Vendas"],
  },
  {
    id: "post-4",
    slug: "automacao-de-processos-comerciais-crm",
    title: "Automação de Processos Comerciais: Do Primeiro Lead ao Fechamento no CRM",
    excerpt:
      "Descubra como estruturar fluxos automatizados de follow-up que impedem que oportunidades esfriem no funil e aumentam a produtividade da sua equipe comercial.",
    category: "Vendas & CRM",
    date: "12 de Jan, 2026",
    readTime: "5 min de leitura",
    coverImage:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Equipe corporativa analisando painel de vendas e CRM",
    featured: false,
    author: {
      name: "Marcus Vinícius",
      role: "Consultor Sênior de CRM & Vendas",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    tags: ["CRM", "Vendas B2B", "Follow-up", "Automação Comercial"],
  },
  {
    id: "post-5",
    slug: "reduzindo-cac-com-automacoes-inteligentes",
    title: "Como Reduzir o CAC em até 40% Utilizando Automações de Alta Resposta",
    excerpt:
      "Análise aprofundada de cases reais que substituíram processos manuais por réguas de contato automáticas e inteligentes, gerando maior ROI nas campanhas de tráfego pago.",
    category: "Automação",
    date: "08 de Jan, 2026",
    readTime: "7 min de leitura",
    coverImage:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Estratégia de negócios e análise de retorno sobre investimento",
    featured: false,
    author: {
      name: "Juliana Moreira",
      role: "Head de Automação & Parcerias Meta",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    },
    tags: ["CAC", "ROI", "Automação", "Performance"],
  },
  {
    id: "post-6",
    slug: "boas-praticas-entregabilidade-sms-marketing-2026",
    title: "SMS Marketing Corporativo: Boas Práticas para Alcançar 98% de Taxa de Abertura",
    excerpt:
      "Saiba como usar o SMS de forma estratégica para notificações críticas, cobrança amigável, tokens de autenticação (2FA) e ofertas exclusivas de curtíssima duração.",
    category: "Marketing Digital",
    date: "03 de Jan, 2026",
    readTime: "4 min de leitura",
    coverImage:
      "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Pessoa segurando celular recebendo mensagem SMS corporativa",
    featured: false,
    author: {
      name: "Camila Guimarães",
      role: "Estrategista de Growth & Mensageria",
      avatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    },
    tags: ["SMS Marketing", "Taxa de Abertura", "Notificações", "Engajamento"],
  },
  {
    id: "post-7",
    slug: "ia-e-atendimento-humano-simbiose-perfeita",
    title: "IA + Atendimento Humano: O Segredo para Escalar Sem Perder a Empatia",
    excerpt:
      "Como calibrar o transbordo inteligente de chamados para que a inteligência artificial resolva 80% das solicitações simples e direcione os casos complexos aos seus melhores consultores.",
    category: "Inteligência Artificial",
    date: "29 de Dez, 2025",
    readTime: "5 min de leitura",
    coverImage:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Equipe trabalhando em harmonia e colaboração com tecnologia",
    featured: false,
    author: {
      name: "Rodrigo Carvalho",
      role: "Especialista em IA Conversacional",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    tags: ["IA", "Atendimento Humano", "Transbordo", "Experiência do Cliente"],
  },
  {
    id: "post-8",
    slug: "metricas-essenciais-para-mensageria-whatsapp-2026",
    title: "As 7 Métricas Essenciais que Todo Gestor Deve Monitorar no WhatsApp Corporativo",
    excerpt:
      "Tempo de Primeira Resposta (TMR), Taxa de Resolução no Primeiro Contato (FCR), CSAT e taxas de conversão de mensagens ativas: um guia prático de dashboards executivos.",
    category: "Vendas & CRM",
    date: "20 de Dez, 2025",
    readTime: "6 min de leitura",
    coverImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Dashboard de análise com gráficos de dados e métricas em tempo real",
    featured: false,
    author: {
      name: "Marcus Vinícius",
      role: "Consultor Sênior de CRM & Vendas",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    tags: ["Métricas", "KPIs", "WhatsApp", "Gestão de Atendimento"],
  },
];
