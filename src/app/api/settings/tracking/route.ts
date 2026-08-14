import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.siteSetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.siteSetting.create({
        data: {
          id: 'default',
          gtmId: '',
          gaId: '',
          metaPixelId: '',
          tiktokPixelId: '',
          customHeaderScript: '',
          customBodyScript: '',
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('[Tracking Settings GET Error]:', error);
    return NextResponse.json(
      {
        success: false,
        settings: {
          id: 'default',
          gtmId: '',
          gaId: '',
          metaPixelId: '',
          tiktokPixelId: '',
          customHeaderScript: '',
          customBodyScript: '',
        },
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      gtmId,
      gaId,
      metaPixelId,
      tiktokPixelId,
      customHeaderScript,
      customBodyScript,
    } = body;

    const settings = await prisma.siteSetting.upsert({
      where: { id: 'default' },
      update: {
        gtmId: (gtmId || '').trim(),
        gaId: (gaId || '').trim(),
        metaPixelId: (metaPixelId || '').trim(),
        tiktokPixelId: (tiktokPixelId || '').trim(),
        customHeaderScript: customHeaderScript || '',
        customBodyScript: customBodyScript || '',
      },
      create: {
        id: 'default',
        gtmId: (gtmId || '').trim(),
        gaId: (gaId || '').trim(),
        metaPixelId: (metaPixelId || '').trim(),
        tiktokPixelId: (tiktokPixelId || '').trim(),
        customHeaderScript: customHeaderScript || '',
        customBodyScript: customBodyScript || '',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configurações de pixels e tags atualizadas com sucesso!',
      settings,
    });
  } catch (error: any) {
    console.error('[Tracking Settings POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}
