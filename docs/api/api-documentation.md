# Documentação de API — Corretor IA

> Status: parcialmente implementada a partir da Fase 2 (Autenticação).
> Demais seções continuam como previsão, a preencher conforme cada fase
> for implementada.

## Convenções

- Rotas privadas exigem sessão válida; retornam `401` quando não
  autenticado e `403` quando autenticado mas sem permissão sobre o
  recurso (ex.: imóvel de outro corretor — RN-026).
- Rotas públicas (catálogo, página do imóvel) nunca exigem autenticação e
  nunca retornam campos internos (RN-049).
- Toda escrita é validada por schema Zod compartilhado entre cliente e
  servidor.
- A partir da Fase 2, a maior parte das mutações da própria UI usa
  **Server Actions** do Next.js (`src/features/*/actions.ts`), não
  chamadas diretas a endpoints REST pelo cliente — reduz JavaScript
  enviado ao navegador (RNF-026). Os endpoints REST abaixo existem e
  podem ser usados por integrações externas, mas não são o caminho
  usado pela própria interface.

## Autenticação (Fase 2 — implementada)

Todas as rotas abaixo são geradas pelo Better Auth
(`src/app/api/auth/[...all]/route.ts`, ver ADR-0002) e ficam sob
`/api/auth/`.

| Rota                               | Método | Descrição                                              |
| ---------------------------------- | ------ | ------------------------------------------------------ |
| `/api/auth/sign-up/email`          | POST   | Cria conta (RF-001)                                    |
| `/api/auth/sign-in/email`          | POST   | Login (RF-002)                                         |
| `/api/auth/sign-out`               | POST   | Logout (RF-003) — exige `Origin` válido (CSRF)         |
| `/api/auth/request-password-reset` | POST   | Solicita redefinição de senha (RF-004, RN-014)         |
| `/api/auth/reset-password`         | POST   | Redefine a senha a partir de um token (RF-005)         |
| `/api/auth/get-session`            | GET    | Sessão atual (usado internamente por `auth-policy.ts`) |

Rate limiting (RN-008) aplicado a `/sign-in/email` e `/sign-up/email`
(5 tentativas/60s) e a `/request-password-reset` (3/60s) — apenas em
produção (`NODE_ENV=production`); ver nota de dívida técnica em
`docs/quality/test-strategy.md` sobre por que fica desabilitado em
desenvolvimento/teste.

Todas as rotas de autenticação exigem cabeçalho `Origin` correspondente
a uma origem confiável (proteção CSRF nativa do Better Auth) e retornam
cookies de sessão `HttpOnly` (`Secure` em produção, `SameSite=Lax`).

Server Actions equivalentes, usadas pela própria UI
(`src/features/auth/actions.ts`): `registerAction`, `loginAction`,
`logoutAction`, `requestPasswordResetAction`, `resetPasswordAction`.

## Perfil do corretor (Fase 3 — implementada)

Sem endpoints REST próprios — implementado inteiramente via Server
Actions (`src/features/brokers/actions.ts`), chamadas diretamente pelos
componentes de formulário:

| Server Action                            | Descrição                                                    |
| ---------------------------------------- | ------------------------------------------------------------ |
| `saveProfileAction`                      | Cria/atualiza o perfil do corretor autenticado (RF-011)      |
| `checkSlugAvailabilityAction`            | Verifica disponibilidade de slug em tempo real (RF-012)      |
| `toggleCatalogAction`                    | Ativa/desativa o catálogo público (RF-016, RN-016 a RN-018)  |
| `uploadPhotoAction` / `uploadLogoAction` | Upload de foto/logotipo, com validação e compressão (RF-014) |

Leitura pública do catálogo: `GET /catalogo/{slug}` (página Next.js, não
uma API JSON) — retorna `404` quando o slug não existe ou o catálogo
está desativado (RN-022).

## Endpoints previstos por fase (ainda não implementados)

| Fase                   | Endpoints (previsão)                                                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4 — Imóveis            | `GET/POST /api/properties`, `GET/PUT/DELETE /api/properties/{id}`, `POST /api/properties/{id}/publish`, `POST /api/properties/{id}/unpublish`, `POST /api/properties/{id}/duplicate`, `POST /api/properties/{id}/media` |
| 5/6 — Catálogo público | `GET /api/public/catalog/{slug}`, `GET /api/public/catalog/{slug}/properties/{propertySlug}`                                                                                                                            |
| 7 — IA                 | `POST /api/ai/advertisements`                                                                                                                                                                                           |
| 8 — Artes              | `GET /api/artwork/templates`, `POST /api/artwork/generate`                                                                                                                                                              |
| 9 — Relatórios         | `GET /api/reports/summary`, `POST /api/analytics/events`                                                                                                                                                                |
| 10 — Administração     | `GET /api/admin/brokers`, `POST /api/admin/brokers/{id}/block`, `POST /api/admin/brokers/{id}/unblock` (mecanismo já disponível via plugin `admin` do Better Auth — `auth.api.banUser`/`unbanUser` — falta apenas a UI) |

Este documento será substituído por documentação detalhada (contrato de
entrada/saída de cada endpoint) conforme cada fase for implementada.
