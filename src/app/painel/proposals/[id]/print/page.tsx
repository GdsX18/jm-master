'use client';

import { use, useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { CONTACT_EMAIL, SITE_NAME, WHATSAPP_DISPLAY } from '@/lib/site';
import { api } from '../../../lib/api';
import { formatBRL, formatDate } from '../../../lib/format';
import { proposalClientName, type Proposal } from '../../types';

// Versão para impressão / "Salvar como PDF" do navegador. Só o conteúdo de .print-root é impresso.
export default function ProposalPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ proposal: Proposal }>(`/api/proposals/${id}`)
      .then((d) => {
        setProposal(d.proposal);
        document.title = `${d.proposal.number} — ${d.proposal.title}`;
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="jm-page"><div className="jm-alert jm-alert-danger">{error}</div></div>;
  if (!proposal) return <div className="jm-page"><div className="jm-card jm-empty">Carregando...</div></div>;

  const recurring = proposal.items.filter((i) => i.recurring);
  const oneTime = proposal.items.filter((i) => !i.recurring);
  const recurringGross = recurring.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="jm-page">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-root, .print-root * { visibility: visible !important; }
          .print-root { position: absolute; inset: 0 auto auto 0; width: 100%; box-shadow: none !important; border: 0 !important; }
          .no-print { display: none !important; }
          @page { margin: 16mm; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between gap-3">
        <p className="text-sm text-jm-muted">Use &ldquo;Salvar como PDF&rdquo; na janela de impressão para gerar o arquivo.</p>
        <button onClick={() => window.print()} className="jm-btn jm-btn-primary">
          <Printer className="h-4 w-4" /> Imprimir / salvar PDF
        </button>
      </div>

      <article className="print-root mx-auto w-full max-w-[820px] rounded-[6px] border border-neutral-200 bg-white p-8 text-[13px] leading-relaxed text-neutral-800 shadow-sm sm:p-12">
        <header className="flex items-start justify-between gap-6 border-b-2 border-[#E85D26] pb-5">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/JM-Master-1.png" alt={SITE_NAME} className="h-10 w-auto" />
            <p className="mt-2 text-xs text-neutral-500">
              {CONTACT_EMAIL} · WhatsApp {WHATSAPP_DISPLAY}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#E85D26]">Proposta comercial</p>
            <p className="font-mono text-lg font-semibold text-[#082B61]">{proposal.number}</p>
            <p className="text-xs text-neutral-500">Emitida em {formatDate(proposal.createdAt)}</p>
            {proposal.validUntil && <p className="text-xs text-neutral-500">Válida até {formatDate(proposal.validUntil)}</p>}
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Para</p>
            <p className="text-base font-semibold text-neutral-900">{proposalClientName(proposal)}</p>
            {proposal.customer?.document && <p className="text-xs text-neutral-500">CPF/CNPJ {proposal.customer.document}</p>}
            {proposal.lead && !proposal.customer && proposal.lead.company && <p className="text-xs text-neutral-500">A/C {proposal.lead.name}</p>}
            {(proposal.customer?.email || proposal.lead?.email) && <p className="text-xs text-neutral-500">{proposal.customer?.email || proposal.lead?.email}</p>}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Assunto</p>
            <p className="text-base font-semibold text-neutral-900">{proposal.title}</p>
          </div>
        </section>

        {recurring.length > 0 && <ItemsTable title="Serviços mensais" items={recurring} />}
        {oneTime.length > 0 && <ItemsTable title="Cobrança única (implantação / setup)" items={oneTime} />}

        <section className="ml-auto mt-6 w-full max-w-xs space-y-1 rounded-[6px] bg-neutral-50 p-4">
          {proposal.discount > 0 && (
            <>
              <TotalRow label="Mensalidade" value={formatBRL(recurringGross)} />
              <TotalRow label="Desconto mensal" value={`− ${formatBRL(proposal.discount)}`} />
            </>
          )}
          <TotalRow label="Total mensal" value={formatBRL(proposal.recurringTotal)} strong />
          {proposal.oneTimeTotal > 0 && <TotalRow label="Total único" value={formatBRL(proposal.oneTimeTotal)} />}
          <p className="pt-1 text-[11px] text-neutral-500">Vencimento da mensalidade: todo dia {proposal.dueDay}.</p>
        </section>

        {proposal.notes && (
          <section className="mt-8">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">Condições e observações</h3>
            <p className="whitespace-pre-wrap text-neutral-700">{proposal.notes}</p>
          </section>
        )}

        <section className="mt-14 grid grid-cols-2 gap-10 text-center text-xs text-neutral-500">
          <div className="border-t border-neutral-300 pt-2">{SITE_NAME}</div>
          <div className="border-t border-neutral-300 pt-2">De acordo — {proposalClientName(proposal)}</div>
        </section>
      </article>
    </div>
  );
}

function ItemsTable({ title, items }: { title: string; items: Proposal['items'] }) {
  return (
    <section className="mt-8">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#082B61]">{title}</h3>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-300 text-[11px] uppercase text-neutral-500">
            <th className="py-1.5 font-semibold">Descrição</th>
            <th className="w-14 py-1.5 text-right font-semibold">Qtd.</th>
            <th className="w-28 py-1.5 text-right font-semibold">Unitário</th>
            <th className="w-28 py-1.5 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => (
            <tr key={idx} className="border-b border-neutral-100">
              <td className="py-2 pr-3">{i.description}</td>
              <td className="py-2 text-right tabular-nums">{i.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatBRL(i.unitPrice)}</td>
              <td className="py-2 text-right tabular-nums">{formatBRL(i.quantity * i.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'text-base font-semibold text-[#082B61]' : 'text-neutral-600'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
