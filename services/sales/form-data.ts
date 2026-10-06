import { db } from "@/lib/db";
import { stockByProduct } from "@/services/inventory/stock.service";
import type { Ctx } from "@/lib/auth/session";

export async function getFormData(ctx: Ctx) {
  const [customers, products, stock] = await Promise.all([
    db.customer.findMany({
      where: { organizationId: ctx.organizationId, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, paymentTerms: true },
    }),
    db.product.findMany({
      where: { organizationId: ctx.organizationId, active: true, deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, salePrice: true, vatRate: true },
    }),
    stockByProduct(ctx),
  ]);
  return {
    customers,
    products: products.map((p) => ({ ...p, salePrice: Number(p.salePrice), vatRate: Number(p.vatRate), stock: stock.get(p.id) ?? 0 })),
  };
}
