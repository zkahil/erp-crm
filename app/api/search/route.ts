import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCtx } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const ctx = await requireCtx("customer.read");
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json([]);
    const contains = { contains: q, mode: "insensitive" as const };
    const org = ctx.organizationId;
    const [customers, products, invoices] = await Promise.all([
      db.customer.findMany({ where: { organizationId: org, deletedAt: null, name: contains }, take: 4 }),
      db.product.findMany({ where: { organizationId: org, OR: [{ name: contains }, { sku: contains }] }, take: 4 }),
      db.invoice.findMany({ where: { organizationId: org, number: contains }, take: 4, include: { customer: { select: { name: true } } } }),
    ]);
    return NextResponse.json([
      ...customers.map((c) => ({ id: `c-${c.id}`, group: "Clients", label: c.name, hint: c.city ?? c.email ?? "", href: `/clients?q=${encodeURIComponent(c.name)}` })),
      ...products.map((p) => ({ id: `p-${p.id}`, group: "Produits", label: p.name, hint: p.sku, href: `/produits?q=${encodeURIComponent(p.sku)}` })),
      ...invoices.map((i) => ({ id: `i-${i.id}`, group: "Factures", label: i.number, hint: i.customer.name, href: `/factures?q=${encodeURIComponent(i.number)}` })),
    ]);
  } catch {
    return NextResponse.json([], { status: 401 });
  }
}
