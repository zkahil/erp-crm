import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createCustomerSchema } from "@/lib/validation/customer";
import type { Ctx } from "@/lib/auth/session";

export const PAGE_SIZE = 12;

export async function listCustomers(ctx: Ctx, page = 1, search?: string) {
  const where = {
    organizationId: ctx.organizationId,
    deletedAt: null,
    ...(search
      ? { OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
        ] }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.customer.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: { createdAt: "desc" } }),
    db.customer.count({ where }),
  ]);
  const billed = await db.invoice.groupBy({
    by: ["customerId"],
    where: { organizationId: ctx.organizationId, customerId: { in: items.map((c) => c.id) }, status: { notIn: ["DRAFT", "CANCELLED"] } },
    _sum: { totalTTC: true },
  });
  const billedMap = new Map(billed.map((b) => [b.customerId, Number(b._sum.totalTTC ?? 0)]));
  return { items: items.map((c) => ({ ...c, billed: billedMap.get(c.id) ?? 0 })), total };
}

export async function createCustomer(ctx: Ctx, input: unknown) {
  const data = createCustomerSchema.parse(input);
  const clean = { ...data, email: data.email || null, phone: data.phone || null, city: data.city || null };
  return db.$transaction(async (tx) => {
    const customer = await tx.customer.create({ data: { ...clean, organizationId: ctx.organizationId } });
    await audit(tx, ctx, { action: "CREATE", entity: "Customer", entityId: customer.id, newData: clean });
    return customer;
  });
}
