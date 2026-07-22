import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("combina classes estáticas", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("descarta valores condicionais falsos", () => {
    expect(cn("flex", false && "hidden", undefined, null)).toBe("flex");
  });

  it("resolve conflito entre classes Tailwind mantendo a última", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("aceita arrays e objetos, como o clsx", () => {
    expect(cn(["flex", { "items-center": true, hidden: false }])).toBe("flex items-center");
  });
});
