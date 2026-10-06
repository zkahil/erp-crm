import { requireCtx } from "@/lib/auth/session";
import { getFormData } from "@/services/sales/form-data";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentForm } from "@/components/ui/document-form";
import { createInvoiceAction } from "../actions";

export default async function Page() {
  const ctx = await requireCtx("invoice.create");
  const { customers, products } = await getFormData(ctx);
  return (
    <>
      <PageHeader title="Nouvelle facture" description="Facturez directement un client. Vous pouvez aussi facturer des devis validés depuis la page « Devis à facturer »." />
      <DocumentForm kind="invoice" today={new Date().toISOString().slice(0, 10)} customers={customers} products={products} action={createInvoiceAction} />
    </>
  );
}