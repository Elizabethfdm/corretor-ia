import { UserAgentCategory } from "@/generated/prisma/enums";

/**
 * Classificador próprio por expressões regulares — suficiente para as
 * 4 categorias exigidas pelo relatório (RF-067); dispensa uma
 * dependência dedicada de parsing de User-Agent (ver ADR-0007).
 */
export function classifyUserAgent(userAgent: string | null | undefined): UserAgentCategory {
  if (!userAgent || userAgent.trim() === "") {
    return UserAgentCategory.UNKNOWN;
  }

  if (/iPad/i.test(userAgent) || /Tablet/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))) {
    return UserAgentCategory.TABLET;
  }

  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(userAgent)) {
    return UserAgentCategory.MOBILE;
  }

  return UserAgentCategory.DESKTOP;
}
