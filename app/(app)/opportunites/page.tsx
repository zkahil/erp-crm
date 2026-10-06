import { db } from "@/lib/db";
import { requireCtx } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { fmtDate, mad } from "@/lib/format";
import { OPPORTUNITY_STATUS } from "@/lib/status";
import { MoveSelect } from "./move-select";

const COLUMNS = ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;

export default async function Opportunites() {
  const ctx = await requireCtx("customer.read");
  const items = await db.opportunity.findMany({
    where: { organizationId: ctx.organizationId },
    include: { customer: { select: { name: true } } },
    orderBy: { amount: "desc" },
  });

  return (
    <>
      <PageHeader title="Opportunités" description="Suivez chaque affaire de la première prise de contact à la signature." />
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
        <div className="grid min-w-[1080px] grid-cols-6 gap-3">
          {COLUMNS.map((col) => {
            const list = items.filter((o) => o.status === col);
            const total = list.reduce((s, o) => s + Number(o.amount), 0);
            return (
              <section key={col} aria-label={OPPORTUNITY_STATUS[col]!.label} className="rounded-2xl bg-sunken p-2">
                <header className="px-2 pb-2 pt-1">
                  <p className="text-sm font-medium">{OPPORTUNITY_STATUS[col]!.label} <span className="font-normal text-muted">{list.length}</span></p>
                  <p className="text-xs tabular-nums text-muted">{mad(total)}</p>
                </header>
                <ul className="space-y-2">
                  {list.map((o) => (
                    <li key={o.id} className="rounded-xl border border-line bg-surface p-3">
                      <p className="text-sm font-medium leading-snug">{o.title || o.customer.name}</p>
                      <p className="text-xs text-muted">{o.customer.name}</p>
                      <p className="mt-2 font-display text-base font-semibold tabular-nums">{mad(Number(o.amount))}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken"><div className="h-full bg-brand" style={{ width: `${o.probability}%` }} /></div>
                        {o.probability} %
                      </div>
                      {o.expectedDate && <p className="mt-1.5 text-xs text-muted">Prévue le {fmtDate(o.expectedDate)}</p>}
                      <div className="mt-2.5"><MoveSelect id={o.id} status={o.status} /></div>
                    </li>
                  ))}
                  {list.length === 0 && <li className="px-2 py-6 text-center text-xs text-muted">Aucune opportunité</li>}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
