import prisma from './prisma';
import { actorOf } from './session';
import { formatDateTimeBr } from './dates';
import { logAudit } from './audit';

type LeadRow = NonNullable<Awaited<ReturnType<typeof prisma.lead.findUnique>>>;

// Converte lead em cliente — usado na conversão manual e no aceite de proposta.
// Também usado no aceite de proposta de um lead
export async function convertLead(
  lead: LeadRow,
  existingCustomerId: string | null,
  auth: { id: string; name: string; email: string; role: string }
): Promise<{ customerId: string; customerName: string } | { error: string }> {
  let customerId: string;
  let customerName: string;

  if (existingCustomerId) {
    const existing = await prisma.customer.findUnique({ where: { id: existingCustomerId }, select: { id: true, name: true } });
    if (!existing) return { error: 'Cliente selecionado não existe' };
    customerId = existing.id;
    customerName = existing.name;
  } else {
    const name = lead.company || lead.name;
    const created = await prisma.customer.create({
      data: {
        name,
        company: name,
        email: lead.email,
        phone: lead.phone,
        status: 'ATIVO',
        data: { contacts: [{ name: lead.name, phone: lead.phone || '', email: lead.email || '', role: '' }] },
      },
      select: { id: true, name: true },
    });
    customerId = created.id;
    customerName = created.name;
    await logAudit({
      actor: actorOf(auth),
      action: 'CREATE',
      entity: 'customer',
      entityId: created.id,
      summary: `Cliente "${created.name}" criado a partir do lead "${lead.name}"`,
    });
  }

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: lead.id },
      data: { customerId, ...(lead.stage !== 'GANHO' ? { stage: 'GANHO', stageChangedAt: new Date() } : {}) },
    }),
    // O histórico do lead passa a aparecer também na linha do tempo do cliente
    prisma.crmInteraction.updateMany({ where: { leadId: lead.id, customerId: null }, data: { customerId } }),
    prisma.proposal.updateMany({ where: { leadId: lead.id, customerId: null }, data: { customerId } }),
    prisma.crmInteraction.create({
      data: {
        operator: `${auth.name} (${auth.role})`,
        leadId: lead.id,
        customerId,
        customerName,
        title: 'Lead convertido em cliente',
        description: `O lead "${lead.name}" virou o cliente "${customerName}".`,
        date: formatDateTimeBr(),
        type: 'COMERCIAL',
      },
    }),
  ]);

  await logAudit({
    actor: actorOf(auth),
    action: 'CONVERT',
    entity: 'lead',
    entityId: lead.id,
    summary: `Lead "${lead.name}" convertido no cliente "${customerName}"`,
  });

  return { customerId, customerName };
}
