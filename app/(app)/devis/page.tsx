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
import { QUOTE_STATUS } from "@/lib/status";
import { convertQuoteAction } from "./actions";

const SIZE = 12;

export default async function Devis({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireCtx("quote.read");
  const page = Math.max(1, Number(sp.page) || 1);
  const where = {
    organizationId: ctx.organizationId,
    ...(sp.q ? { OR: [{ number: { contains: sp.q, mode: "insensitive" as const } }, { customer: { name: { contains: sp.q, mode: "insensitive" as const } } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.quote.findMany({
      where,
      include: { customer: { select: { name: true } }, _count: { select: { orders: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * SIZE,
      take: SIZE,
    }),
    db.quote.count({ where }),
  ]);
  const canCreate = can(ctx.role, "quote.create");
  const canInvoice = can(ctx.role, "invoice.create");
  const canEdit = can(ctx.role, "quote.update");

  return (
    <>
      <PageHeader
        title="Devis"
        description="Les propositions envoyées à vos clients et leur avancement."
        actions={canCreate && (
          <Link href="/devis/nouveau" className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-sm font-medium text-white hover:opacity-90">
            <Plus className="size-4" aria-hidden />Nouveau devis
          </Link>
        )}
      />
      <div className="mb-4"><SearchBox q={sp.q} placeholder="Numéro ou client" /></div>
      <TableShell>
        {items.length === 0 ? (
          <Empty title={sp.q ? "Aucun devis ne correspond" : "Aucun devis pour l’instant"} hint={sp.q ? "Essayez un autre numéro ou un autre client." : "Créez votre premier devis avec le bouton « Nouveau devis »."} />
        ) : (
          <table className="w-full text-sm">
            <thead><tr><Th>Numéro</Th><Th>Client</Th><Th>Date</Th><Th>Valable jusqu’au</Th><Th right>Total TTC</Th><Th>Statut</Th><Th right>Action</Th></tr></thead>
            <tbody>
              {items.map((q) => {
                const s = QUOTE_STATUS[q.status]!;
                const editable = canEdit && (q.status === "DRAFT" || q.status === "SENT") && q._count.orders === 0;
                const convertible = canInvoice && (q.status === "SENT" || q.status === "ACCEPTED") && q._count.orders === 0;
                return (
                  <Tr key={q.id}>
                    <Td className="font-medium">{q.number}</Td>
                    <Td>{q.customer.name}</Td>
                    <Td muted>{fmtDate(q.date)}</Td>
                    <Td muted>{fmtDate(q.validUntil)}</Td>
                    <Td right>{mad(Number(q.totalTTC))}</Td>
                    <Td><Badge tone={s.tone}>{s.label}</Badge></Td>
                    <Td right>
                      <div className="flex justify-end gap-2">
                        {editable && (
                          <Link href={`/devis/${q.id}/modifier`} className="inline-flex h-8 items-center rounded-lg border border-line bg-surface px-2.5 text-sm hover:bg-sunken">Modifier</Link>
                        )}
                        {convertible ? (
                          <ConfirmAction
                            label="Créer la facture"
                            title="Créer la facture ?"
                            description={`Le devis ${q.number} sera marqué comme accepté, une commande et une facture brouillon seront créées avec les mêmes lignes.`}
                            confirmLabel="Créer la facture"
                            success="Facture créée"
                            action={convertQuoteAction.bind(null, q.id)}
                            redirectTo="/factures"
                          />
                        ) : q._count.orders > 0 ? (
                          <span className="self-center text-xs text-muted">Facturé</span>
                        ) : null}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableShell>
      <Pagination page={page} total={total} pageSize={SIZE} basePath="/devis" q={sp.q} />
    </>
  );
}