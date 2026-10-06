import { db } from "@/lib/db";
import { requireCtx } from "@/lib/auth/session";
import { stockByProduct } from "@/services/inventory/stock.service";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBox } from "@/components/ui/search-box";
import { Badge } from "@/components/ui/badge";
import { Empty, TableShell, Td, Th, Tr } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { mad } from "@/lib/format";

const SIZE = 12;

export default async function Produits({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireCtx("product.read");
  const page = Math.max(1, Number(sp.page) || 1);
  const where = {
    organizationId: ctx.organizationId,
    deletedAt: null,
    ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" as const } }, { sku: { contains: sp.q, mode: "insensitive" as const } }] } : {}),
  };
  const [items, total, stock] = await Promise.all([
    db.product.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * SIZE, take: SIZE }),
    db.product.count({ where }),
    stockByProduct(ctx),
  ]);

  return (
    <>
      <PageHeader title="Produits" description="Catalogue, prix et niveau de stock calculé à partir des mouvements." />
      <div className="mb-4"><SearchBox q={sp.q} placeholder="Nom ou référence" /></div>
      <TableShell>
        {items.length === 0 ? (
          <Empty title="Aucun produit trouvé" hint="Modifiez votre recherche ou ajoutez un produit au catalogue." />
        ) : (
          <table className="w-full text-sm">
            <thead><tr><Th>Produit</Th><Th>Référence</Th><Th right>Prix d’achat</Th><Th right>Prix de vente</Th><Th right>TVA</Th><Th right>Stock</Th><Th>État</Th></tr></thead>
            <tbody>
              {items.map((p) => {
                const qty = stock.get(p.id) ?? 0;
                const low = qty <= p.minStock;
                return (
                  <Tr key={p.id}>
                    <Td className="font-medium">{p.name}</Td>
                    <Td muted>{p.sku}</Td>
                    <Td right muted>{mad(Number(p.purchasePrice))}</Td>
                    <Td right>{mad(Number(p.salePrice))}</Td>
                    <Td right muted>{Number(p.vatRate)} %</Td>
                    <Td right>{qty} <span className="text-muted">{p.unit}</span></Td>
                    <Td>{qty <= 0 ? <Badge tone="bad">Rupture</Badge> : low ? <Badge tone="warn">Stock bas</Badge> : <Badge tone="ok">Disponible</Badge>}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableShell>
      <Pagination page={page} total={total} pageSize={SIZE} basePath="/produits" q={sp.q} />
    </>
  );
}
