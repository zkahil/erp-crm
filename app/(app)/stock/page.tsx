import clsx from "clsx";
import { db } from "@/lib/db";
import { requireCtx } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { Empty, TableShell, Td, Th, Tr } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { fmtDateTime } from "@/lib/format";
import { MOVEMENT_TYPE } from "@/lib/status";

const SIZE = 15;

export default async function Mouvements({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireCtx("stock.read");
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { organizationId: ctx.organizationId };
  const [items, total] = await Promise.all([
    db.stockMovement.findMany({
      where,
      include: { product: { select: { name: true, sku: true } }, warehouse: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * SIZE,
      take: SIZE,
    }),
    db.stockMovement.count({ where }),
  ]);

  return (
    <>
      <PageHeader title="Mouvements de stock" description="Chaque entrée et chaque sortie. Le stock affiché ailleurs en est la somme." />
      <TableShell>
        {items.length === 0 ? (
          <Empty title="Aucun mouvement" hint="Les achats, ventes et ajustements apparaîtront ici." />
        ) : (
          <table className="w-full text-sm">
            <thead><tr><Th>Date</Th><Th>Produit</Th><Th>Entrepôt</Th><Th>Type</Th><Th right>Quantité</Th><Th>Référence</Th></tr></thead>
            <tbody>
              {items.map((m) => (
                <Tr key={m.id}>
                  <Td muted>{fmtDateTime(m.createdAt)}</Td>
                  <Td><span className="font-medium">{m.product.name}</span> <span className="text-muted">{m.product.sku}</span></Td>
                  <Td muted>{m.warehouse.name}</Td>
                  <Td>{MOVEMENT_TYPE[m.type]}</Td>
                  <Td right className={clsx("font-medium", m.quantity > 0 ? "text-ok" : "text-bad")}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</Td>
                  <Td muted>{m.reference ?? "–"}</Td>
                </Tr>
              ))}
            </tbody>
          </table>
        )}
      </TableShell>
      <Pagination page={page} total={total} pageSize={SIZE} basePath="/stock" />
    </>
  );
}
