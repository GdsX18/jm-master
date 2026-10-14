import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToStorage } from '@/lib/supabase';

const ALLOWED_BUCKETS = ['blog-images'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'blog-images';

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Destino de upload inválido' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // SVG pode carregar scripts, por isso fica de fora
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return NextResponse.json(
        { error: 'Apenas arquivos de imagem são permitidos (PNG, JPG, WebP, etc.)' },
        { status: 400 }
      );
    }

    // Limite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'A imagem deve ter no máximo 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await uploadImageToStorage(
      buffer,
      file.name,
      file.type,
      bucket
    );

    if (!uploadResult.success || !uploadResult.url) {
      return NextResponse.json(
        { error: uploadResult.error || 'Falha ao enviar imagem para o Supabase Storage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      filename: file.name,
    });
  } catch (error: any) {
    console.error('[API Upload Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar upload' },
      { status: 500 }
    );
  }
}
