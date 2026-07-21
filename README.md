# Corretor IA

> **Status atual: Fase 7 — IA para Anúncios concluída.**
> Autenticação, perfil profissional, cadastro completo de imóveis, o
> catálogo público, a página individual do imóvel e a geração de
> anúncios com IA (Anthropic Claude, com provedor fake para dev/testes)
> estão funcionando de ponta a ponta. Criação de artes para redes
> sociais ainda não foi implementada — isso começa na Fase 8. Ver
> [`docs/planning/phases-plan.md`](docs/planning/phases-plan.md) para o
> plano completo por fases.

## 1. Visão geral

**Corretor IA** é uma aplicação web SaaS, responsiva e mobile-first,
destinada a corretores de imóveis autônomos. Permite cadastrar o imóvel uma
única vez, publicá-lo em um catálogo digital profissional, gerar anúncios
com inteligência artificial, criar artes para redes sociais e compartilhar
tudo pelo WhatsApp.

Documento completo de visão: [`docs/product/product-vision.md`](docs/product/product-vision.md).

## 2. Problema resolvido

Corretores autônomos costumam gastar tempo excessivo cadastrando o mesmo
imóvel em múltiplos lugares, escrevendo anúncios do zero e criando peças
gráficas manualmente. O Corretor IA centraliza esse fluxo: um único
cadastro alimenta o catálogo público, os anúncios gerados por IA e as artes
para redes sociais.

## 3. Funcionalidades da primeira versão (MVP)

- Cadastro e autenticação de corretores.
- Perfil profissional público (catálogo digital com URL própria).
- Cadastro de imóveis em etapas (rascunho até publicação).
- Catálogo público com busca, filtros e ordenação.
- Página individual do imóvel com galeria e contato via WhatsApp.
- Compartilhamento de imóveis, catálogo e resultados filtrados pelo
  WhatsApp.
- Geração de anúncios com IA (múltiplos canais e tons).
- Criação de artes para redes sociais a partir de modelos predefinidos.
- Relatório básico de acessos, cliques e compartilhamentos.

Escopo completo (dentro e fora do MVP):
[`docs/product/mvp-scope.md`](docs/product/mvp-scope.md).

## 4. Capturas de tela

_Pendente — a aplicação já tem interface navegável (autenticação,
painel, cadastro de imóveis, catálogo público) desde a Fase 5, mas
capturas de tela ainda não foram adicionadas a este documento._

## 5. Arquitetura

- **Frontend/Backend:** Next.js (App Router) com TypeScript em modo
  estrito.
- **Banco de dados:** PostgreSQL, acessado via Prisma ORM (driver
  adapter `@prisma/adapter-pg`).
- **Autenticação:** Better Auth (e-mail/senha, sessão em cookie seguro,
  ver ADR-0002).
- **E-mail transacional:** camada de abstração própria (`EmailProvider`),
  independente de fornecedor (ver ADR-0005).
- **Armazenamento de mídia:** serviço compatível com S3 (`@aws-sdk/client-s3`;
  MinIO em desenvolvimento local), com processamento de imagem via
  `sharp` — ver ADR-0003.
- **IA:** camada de abstração própria (`AiContentProvider`), independente
  de fornecedor — provedor real via Anthropic Claude (`@anthropic-ai/sdk`),
  provedor fake determinístico em dev/testes (ver ADR-0004).
- **Estilo:** Tailwind CSS.
- **Validação:** Zod (compartilhada entre cliente e servidor).
- **Formulários:** Server Actions + `useActionState`/`useFormStatus`
  nativos do React 19 (sem React Hook Form), incluindo o cadastro de
  imóveis em múltiplas etapas (Fase 4).
- **Testes:** Vitest (unitário e integração) e Playwright (E2E e
  acessibilidade).
- **Qualidade:** ESLint, Prettier, TypeScript estrito.
- **Infraestrutura local:** Docker.
- **CI/CD:** GitHub Actions.

