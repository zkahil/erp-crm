import { requireCtx } from "@/lib/auth/session";
import { getFormData } from "@/services/sales/form-data";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentForm } from "@/components/ui/document-form";
import { createQuoteAction } from "../actions";

export default async function Page() {
  const ctx = await requireCtx("quote.create");
  const { customers, products } = await getFormData(ctx);
  return (
    <>
      <PageHeader title="Nouveau devis" description="Chiffrez une affaire : prix, TVA et stock disponible se remplissent depuis le catalogue." />
      <DocumentForm kind="quote" today={new Date().toISOString().slice(0, 10)} customers={customers} products={products} action={createQuoteAction} />
    </>
  );
}