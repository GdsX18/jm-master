import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { requirePermission } from '@/lib/session';
import { CUSTOMER_DOCS_BUCKET, MAX_DOCUMENT_SIZE, ensureCustomerDocsBucket } from '@/lib/customers';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
];

// POST /api/customers/[id]/documents - Anexar arquivo ao cliente
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!customer) return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: 'Selecione um arquivo' }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json({ message: 'O arquivo deve ter no máximo 10 MB' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ message: 'Tipo de arquivo não permitido (use PDF, imagem, Word, Excel, CSV, TXT ou ZIP)' }, { status: 400 });
    }

    const displayName = String(form.get('name') || file.name).trim().slice(0, 200) || file.name;
    const safeName = file.name.normalize('NFD').replace(/[^\w.-]/g, '_').slice(-120);
    const storagePath = `${id}/${Date.now()}-${safeName}`;

    await ensureCustomerDocsBucket();
    const { error } = await supabaseAdmin.storage
      .from(CUSTOMER_DOCS_BUCKET)
      .upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (error) {
      console.error('[Customer Document Upload Error]:', error);
      return NextResponse.json({ message: 'Falha ao enviar o arquivo para o armazenamento' }, { status: 500 });
    }

    const document = await prisma.customerDocument.create({
      data: {
        customerId: id,
        name: displayName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        storagePath,
        userEmail: auth.email,
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('[API Customer Documents POST Error]:', error);
    return NextResponse.json({ message: 'Erro ao anexar documento' }, { status: 500 });
  }
}
