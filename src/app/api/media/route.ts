import { NextRequest, NextResponse } from 'next/server';
import { listObjects, publicUrl, removeObjects } from '@/lib/storage';
import { actorOf, requirePermission } from '@/lib/session';
import { logAudit } from '@/lib/audit';

const BUCKET = 'blog-images';

// GET /api/media - Biblioteca de imagens já enviadas ao blog (mais recentes primeiro)
export async function GET(req: NextRequest) {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    const offset = Math.max(0, parseInt(new URL(req.url).searchParams.get('offset') || '0', 10) || 0);
    const objects = await listObjects(BUCKET, { limit: 60, offset });
    const files = objects.map((f) => ({ ...f, url: publicUrl(BUCKET, f.name) }));

    return NextResponse.json({ success: true, files, hasMore: objects.length === 60 });
  } catch (error) {
    console.error('[API Media GET Error]:', error);
    return NextResponse.json({ error: 'Erro ao carregar a biblioteca de imagens' }, { status: 500 });
  }
}

// DELETE /api/media?name= - Remover imagem da biblioteca
export async function DELETE(req: NextRequest) {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    const name = new URL(req.url).searchParams.get('name');
    if (!name || name.includes('/') || name.includes('..')) {
      return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 });
    }
    await removeObjects(BUCKET, [name]);
    await logAudit({ actor: actorOf(auth), action: 'DELETE', entity: 'media', entityId: name, summary: `Imagem "${name}" excluída da biblioteca` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Media DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir imagem' }, { status: 500 });
  }
}
