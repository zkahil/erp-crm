import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { documentSchema } from "@/lib/validation/document";
import { calculateInvoiceTotals } from "@/services/sales/invoice.service";
import type { Ctx } from "@/lib/auth/session";

type Tx = Prisma.TransactionClient;
const DAY = 86_400_000;

async function nextNumber(tx: Tx, kind: "quote" | "order" | "invoice", organizationId: string) {
  const prefix = { quote: "DEV", order: "CMD", invoice: "FAC" }[kind];
  const year = new Date().getFullYear();
  const args = {
    where: { organizationId, number: { startsWith: `${prefix}-${year}-` } },
    orderBy: { number: "desc" as const },
    select: { number: true },
  };
  const last = kind === "quote" ? await tx.quote.findFirst(args) : kind === "order" ? await tx.order.findFirst(args) : await tx.invoice.findFirst(args);
  const n = last ? Number(last.number.split("-")[2]) + 1 : 1;
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

// Limiteur de quantité : on ne peut pas chiffrer plus que le stock disponible (somme des mouvements).
async function assertStock(tx: Tx, ctx: Ctx, lines: { productId: string | null; quantity: number }[]) {
  const asked = new Map<string, number>();
  for (const l of lines) if (l.productId) asked.set(l.productId, (asked.get(l.productId) ?? 0) + l.quantity);
  if (!asked.size) return;
  const ids = [...asked.keys()];
  const [sums, products] = await Promise.all([
    tx.stockMovement.groupBy({ by: ["productId"], where: { organizationId: ctx.organizationId, productId: { in: ids } }, _sum: { quantity: true } }),
    tx.product.findMany({ where: { id: { in: ids }, organizationId: ctx.organizationId }, select: { id: true, name: true } }),
  ]);
  const have = new Map<string, number>(sums.map((s) => [s.productId, s._sum.quantity ?? 0]));
  for (const p of products) {
    const want = asked.get(p.id)!;
    const available = have.get(p.id) ?? 0;
    if (want > available) {
      throw new AppError("INSUFFICIENT_STOCK", available <= 0 ? `« ${p.name} » est en rupture de stock.` : `Stock insuffisant pour « ${p.name} » : ${available} disponible(s), ${want} demandé(s).`);
    }
  }
}

// Valide l'entrée et recalcule les totaux côté serveur : on ne fait jamais confiance au navigateur.
async function prepare(tx: Tx, ctx: Ctx, input: unknown) {
  const data = documentSchema.parse(input);
  const customer = await tx.customer.findFirst({ where: { id: data.customerId, organizationId: ctx.organizationId, deletedAt: null } });
  if (!customer) throw new AppError("CUSTOMER_NOT_FOUND");

  const ids = [...new Set(data.lines.map((l) => l.productId).filter((x): x is string => !!x))];
  if (ids.length) {
    const found = await tx.product.count({ where: { id: { in: ids }, organizationId: ctx.organizationId } });
    if (found !== ids.length) throw new AppError("ORGANIZATION_ACCESS_DENIED");
  }

  const totals = calculateInvoiceTotals(data.lines);
  const lines = data.lines.map((l) => ({
    productId: l.productId || null,
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    discount: l.discount,
    vatRate: l.vatRate,
  }));
  await assertStock(tx, ctx, lines);
  return { data, customer, totals, lines };
}

/* ───────────── Devis ───────────── */

export async function createQuote(ctx: Ctx, input: unknown, status: "DRAFT" | "SENT") {
  if (status === "SENT" && !can(ctx.role, "quote.validate")) throw new AppError("PERMISSION_DENIED");
  return db.$transaction(async (tx) => {
    const { data, totals, lines } = await prepare(tx, ctx, input);
    const number = await nextNumber(tx, "quote", ctx.organizationId);
    const quote = await tx.quote.create({
      data: {
        organizationId: ctx.organizationId,
        number,
        customerId: data.customerId,
        status,
        date: new Date(data.date),
        validUntil: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
        ...totals,
        lines: { create: lines },
      },
    });
    await audit(tx, ctx, { action: "CREATE", entity: "Quote", entityId: quote.id, newData: { number, status, ...totals } });
    return quote;
  });
}

// Un devis reste modifiable tant qu'il n'est ni accepté, ni refusé, ni facturé.
export async function updateQuote(ctx: Ctx, id: string, input: unknown, send: boolean) {
  if (send && !can(ctx.role, "quote.validate")) throw new AppError("PERMISSION_DENIED");
  return db.$transaction(async (tx) => {
    const existing = await tx.quote.findFirst({ where: { id, organizationId: ctx.organizationId }, include: { _count: { select: { orders: true } } } });
    if (!existing) throw new AppError("ORGANIZATION_ACCESS_DENIED");
    if ((existing.status !== "DRAFT" && existing.status !== "SENT") || existing._count.orders > 0) throw new AppError("INVALID_STATUS_TRANSITION");

    const { data, totals, lines } = await prepare(tx, ctx, input);
    const status = send && existing.status === "DRAFT" ? "SENT" : existing.status;
    await tx.quoteLine.deleteMany({ where: { quoteId: id } });
    const quote = await tx.quote.update({
      where: { id },
      data: {
        customerId: data.customerId,
        status,
        date: new Date(data.date),
        validUntil: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
        ...totals,
        lines: { create: lines },
      },
    });
    await audit(tx, ctx, {
      action: "UPDATE", entity: "Quote", entityId: id,
      oldData: { status: existing.status, totalTTC: Number(existing.totalTTC) },
      newData: { status, ...totals },
    });
    return quote;
  });
}

/* ───────────── Factures ───────────── */

export async function createInvoice(ctx: Ctx, input: unknown, status: "DRAFT" | "ISSUED") {
  if (status === "ISSUED" && !can(ctx.role, "invoice.validate")) throw new AppError("PERMISSION_DENIED");
  return db.$transaction(async (tx) => {
    const { data, customer, totals, lines } = await prepare(tx, ctx, input);
    const number = await nextNumber(tx, "invoice", ctx.organizationId);
    const date = new Date(data.date);
    const invoice = await tx.invoice.create({
      data: {
        organizationId: ctx.organizationId,
        number,
        customerId: data.customerId,
        status,
        date,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(date.getTime() + customer.paymentTerms * DAY),
        notes: data.notes || null,
        ...totals,
        lines: { create: lines },
      },
    });
    await audit(tx, ctx, { action: "CREATE", entity: "Invoice", entityId: invoice.id, newData: { number, status, ...totals } });
    return invoice;
  });
}

// Seule une facture brouillon est modifiable : une facture émise reste traçable.
export async function updateInvoice(ctx: Ctx, id: string, input: unknown, issue: boolean) {
  if (issue && !can(ctx.role, "invoice.validate")) throw new AppError("PERMISSION_DENIED");
  return db.$transaction(async (tx) => {
    const existing = await tx.invoice.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!existing) throw new AppError("ORGANIZATION_ACCESS_DENIED");
    if (existing.status !== "DRAFT") throw new AppError("INVALID_STATUS_TRANSITION");

    const { data, customer, totals, lines } = await prepare(tx, ctx, input);
    const date = new Date(data.date);
    const status = issue ? "ISSUED" : "DRAFT";
    await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
    const invoice = await tx.invoice.update({
      where: { id },
      data: {
        customerId: data.customerId,
        status,
        date,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(date.getTime() + customer.paymentTerms * DAY),
        notes: data.notes || null,
        ...totals,
        lines: { create: lines },
      },
    });
    await audit(tx, ctx, {
      action: issue ? "VALIDATE" : "UPDATE", entity: "Invoice", entityId: id,
      oldData: { status: existing.status, totalTTC: Number(existing.totalTTC) },
      newData: { status, ...totals },
    });
    return invoice;
  });
}

