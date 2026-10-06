import { AppError } from "@/lib/errors";
import { assertCan, type Permission, type Role } from "@/lib/permissions";
import { auth } from "@/lib/auth";

export type Ctx = { userId: string; organizationId: string; role: Role };

// organizationId vient TOUJOURS de la session, jamais du frontend.
export async function requireCtx(permission: Permission): Promise<Ctx> {
  const session = await auth();
  const u = session?.user as { id?: string; organizationId?: string; role?: Role } | undefined;
  if (!u?.id || !u.organizationId || !u.role) throw new AppError("UNAUTHENTICATED");
  assertCan(u.role, permission);
  return { userId: u.id, organizationId: u.organizationId, role: u.role };
}
