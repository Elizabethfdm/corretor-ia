import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("retorna status 200 com banco de dados disponível", async () => {
    const request = new Request("http://localhost/api/health");

    const response = await GET(request);
    const body = (await response.json()) as { status: string; database: string };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.database).toBe("up");
  });

  it("reaproveita o identificador de correlação recebido na requisição", async () => {
    const request = new Request("http://localhost/api/health", {
      headers: { "x-correlation-id": "teste-correlacao-123" },
    });

    const response = await GET(request);

    expect(response.headers.get("x-correlation-id")).toBe("teste-correlacao-123");
  });
});
