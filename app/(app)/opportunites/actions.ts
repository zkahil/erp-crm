"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireCtx } from "@/lib/auth/session";

const schema = z.object({ id: z.string().min(1), status: z.enum(["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]) });

export async function moveOpportunity(input: unknown) {
  const ctx = await requireCtx("customer.update");
  const { id, status } = schema.parse(input);
  await db.$transaction(async (tx) => {
    const current = await tx.opportunity.findFirst({ where: { id, organizationId: ctx.organizationId } });
    if (!current) return;
    await tx.opportunity.update({ where: { id }, data: { status } });
    await audit(tx, ctx, { action: "UPDATE", entity: "Opportunity", entityId: id, oldData: { status: current.status }, newData: { status } });
  });
  revalidatePath("/opportunites");
}
