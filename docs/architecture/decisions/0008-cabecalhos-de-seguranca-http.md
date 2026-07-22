# ADR-0008 — Cabeçalhos de segurança HTTP

- **Status:** Aceita — implementada na Fase 10
- **Data:** 2026-07-21
- **Decisores:** Arquitetura / Segurança

## Contexto

RNF-034 exige cabeçalhos de segurança HTTP (CSP quando viável,
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
Nenhum cabeçalho de segurança estava configurado até a Fase 10.

## Alternativas consideradas (CSP)

| Alternativa                                                        | Prós                                                                 | Contras                                                                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| CSP com nonce por requisição (`proxy.ts`)                             | Política mais estrita, sem `'unsafe-inline'`                              | Exige renderização dinâmica em **100% das páginas** — perde geração estática das páginas realmente estáticas do site (home, termos de uso, política de privacidade); maior custo de hospedagem (RNF-049) |
| CSP estática em `next.config.ts`, sem nonce (`'unsafe-inline'`)        | Nenhuma infraestrutura nova; mantém páginas estáticas como estão hoje    | `script-src`/`style-src` precisam de `'unsafe-inline'` (o próprio bootstrap do Next.js e os estilos do Tailwind dependem disso sem nonce) — mitiga menos XSS via inline script que a versão com nonce |

## Decisão

CSP estática sem nonce, em `next.config.ts` (`headers()`), consultada a
documentação oficial do Next.js (`api-reference/config/next-config-js/headers`
e `guides/content-security-policy`) antes de escrever a configuração.
Diretivas: `default-src 'self'`, `script-src`/`style-src` com
`'unsafe-inline'` (necessário sem nonce), `img-src` restrito a `'self'`
mais a origem configurada de `STORAGE_PUBLIC_BASE_URL` (lida em tempo de
build a partir da variável de ambiente), `object-src 'none'`,
`frame-ancestors 'none'`, `form-action 'self'`. Acompanhada de
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` e
`Referrer-Policy: origin-when-cross-origin`.

A alternativa com nonce foi descartada por desproporcional ao ganho
nesta fase: forçar renderização dinâmica em toda a aplicação (incluindo
páginas hoje estáticas) contraria RNF-049 (custo previsível baixo) sem
uma ameaça concreta que a justifique além do que a versão sem nonce já
mitiga (restrição de origem de recursos/iframes/formulários).

**`upgrade-insecure-requests` testada e removida.** A primeira versão
incluía essa diretiva (presente no exemplo oficial do Next.js). A
suíte E2E completa (5 navegadores) revelou que o WebKit a aplica também
às sub-requisições da própria página (scripts, fontes, CSS), tentando
promovê-las para HTTPS — e falha por completo em qualquer origem
servida apenas por HTTP, como `http://localhost` (usado tanto em
desenvolvimento quanto pelo servidor `next start` da suíte E2E). Um
teste de diagnóstico isolado no projeto `webkit-desktop` confirmou "SSL
connect error" em todo recurso da página após o login. Chromium e
Firefox não apresentaram o mesmo problema neste cenário específico, mas
a diretiva foi removida para os três motores por consistência — não é
um dos cabeçalhos exigidos por RNF-034, e o ganho (upgrade automático de
recursos http:// residuais) não compensa quebrar o ambiente de
desenvolvimento/teste.

## Consequências

- `'unsafe-inline'` em `script-src` reduz a proteção contra XSS via
  script inline em comparação com uma política com nonce — mitigação
  parcial, não completa, contra esse vetor específico.
- Nenhuma dependência nova, nenhuma página deixa de ser estaticamente
  gerada.
- Se o produto crescer para justificar uma política mais estrita (dados
  ainda mais sensíveis, requisito de conformidade), a migração para
  nonce via `proxy.ts` é o próximo passo natural — documentado aqui como
  caminho de evolução, não implementado agora.

## Referências

- https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- https://nextjs.org/docs/app/guides/content-security-policy
- https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy
- https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Content-Type-Options
- https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Frame-Options
- https://developer.mozilla.org/docs/Web/HTTP/Headers/Referrer-Policy
