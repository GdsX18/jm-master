import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products/groups - Listar grupos de clientes/preços
export async function GET() {
  try {
    let setting = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
    if (!setting) {
      setting = await prisma.siteSetting.create({
        data: { id: 'default' },
      });
    }

    // Grupos padrão se ainda não existirem
    let groups = [
      { id: 'grp-padrao', name: 'Tabela Padrão (Varejo)', isActive: true },
      { id: 'grp-enterprise', name: 'Enterprise & Grandes Contas', isActive: true },
      { id: 'grp-parceiros', name: 'Parceiros & Integradores', isActive: true },
    ];

    try {
      if (setting.customHeaderScript && setting.customHeaderScript.startsWith('GROUPS_JSON:')) {
        const jsonStr = setting.customHeaderScript.replace('GROUPS_JSON:', '');
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          groups = parsed;
        }
      }
    } catch {}

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('[API Groups GET Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao carregar grupos' }, { status: 500 });
  }
}

// POST /api/products/groups - Criar novo grupo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'Nome do grupo é obrigatório' }, { status: 400 });
    }

    let setting = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
    let groups = [
      { id: 'grp-padrao', name: 'Tabela Padrão (Varejo)', isActive: true },
      { id: 'grp-enterprise', name: 'Enterprise & Grandes Contas', isActive: true },
      { id: 'grp-parceiros', name: 'Parceiros & Integradores', isActive: true },
    ];

    if (setting?.customHeaderScript && setting.customHeaderScript.startsWith('GROUPS_JSON:')) {
      try {
        groups = JSON.parse(setting.customHeaderScript.replace('GROUPS_JSON:', ''));
      } catch {}
    }

    const newGroup = {
      id: `grp-${Date.now()}`,
      name: name.trim(),
      isActive: true,
    };

    groups.push(newGroup);

    await prisma.siteSetting.upsert({
      where: { id: 'default' },
      update: { customHeaderScript: `GROUPS_JSON:${JSON.stringify(groups)}` },
      create: { id: 'default', customHeaderScript: `GROUPS_JSON:${JSON.stringify(groups)}` },
    });

    return NextResponse.json(newGroup);
  } catch (error: any) {
    console.error('[API Groups POST Error]:', error);
    return NextResponse.json({ message: error.message || 'Erro ao criar grupo' }, { status: 500 });
  }
}
