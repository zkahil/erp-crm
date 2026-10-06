import { requireCtx } from "@/lib/auth/session";
import { listCustomers, PAGE_SIZE } from "@/services/crm/customer.service";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBox } from "@/components/ui/search-box";
import { Empty, TableShell, Td, Th, Tr } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { fmtDate, initials, mad } from "@/lib/format";
import { NewCustomer } from "./new-customer";

export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; new?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireCtx("customer.read");
  const page = Math.max(1, Number(sp.page) || 1);
  const { items, total } = await listCustomers(ctx, page, sp.q);

  return (
    <>
      <PageHeader title="Clients" description="Vos clients, leurs coordonnées et leur chiffre d’affaires facturé." actions={<NewCustomer defaultOpen={sp.new === "1"} />} />
      <div className="mb-4"><SearchBox q={sp.q} placeholder="Nom, e-mail ou ville" /></div>
      <TableShell>
        {items.length === 0 ? (
          <Empty title={sp.q ? "Aucun client ne correspond" : "Aucun client pour l’instant"} hint={sp.q ? "Essayez un autre nom ou une autre ville." : "Ajoutez votre premier client pour pouvoir lui faire un devis."} />
        ) : (
          <table className="w-full text-sm">
            <thead><tr><Th>Client</Th><Th>Ville</Th><Th>Contact</Th><Th right>Facturé</Th><Th>Ajouté le</Th></tr></thead>
            <tbody>
              {items.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-xs font-semibold text-brand">{initials(c.name)}</span>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </Td>
                  <Td muted>{c.city ?? "–"}</Td>
                  <Td muted>{c.email ?? c.phone ?? "–"}</Td>
                  <Td right>{c.billed ? mad(c.billed) : <span className="text-muted">–</span>}</Td>
                  <Td muted>{fmtDate(c.createdAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </table>
        )}
      </TableShell>
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/clients" q={sp.q} />
    </>
  );
}
