import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Saisissez au moins 2 caractères"),
  email: z.string().trim().email("Adresse e-mail invalide").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  city: z.string().trim().optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