Detalhamento completo: [`docs/architecture/architecture.md`](docs/architecture/architecture.md)
e [`docs/architecture/data-model.md`](docs/architecture/data-model.md).

## 6. Tecnologias

| Camada                      | Tecnologia                                                                       |
| --------------------------- | -------------------------------------------------------------------------------- |
| Framework web               | Next.js (App Router)                                                             |
| Linguagem                   | TypeScript (modo estrito)                                                        |
| UI                          | React + Tailwind CSS                                                             |
| Banco de dados              | PostgreSQL                                                                       |
| ORM                         | Prisma 7 (driver adapter `@prisma/adapter-pg`)                                   |
| Autenticação                | Better Auth (e-mail/senha, plugin `admin`)                                       |
| Validação                   | Zod                                                                              |
| Formulários                 | Server Actions + React 19 (`useActionState`)                                     |
| Armazenamento de mídia      | Compatível com S3 (`@aws-sdk/client-s3`; MinIO local) + `sharp`                  |
| IA (geração de anúncios)    | Anthropic Claude (`@anthropic-ai/sdk`); provedor fake em dev/testes              |
| Testes unitários/integração | Vitest (+ Testing Library)                                                       |
| Testes E2E                  | Playwright                                                                       |
| Qualidade de código         | ESLint + Prettier                                                                |
| Ambiente local              | Docker                                                                           |
| Integração contínua         | GitHub Actions                                                                   |

## 7. Pré-requisitos

- Node.js 22.x e npm 10.x (ver `.nvmrc`/`engines` — a validar no seu
  ambiente com `node -v`).
- Docker Desktop (ou Docker Engine + Compose) para PostgreSQL e MinIO
  locais.
- Git.

## 8. Instalação

```bash
npm install
```

O script `prepare` executa `prisma generate` automaticamente após o
`install`.

## 9. Configuração

```bash
cp .env.example .env
```

Preencha as variáveis conforme o seu ambiente. Nunca versione valores
reais — ver [`SECURITY.md`](SECURITY.md). No Windows com Docker Desktop,
use `127.0.0.1` (não `localhost`) em `DATABASE_URL`, pois a resolução de
`localhost` pode preferir IPv6 e travar a conexão.

## 10. Banco de dados e armazenamento de mídia

O modelo de dados está documentado em
[`docs/architecture/data-model.md`](docs/architecture/data-model.md).
Modelos implementados até agora: `user`/`session`/`account`/`verification`/`rateLimit`
(Better Auth), `AuditLog` e `BrokerProfile`.

```bash
# Sobe o PostgreSQL e o MinIO (S3-compatível) locais
docker compose up -d

# Aplica migrações pendentes
npm run db:migrate

# Abre o Prisma Studio para inspecionar o banco
npm run db:studio

# Executa o seed determinístico (placeholder até haver dados de domínio)
npm run db:seed
```

O console web do MinIO fica disponível em `http://localhost:9001`
(credenciais em `STORAGE_ACCESS_KEY_ID`/`STORAGE_SECRET_ACCESS_KEY` no
`.env`). O bucket é criado automaticamente pelo serviço `minio-init` do
`docker-compose.yml`.

## 11. Execução

```bash
npm run dev
```

Aplicação disponível em `http://localhost:3000`. Health check em
`http://localhost:3000/api/health` (verifica também a conexão com o
banco de dados). Fluxos de autenticação disponíveis em `/cadastro`,
`/login`, `/recuperar-senha` e `/redefinir-senha`; `/painel` e
`/painel/perfil` exigem login. Catálogo público em `/catalogo/{slug}`
(só acessível quando o corretor publica o catálogo).

## 12. Testes

A estratégia de testes (pirâmide de testes, tipos de teste, cobertura
esperada por fase) está documentada em
[`docs/quality/test-strategy.md`](docs/quality/test-strategy.md).

