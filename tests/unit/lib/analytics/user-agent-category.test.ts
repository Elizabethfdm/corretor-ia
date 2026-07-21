import { describe, expect, it } from "vitest";
import { classifyUserAgent } from "@/lib/analytics/user-agent-category";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_PHONE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_TABLET_UA =
  "Mozilla/5.0 (Linux; Android 14; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

describe("classifyUserAgent (RF-067)", () => {
  it("classifica iPhone e Android com Mobile como MOBILE", () => {
    expect(classifyUserAgent(IPHONE_UA)).toBe("MOBILE");
    expect(classifyUserAgent(ANDROID_PHONE_UA)).toBe("MOBILE");
  });

  it("classifica iPad e Android sem Mobile como TABLET", () => {
    expect(classifyUserAgent(IPAD_UA)).toBe("TABLET");
    expect(classifyUserAgent(ANDROID_TABLET_UA)).toBe("TABLET");
  });

  it("classifica navegador desktop comum como DESKTOP", () => {
    expect(classifyUserAgent(DESKTOP_UA)).toBe("DESKTOP");
  });

  it("classifica ausência de User-Agent como UNKNOWN", () => {
    expect(classifyUserAgent(null)).toBe("UNKNOWN");
    expect(classifyUserAgent(undefined)).toBe("UNKNOWN");
    expect(classifyUserAgent("")).toBe("UNKNOWN");
    expect(classifyUserAgent("   ")).toBe("UNKNOWN");
  });
});
