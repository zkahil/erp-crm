"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { mad, madCents } from "@/lib/format";
import { documentSchema, type DocumentInput } from "@/lib/validation/document";
import { calculateInvoiceTotals } from "@/services/sales/invoice.service";

type Customer = { id: string; name: string; paymentTerms: number };
type Product = { id: string; name: string; sku: string; salePrice: number; vatRate: number; stock: number };
type Mode = "draft" | "final";

const field = "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm";
const emptyLine = { productId: "", description: "", quantity: 1, unitPrice: 0, discount: 0, vatRate: 20 };

const addDays = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export function DocumentForm({
  kind, customers, products, today, action, initial,
}: {
  kind: "quote" | "invoice";
  customers: Customer[];
  products: Product[];
  today: string;
  action: (input: DocumentInput, mode: Mode) => Promise<{ ok: true } | { ok: false; error: string }>;
  initial?: { status: string; values: DocumentInput };
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isQuote = kind === "quote";
  const isEdit = !!initial;
  const backTo = isQuote ? "/devis" : "/factures";

  const { register, control, handleSubmit, watch, setValue, getValues, setError, formState: { errors, isSubmitting } } = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: initial?.values ?? { customerId: "", date: today, dueDate: addDays(today, 30), notes: "", lines: [emptyLine] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  const lines = watch("lines");
  const totals = calculateInvoiceTotals(
    lines.map((l) => ({ quantity: Number(l.quantity) || 0, unitPrice: Number(l.unitPrice) || 0, discount: Number(l.discount) || 0, vatRate: Number(l.vatRate) || 0 })),
  );
  const lineTotal = (i: number) => {
    const l = lines[i];
    return l ? (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * (1 - (Number(l.discount) || 0) / 100) : 0;
  };

  const findProduct = (id?: string) => (id ? products.find((p) => p.id === id) : undefined);
  const askedElsewhere = (productId: string, except: number) =>
    getValues("lines").reduce((s, l, idx) => (idx !== except && l.productId === productId ? s + (Number(l.quantity) || 0) : s), 0);
  const askedTotal = (productId: string) =>
    lines.reduce((s, l) => (l.productId === productId ? s + (Number(l.quantity) || 0) : s), 0);

  // Limiteur : la quantité ne peut pas dépasser le stock disponible (en tenant compte des autres lignes du même produit).
  const clampQuantity = (i: number, typed?: number) => {
    const p = findProduct(getValues(`lines.${i}.productId`));
    if (!p) return;
    const allowed = Math.max(p.stock - askedElsewhere(p.id, i), 0);
    const value = typed ?? Number(getValues(`lines.${i}.quantity`));
    if (value > allowed) setValue(`lines.${i}.quantity`, allowed);
  };

  const checkStock = () => {
    let ok = true;
    const seen = new Map<string, number>();
    getValues("lines").forEach((l, i) => {
      const p = findProduct(l.productId);
      if (!p) return;
      const total = (seen.get(p.id) ?? 0) + Number(l.quantity);
      seen.set(p.id, total);
      if (total > p.stock) {
        ok = false;
        setError(`lines.${i}.quantity`, { type: "manual", message: p.stock <= 0 ? `« ${p.name} » est en rupture de stock` : `Maximum ${p.stock} en stock pour « ${p.name} »` });
      }
    });
    return ok;
  };

  const submit = (mode: Mode) =>
    handleSubmit(async (values) => {
      setServerError(null);
      if (!checkStock()) return;
      const res = await action(values, mode);
      if (!res.ok) { setServerError(res.error); return; }
      toast(isEdit ? "Modifications enregistrées" : isQuote ? (mode === "final" ? "Devis envoyé" : "Devis enregistré") : mode === "final" ? "Facture émise" : "Facture enregistrée");
      router.push(backTo);
      router.refresh();
    });

  const canFinalize = !isEdit || initial.status === "DRAFT";

  return (
    <form noValidate className="max-w-4xl space-y-5" onSubmit={(e) => e.preventDefault()}>
      <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-3">
        <label className="block text-sm sm:col-span-3">
          <span className="mb-1 block font-medium">Client</span>
          <select
            className={field}
            {...register("customerId", {
              onChange: (e) => {
                const c = customers.find((x) => x.id === e.target.value);
                if (c && !isEdit) setValue("dueDate", addDays(getValues("date"), c.paymentTerms));
              },
            })}
          >
            <option value="">Choisir un client</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.customerId && <span className="mt-1 block text-xs text-bad">{errors.customerId.message}</span>}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Date</span>
          <input type="date" className={field} {...register("date")} />
          {errors.date && <span className="mt-1 block text-xs text-bad">{errors.date.message}</span>}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{isQuote ? "Valable jusqu’au" : "Échéance de paiement"}</span>
          <input type="date" className={field} {...register("dueDate")} />
        </label>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-base font-semibold">Lignes</h2>
        <ul className="space-y-3">
          {fields.map((f, i) => {
            const p = findProduct(lines[i]?.productId);
            const asked = p ? askedTotal(p.id) : 0;
            return (
              <li key={f.id} className="rounded-xl border border-line bg-sunken p-3">
                <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
                  <select
                    aria-label="Produit du catalogue"
                    className={field}
                    {...register(`lines.${i}.productId`, {
                      onChange: (e) => {
                        const chosen = findProduct(e.target.value);
                        if (!chosen) return;
                        setValue(`lines.${i}.description`, chosen.name);
                        setValue(`lines.${i}.unitPrice`, chosen.salePrice);
                        setValue(`lines.${i}.vatRate`, chosen.vatRate);
                        clampQuantity(i);
                      },
                    })}
                  >
                    <option value="">Ligne libre</option>
                    {products.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.stock} en stock)</option>)}
                  </select>
                  <div>
                    <input aria-label="Description" placeholder="Description" className={field} {...register(`lines.${i}.description`)} />
                    {errors.lines?.[i]?.description && <span className="mt-1 block text-xs text-bad">{errors.lines[i]!.description!.message}</span>}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 items-end gap-3 sm:grid-cols-[repeat(4,minmax(0,1fr))_8rem_2.5rem]">
                  <label className="text-xs text-muted">Quantité
                    <input
                      type="number"
                      step="any"
                      min={0}
                      max={p ? Math.max(p.stock - askedElsewhere(p.id, i), 0) : undefined}
                      className={`${field} mt-1 text-ink`}
                      {...register(`lines.${i}.quantity`, { valueAsNumber: true, onChange: (e) => clampQuantity(i, Number(e.target.value)) })}
                    />
                  </label>
                  <label className="text-xs text-muted">Prix unitaire HT
                    <input type="number" step="any" className={`${field} mt-1 text-ink`} {...register(`lines.${i}.unitPrice`, { valueAsNumber: true })} />
                  </label>
                  <label className="text-xs text-muted">Remise %
                    <input type="number" step="any" className={`${field} mt-1 text-ink`} {...register(`lines.${i}.discount`, { valueAsNumber: true })} />
                  </label>
                  <label className="text-xs text-muted">TVA %
                    <input type="number" step="any" className={`${field} mt-1 text-ink`} {...register(`lines.${i}.vatRate`, { valueAsNumber: true })} />
                  </label>
                  <p className="pb-2 text-right text-sm font-medium tabular-nums">{mad(lineTotal(i))}</p>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={fields.length === 1}
                    aria-label="Supprimer la ligne"
                    className="grid size-10 place-items-center justify-self-end rounded-lg text-muted hover:bg-surface disabled:opacity-30"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {!p ? (
                    <span className="text-muted">Ligne libre, sans limite de quantité</span>
                  ) : p.stock <= 0 ? (
                    <Badge tone="bad">Rupture de stock</Badge>
                  ) : asked >= p.stock ? (
                    <Badge tone="warn">Limite atteinte : {p.stock} en stock</Badge>
                  ) : (
                    <Badge tone="ok">{p.stock} en stock, reste {p.stock - asked}</Badge>
                  )}
                  {errors.lines?.[i] && (errors.lines[i]!.quantity || errors.lines[i]!.unitPrice || errors.lines[i]!.discount || errors.lines[i]!.vatRate) && (
                    <span className="text-bad">
                      {(errors.lines[i]!.quantity ?? errors.lines[i]!.unitPrice ?? errors.lines[i]!.discount ?? errors.lines[i]!.vatRate)!.message}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {errors.lines?.message && <p className="mt-2 text-xs text-bad">{errors.lines.message}</p>}
        <Button type="button" variant="soft" className="mt-4" onClick={() => append(emptyLine)}>
          <Plus className="size-4" aria-hidden />Ajouter une ligne
        </Button>
      </section>

      <section className="grid gap-5 sm:grid-cols-[1fr_16rem]">
        <label className="block rounded-2xl border border-line bg-surface p-5 text-sm">
          <span className="mb-1 block font-medium">{isQuote ? "Conditions et notes" : "Notes"}</span>
          <textarea rows={4} className="w-full rounded-lg border border-line bg-surface p-3 text-sm" {...register("notes")} />
        </label>
        <dl className="space-y-2 rounded-2xl border border-line bg-surface p-5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Total HT</dt><dd className="tabular-nums">{madCents(totals.totalHT)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">TVA</dt><dd className="tabular-nums">{madCents(totals.totalVAT)}</dd></div>
          <div className="flex justify-between border-t border-line pt-3">
            <dt className="font-medium">Total TTC</dt>
            <dd className="font-display text-lg font-semibold tabular-nums">{madCents(totals.totalTTC)}</dd>
          </div>
        </dl>
      </section>

      {serverError && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{serverError}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        <Link href={backTo} className="inline-flex h-9 items-center rounded-lg px-3.5 text-sm hover:bg-sunken">Annuler</Link>
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={submit("draft")}>{isEdit ? "Enregistrer" : "Enregistrer le brouillon"}</Button>
        {canFinalize && (
          <Button type="button" disabled={isSubmitting} onClick={submit("final")}>{isQuote ? "Enregistrer et marquer envoyé" : "Émettre la facture"}</Button>
        )}
      </div>
    </form>
  );
}