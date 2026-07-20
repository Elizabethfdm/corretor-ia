# Arquitetura — Corretor IA

> Status: proposta da Fase 0, a ser implementada a partir da Fase 1.
> Decisões específicas com alternativas avaliadas ficam registradas em
> `docs/architecture/decisions/` (ADRs).

## 1. Visão geral

O Corretor IA será uma aplicação **Next.js (App Router)** full-stack em
**TypeScript estrito**, com renderização predominante no servidor para as
páginas públicas (catálogo e página do imóvel, por requisitos de SEO e
performance) e componentes de cliente localizados para interatividade
(formulários em etapas, upload, filtros).

```text
                    ┌───────────────────────────┐
                    │        Next.js App        │
                    │  (App Router, TS estrito)  │
                    │                             │
   Visitante ──────►│  Rotas públicas (RSC)       │
   Corretor  ──────►│  Rotas privadas (painel)    │──────► PostgreSQL (Prisma)
   Admin     ──────►│  Route Handlers (API)       │
                    │                             │──────► Storage compatível S3
                    │  lib/ai (AiContentProvider) │──────► Provedor de IA (abstraído)
                    └───────────────────────────┘
```

## 2. Camadas da aplicação

| Camada                | Responsabilidade                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `app/`                | Rotas (páginas e route handlers), agrupadas por contexto: `(auth)`, `(dashboard)`, `catalogo`, `api`                          |
| `components/`         | Componentes de UI reutilizáveis, sem regra de negócio                                                                         |
| `features/`           | Composição de UI + hooks específicos de cada domínio (auth, brokers, properties, catalog, advertisements, artwork, analytics) |
| `server/services`     | Regras de negócio e orquestração — ponto único onde regras RN-XXX são aplicadas                                               |
| `server/repositories` | Acesso a dados via Prisma, isolado por domínio                                                                                |
| `server/policies`     | Regras de autorização/isolamento por corretor (RN-001/RN-026)                                                                 |
| `lib/`                | Integrações técnicas transversais: `auth`, `database`, `storage`, `ai`, `analytics`, `validation`, `security`                 |
| `types/`              | Tipos compartilhados entre camadas                                                                                            |

**Regra arquitetural central:** nenhuma rota ou componente acessa o banco
de dados diretamente — toda escrita/leitura sensível passa por
`server/services`, que aplica `server/policies` antes de delegar a
`server/repositories`. Isso garante que o isolamento por corretor
(RN-026) seja aplicado em um único lugar, testável isoladamente.

## 3. Autenticação

Decisão detalhada em
[`decisions/0002-estrategia-autenticacao.md`](decisions/0002-estrategia-autenticacao.md).
Resumo: autenticação baseada em sessão segura no servidor (cookie
`HttpOnly`/`Secure`/`SameSite`), com senha em hash forte, usando uma
biblioteca de autenticação madura e mantida para Next.js em vez de
implementação própria de baixo nível (evita reinventar primitivas
criptográficas sensíveis).

## 4. Banco de dados e ORM

PostgreSQL como banco relacional principal, acessado via **Prisma** (ORM
maduro, tipado, com migrações versionadas nativamente — ver ADR de stack).
Justificativa resumida: tipagem forte alinhada ao TypeScript estrito,
migrações declarativas revisáveis em PR, e ampla adoção/manutenção ativa.

Ver modelo completo em [`data-model.md`](data-model.md).

## 5. Armazenamento de mídia

Decisão detalhada em
[`decisions/0003-armazenamento-de-imagens.md`](decisions/0003-armazenamento-de-imagens.md).
Resumo: serviço de objetos compatível com a API S3, com URLs públicas
para mídia de imóveis publicados e chaves de acesso restritas ao
servidor (upload nunca expõe credenciais ao cliente — usar upload via
URL assinada gerada no servidor).

## 6. Camada de IA

Decisão detalhada em
[`decisions/0004-abstracao-provedor-ia.md`](decisions/0004-abstracao-provedor-ia.md).
Resumo: interface `AiContentProvider` definida em `lib/ai`, com uma
implementação concreta por provedor. Nenhuma camada de negócio depende
diretamente do SDK de um fornecedor específico.

```typescript
interface AiContentProvider {
  generatePropertyAdvertisement(
    input: PropertyAdvertisementInput,
  ): Promise<PropertyAdvertisementOutput>;
}
```

## 7. Validação

Zod como única fonte de validação, com schemas compartilhados entre
formulários de cliente (React Hook Form + `zodResolver`) e revalidação
obrigatória no servidor antes de qualquer escrita — nunca confiar apenas
na validação do cliente (RNF-029).

## 8. Estrutura de pastas proposta

```text
src/
  app/
    (auth)/
    (dashboard)/
    catalogo/
    api/
  components/
    ui/
    forms/
    layout/
    property/
    catalog/
    reports/
  features/
    auth/
    brokers/
    properties/
    catalog/
    advertisements/
    artwork/
    analytics/
  lib/
    auth/
    database/
    storage/
    ai/
    analytics/
    validation/
    security/
  server/
    services/
    repositories/
    policies/
  types/
  styles/

prisma/
  schema.prisma
  migrations/
  seed.ts

tests/
  unit/
  integration/
  e2e/
  accessibility/
  fixtures/
  factories/
```

Esta estrutura será criada fisicamente na Fase 1 (Fundação do Projeto).
Ajustes futuros devem ser justificados em um ADR.

## 9. Ambiente local e CI

- **Docker** para banco de dados PostgreSQL local (e demais serviços que
  vierem a ser necessários), garantindo ambiente reproduzível.
- **GitHub Actions** para pipeline de CI: instalação determinística,
  formatação, lint, verificação de tipos, testes unitários, testes de
  integração, build, testes E2E e auditoria de dependências (ver
  `docs/planning/phases-plan.md`, Fase 1).

## 10. Decisões técnicas pendentes de validação com o proprietário do produto

Todas as demais decisões técnicas comuns já foram resolvidas nesta Fase 0
adotando a opção mais simples, seguem madura e documentada. Ficam
pendentes apenas decisões que afetam diretamente o produto ou o modelo de
negócio — ver seção "Decisões pendentes" em
[`docs/planning/phases-plan.md`](../planning/phases-plan.md).
