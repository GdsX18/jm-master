import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ success: true, message: 'Status do grupo alternado' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Erro' }, { status: 500 });
  }
}
