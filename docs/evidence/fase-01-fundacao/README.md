# Evidências — Fase 1 (Fundação do Projeto)

Data: 2026-07-19. Ambiente: Windows 11, Node v22.22.2, npm 10.9.7, Docker
29.6.1, Docker Desktop (PostgreSQL local via `docker-compose.yml`).

## Comandos executados e resultado

| Comando | Resultado |
|---|---|
| `npm run format:check` | Sem problemas — todos os arquivos seguem o Prettier |
| `npm run lint` | 0 erros, 0 warnings |
| `npm run typecheck` | Sem erros (TypeScript modo estrito) |
| `npm run test:coverage` (Vitest — unitário + integração) | 3 arquivos, 10 testes, todos aprovados. Cobertura: 87,23% statements / 67,74% branches / 90% funções / 87,23% linhas (módulos `lib/observability`, `lib/database`, `app/api/health`) |
| `npm run build` | Build de produção concluído com sucesso (Next.js 16, Turbopack). Rotas: `/` (estática), `/_not-found` (estática), `/api/health` (dinâmica) |
| `npm run test:e2e` (Playwright — E2E + acessibilidade) | 15 testes aprovados em 5 projetos: `chromium-desktop`, `firefox-desktop`, `webkit-desktop`, `mobile` (Pixel 7), `tablet` (iPad gen 7). Inclui varredura de acessibilidade (`@axe-core/playwright`, tags `wcag2a`/`wcag2aa`) sem violações na página inicial |
| `docker compose up -d` + `npx prisma db pull --print` | Conexão com o PostgreSQL local confirmada (erro esperado `P4001`, pois o banco ainda não tem tabelas — nenhum modelo de domínio existe até a Fase 2) |
| `npm audit --audit-level=high` | 0 vulnerabilidades de severidade alta/crítica. 5 vulnerabilidades moderadas em dependências transitivas de ferramentas de desenvolvimento (não usadas em produção): `postcss` embutido no `next` e `@hono/node-server` usado pelo comando opcional `prisma dev` (não utilizado neste projeto, que usa Docker Compose) |

## Descobertas registradas

Documentadas em [`docs/architecture/decisions/0001-stack-tecnologica.md`](../../architecture/decisions/0001-stack-tecnologica.md)
(seção "Notas de implementação"):

1. Prisma 7 exige driver adapter explícito (`@prisma/adapter-pg`) — não lê
   mais `DATABASE_URL` implicitamente via `new PrismaClient()`.
2. No Windows com Docker Desktop, `DATABASE_URL` deve usar `127.0.0.1` em
   vez de `localhost` para evitar travamento de conexão por resolução
   IPv6.

## Critérios de conclusão da fase (checklist)

- [x] `npm run lint`, `npm run typecheck`, `npm run build` passando
- [x] `npm run test` (unitário + integração) passando
- [x] `npm run test:e2e` passando nos motores e viewports definidos
- [x] `docker compose up` sobe o PostgreSQL local e a aplicação se conecta
- [x] Health check (`/api/health`) responde e verifica o banco
- [x] CI configurado (`.github/workflows/ci.yml`) — execução real pendente
      do primeiro push ao GitHub
- [x] Nenhum segredo real versionado (`.env` fica fora do Git; `.env.example`
      contém apenas placeholders)
- [x] Documentação atualizada (README, CLAUDE.md, ADR-0001, CHANGELOG,
      plano de fases)
