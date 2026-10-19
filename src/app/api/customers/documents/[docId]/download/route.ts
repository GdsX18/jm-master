import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signedDownloadUrl } from '@/lib/storage';
import { requirePermission } from '@/lib/session';
import { CUSTOMER_DOCS_BUCKET } from '@/lib/customers';

// GET /api/customers/documents/[docId]/download — link temporário (60s) para o arquivo privado
export async function GET(req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { docId } = await params;
    const document = await prisma.customerDocument.findUnique({ where: { id: docId } });
    if (!document) return NextResponse.json({ message: 'Documento não encontrado' }, { status: 404 });

    let signedUrl: string;
    try {
      signedUrl = await signedDownloadUrl(CUSTOMER_DOCS_BUCKET, document.storagePath, 60, document.originalName);
    } catch {
      return NextResponse.json({ message: 'Arquivo indisponível no armazenamento' }, { status: 404 });
    }

    // No driver local o link é relativo ("/files/..."): resolve contra o domínio da requisição
    return NextResponse.redirect(new URL(signedUrl, req.url));
  } catch (error) {
    console.error('[API Customer Document Download Error]:', error);
    return NextResponse.json({ message: 'Erro ao baixar documento' }, { status: 500 });
  }
}
