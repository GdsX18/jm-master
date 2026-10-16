import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { SUPER_ADMIN_ROLE } from '@/lib/permissions';
import { diffFields, logAudit } from '@/lib/audit';

// IDs aceitos: letras, números, hífen e sublinhado (GTM-XXXX, G-XXXX, números do Pixel...)
const ID_PATTERN = /^[A-Za-z0-9_-]{0,40}$/;

const EMPTY = {
  gtmId: '',
  gaId: '',
  metaPixelId: '',
  tiktokPixelId: '',
  customHeaderScript: '',
  customBodyScript: '',
};

export async function GET() {
  const auth = await requirePermission(['structuralManagement', 'manageBlog']);
  if (auth instanceof NextResponse) return auth;

  try {
    const settings =
      (await prisma.siteSetting.findUnique({ where: { id: 'default' } })) ||
      (await prisma.siteSetting.create({ data: { id: 'default', ...EMPTY } }));

    return NextResponse.json({
      success: true,
      settings,
      // Scripts personalizados executam JavaScript no site inteiro: só o Super administrador edita
      canEditScripts: auth.role === SUPER_ADMIN_ROLE,
      canEdit: auth.permissions.structuralManagement,
    });
  } catch (error) {
    console.error('[Tracking Settings GET Error]:', error);
    // Erro real (não devolver campos vazios: o painel poderia salvar por cima das tags existentes)
    return NextResponse.json({ success: false, error: 'Erro ao carregar configurações de rastreamento' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requirePermission('structuralManagement');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const ids = {
      gtmId: String(body.gtmId || '').trim(),
      gaId: String(body.gaId || '').trim(),
      metaPixelId: String(body.metaPixelId || '').trim(),
      tiktokPixelId: String(body.tiktokPixelId || '').trim(),
    };
    for (const [key, value] of Object.entries(ids)) {
      if (!ID_PATTERN.test(value)) {
        return NextResponse.json({ success: false, error: `Identificador inválido em "${key}"` }, { status: 400 });
      }
    }

    const current = await prisma.siteSetting.findUnique({ where: { id: 'default' } });
    const isSuperAdmin = auth.role === SUPER_ADMIN_ROLE;

    const scripts = {
      customHeaderScript: isSuperAdmin ? String(body.customHeaderScript || '') : current?.customHeaderScript || '',
      customBodyScript: isSuperAdmin ? String(body.customBodyScript || '') : current?.customBodyScript || '',
    };
    const triedToChangeScripts =
      !isSuperAdmin &&
      ((body.customHeaderScript !== undefined && body.customHeaderScript !== (current?.customHeaderScript || '')) ||
        (body.customBodyScript !== undefined && body.customBodyScript !== (current?.customBodyScript || '')));
    if (triedToChangeScripts) {
      return NextResponse.json(
        { success: false, error: 'Apenas o Super administrador pode alterar os scripts personalizados' },
        { status: 403 }
      );
    }

    const data = { ...ids, ...scripts };
    const settings = await prisma.siteSetting.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    const changes = diffFields(current as unknown as Record<string, unknown>, data);
    if (Object.keys(changes).length > 0) {
      await logAudit({
        actor: actorOf(auth),
        action: 'UPDATE',
        entity: 'settings',
        entityId: 'tracking',
        summary: `Tags de rastreamento alteradas (${Object.keys(changes).join(', ')})`,
        changes,
      });
    }

    // As tags são renderizadas no layout raiz: invalida todas as páginas para refletir a mudança
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      message: 'Configurações de pixels e tags atualizadas com sucesso!',
      settings,
    });
  } catch (error) {
    console.error('[Tracking Settings POST Error]:', error);
    return NextResponse.json({ success: false, error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
