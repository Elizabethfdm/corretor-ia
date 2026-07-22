"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/policies/auth-policy";
import { recordAuditLog } from "@/server/services/audit-log-service";
import { blockBroker, unblockBroker } from "@/server/services/admin-service";

/** RF-073, RN-092, RN-094, RN-095: só administrador pode bloquear; ação sempre auditada. */
export async function blockBrokerAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));

  await blockBroker(userId);
  await recordAuditLog({
    userId: admin.id,
    action: "BROKER_BLOCKED",
    entityType: "User",
    entityId: userId,
  });
  revalidatePath("/painel-admin");
}

export async function unblockBrokerAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));

  await unblockBroker(userId);
  await recordAuditLog({
    userId: admin.id,
    action: "BROKER_UNBLOCKED",
    entityType: "User",
    entityId: userId,
  });
  revalidatePath("/painel-admin");
}