```bash
npm run test          # unitários + integração (Vitest) — exige Postgres local no ar
npm run test:coverage # idem, com relatório de cobertura
npm run test:e2e      # E2E + acessibilidade (Playwright) — builda e sobe a app automaticamente
npm run lint           # ESLint
npm run typecheck      # TypeScript em modo estrito
npm run format:check   # Verifica formatação (Prettier)
```

## 13. Pipeline de integração contínua

O pipeline de CI (`.github/workflows/ci.yml`) roda em todo push/PR para
`main`: instalação determinística, auditoria de dependências, geração do
Prisma Client, formatação, lint, verificação de tipos, migrações,
testes unitários/integração com cobertura, build de produção e testes
E2E/acessibilidade — publicando os relatórios como artefatos. Badges
serão adicionados ao README após a primeira execução bem-sucedida no
GitHub.

## 14. Segurança

Ver [`SECURITY.md`](SECURITY.md) e
[`docs/security/threat-model.md`](docs/security/threat-model.md).

## 15. Estrutura do repositório

```text
corretor-ia/
  README.md
  CLAUDE.md
  LICENSE
  SECURITY.md
  CONTRIBUTING.md
  CHANGELOG.md
  .gitignore
  .env.example
  docker-compose.yml
  playwright.config.ts
  vitest.config.ts
  prisma.config.ts
  src/
    app/                  # rotas Next.js (App Router) e route handlers de API
    components/            # ui, forms, layout, property, catalog, reports
    features/                # auth, brokers, properties, catalog, advertisements, artwork, analytics
    lib/                      # auth, database, storage, ai, analytics, validation, security, observability
    server/                    # services, repositories, policies
    types/
  prisma/
    schema.prisma
    seed.ts
  tests/
    unit/                       # Vitest
    integration/                 # Vitest (contra Postgres real)
    e2e/                           # Playwright
    accessibility/                  # Playwright + axe-core
    fixtures/ factories/              # dados de teste determinísticos (a partir da Fase 2)
  docs/
    product/            # visão, personas, jornadas, mapa de funcionalidades, escopo do MVP
    business-rules/      # regras de negócio numeradas (RN-xxx)
    requirements/        # requisitos funcionais (RF-xxx) e não funcionais (RNF-xxx)
    architecture/         # arquitetura, modelo de dados e decisões técnicas (ADRs)
    quality/               # estratégia de testes, DoR, DoD, matriz de rastreabilidade
    security/               # modelo de ameaças
    backlog/                 # épicos e histórias de usuário
    planning/                 # plano de fases e riscos
    api/                       # documentação de API (preenchida a partir da Fase 2)
    evidence/                   # evidências de execução de fases (capturas, logs, relatórios)
  .claude/
    rules/                       # regras permanentes consultadas pelo Claude Code
  .github/
    workflows/
      ci.yml                       # pipeline de qualidade (lint, testes, build, E2E)
```

## 16. Roadmap

Ver plano completo de fases em
[`docs/planning/phases-plan.md`](docs/planning/phases-plan.md). Resumo:

| Fase | Nome                        | Status       |
| ---- | --------------------------- | ------------ |
| 0    | Descoberta e planejamento   | Concluída    |
| 1    | Fundação do projeto         | Concluída    |
| 2    | Autenticação                | Concluída    |
| 3    | Perfil do corretor          | Concluída    |
| 4    | Cadastro de imóveis         | Concluída    |
| 5    | Catálogo digital            | Concluída    |
| 6    | Página individual do imóvel | Concluída    |
| 7    | IA para anúncios            | Concluída    |
| 8    | Artes                       | Não iniciada |
| 9    | Relatórios                  | Não iniciada |
| 10   | Hardening                   | Não iniciada |

## 17. Contribuição

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para o fluxo de trabalho, padrão de
commits e critérios de qualidade obrigatórios.

## 18. Licença

Ver [`LICENSE`](LICENSE). Modelo provisório de "todos os direitos
reservados" definido na Fase 0 — decisão sujeita a confirmação do
proprietário do produto.
