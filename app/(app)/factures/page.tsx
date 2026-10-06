import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireCtx } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBox } from "@/components/ui/search-box";
import { Badge } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Empty, TableShell, Td, Th, Tr } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { fmtDate, mad } from "@/lib/format";
import { INVOICE_STATUS } from "@/lib/status";
import { issueInvoiceAction } from "./actions";

const SIZE = 12;

export default async function Factures({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireCtx("invoice.read");
  const page = Math.max(1, Number(sp.page) || 1);
  const where = {
    organizationId: ctx.organizationId,
    ...(sp.q ? { OR: [{ number: { contains: sp.q, mode: "insensitive" as const } }, { customer: { name: { contains: sp.q, mode: "insensitive" as const } } }] } : {}),
  };
  const [items, total, toInvoice] = await Promise.all([
    db.invoice.findMany({ where, include: { customer: { select: { name: true } } }, orderBy: { date: "desc" }, skip: (page - 1) * SIZE, take: SIZE }),
    db.invoice.count({ where }),
    db.quote.count({ where: { organizationId: ctx.organizationId, status: { in: ["SENT", "ACCEPTED"] }, orders: { none: {} } } }),
  ]);
  const now = new Date();
  const canCreate = can(ctx.role, "invoice.create");
  const canIssue = can(ctx.role, "invoice.validate");

  return (
    <>
      <PageHeader
        title="Factures"
        description="Ce qui est facturé, encaissé et ce qu’il reste à recevoir."
        actions={canCreate && (
          <>
            <Link href="/factures/a-facturer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 text-sm font-medium hover:bg-sunken">
              Devis à facturer
              {toInvoice > 0 && <span className="rounded-full bg-brand px-1.5 text-xs text-white">{toInvoice}</span>}
            </Link>
            <Link href="/factures/nouveau" className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-medium text-white hover:opacity-90">
              <Plus className="size-4" aria-hidden />Nouvelle facture
            </Link>
          </>
        )}
      />
      <div className="mb-4"><SearchBox q={sp.q} placeholder="Numéro ou client" /></div>
      <TableShell>
        {items.length === 0 ? (
          <Empty title={sp.q ? "Aucune facture ne correspond" : "Aucune facture pour l’instant"} hint={sp.q ? "Essayez un autre numéro ou un autre client." : "Créez une facture avec le bouton « Nouvelle facture » ou depuis un devis."} />
        ) : (
          <table className="w-full text-sm">
            <thead><tr><Th>Numéro</Th><Th>Client</Th><Th>Date</Th><Th>Échéance</Th><Th right>Total TTC</Th><Th right>Reste à payer</Th><Th>Statut</Th><Th right>Action</Th></tr></thead>
            <tbody>
              {items.map((i) => {
                const rest = Number(i.totalTTC) - Number(i.paidAmount);
                const open = i.status === "ISSUED" || i.status === "PARTIALLY_PAID" || i.status === "OVERDUE";
                const late = open && i.dueDate && i.dueDate < now;
                const s = late ? INVOICE_STATUS.OVERDUE! : INVOICE_STATUS[i.status]!;
                return (
                  <Tr key={i.id}>
                    <Td className="font-medium">{i.number}</Td>
                    <Td>{i.customer.name}</Td>
                    <Td muted>{fmtDate(i.date)}</Td>
                    <Td muted>{fmtDate(i.dueDate)}</Td>
                    <Td right>{mad(Number(i.totalTTC))}</Td>
                    <Td right>{open ? mad(rest) : <span className="text-muted">–</span>}</Td>
                    <Td><Badge tone={s.tone}>{s.label}</Badge></Td>
                    <Td right>
                      {i.status === "DRAFT" && (
                        <div className="flex justify-end gap-2">
                          {canCreate && (
                            <Link href={`/factures/${i.id}/modifier`} className="inline-flex h-8 items-center rounded-lg border border-line bg-surface px-2.5 text-sm hover:bg-sunken">Modifier</Link>
                          )}
                          {canIssue && (
                            <ConfirmAction
                              label="Émettre"
                              title="Émettre la facture ?"
                              description={`La facture ${i.number} passera au statut « Émise » et sera à encaisser avant le ${fmtDate(i.dueDate)}.`}
                              confirmLabel="Émettre la facture"
                              success="Facture émise"
                              action={issueInvoiceAction.bind(null, i.id)}
                            />
                          )}
                        </div>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableShell>
      <Pagination page={page} total={total} pageSize={SIZE} basePath="/factures" q={sp.q} />
    </>
  );
}