import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Rota pública (liberada no middleware) — recebe o formulário de contato do site
// e registra o lead na linha do tempo do CRM.

const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;
const submissions = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = submissions.get(ip);
  if (!entry || entry.resetAt < now) {
    submissions.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function clean(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Muitas solicitações. Tente novamente em alguns minutos.' }, { status: 429 });
    }

    const body = await req.json();

    // Honeypot: campo invisível que só robôs preenchem
    if (clean(body.website, 200)) {
      return NextResponse.json({ success: true });
    }

    const name = clean(body.name, 120);
    const email = clean(body.email, 160);
    const phone = clean(body.phone, 40);
    const company = clean(body.company, 120);
    const interest = clean(body.interest, 120);
    const message = clean(body.message, 2000);
    const page = clean(body.page, 300);

    if (!name || (!email && !phone)) {
      return NextResponse.json({ error: 'Informe seu nome e um e-mail ou telefone.' }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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

    await prisma.crmInteraction.create({
      data: {
        operator: 'Site',
        customerName: company ? `${name} (${company})` : name,
        title: `Novo lead pelo site${interest ? ` — ${interest}` : ''}`,
        description,
        date: new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        }),
        type: 'LEAD',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Leads Error]:', error);
    return NextResponse.json({ error: 'Não foi possível enviar agora. Tente pelo WhatsApp.' }, { status: 500 });
  }
}
