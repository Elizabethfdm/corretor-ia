import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionais (clsx) e resolve conflitos entre
 * classes Tailwind (tailwind-merge) — ex.: `cn("px-2", condicao && "px-4")`
 * resulta em só `px-4` quando `condicao` é verdadeira, em vez de
 * ambas as classes conflitantes lado a lado.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
