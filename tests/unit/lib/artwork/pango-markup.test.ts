import { describe, expect, it } from "vitest";
import { escapePangoMarkup } from "@/lib/artwork/pango-markup";

describe("escapePangoMarkup", () => {
  it("escapa caracteres especiais de markup tipo-XML", () => {
    expect(escapePangoMarkup("Casa & Cia <apto> \"top\" 'novo'")).toBe(
      "Casa &amp; Cia &lt;apto&gt; &quot;top&quot; &apos;novo&apos;",
    );
  });

  it("não altera texto sem caracteres especiais", () => {
    expect(escapePangoMarkup("Casa com piscina no Jardim Europa")).toBe(
      "Casa com piscina no Jardim Europa",
    );
  });

  it("escapa markup malicioso tentando fechar a tag span", () => {
    const malicious = '</span><span foreground="#000000">';
    const escaped = escapePangoMarkup(malicious);

    expect(escaped).not.toContain("<");
    expect(escaped).not.toContain(">");
  });
});
