# ADR-0001 — Stack tecnológica principal

- **Status:** Aceita
- **Data:** 2026-07-19
- **Decisores:** Arquitetura (decisão técnica comum — não bloqueante para
  o proprietário do produto)

## Contexto

O Prompt Mestre do projeto já recomenda explicitamente uma stack
("preferencialmente"): Next.js (App Router), TypeScript estrito, React,
PostgreSQL, Prisma, Tailwind CSS, Zod, React Hook Form, storage
compatível com S3, Playwright, Vitest/Jest, ESLint, Prettier, Docker e
GitHub Actions. Trata-se de uma decisão técnica comum, não de uma decisão
de produto — cabe à arquitetura confirmar e justificar, seguindo o
princípio de adotar a opção mais simples, seguro e bem documentada.

## Alternativas consideradas

| Camada                     | Escolhida                 | Alternativa considerada                         | Motivo da escolha                                                                                                                                                                                             |
| -------------------------- | ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework                  | Next.js (App Router)      | Remix, SPA (Vite + React Router) + API separada | Renderização híbrida (SSR/RSC) essencial para SEO do catálogo público e performance mobile; ecossistema maduro e amplamente mantido                                                                           |
| Linguagem                  | TypeScript estrito        | JavaScript puro                                 | Segurança de tipos reduz classe inteira de bugs, essencial dado o volume de regras de negócio                                                                                                                 |
| Banco de dados             | PostgreSQL                | MySQL, MongoDB                                  | Relacional maduro, suporta bem os relacionamentos do domínio (imóveis, mídia, endereço) e tipos monetários precisos; MongoDB evitado por RN explícita contra JSON quando estrutura relacional é mais adequada |
| ORM                        | Prisma                    | Drizzle ORM, TypeORM                            | Tipagem gerada automaticamente a partir do schema, migrações declarativas revisáveis, documentação oficial extensa e atualizada                                                                               |
| Estilo                     | Tailwind CSS              | CSS Modules, styled-components                  | Consistência visual rápida, baixo custo de manutenção, boa integração com Next.js                                                                                                                             |
| Validação                  | Zod                       | Yup, Joi                                        | Inferência de tipos TypeScript nativa a partir do schema, permitindo reaproveitar o mesmo schema no cliente e no servidor                                                                                     |
| Formulários                | React Hook Form           | Formik                                          | Melhor performance em formulários grandes/multi-etapa (cadastro de imóvel), boa integração com Zod via `zodResolver`                                                                                          |
| Storage de mídia           | Serviço compatível com S3 | Armazenamento em disco local/no banco           | Escalável, baixo custo inicial via camadas gratuitas de provedores compatíveis, evita acoplamento a um único fornecedor                                                                                       |
| Testes unitário/integração | Vitest                    | Jest                                            | Melhor integração nativa com o ecossistema Vite/TS moderno e tempo de execução menor; Jest permanece como alternativa equivalente caso a equipe prefira                                                       |
| Testes E2E                 | Playwright                | Cypress                                         | Suporte nativo a múltiplos motores (Chromium, Firefox, WebKit) e a múltiplos viewports, exigido pela estratégia de testes do projeto                                                                          |
| CI/CD                      | GitHub Actions            | GitLab CI, CircleCI                             | Já indicado no Prompt Mestre; integração nativa caso o repositório seja hospedado no GitHub                                                                                                                   |

## Decisão

Adotar integralmente a stack recomendada no Prompt Mestre. Qualquer
mudança futura de item desta tabela deve ser registrada em um novo ADR,
com justificativa e avaliação de impacto.

## Consequências

- A estrutura de pastas proposta em `docs/architecture/architecture.md`
  pressupõe esta stack.
- A instalação efetiva de dependências ocorre apenas na Fase 1, quando
  as versões exatas serão fixadas consultando a documentação oficial
  vigente no momento da implementação (nunca presumindo versões por
  conhecimento prévio desatualizado).

## Referências

- https://nextjs.org/docs
- https://www.prisma.io/docs
- https://www.prisma.io/docs vs. alternativas — reavaliar documentação
  oficial de cada biblioteca no início da Fase 1.

## Notas de implementação (Fase 1)

Versões efetivamente instaladas: Next.js 16.2.10, React 19.2.4,
TypeScript 5.9.x, Prisma/`@prisma/client` 7.8.0, Vitest 4.1.10,
Playwright 1.61.1, Tailwind CSS 4.

Duas descobertas relevantes ao consultar a documentação vigente destas
versões (nenhuma API foi presumida por conhecimento prévio):

1. **Prisma 7 exige driver adapter explícito.** Diferente de versões
   anteriores, `new PrismaClient()` sem argumentos não lê mais
   `DATABASE_URL` implicitamente do `schema.prisma`. É necessário
   instanciar com um adapter (`@prisma/adapter-pg` para PostgreSQL),
   conforme `src/lib/database/prisma.ts`. A URL de conexão para o CLI
   (migrate, studio, db pull) agora vive em `prisma.config.ts`, não mais
   em `datasource.url` no `schema.prisma`.
2. **Windows + Docker Desktop: usar `127.0.0.1`, não `localhost`.** A
   resolução de `localhost` pelo Node.js pode preferir IPv6 (`::1`),
   endereço que o proxy de porta do Docker Desktop no Windows não
   encaminha da mesma forma que IPv4 — a conexão trava sem erro
   explícito (timeout). `.env.example` e `.env` já usam `127.0.0.1`.

Vitest confirmado (sem uso de Jest). Estrutura de testes usa `test.projects`
(API estável do Vitest 4) para separar unitário (`jsdom`) de integração
(`node`, contra Postgres real via Docker), em vez do antigo arquivo
`vitest.workspace.ts`.
