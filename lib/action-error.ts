import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

const MESSAGES: Record<string, string> = {
  PERMISSION_DENIED: "Vous n’avez pas l’autorisation d’effectuer cette action.",
  UNAUTHENTICATED: "Votre session a expiré. Reconnectez-vous.",
  CUSTOMER_NOT_FOUND: "Ce client est introuvable.",
  ORGANIZATION_ACCESS_DENIED: "Cet élément est introuvable.",
  INVALID_STATUS_TRANSITION: "Cette action n’est pas possible dans l’état actuel du document.",
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export function actionError(e: unknown): { ok: false; error: string } {
  if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? "Données invalides" };
  if (e instanceof AppError && e.code === "INSUFFICIENT_STOCK") return { ok: false, error: e.message };
  if (e instanceof AppError) return { ok: false, error: MESSAGES[e.code] ?? "Une erreur est survenue." };
  console.error(e);
  return { ok: false, error: "Une erreur est survenue. Réessayez dans un instant." };
}