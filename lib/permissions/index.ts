import { AppError } from "@/lib/errors";

export type Role =
  | "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "COMMERCIAL" | "COMPTABLE"
  | "MAGASINIER" | "RH" | "EMPLOYEE" | "SUPPORT";

export const PERMISSIONS = [
  "customer.read", "customer.create", "customer.update", "customer.delete",
  "product.read", "product.create", "product.update", "product.delete",
  "quote.read", "quote.create", "quote.update", "quote.validate", "quote.cancel",
  "invoice.read", "invoice.create", "invoice.validate", "invoice.cancel",
  "stock.read", "stock.adjust", "stock.transfer",
  "user.read", "user.create", "user.update", "user.delete",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const all = [...PERMISSIONS] as Permission[];
const pick = (prefixes: string[]) => all.filter((p) => prefixes.some((x) => p.startsWith(x)));

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: all,
  ADMIN: all,
  MANAGER: all.filter((p) => !p.startsWith("user.")),
  COMMERCIAL: [...pick(["customer.", "quote."]), "product.read", "stock.read"],
  COMPTABLE: [...pick(["invoice."]), "customer.read", "quote.read"],
  MAGASINIER: [...pick(["stock."]), "product.read"],
  RH: ["user.read"],
  EMPLOYEE: ["customer.read", "product.read"],
  SUPPORT: ["customer.read", "quote.read"],
};

export function can(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertCan(role: Role, permission: Permission) {
  if (!can(role, permission)) throw new AppError("PERMISSION_DENIED", permission);
}
