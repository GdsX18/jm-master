import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
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

    const { data, error } = await supabaseAdmin.storage
      .from(CUSTOMER_DOCS_BUCKET)
      .createSignedUrl(document.storagePath, 60, { download: document.originalName });
    if (error || !data?.signedUrl) {
      return NextResponse.json({ message: 'Arquivo indisponível no armazenamento' }, { status: 404 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error('[API Customer Document Download Error]:', error);
    return NextResponse.json({ message: 'Erro ao baixar documento' }, { status: 500 });
  }
}
