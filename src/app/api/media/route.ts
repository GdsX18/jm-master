import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { actorOf, requirePermission } from '@/lib/session';
import { logAudit } from '@/lib/audit';

const BUCKET = 'blog-images';

// GET /api/media - Biblioteca de imagens já enviadas ao blog (mais recentes primeiro)
export async function GET(req: NextRequest) {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    const offset = Math.max(0, parseInt(new URL(req.url).searchParams.get('offset') || '0', 10) || 0);
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list('', {
      limit: 60,
      offset,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) throw new Error(error.message);

    const files = (data || [])
      .filter((f) => f.id && f.name !== '.emptyFolderPlaceholder')
      .map((f) => ({
        name: f.name,
        url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(f.name).data.publicUrl,
        size: (f.metadata as { size?: number } | null)?.size || 0,
        createdAt: f.created_at,
      }));

    return NextResponse.json({ success: true, files, hasMore: (data || []).length === 60 });
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
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([name]);
    if (error) throw new Error(error.message);
    await logAudit({ actor: actorOf(auth), action: 'DELETE', entity: 'media', entityId: name, summary: `Imagem "${name}" excluída da biblioteca` });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Media DELETE Error]:', error);
    return NextResponse.json({ error: 'Erro ao excluir imagem' }, { status: 500 });
  }
}
