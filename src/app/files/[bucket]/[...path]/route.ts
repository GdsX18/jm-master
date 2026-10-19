import { NextRequest, NextResponse } from 'next/server';
import { PUBLIC_BUCKETS, STORAGE_DRIVER, isSafeObjectPath, readLocalObject, verifySignedRequest } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// GET /files/[bucket]/[...path] — entrega arquivos do driver local (STORAGE_DRIVER=local).
// Buckets públicos abrem direto; os privados exigem o link assinado gerado por signedDownloadUrl().
export async function GET(req: NextRequest, { params }: { params: Promise<{ bucket: string; path: string[] }> }) {
  if (STORAGE_DRIVER !== 'local') return new NextResponse(null, { status: 404 });

  const { bucket, path } = await params;
  // Nomes válidos só têm [\w.-], então não há o que decodificar
  const objectPath = path.join('/');
  if (!isSafeObjectPath(objectPath)) return new NextResponse(null, { status: 404 });

  const isPublic = PUBLIC_BUCKETS.includes(bucket);
  const query = req.nextUrl.searchParams;
  if (!isPublic && !verifySignedRequest(bucket, objectPath, query)) {
    return NextResponse.json({ message: 'Link expirado ou inválido' }, { status: 403 });
  }

  try {
    const { bytes, contentType } = await readLocalObject(bucket, objectPath);
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': String(bytes.length),
      'X-Content-Type-Options': 'nosniff',
      // Nomes levam timestamp e nunca são sobrescritos: dá para cachear para sempre
      'Cache-Control': isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store',
    };
    const download = query.get('download');
    if (!isPublic && download) {
      headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(download)}`;
    }
    return new NextResponse(new Uint8Array(bytes), { headers });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
