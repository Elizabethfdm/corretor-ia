import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/policies/auth-policy";
import { getOwnProfile } from "@/server/services/broker-profile-service";
import type { BrokerProfile } from "@/generated/prisma/client";

/**
 * Exige um usuário autenticado com perfil de corretor já salvo — usado
 * por toda funcionalidade que depende de um `brokerId` (ex.: imóveis).
 * Sem perfil, não há como isolar dados por corretor (RN-026).
 */
export async function requireBrokerProfile(): Promise<BrokerProfile> {
  const user = await requireUser();
  const profile = await getOwnProfile(user.id);

  if (!profile) {
    redirect("/painel/perfil");
  }

  return profile;
}
