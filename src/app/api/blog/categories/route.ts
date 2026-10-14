import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/session';

const DEFAULT_CATEGORIES = ['WhatsApp API', 'Automação', 'Chatbots', 'Marketing Digital', 'Vendas & CRM'];

// GET /api/blog/categories - Categorias do blog (cadastradas + as já usadas em artigos)
export async function GET() {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    let stored = await prisma.blogCategory.findMany({ orderBy: { createdAt: 'asc' }, select: { name: true } });
    if (stored.length === 0) {
      await prisma.blogCategory.createMany({ data: DEFAULT_CATEGORIES.map((name) => ({ name })), skipDuplicates: true });
      stored = await prisma.blogCategory.findMany({ orderBy: { createdAt: 'asc' }, select: { name: true } });
    }
    const used = await prisma.blogPost.findMany({ distinct: ['category'], select: { category: true } });
    const names = Array.from(new Set([...stored.map((c) => c.name), ...used.map((u) => u.category)])).filter(Boolean);
    return NextResponse.json({ success: true, categories: names });
  } catch (error) {
    console.error('[API Blog Categories GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar categorias' }, { status: 500 });
  }
}

// POST /api/blog/categories { name } - Criar categoria
export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    const { name } = await req.json();
    const clean = typeof name === 'string' ? name.trim().slice(0, 60) : '';
    if (!clean) return NextResponse.json({ error: 'Informe o nome da categoria' }, { status: 400 });

    const existing = await prisma.blogCategory.findFirst({ where: { name: { equals: clean, mode: 'insensitive' } } });
    const category = existing || (await prisma.blogCategory.create({ data: { name: clean } }));
    return NextResponse.json({ success: true, name: category.name });
  } catch (error) {
    console.error('[API Blog Categories POST Error]:', error);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}

// DELETE /api/blog/categories?name=&moveTo= - Excluir categoria movendo os artigos para outra
export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    const params = new URL(req.url).searchParams;
    const name = params.get('name')?.trim();
    const moveTo = params.get('moveTo')?.trim();
    if (!name) return NextResponse.json({ error: 'Categoria é obrigatória' }, { status: 400 });

    const inUse = await prisma.blogPost.count({ where: { category: name } });
    if (inUse > 0 && (!moveTo || moveTo === name)) {
      return NextResponse.json(
        { error: `${inUse} artigo(s) usam esta categoria. Escolha para qual categoria movê-los.` },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      ...(inUse > 0 ? [prisma.blogPost.updateMany({ where: { category: name }, data: { category: moveTo! } })] : []),
      prisma.blogCategory.deleteMany({ where: { name } }),
    ]);

    if (inUse > 0) revalidatePath('/blog', 'layout');
    return NextResponse.json({ success: true, moved: inUse });
  } catch (error) {
    console.error('[API Blog Categories DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
