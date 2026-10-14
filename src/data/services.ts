export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface Service {
  slug: string;
  // Id do card correspondente na seção de soluções da home
  cardId: string;
  name: string;
  eyebrow: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  intro: string[];
  benefits: { title: string; description: string }[];
  useCases: string[];
  steps: { title: string; description: string }[];
  faqs: ServiceFAQ[];
  whatsappMessage: string;
}

export const SERVICES: Service[] = [
  {
    slug: 'whatsapp-api-oficial',
    cardId: 'whatsapp',
    name: 'WhatsApp Business API Oficial',
    eyebrow: 'API Oficial Meta',
    h1: 'WhatsApp Business API Oficial para empresas',
    metaTitle: 'WhatsApp Business API Oficial | JM MASTER GROUP',
    metaDescription:
      'Implante a API Oficial do WhatsApp (Meta) com múltiplos atendentes, disparos segmentados, automações de venda e relatórios. Sem risco de bloqueio por uso não oficial.',
    keywords: [
      'WhatsApp Business API',
      'API Oficial do WhatsApp',
      'WhatsApp para empresas',
      'disparo em massa WhatsApp',
      'multiatendimento WhatsApp',
    ],
    intro: [
      'A API Oficial do WhatsApp é a forma homologada pela Meta para empresas conversarem com clientes em escala. Diferente de ferramentas não oficiais, ela não depende de engenharia reversa do aplicativo e não coloca o seu número em risco de banimento.',
      'A JM MASTER GROUP cuida de toda a implantação: aprovação do número, configuração do perfil comercial, criação de modelos de mensagem, integração com o seu atendimento e as automações que fazem a operação vender mais com o mesmo time.',
    ],
    benefits: [
      {
        title: 'Vários atendentes, um único número',
        description: 'Toda a equipe atende pelo mesmo WhatsApp, com distribuição de conversas e histórico centralizado.',
      },
      {
        title: 'Disparos segmentados e permitidos',
        description: 'Campanhas com modelos aprovados pela Meta, enviadas para listas segmentadas sem risco de bloqueio.',
      },
      {
        title: 'Automação de vendas e pós-venda',
        description: 'Fluxos que respondem, qualificam, confirmam agendamentos e reativam clientes automaticamente.',
      },
      {
        title: 'Métricas em tempo real',
        description: 'Acompanhe entregas, leituras, respostas e conversões de cada campanha e de cada atendente.',
      },
    ],
    useCases: [
      'Confirmação e lembrete de agendamentos (clínicas, oficinas, salões)',
      'Recuperação de orçamentos e carrinhos abandonados',
      'Reativação de clientes inativos',
      'Atendimento comercial com fila e distribuição entre vendedores',
      'Avisos de cobrança, entrega e pós-venda',
    ],
    steps: [
      { title: 'Diagnóstico', description: 'Entendemos sua operação, volume de mensagens e objetivos comerciais.' },
      { title: 'Implantação', description: 'Homologamos o número na Meta e configuramos perfil, modelos e integrações.' },
      { title: 'Automação', description: 'Criamos os fluxos de atendimento, qualificação e campanhas.' },
      { title: 'Acompanhamento', description: 'Medimos resultados e ajustamos continuamente as mensagens e fluxos.' },
    ],
    faqs: [
      {
        question: 'Qual a diferença entre o WhatsApp Business comum e a API Oficial?',
        answer:
          'O aplicativo WhatsApp Business funciona em poucos aparelhos e não permite automação robusta. A API Oficial permite vários atendentes no mesmo número, integrações com sistemas, chatbots e disparos com modelos aprovados pela Meta.',
      },
      {
        question: 'Meu número corre risco de ser bloqueado?',
        answer:
          'O risco de bloqueio vem do uso de ferramentas não oficiais. Na API Oficial, seguindo as políticas da Meta e usando modelos aprovados, a operação é homologada e estável.',
      },
      {
        question: 'Posso usar o número que a empresa já tem?',
        answer:
          'Sim, na maioria dos casos é possível migrar o número atual para a API Oficial. Avaliamos o seu cenário no diagnóstico.',
      },
      {
        question: 'Quanto tempo leva a implantação?',
        answer:
          'Depende da verificação da empresa junto à Meta e da complexidade dos fluxos. Informamos o prazo estimado logo após o diagnóstico.',
      },
    ],
    whatsappMessage: 'Olá! Gostaria de saber mais sobre a WhatsApp Business API Oficial.',
  },
  {
    slug: 'chatbot-atendimento',
    cardId: 'chatbot',
    name: 'Chatbot de Atendimento',
    eyebrow: 'Atendimento 24/7',
    h1: 'Chatbot inteligente de atendimento e vendas',
    metaTitle: 'Chatbot de Atendimento Inteligente | JM MASTER GROUP',
    metaDescription:
      'Chatbot para WhatsApp e site que responde na hora, qualifica leads, integra com o CRM e transfere para um atendente humano no momento certo.',
    keywords: [
      'chatbot de atendimento',
      'chatbot para WhatsApp',
      'automação de atendimento',
      'qualificação de leads',
      'chatbot com inteligência artificial',
    ],
    intro: [
      'Um bom chatbot não substitui o seu time: ele elimina a espera, responde as dúvidas repetitivas e entrega para os atendentes apenas as conversas com potencial real de negócio.',
      'Desenhamos fluxos que conversam de forma natural, coletam as informações certas, consultam seus sistemas e fazem a transição para o atendimento humano sem que o cliente precise repetir nada.',
    ],
    benefits: [
      {
        title: 'Resposta imediata, a qualquer hora',
        description: 'Clientes atendidos em segundos, inclusive à noite, nos fins de semana e em picos de demanda.',
      },
      {
        title: 'Qualificação automática',
        description: 'O bot faz as perguntas certas e entrega ao vendedor um lead já qualificado.',
      },
      {
        title: 'Integração com CRM',
        description: 'Dados da conversa registrados no seu CRM e em bases de conhecimento.',
      },
      {
        title: 'Transição fluida para humanos',
        description: 'Quando a conversa exige uma pessoa, o atendente assume com todo o contexto.',
      },
    ],
    useCases: [
      'Triagem de atendimento e direcionamento por setor',
      'Respostas a perguntas frequentes (preço, horário, prazos)',
      'Agendamento automático de consultas e visitas',
      'Segunda via de boletos e status de pedidos',
      'Pesquisa de satisfação após o atendimento',
    ],
    steps: [
      { title: 'Mapeamento', description: 'Levantamos as perguntas e jornadas mais comuns dos seus clientes.' },
      { title: 'Roteiro', description: 'Escrevemos fluxos com a linguagem da sua marca.' },
      { title: 'Integração', description: 'Conectamos o bot ao WhatsApp, ao site e ao seu CRM.' },
      { title: 'Otimização', description: 'Analisamos as conversas e melhoramos os fluxos continuamente.' },
    ],
    faqs: [
      {
        question: 'O chatbot funciona no WhatsApp?',
        answer: 'Sim. O chatbot funciona na API Oficial do WhatsApp e também pode ser usado no site e em outros canais.',
      },
      {
        question: 'O cliente consegue falar com uma pessoa?',
        answer:
          'Sim. Definimos em quais momentos a conversa é transferida para um atendente, que recebe todo o histórico.',
      },
      {
        question: 'Preciso ter um CRM para usar o chatbot?',
        answer: 'Não é obrigatório, mas a integração com CRM aumenta muito o aproveitamento dos leads. Ajudamos na escolha e na integração.',
      },
    ],
    whatsappMessage: 'Olá! Gostaria de saber mais sobre o Chatbot de Atendimento.',
  },
  {
    slug: 'email-marketing',
    cardId: 'email',
    name: 'E-mail Marketing Estratégico',
    eyebrow: 'Réguas de relacionamento',
    h1: 'E-mail marketing estratégico com alta entregabilidade',
    metaTitle: 'E-mail Marketing Estratégico | JM MASTER GROUP',
    metaDescription:
      'Réguas de relacionamento, newsletters e e-mails transacionais com foco em entregabilidade, automação (boas-vindas, carrinho abandonado, pós-venda) e testes A/B.',
    keywords: [
      'e-mail marketing',
      'automação de e-mail',
      'régua de relacionamento',
      'entregabilidade de e-mail',
      'newsletter para empresas',
    ],
    intro: [
      'O e-mail continua sendo um dos canais com melhor retorno sobre investimento quando é bem feito: mensagens relevantes, na hora certa, chegando na caixa de entrada e não no spam.',
      'Configuramos a infraestrutura de envio (autenticação de domínio SPF, DKIM e DMARC), criamos as réguas automáticas e acompanhamos os resultados para melhorar cada envio.',
    ],
    benefits: [
      {
        title: 'Caixa de entrada, não spam',
        description: 'Configuração técnica do domínio e boas práticas de envio para maximizar a entregabilidade.',
      },
      {
        title: 'Automações que trabalham sozinhas',
        description: 'Boas-vindas, carrinho abandonado, aniversário, reativação e pós-venda no piloto automático.',
      },
      {
        title: 'Testes A/B',
        description: 'Assuntos, conteúdos e horários testados para descobrir o que gera mais abertura e cliques.',
      },
      {
        title: 'Segmentação',
        description: 'Mensagens diferentes para cada perfil de cliente, com base em comportamento e histórico.',
      },
    ],
    useCases: [
      'Newsletter e conteúdo para nutrição de leads',
      'Sequência de boas-vindas para novos clientes',
      'Recuperação de carrinho abandonado',
      'E-mails transacionais (pedidos, cobranças, confirmações)',
      'Campanhas sazonais e promocionais',
    ],
    steps: [
      { title: 'Infraestrutura', description: 'Autenticamos o domínio e preparamos a base de contatos.' },
      { title: 'Estratégia', description: 'Definimos segmentos, réguas e calendário de envios.' },
      { title: 'Produção', description: 'Criamos modelos responsivos e textos alinhados à sua marca.' },
      { title: 'Análise', description: 'Medimos aberturas, cliques e conversões e otimizamos.' },
    ],
    faqs: [
      {
        question: 'Por que meus e-mails caem no spam?',
        answer:
          'Normalmente por falta de autenticação do domínio (SPF, DKIM, DMARC), listas desatualizadas ou conteúdo com características de spam. Corrigimos esses pontos na implantação.',
      },
      {
        question: 'Posso usar minha base de contatos atual?',
        answer:
          'Sim, desde que os contatos tenham autorizado o recebimento, conforme a LGPD. Fazemos a higienização da base antes dos envios.',
      },
    ],
    whatsappMessage: 'Olá! Gostaria de saber mais sobre o E-mail Marketing Estratégico.',
  },
  {
    slug: 'sms-marketing',
    cardId: 'sms',
    name: 'SMS Marketing Corporativo',
    eyebrow: 'Disparo instantâneo',
    h1: 'SMS marketing e SMS corporativo para empresas',
    metaTitle: 'SMS Marketing Corporativo | JM MASTER GROUP',
    metaDescription:
      'Envio de SMS em massa e transacional para lembretes, cobranças, tokens (2FA) e ofertas, com entrega em segundos e relatórios de confirmação.',
    keywords: [
      'SMS marketing',
      'SMS corporativo',
      'envio de SMS em massa',
      'SMS para cobrança',
      'SMS token 2FA',
    ],
    intro: [
      'O SMS chega em qualquer celular, sem depender de internet ou de aplicativo instalado. Por isso é o canal ideal para mensagens curtas e urgentes que o cliente precisa ver.',
      'Integramos o envio de SMS aos seus sistemas para disparos automáticos (lembretes, códigos de verificação, avisos de cobrança) e campanhas segmentadas.',
    ],
    benefits: [
      {
        title: 'Entrega em segundos',
        description: 'Ideal para códigos de verificação, alertas e ofertas com prazo curto.',
      },
      {
        title: 'Alcance universal',
        description: 'Funciona em qualquer aparelho, mesmo sem internet ou aplicativo de mensagens.',
      },
      {
        title: 'Cobrança e avisos operacionais',
        description: 'Lembretes de vencimento e avisos automáticos integrados ao seu sistema.',
      },
      {
        title: 'Relatórios de entrega',
        description: 'Confirmação de entrega de cada mensagem para auditoria e acompanhamento.',
      },
    ],
    useCases: [
      'Lembrete de consultas e agendamentos',
      'Códigos de verificação (2FA) e tokens',
      'Aviso de vencimento e cobrança',
      'Ofertas relâmpago e campanhas promocionais',
      'Comunicados operacionais urgentes',
    ],
    steps: [
      { title: 'Configuração', description: 'Definimos remetente, rotas e integrações com seus sistemas.' },
      { title: 'Mensagens', description: 'Escrevemos textos curtos, claros e dentro das regras das operadoras.' },
      { title: 'Disparo', description: 'Envios automáticos ou campanhas segmentadas.' },
      { title: 'Relatórios', description: 'Acompanhamento de entregas e resultados.' },
    ],
    faqs: [
      {
        question: 'SMS ainda funciona com tanta gente usando WhatsApp?',
        answer:
          'Sim. Para mensagens curtas e urgentes, como códigos de verificação, lembretes e cobranças, o SMS continua sendo o canal mais garantido, porque não depende de internet nem de aplicativo.',
      },
      {
        question: 'Posso integrar o SMS ao meu sistema?',
        answer: 'Sim. O envio pode ser disparado automaticamente pelo seu sistema por meio de API.',
      },
    ],
    whatsappMessage: 'Olá! Gostaria de saber mais sobre o SMS Marketing Corporativo.',
  },
];

export function getServiceBySlug(slug: string) {
  return SERVICES.find((service) => service.slug === slug);
}
