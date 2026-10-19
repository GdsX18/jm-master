import { NextRequest, NextResponse } from 'next/server';
import { publicUrl, putObject } from '@/lib/storage';
import { actorOf, requirePermission } from '@/lib/session';
import { isRealImage } from '@/lib/files';
import { logAudit } from '@/lib/audit';

const ALLOWED_BUCKETS = ['blog-images'];
// Limite de 4MB (a Vercel aceita no máximo ~4,5MB por requisição)
const MAX_SIZE = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const auth = await requirePermission('manageBlog');
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const bucket = (formData.get('bucket') as string) || 'blog-images';

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Destino de upload inválido' }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'A imagem deve ter no máximo 4MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // O tipo vem dos bytes do arquivo, não do navegador. SVG fica de fora (pode carregar scripts).
    const realType = isRealImage(buffer);
    if (!realType) {
      return NextResponse.json(
        { error: 'Apenas imagens PNG, JPG, WebP, GIF ou AVIF são permitidas' },
        { status: 400 }
      );
    }

    const objectName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    try {
      await putObject(bucket, objectName, buffer, realType);
    } catch (error) {
      console.error('[API Upload Storage Error]:', error);
      return NextResponse.json({ error: 'Falha ao enviar imagem para o armazenamento' }, { status: 500 });
    }
    const url = publicUrl(bucket, objectName);

    await logAudit({
      actor: actorOf(auth),
      action: 'CREATE',
      entity: 'media',
      entityId: objectName,
      summary: `Imagem enviada à biblioteca do blog (${file.name})`,
    });

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
    });
  } catch (error) {
    console.error('[API Upload Error]:', error);
    return NextResponse.json({ error: 'Erro interno ao processar upload' }, { status: 500 });
  }
}
