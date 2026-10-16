import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { actorOf, requirePermission } from '@/lib/session';
import { PROPOSAL_INCLUDE, isProposalStatus, mapProposal } from '@/lib/proposals';
import { convertLead } from '@/lib/lead-convert';
import { createInvoiceWithNumber, firstBillingPeriod, readBilling } from '@/lib/billing';
import { brazilToday, formatDateTimeBr } from '@/lib/dates';
import { formatBRL, round2, toNumber } from '@/lib/money';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

const OPEN_LEAD_STAGES_BEFORE_PROPOSAL = ['NOVO', 'CONTATO', 'QUALIFICADO'];

// Vencimento da cobrança única: próximo "dueDay" a pelo menos 5 dias de hoje
function oneTimeDueDate(dueDay: number): Date {
  const today = new Date(`${brazilToday()}T12:00:00.000Z`);
  const candidate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), dueDay, 12));
  if (candidate.getTime() - today.getTime() < 5 * 86_400_000) candidate.setUTCMonth(candidate.getUTCMonth() + 1);
  return candidate;
}

// POST /api/proposals/[id]/status { status: 'ENVIADA' | 'ACEITA' | 'RECUSADA' | 'RASCUNHO', reason? }
// Aceite: converte o lead em cliente (se preciso), ativa/soma a cobrança recorrente
// e gera a fatura dos itens de cobrança única. A parte financeira exige a permissão "Financeiro".
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requirePermission('manageCrm');
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { status, reason } = await req.json();
    if (!isProposalStatus(status)) return NextResponse.json({ error: 'Status inválido' }, { status: 400 });

    const proposal = await prisma.proposal.findUnique({ where: { id }, include: { lead: true, items: true } });
    if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    if (proposal.status === 'ACEITA') {
      return NextResponse.json({ error: 'Esta proposta já foi aceita e gerou cobrança.' }, { status: 409 });
    }
    if (proposal.status === status) return NextResponse.json({ error: 'A proposta já está neste status' }, { status: 400 });

    const operator = `${auth.name} (${auth.role})`;
    const warnings: string[] = [];
    let customerId = proposal.customerId || proposal.lead?.customerId || null;
    let customerName = proposal.lead ? proposal.lead.company || proposal.lead.name : null;

    if (status === 'ENVIADA') {
      await prisma.proposal.update({ where: { id }, data: { status, sentAt: new Date() } });
      if (proposal.lead && OPEN_LEAD_STAGES_BEFORE_PROPOSAL.includes(proposal.lead.stage)) {
        await prisma.lead.update({ where: { id: proposal.lead.id }, data: { stage: 'PROPOSTA', stageChangedAt: new Date() } });
      }
    } else if (status === 'RECUSADA') {
      await prisma.proposal.update({ where: { id }, data: { status, rejectedAt: new Date() } });
    } else if (status === 'RASCUNHO') {
      await prisma.proposal.update({ where: { id }, data: { status, sentAt: null, rejectedAt: null } });
    } else {
      // ACEITA
      if (!customerId && proposal.lead) {
        const converted = await convertLead(proposal.lead, null, auth);
        if ('error' in converted) return NextResponse.json({ error: converted.error }, { status: 400 });
        customerId = converted.customerId;
        customerName = converted.customerName;
      } else if (proposal.lead && proposal.lead.stage !== 'GANHO') {
        await prisma.lead.update({ where: { id: proposal.lead.id }, data: { stage: 'GANHO', stageChangedAt: new Date() } });
      }
      if (!customerId) return NextResponse.json({ error: 'Vincule a proposta a um cliente antes de aceitar' }, { status: 400 });

      const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId }, select: { name: true, data: true } });
      customerName = customer.name;
      await prisma.proposal.update({ where: { id }, data: { status, acceptedAt: new Date(), customerId } });

      const recurringTotal = toNumber(proposal.recurringTotal);
      const oneTimeTotal = toNumber(proposal.oneTimeTotal);

      if (auth.permissions.manageFinance) {
        if (recurringTotal > 0) {
          const current = readBilling(customer.data);
          const amount = current.enabled ? round2(current.amount + recurringTotal) : recurringTotal;
          const billing = {
            ...current,
            enabled: true,
            amount,
            dueDay: current.enabled ? current.dueDay : proposal.dueDay,
            description: current.enabled ? current.description : proposal.title,
            startPeriod: current.enabled && current.startPeriod ? current.startPeriod : firstBillingPeriod(proposal.dueDay),
          };
          await prisma.customer.update({
            where: { id: customerId },
            data: { data: { ...((customer.data as object) || {}), billing } },
          });
          await logAudit({
            actor: actorOf(auth),
            action: 'UPDATE',
            entity: 'billing',
            entityId: customerId,
            summary: current.enabled
              ? `Mensalidade de ${customer.name}: ${formatBRL(current.amount)} → ${formatBRL(amount)} (proposta ${proposal.number})`
              : `Cobrança recorrente de ${customer.name} ativada: ${formatBRL(amount)}/mês (proposta ${proposal.number})`,
          });
        }
        if (oneTimeTotal > 0) {
          const invoice = await createInvoiceWithNumber({
            description: `${proposal.title} — itens de cobrança única (${proposal.number})`,
            amount: oneTimeTotal,
            type: 'RECEITA',
            category: 'Implantação',
            status: 'ABERTO',
            dueDate: oneTimeDueDate(proposal.dueDay),
            customerId,
            proposalId: id,
            metadata: { customer: customer.name, method: 'Boleto / Pix', createdBy: auth.email, proposal: proposal.number },
          });
          warnings.push(`Fatura ${invoice.invoiceNumber} de ${formatBRL(oneTimeTotal)} gerada.`);
        }
      } else if (recurringTotal > 0 || oneTimeTotal > 0) {
        warnings.push('Seu perfil não tem acesso ao Financeiro: a cobrança ficou pendente para um responsável ativar.');
        await prisma.crmInteraction.create({
          data: {
            operator,
            customerId,
            customerName,
            title: `Cobrança pendente — proposta ${proposal.number}`,
            description: `Proposta aceita: mensalidade ${formatBRL(recurringTotal)}${oneTimeTotal ? ` + ${formatBRL(oneTimeTotal)} único` : ''}. Ativar no Financeiro.`,
            date: formatDateTimeBr(),
            type: 'COBRANCA',
          },
        });
      }
    }

    const LABEL: Record<string, string> = { ENVIADA: 'enviada', ACEITA: 'aceita', RECUSADA: 'recusada', RASCUNHO: 'voltou para rascunho' };
    await prisma.crmInteraction.create({
      data: {
        operator,
        leadId: proposal.leadId,
        customerId,
        customerName,
        title: `Proposta ${proposal.number} ${LABEL[status]}`,
        description:
          status === 'RECUSADA' && typeof reason === 'string' && reason.trim()
            ? `Motivo: ${reason.trim().slice(0, 500)}`
            : `${proposal.title} — mensalidade ${formatBRL(proposal.recurringTotal)}${
                toNumber(proposal.oneTimeTotal) ? ` + ${formatBRL(proposal.oneTimeTotal)} único` : ''
              }`,
        date: formatDateTimeBr(),
        type: 'COMERCIAL',
      },
    });

    await logAudit({
      actor: actorOf(auth),
      action: 'STATUS',
      entity: 'proposal',
      entityId: id,
      summary: `Proposta ${proposal.number}: ${proposal.status} → ${status}`,
    });

    const full = await prisma.proposal.findUniqueOrThrow({ where: { id }, include: PROPOSAL_INCLUDE });
    return NextResponse.json({ success: true, proposal: mapProposal(full), warnings });
  } catch (error) {
    console.error('[API Proposal Status Error]:', error);
    return NextResponse.json({ error: 'Erro ao alterar o status da proposta' }, { status: 500 });
  }
}
