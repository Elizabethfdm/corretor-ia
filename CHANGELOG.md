# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue as recomendações do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/) a
partir da primeira versão publicada.

## [Não lançado]

### Adicionado — Fase 1 (Fundação do Projeto)

- Projeto Next.js 16 (App Router) com TypeScript em modo estrito e
  Tailwind CSS 4.
- Estrutura de pastas de domínio (`src/app`, `components`, `features`,
  `lib`, `server`, `types`) e de testes (`tests/{unit,integration,e2e,accessibility,fixtures,factories}`).
- Prisma 7 configurado com driver adapter PostgreSQL
  (`@prisma/adapter-pg`) e `docker-compose.yml` para banco local.
- ESLint + `eslint-config-prettier` e Prettier (com plugin Tailwind).
- Vitest (unitário + integração via `test.projects`) e Playwright (E2E +
  acessibilidade com `@axe-core/playwright`), cobrindo Chromium, Firefox,
  WebKit, mobile e tablet.
- Logger estruturado com redação de campos sensíveis
  (`src/lib/observability/logger.ts`) e identificador de correlação
  (`src/lib/observability/correlation-id.ts`).
- Endpoint de health check (`/api/health`), incluindo verificação de
  conexão com o banco.
- Pipeline de CI (`.github/workflows/ci.yml`): instalação determinística,
  auditoria de dependências, geração do Prisma Client, formatação, lint,
  verificação de tipos, migrações, testes com cobertura, build e E2E.
- `README.md` e `CLAUDE.md` atualizados com comandos reais de instalação,
  configuração, banco de dados, execução e testes.
- ADR-0001 atualizado com as versões efetivamente instaladas e duas
  descobertas de implementação (driver adapter obrigatório no Prisma 7;
  uso de `127.0.0.1` em vez de `localhost` no Windows com Docker
  Desktop).

Nenhuma funcionalidade de negócio (autenticação, perfil, imóveis etc.) foi
implementada nesta fase — `prisma/schema.prisma` permanece sem modelos de
domínio, que chegam na Fase 2.

### Adicionado — Fase 0 (Descoberta e Planejamento)

- Estrutura inicial de documentação do projeto (`/docs`).
- Visão de produto, personas, jornadas e mapa de funcionalidades.
- Escopo e fora de escopo da primeira versão (MVP).
- Regras de negócio numeradas (RN-xxx).
- Requisitos funcionais (RF-xxx) e não funcionais (RNF-xxx) numerados.
- Modelo de dados inicial e proposta de arquitetura técnica.
- Registros de decisão de arquitetura (ADRs) para autenticação, storage de
  imagens e abstração do provedor de IA.
- Estratégia de testes, Definition of Ready, Definition of Done e matriz de
  rastreabilidade inicial.
- Modelo de ameaças e estratégia de segurança preliminar.
- Backlog inicial priorizado com histórias de usuário em Given/When/Then.
- Plano de implementação por fases (Fase 0 a Fase 10).
- Arquivos de governança do repositório: `README.md`, `CLAUDE.md`,
  `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`, `.gitignore`, `.env.example`.

Nenhum código funcional, dependência, banco de dados ou infraestrutura foi
criado nesta fase, conforme definição do escopo da Fase 0.
