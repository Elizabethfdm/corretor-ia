# Documentação de API — Corretor IA

> Status: placeholder da Fase 0. Será preenchida progressivamente a
> partir da Fase 2 (Autenticação), conforme os route handlers forem
> implementados em `src/app/api`.

## Convenções previstas

- Rotas privadas exigem sessão válida; retornam `401` quando não
  autenticado e `403` quando autenticado mas sem permissão sobre o
  recurso (ex.: imóvel de outro corretor — RN-026).
- Rotas públicas (catálogo, página do imóvel) nunca exigem autenticação e
  nunca retornam campos internos (RN-049).
- Erros seguem o formato padronizado descrito em
  `docs/architecture/architecture.md` (a detalhar na Fase 1): código
  interno, mensagem segura para o usuário, identificador de correlação.
- Toda escrita é validada por schema Zod compartilhado entre cliente e
  servidor.

## Endpoints previstos por fase

| Fase                   | Endpoints (previsão)                                                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2 — Autenticação       | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/password/recover`, `POST /api/auth/password/reset`                                                                          |
| 3 — Perfil             | `GET/PUT /api/broker/profile`, `GET /api/broker/slug-availability`                                                                                                                                                      |
| 4 — Imóveis            | `GET/POST /api/properties`, `GET/PUT/DELETE /api/properties/{id}`, `POST /api/properties/{id}/publish`, `POST /api/properties/{id}/unpublish`, `POST /api/properties/{id}/duplicate`, `POST /api/properties/{id}/media` |
| 5/6 — Catálogo público | `GET /api/public/catalog/{slug}`, `GET /api/public/catalog/{slug}/properties/{propertySlug}`                                                                                                                            |
| 7 — IA                 | `POST /api/ai/advertisements`                                                                                                                                                                                           |
| 8 — Artes              | `GET /api/artwork/templates`, `POST /api/artwork/generate`                                                                                                                                                              |
| 9 — Relatórios         | `GET /api/reports/summary`, `POST /api/analytics/events`                                                                                                                                                                |
| 10 — Administração     | `GET /api/admin/brokers`, `POST /api/admin/brokers/{id}/block`, `POST /api/admin/brokers/{id}/unblock`                                                                                                                  |

Este documento será substituído por documentação detalhada (contrato de
entrada/saída de cada endpoint) conforme cada fase for implementada.