export async function issueInvoice(ctx: Ctx, invoiceId: string) {
  return db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, organizationId: ctx.organizationId } });
    if (!invoice) throw new AppError("ORGANIZATION_ACCESS_DENIED");
    if (invoice.status !== "DRAFT") throw new AppError("INVALID_STATUS_TRANSITION");
    await tx.invoice.update({ where: { id: invoice.id }, data: { status: "ISSUED" } });
    await audit(tx, ctx, { action: "VALIDATE", entity: "Invoice", entityId: invoice.id, oldData: { status: "DRAFT" }, newData: { status: "ISSUED" } });
    return invoice;
  });
}

/* ───────────── Devis → commande → facture ───────────── */

export async function convertQuoteToInvoice(ctx: Ctx, quoteId: string, opts: { issue?: boolean } = {}) {
  if (opts.issue && !can(ctx.role, "invoice.validate")) throw new AppError("PERMISSION_DENIED");
  return db.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({
      where: { id: quoteId, organizationId: ctx.organizationId },
      include: { lines: true, customer: true, _count: { select: { orders: true } } },
    });
    if (!quote) throw new AppError("ORGANIZATION_ACCESS_DENIED");
    if ((quote.status !== "SENT" && quote.status !== "ACCEPTED") || quote._count.orders > 0) throw new AppError("INVALID_STATUS_TRANSITION");

    const order = await tx.order.create({
      data: {
        organizationId: ctx.organizationId,
        number: await nextNumber(tx, "order", ctx.organizationId),
        customerId: quote.customerId,
        quoteId: quote.id,
        status: "CONFIRMED",
        totalHT: quote.totalHT,
        totalTTC: quote.totalTTC,
      },
    });
    const now = new Date();
    const status = opts.issue ? "ISSUED" : "DRAFT";
    const invoice = await tx.invoice.create({
      data: {
        organizationId: ctx.organizationId,
        number: await nextNumber(tx, "invoice", ctx.organizationId),
        customerId: quote.customerId,
        orderId: order.id,
        status,
        date: now,
        dueDate: new Date(now.getTime() + quote.customer.paymentTerms * DAY),
        notes: quote.notes,
        totalHT: quote.totalHT,
        totalVAT: quote.totalVAT,
        totalTTC: quote.totalTTC,
        lines: {
          create: quote.lines.map((l) => ({
            productId: l.productId, description: l.description, quantity: l.quantity,
            unitPrice: l.unitPrice, discount: l.discount, vatRate: l.vatRate,
          })),
        },
      },
    });
    await tx.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED" } });
    await audit(tx, ctx, { action: "UPDATE", entity: "Quote", entityId: quote.id, oldData: { status: quote.status }, newData: { status: "ACCEPTED" } });
    await audit(tx, ctx, { action: "CREATE", entity: "Order", entityId: order.id, newData: { number: order.number, quoteId: quote.id } });
    await audit(tx, ctx, { action: "CREATE", entity: "Invoice", entityId: invoice.id, newData: { number: invoice.number, orderId: order.id, status } });
    return invoice;
  });
}

// Facturation en lot : chaque devis est traité dans sa propre transaction, un échec n'annule pas les autres.
export async function convertQuotesToInvoices(ctx: Ctx, ids: string[], issue: boolean) {
  if (issue && !can(ctx.role, "invoice.validate")) throw new AppError("PERMISSION_DENIED");
  let created = 0;
  let failed = 0;
  for (const id of [...new Set(ids)].slice(0, 50)) {
    try {
      await convertQuoteToInvoice(ctx, id, { issue });
      created++;
    } catch {
      failed++;
    }
  }
  return { created, failed };
}