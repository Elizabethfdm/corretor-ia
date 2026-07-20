import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export type CurrentSession = Awaited<ReturnType<typeof auth.api.getSession>>;
export type CurrentUser = NonNullable<CurrentSession>["user"];

/**
 * Retorna a sessão atual (ou null) a partir dos headers da requisição.
 * Não redireciona — use quando a rota funciona tanto autenticada quanto
 * anonimamente (ex.: cabeçalho do site).
 */
export async function getCurrentSession(): Promise<CurrentSession> {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * RF-007/RN-010: exige um usuário autenticado, redirecionando para o
 * login quando não houver sessão válida. Use em toda página/Server
 * Action que representa uma rota privada.
 */
export async function requireUser(): Promise<CurrentUser> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session.user;
}

/**
 * Exige um usuário com papel de administrador (RN-095). Rotas
 * administrativas nunca devem confiar apenas em ocultar o link na UI.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();

  if (user.role !== "admin") {
    redirect("/acesso-negado");
  }

  return user;
}
