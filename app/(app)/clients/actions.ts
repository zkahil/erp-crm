"use server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireCtx } from "@/lib/auth/session";
import { createCustomer } from "@/services/crm/customer.service";

export async function createCustomerAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ctx = await requireCtx("customer.create");
    await createCustomer(ctx, input);
    revalidatePath("/clients");
    return { ok: true };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? "Données invalides" };
    return { ok: false, error: "Vous n’avez pas l’autorisation de créer un client." };
  }
}
