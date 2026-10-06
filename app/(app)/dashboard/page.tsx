import Link from "next/link";
import { requireCtx } from "@/lib/auth/session";
import { getDashboard } from "@/services/dashboard/dashboard.service";
import { PageHeader } from "@/components/ui/page-header";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { Badge } from "@/components/ui/badge";
import { daysBetween, fmtDate, mad } from "@/lib/format";
import { OPPORTUNITY_STATUS } from "@/lib/status";

export default async function Dashboard() {
  const ctx = await requireCtx("customer.read");
  const d = await getDashboard(ctx);
  const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const pipelineTotal = d.pipeline.reduce((s, p) => s + p.amount, 0) || 1;
  const order = ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION"];
  const pipeline = [...d.pipeline].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const shade = ["bg-brand/25", "bg-brand/45", "bg-brand/70", "bg-brand"];

  return (
    <>
      <PageHeader title="Tableau de bord" description={today.charAt(0).toUpperCase() + today.slice(1)} />

      <section className="grid grid-cols-2 divide-x divide-line overflow-hidden rounded-2xl border border-line bg-surface lg:grid-cols-4">
        <Metric label="Facturé ce mois" value={mad(d.month.current)} note={d.month.delta === null ? "Pas de mois précédent" : `${d.month.delta >= 0 ? "+" : ""}${Math.round(d.month.delta * 100)} % vs mois dernier`}>
          <Sparkline values={d.revenue.map((r) => r.total)} />
        </Metric>
        <Metric label="À encaisser" value={mad(d.receivable)} note={d.late.length ? `dont ${mad(d.lateTotal)} en retard` : "Aucun retard"} tone={d.late.length ? "bad" : undefined} />
        <Metric label="Devis envoyés" value={String(d.openQuotes.count)} note={`${mad(d.openQuotes.total)} en attente de réponse`} />
        <Metric label="Stock bas" value={String(d.lowStockCount)} note={d.lowStockCount ? "produits à réapprovisionner" : "Tout est couvert"} tone={d.lowStockCount ? "warn" : undefined} />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-display text-base font-semibold">Facturation des 6 derniers mois</h2>
            <p className="mb-2 text-sm text-muted">Factures émises, TVA comprise</p>
            <RevenueChart data={d.revenue} />
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-base font-semibold">Pipeline commercial</h2>
              <Link href="/opportunites" className="text-sm text-brand hover:underline">Voir les opportunités</Link>
            </div>
            {pipeline.length === 0 ? (
              <p className="text-sm text-muted">Aucune opportunité en cours. Créez-en une depuis la fiche d’un client.</p>
            ) : (
              <>
                <div className="flex h-3 overflow-hidden rounded-full bg-sunken" role="img" aria-label="Répartition du pipeline par étape">
                  {pipeline.map((p, i) => (
                    <div key={p.status} className={shade[order.indexOf(p.status)] ?? shade[i]} style={{ width: `${(p.amount / pipelineTotal) * 100}%` }} />
                  ))}
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                  {pipeline.map((p) => (
                    <li key={p.status}>
                      <p className="text-muted">{OPPORTUNITY_STATUS[p.status]?.label}</p>
                      <p className="font-medium tabular-nums">{mad(p.amount)}</p>
                      <p className="text-xs text-muted">{p.count} opportunité{p.count > 1 ? "s" : ""}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-surface">
            <h2 className="px-5 pt-5 font-display text-base font-semibold">À relancer</h2>
            {d.late.length === 0 ? (
              <p className="px-5 pb-5 pt-2 text-sm text-muted">Aucune facture en retard.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {d.late.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.customer}</p>
                      <p className="text-xs text-muted">{i.number}, échue depuis {daysBetween(new Date(), i.dueDate)} j</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-bad">{mad(i.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-surface">
            <h2 className="px-5 pt-5 font-display text-base font-semibold">Stock à surveiller</h2>
            {d.lowStock.length === 0 ? (
              <p className="px-5 pb-5 pt-2 text-sm text-muted">Tous les produits sont au-dessus de leur seuil.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {d.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted">{p.sku}, seuil {p.min}</p>
                    </div>
                    <Badge tone={p.qty <= 0 ? "bad" : "warn"}>{p.qty <= 0 ? "Rupture" : `${p.qty} en stock`}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-surface">
            <h2 className="px-5 pt-5 font-display text-base font-semibold">Derniers encaissements</h2>
            {d.payments.length === 0 ? (
              <p className="px-5 pb-5 pt-2 text-sm text-muted">Aucun paiement enregistré.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {d.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.customer}</p>
                      <p className="text-xs text-muted">{p.number}, {fmtDate(p.paidAt)}</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-ok">+{mad(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, note, tone, children }: { label: string; value: string; note: string; tone?: "bad" | "warn"; children?: React.ReactNode }) {
  return (
    <div className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="font-display text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {children}
      </div>
      <p className={tone === "bad" ? "mt-1 text-xs text-bad" : tone === "warn" ? "mt-1 text-xs text-warn" : "mt-1 text-xs text-muted"}>{note}</p>
    </div>
  );
}
