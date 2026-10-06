import { db } from "@/lib/db";
import { requireCtx } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { fmtDate, mad } from "@/lib/format";
import { ToInvoiceTable } from "./to-invoice-table";

export default async function DevisAFacturer() {
  const ctx = await requireCtx("invoice.create");
  const quotes = await db.quote.findMany({
    where: { organizationId: ctx.organizationId, status: { in: ["SENT", "ACCEPTED"] }, orders: { none: {} } },
    include: { customer: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title="Devis à facturer" description="Les devis validés qui n’ont pas encore de facture. Sélectionnez-en plusieurs pour les facturer d’un coup." />
      <ToInvoiceTable
        canIssue={can(ctx.role, "invoice.validate")}
        rows={quotes.map((q) => ({
          id: q.id,
          number: q.number,
          customer: q.customer.name,
          date: fmtDate(q.date),
          validUntil: fmtDate(q.validUntil),
          totalLabel: mad(Number(q.totalTTC)),
          total: Number(q.totalTTC),
          status: q.status,
        }))}
      />
    </>
  );
}