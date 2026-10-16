import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { clientIp, isRateLimited } from '@/lib/rate-limit';
import { formatDateTimeBr } from '@/lib/dates';
import { EMAIL_REGEX } from '@/lib/validators';

// Rota pública (liberada no middleware) — recebe o formulário de contato do site,
// cria o lead no funil de vendas (estágio "Novo") e registra na linha do tempo do CRM.

const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;

function clean(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (await isRateLimited(`lead:${ip}`, MAX_PER_WINDOW, WINDOW_MS)) {
      return NextResponse.json({ error: 'Muitas solicitações. Tente novamente em alguns minutos.' }, { status: 429 });
    }

    const body = await req.json();

    // Honeypot: campo invisível que só robôs preenchem
    if (clean(body.website, 200)) {
      return NextResponse.json({ success: true });
    }

    const name = clean(body.name, 120);
    const email = clean(body.email, 160).toLowerCase();
    const phone = clean(body.phone, 40);
    const company = clean(body.company, 120);
    const interest = clean(body.interest, 120);
    const message = clean(body.message, 2000);
    const currentPage = clean(body.page, 300);
    // Artigo do blog lido antes de chegar ao formulário (atribuição do lead ao conteúdo)
    const referrerPost = clean(body.referrerPost, 300);
    const page =
      referrerPost.startsWith('/blog/') && !currentPage.startsWith('/blog/')
        ? `${currentPage || '/'} (via ${referrerPost})`
        : currentPage;

    if (!name || (!email && !phone)) {
      return NextResponse.json({ error: 'Informe seu nome e um e-mail ou telefone.' }, { status: 400 });
    }
    if (email && !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }
    if (body.consent !== true) {
      return NextResponse.json({ error: 'É necessário aceitar a Política de Privacidade.' }, { status: 400 });
    }

    const description = [
      email && `E-mail: ${email}`,
      phone && `Telefone: ${phone}`,
      company && `Empresa: ${company}`,
      interest && `Interesse: ${interest}`,
      message && `Mensagem: ${message}`,
      page && `Página de origem: ${page}`,
      'Consentimento LGPD: aceito',
    ]
      .filter(Boolean)
      .join('\n');

    // Novo lead entra no topo da coluna "Novo"
    const top = await prisma.lead.findFirst({ where: { stage: 'NOVO' }, orderBy: { position: 'asc' }, select: { position: true } });

    await prisma.lead.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
        interest: interest || null,
        message: message || null,
        sourcePage: page || null,
        source: 'SITE',
        stage: 'NOVO',
        consent: true,
        position: (top?.position ?? 0) - 1,
        interactions: {
          create: {
            operator: 'Site',
            customerName: company ? `${name} (${company})` : name,
            title: `Novo lead pelo site${interest ? ` — ${interest}` : ''}`,
            description,
            date: formatDateTimeBr(),
            type: 'LEAD',
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Leads Error]:', error);
    return NextResponse.json({ error: 'Não foi possível enviar agora. Tente pelo WhatsApp.' }, { status: 500 });
  }
}
