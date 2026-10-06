import { db } from "@/lib/db";
import { stockByProduct } from "@/services/inventory/stock.service";
import type { Ctx } from "@/lib/auth/session";

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export async function getDashboard(ctx: Ctx) {
  const org = ctx.organizationId;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [invoices, unpaid, openQuotes, pipelineRaw, payments, products, stock] = await Promise.all([
    db.invoice.findMany({
      where: { organizationId: org, status: { notIn: ["DRAFT", "CANCELLED"] }, date: { gte: start } },
      select: { date: true, totalTTC: true },
    }),
    db.invoice.findMany({
      where: { organizationId: org, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      include: { customer: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    db.quote.aggregate({ where: { organizationId: org, status: "SENT" }, _sum: { totalTTC: true }, _count: true }),
    db.opportunity.groupBy({
      by: ["status"],
      where: { organizationId: org, status: { notIn: ["WON", "LOST"] } },
      _sum: { amount: true },
      _count: true,
    }),
    db.payment.findMany({
      where: { organizationId: org },
      orderBy: { paidAt: "desc" },
      take: 5,
      include: { invoice: { select: { number: true, customer: { select: { name: true } } } } },
    }),
    db.product.findMany({ where: { organizationId: org, active: true, deletedAt: null } }),
    stockByProduct(ctx),
  ]);

  const revenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()]!, total: 0 };
  });
  for (const inv of invoices) {
    const k = `${inv.date.getFullYear()}-${inv.date.getMonth()}`;
    const m = revenue.find((r) => r.key === k);
    if (m) m.total += Number(inv.totalTTC);
  }

  const remaining = (i: { totalTTC: unknown; paidAmount: unknown }) => Number(i.totalTTC) - Number(i.paidAmount);
  const late = unpaid.filter((i) => i.dueDate && i.dueDate < now);
  const lowStock = products
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, min: p.minStock, qty: stock.get(p.id) ?? 0 }))
    .filter((p) => p.qty <= p.min)
    .sort((a, b) => a.qty - b.qty);

  const current = revenue[5]!.total;
  const previous = revenue[4]!.total;

  return {
    revenue: revenue.map(({ label, total }) => ({ label, total: Math.round(total) })),
    month: { current, previous, delta: previous ? (current - previous) / previous : null },
    receivable: unpaid.reduce((s, i) => s + remaining(i), 0),
    lateTotal: late.reduce((s, i) => s + remaining(i), 0),
    late: late.slice(0, 5).map((i) => ({ id: i.id, number: i.number, customer: i.customer.name, dueDate: i.dueDate!, amount: remaining(i) })),
    openQuotes: { count: openQuotes._count, total: Number(openQuotes._sum.totalTTC ?? 0) },
    pipeline: pipelineRaw.map((p) => ({ status: p.status as string, count: p._count, amount: Number(p._sum.amount ?? 0) })),
    payments: payments.map((p) => ({ id: p.id, amount: Number(p.amount), paidAt: p.paidAt, number: p.invoice.number, customer: p.invoice.customer.name })),
    lowStock: lowStock.slice(0, 5),
    lowStockCount: lowStock.length,
  };
}
