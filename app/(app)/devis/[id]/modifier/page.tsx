import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCtx } from "@/lib/auth/session";
import { getFormData } from "@/services/sales/form-data";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentForm } from "@/components/ui/document-form";
import { updateQuoteAction } from "../../actions";

export default async function ModifierDevis({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireCtx("quote.update");
  const q = await db.quote.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: { lines: { orderBy: { id: "asc" } }, _count: { select: { orders: true } } },
  });
  if (!q) notFound();

  const editable = (q.status === "DRAFT" || q.status === "SENT") && q._count.orders === 0;
  if (!editable) {
    return <PageHeader title={`Devis ${q.number}`} description="Ce devis ne peut plus être modifié : il a été accepté, refusé, expiré ou facturé." />;
  }

  const { customers, products } = await getFormData(ctx);
  return (
    <>
      <PageHeader title={`Modifier le devis ${q.number}`} description="Les totaux sont recalculés à l’enregistrement." />
      <DocumentForm
        kind="quote"
        today={new Date().toISOString().slice(0, 10)}
        customers={customers}
        products={products}
        action={updateQuoteAction.bind(null, q.id)}
        initial={{
          status: q.status,
          values: {
            customerId: q.customerId,
            date: q.date.toISOString().slice(0, 10),
            dueDate: q.validUntil ? q.validUntil.toISOString().slice(0, 10) : "",
            notes: q.notes ?? "",
            lines: q.lines.map((l) => ({
              productId: l.productId ?? "",
              description: l.description,
              quantity: Number(l.quantity),
              unitPrice: Number(l.unitPrice),
              discount: Number(l.discount),
              vatRate: Number(l.vatRate),
            })),
          },
        }}
      />
    </>
  );
}