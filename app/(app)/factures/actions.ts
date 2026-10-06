"use server";
import { revalidatePath } from "next/cache";
import { requireCtx } from "@/lib/auth/session";
import { actionError, type ActionResult } from "@/lib/action-error";
import { createInvoice, issueInvoice, updateInvoice } from "@/services/sales/document.service";

export async function createInvoiceAction(input: unknown, mode: "draft" | "final"): Promise<ActionResult> {
  try {
    const ctx = await requireCtx("invoice.create");
    await createInvoice(ctx, input, mode === "final" ? "ISSUED" : "DRAFT");
    revalidatePath("/factures");
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function updateInvoiceAction(id: string, input: unknown, mode: "draft" | "final"): Promise<ActionResult> {
  try {
    const ctx = await requireCtx("invoice.create");
    await updateInvoice(ctx, id, input, mode === "final");
    revalidatePath("/factures");
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function issueInvoiceAction(invoiceId: string): Promise<ActionResult> {
  try {
    const ctx = await requireCtx("invoice.validate");
    await issueInvoice(ctx, invoiceId);
    revalidatePath("/factures");
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}