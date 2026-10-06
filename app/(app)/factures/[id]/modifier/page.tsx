import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCtx } from "@/lib/auth/session";
import { getFormData } from "@/services/sales/form-data";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentForm } from "@/components/ui/document-form";
import { updateInvoiceAction } from "../../actions";

export default async function ModifierFacture({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireCtx("invoice.create");
  const inv = await db.invoice.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: { lines: { orderBy: { id: "asc" } } },
  });
  if (!inv) notFound();

  if (inv.status !== "DRAFT") {
    return <PageHeader title={`Facture ${inv.number}`} description="Une facture émise ne peut plus être modifiée, afin de rester traçable. Annulez-la et créez-en une nouvelle si nécessaire." />;
  }

  const { customers, products } = await getFormData(ctx);
  return (
    <>
      <PageHeader title={`Modifier la facture ${inv.number}`} description="Cette facture est un brouillon : vous pouvez encore la modifier avant de l’émettre." />
      <DocumentForm
        kind="invoice"
        today={new Date().toISOString().slice(0, 10)}
        customers={customers}
        products={products}
        action={updateInvoiceAction.bind(null, inv.id)}
        initial={{
          status: inv.status,
          values: {
            customerId: inv.customerId,
            date: inv.date.toISOString().slice(0, 10),
            dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : "",
            notes: inv.notes ?? "",
            lines: inv.lines.map((l) => ({
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