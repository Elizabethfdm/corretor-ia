import type { NextConfig } from "next";

/**
 * RNF-034: cabeçalhos de segurança HTTP aplicados a toda a aplicação.
 * CSP sem nonce (ver docs/architecture/decisions — decisão registrada
 * na Fase 10): a alternativa com nonce exige renderização dinâmica em
 * 100% das páginas (perde geração estática das poucas páginas
 * realmente estáticas do site — home, termos, política de
 * privacidade), custo desproporcional ao ganho para este MVP (RNF-049).
 * `'unsafe-inline'` em `script-src`/`style-src` é necessário sem nonce
 * (o próprio bootstrap do Next.js e os estilos injetados pelo Tailwind
 * dependem disso) — ainda assim, a política restringe origem de
 * recursos, iframes e formulários, o que já mitiga boa parte da
 * superfície de risco.
 *
 * Sem `upgrade-insecure-requests`: testado e descartado — o WebKit
 * aplica essa diretiva promovendo também as próprias sub-requisições da
 * página (scripts, fontes, CSS) para HTTPS, e quebra por completo em
 * qualquer origem que sirva apenas HTTP (dev local e o servidor
 * `next start` usado pelos testes E2E, ambos em `http://localhost`,
 * sem TLS) — confirmado via teste de diagnóstico isolado no projeto
 * `webkit-desktop` (erro "SSL connect error" em todo recurso). Chromium
 * e Firefox não quebravam da mesma forma neste cenário, mas a diretiva
 * foi removida para os três motores por consistência e porque não é um
 * dos cabeçalhos exigidos por RNF-034.
 */
function resolveStorageOrigin(): string | null {
  const baseUrl = process.env["STORAGE_PUBLIC_BASE_URL"];
  if (!baseUrl) return null;
  try {
    return new URL(baseUrl).origin;
  } catch {
    return null;
  }
}

const storageOrigin = resolveStorageOrigin();
const imgSrc = ["'self'", "blob:", "data:", storageOrigin].filter(Boolean).join(" ");

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src ${imgSrc};
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
