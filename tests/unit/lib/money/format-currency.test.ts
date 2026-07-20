import { describe, expect, it } from "vitest";
import { formatCurrencyBRL } from "@/lib/money/format-currency";

// Intl.NumberFormat("pt-BR", { style: "currency" }) usa um espaço
// inseparável (U+00A0) entre o símbolo e o valor, não um espaço comum.
const NBSP = " ";

describe("formatCurrencyBRL (RN-030)", () => {
  it("formata um valor numérico em real brasileiro", () => {
    expect(formatCurrencyBRL(450000.5)).toBe(`R$${NBSP}450.000,50`);
  });

  it("formata um valor em string, preservando os centavos", () => {
    expect(formatCurrencyBRL("1200.99")).toBe(`R$${NBSP}1.200,99`);
  });

  it("retorna string vazia para null, undefined ou string vazia", () => {
    expect(formatCurrencyBRL(null)).toBe("");
    expect(formatCurrencyBRL(undefined)).toBe("");
    expect(formatCurrencyBRL("")).toBe("");
  });

  it("retorna string vazia para valor não numérico", () => {
    expect(formatCurrencyBRL("não-é-número")).toBe("");
  });

  it("formata zero corretamente", () => {
    expect(formatCurrencyBRL(0)).toBe(`R$${NBSP}0,00`);
  });
});
