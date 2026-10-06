import { z } from "zod";

const num = (msg: string) => z.number({ invalid_type_error: msg, required_error: msg });

export const lineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().trim().min(1, "Décrivez la ligne"),
  quantity: num("Quantité requise").positive("La quantité doit être supérieure à 0"),
  unitPrice: num("Prix requis").min(0, "Le prix ne peut pas être négatif"),
  discount: num("Remise requise").min(0).max(100, "La remise va de 0 à 100 %"),
  vatRate: num("TVA requise").min(0).max(100),
});

export const documentSchema = z.object({
  customerId: z.string().min(1, "Choisissez un client"),
  date: z.string().min(1, "Indiquez la date"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "Ajoutez au moins une ligne"),
});

export type DocumentInput = z.infer<typeof documentSchema>;