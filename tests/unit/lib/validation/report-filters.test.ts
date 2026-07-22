import { describe, expect, it } from "vitest";
import {
  parseReportFilters,
  resolveReportDateRange,
  type ReportFilters,
} from "@/lib/validation/report-filters";

describe("parseReportFilters (RF-068)", () => {
  it("assume 'últimos 7 dias' quando nenhum filtro é informado", () => {
    const filters = parseReportFilters({});
    expect(filters.period).toBe("7d");
  });

  it("aceita cada período válido", () => {
    expect(parseReportFilters({ period: "today" }).period).toBe("today");
    expect(parseReportFilters({ period: "30d" }).period).toBe("30d");
    expect(
      parseReportFilters({ period: "custom", from: "2026-07-01", to: "2026-07-10" }).period,
    ).toBe("custom");
  });

  it("nunca derruba a página com um período inválido — cai para o padrão (RN-047-like resiliência)", () => {
    const filters = parseReportFilters({ period: "ontem" });
    expect(filters.period).toBe("7d");
  });

  it("ignora datas malformadas em vez de lançar", () => {
    const filters = parseReportFilters({
      period: "custom",
      from: "não-é-uma-data",
      to: "2026-07-10",
    });
    expect(filters.from).toBeUndefined();
  });
});

describe("resolveReportDateRange", () => {
  const now = new Date("2026-07-21T15:00:00.000Z");

  // Conta dias-calendário abrangidos (inclusive em ambas as pontas) usando
  // os getters locais — nunca `toISOString()`, que normaliza para UTC e
  // pode deslocar a data num servidor rodando fora do fuso UTC.
  function calendarDaySpan(from: Date, to: Date): number {
    const startOfFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const startOfTo = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((startOfTo.getTime() - startOfFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  it("'hoje' cobre apenas o dia atual", () => {
    const { from, to } = resolveReportDateRange({ period: "today" } as ReportFilters, now);
    expect(from.getDate()).toBe(now.getDate());
    expect(to.getDate()).toBe(now.getDate());
  });

  it("'7d' cobre 7 dias-calendário incluindo hoje", () => {
    const { from, to } = resolveReportDateRange({ period: "7d" } as ReportFilters, now);
    expect(calendarDaySpan(from, to)).toBe(7);
  });

  it("'30d' cobre 30 dias-calendário incluindo hoje", () => {
    const { from, to } = resolveReportDateRange({ period: "30d" } as ReportFilters, now);
    expect(calendarDaySpan(from, to)).toBe(30);
  });

  it("'custom' com from/to válidos usa exatamente o intervalo informado", () => {
    const { from, to } = resolveReportDateRange(
      { period: "custom", from: "2026-07-01", to: "2026-07-05" } as ReportFilters,
      now,
    );
    expect(`${from.getFullYear()}-${from.getMonth() + 1}-${from.getDate()}`).toBe("2026-7-1");
    expect(`${to.getFullYear()}-${to.getMonth() + 1}-${to.getDate()}`).toBe("2026-7-5");
  });

  it("'custom' sem from/to cai para os últimos 7 dias (RN-088 — nunca quebra o relatório)", () => {
    const { from, to } = resolveReportDateRange({ period: "custom" } as ReportFilters, now);
    expect(calendarDaySpan(from, to)).toBe(7);
  });

  it("'custom' com from depois de to cai para os últimos 7 dias", () => {
    const { from, to } = resolveReportDateRange(
      { period: "custom", from: "2026-07-10", to: "2026-07-01" } as ReportFilters,
      now,
    );
    expect(calendarDaySpan(from, to)).toBe(7);
  });
});
