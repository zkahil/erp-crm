"use server";
import { revalidatePath } from "next/cache";
import { requireCtx } from "@/lib/auth/session";
import { actionError, type ActionResult } from "@/lib/action-error";
import { convertQuotesToInvoices, convertQuoteToInvoice, createQuote, updateQuote } from "@/services/sales/document.service";

function refresh() {
  revalidatePath("/devis");
  revalidatePath("/factures");
  revalidatePath("/factures/a-facturer");
}

export async function createQuoteAction(input: unknown, mode: "draft" | "final"): Promise<ActionResult> {
  try {
    const ctx = await requireCtx("quote.create");
    await createQuote(ctx, input, mode === "final" ? "SENT" : "DRAFT");
    refresh();
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function updateQuoteAction(id: string, input: unknown, mode: "draft" | "final"): Promise<ActionResult> {
  try {
    const ctx = await requireCtx("quote.update");
    await updateQuote(ctx, id, input, mode === "final");
    refresh();
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function convertQuoteAction(quoteId: string, issue = false): Promise<ActionResult> {
  try {
    const ctx = await requireCtx("invoice.create");
    await convertQuoteToInvoice(ctx, quoteId, { issue });
    refresh();
    return { ok: true };
  } catch (e) {
    return actionError(e);
  }
}

export async function convertQuotesAction(
  ids: string[],
  issue: boolean,
): Promise<{ ok: true; created: number; failed: number } | { ok: false; error: string }> {
  try {
    const ctx = await requireCtx("invoice.create");
    const r = await convertQuotesToInvoices(ctx, ids, issue);
    refresh();
    return { ok: true, ...r };
  } catch (e) {
    return actionError(e);
  }
}