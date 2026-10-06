"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Dialog } from "@/components/ui/dialog";
import { Empty, TableShell, Td, Th, Tr } from "@/components/ui/table";
import { mad } from "@/lib/format";
import { QUOTE_STATUS } from "@/lib/status";
import { toast } from "@/lib/toast";
import { convertQuoteAction, convertQuotesAction } from "../../devis/actions";

type Row = { id: string; number: string; customer: string; date: string; validUntil: string; totalLabel: string; total: number; status: string };

export function ToInvoiceTable({ rows, canIssue }: { rows: Row[]; canIssue: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (rows.length === 0) {
    return (
      <TableShell>
        <Empty title="Aucun devis à facturer" hint="Les devis envoyés ou acceptés qui n’ont pas encore de facture apparaîtront ici." />
      </TableShell>
    );
  }

  const allChecked = selected.size === rows.length;
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const sum = rows.filter((r) => selected.has(r.id)).reduce((s, r) => s + r.total, 0);
  const close = () => { setOpen(false); setError(null); };

  const run = () =>
    start(async () => {
      const r = await convertQuotesAction([...selected], issue);
      if (!r.ok) { setError(r.error); return; }
      toast(`${r.created} facture${r.created > 1 ? "s" : ""} ${issue ? "émise" : "créée"}${r.created > 1 ? "s" : ""}${r.failed ? `, ${r.failed} en échec` : ""}`, r.failed ? "bad" : "ok");
      setSelected(new Set());
      close();
      router.refresh();
    });

  return (
    <>
      <TableShell>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>
                <input type="checkbox" aria-label="Tout sélectionner" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))} />
              </Th>
              <Th>Devis</Th><Th>Client</Th><Th>Date</Th><Th>Valable jusqu’au</Th><Th right>Total TTC</Th><Th>Statut</Th><Th right>Action</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const s = QUOTE_STATUS[r.status]!;
              return (
                <Tr key={r.id}>
                  <Td><input type="checkbox" aria-label={`Sélectionner ${r.number}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></Td>
                  <Td className="font-medium">{r.number}</Td>
                  <Td>{r.customer}</Td>
                  <Td muted>{r.date}</Td>
                  <Td muted>{r.validUntil}</Td>
                  <Td right>{r.totalLabel}</Td>
                  <Td><Badge tone={s.tone}>{s.label}</Badge></Td>
                  <Td right>
                    <div className="flex justify-end gap-2">
                      <Link href={`/devis/${r.id}/modifier`} className="inline-flex h-8 items-center rounded-lg border border-line bg-surface px-2.5 text-sm hover:bg-sunken">Modifier</Link>
                      <ConfirmAction
                        label="Facturer"
                        title="Créer la facture ?"
                        description={`Le devis ${r.number} sera marqué comme accepté, une commande et une facture brouillon seront créées avec les mêmes lignes.`}
                        confirmLabel="Créer la facture"
                        success="Facture créée"
                        action={() => convertQuoteAction(r.id)}
                      />
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>

      {selected.size > 0 && (
        <div className="sticky bottom-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3 pl-5 shadow-lg">
          <p className="text-sm"><span className="font-medium">{selected.size} devis sélectionné{selected.size > 1 ? "s" : ""}</span> <span className="text-muted">pour {mad(sum)} TTC</span></p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelected(new Set())}>Tout désélectionner</Button>
            <Button onClick={() => setOpen(true)}>Créer les factures</Button>
          </div>
        </div>
      )}

      <Dialog open={open} onClose={close} title={`Facturer ${selected.size} devis ?`}>
        <p className="text-sm text-muted">Pour chaque devis, une commande et une facture avec les mêmes lignes seront créées, et le devis sera marqué comme accepté.</p>
        {canIssue && (
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5" checked={issue} onChange={(e) => setIssue(e.target.checked)} />
            <span>Émettre les factures tout de suite<span className="block text-xs text-muted">Sinon elles restent en brouillon et vous pourrez les vérifier avant.</span></span>
          </label>
        )}
        {error && <p role="alert" className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={close}>Annuler</Button>
          <Button disabled={pending} onClick={run}>Créer les factures</Button>
        </div>
      </Dialog>
    </>
  );
}