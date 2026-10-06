import { db } from "@/lib/db";
import type { Ctx } from "@/lib/auth/session";

// Le stock est toujours la somme des mouvements (quantités signées).
export async function stockByProduct(ctx: Ctx) {
  const rows = await db.stockMovement.groupBy({
    by: ["productId"],
    where: { organizationId: ctx.organizationId },
    _sum: { quantity: true },
  });
  return new Map(rows.map((r) => [r.productId, r._sum.quantity ?? 0]));
}

export async function getStock(ctx: Ctx, productId: string, warehouseId?: string) {
  const r = await db.stockMovement.aggregate({
    _sum: { quantity: true },
    where: { organizationId: ctx.organizationId, productId, ...(warehouseId ? { warehouseId } : {}) },
  });
  return r._sum.quantity ?? 0;
}
