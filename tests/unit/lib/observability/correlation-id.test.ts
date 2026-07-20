import { describe, expect, it } from "vitest";
import { resolveCorrelationId } from "@/lib/observability/correlation-id";

describe("resolveCorrelationId", () => {
  it("reaproveita um identificador de correlação válido recebido na requisição", () => {
    const incoming = "abc-123-DEF";
    expect(resolveCorrelationId(incoming)).toBe(incoming);
  });

  it("gera um novo identificador quando nenhum é recebido", () => {
    const generated = resolveCorrelationId(null);
    expect(generated).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("ignora um identificador recebido com caracteres inválidos e gera um novo", () => {
    const generated = resolveCorrelationId("<script>alert(1)</script>");
    expect(generated).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("gera identificadores diferentes a cada chamada sem valor recebido", () => {
    expect(resolveCorrelationId(null)).not.toBe(resolveCorrelationId(null));
  });
});
