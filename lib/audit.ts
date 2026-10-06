import type { Prisma, AuditAction } from "@prisma/client";
import type { Ctx } from "@/lib/auth/session";

export async function audit(
  tx: Prisma.TransactionClient,
  ctx: Ctx,
  p: { action: AuditAction; entity: string; entityId?: string; oldData?: Prisma.InputJsonValue; newData?: Prisma.InputJsonValue },
) {
  await tx.auditLog.create({
    data: { organizationId: ctx.organizationId, userId: ctx.userId, ...p },
  });
}
