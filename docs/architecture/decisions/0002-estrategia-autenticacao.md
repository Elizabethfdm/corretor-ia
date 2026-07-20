# ADR-0002 — Estratégia de autenticação

- **Status:** Aceita
- **Data:** 2026-07-19 (nível de estratégia) — atualizada em 2026-07-19
  (Fase 2, biblioteca confirmada)
- **Decisores:** Arquitetura / Segurança

## Contexto

O sistema precisa de cadastro, login, logout, recuperação e redefinição
de senha, verificação de e-mail (quando suportada), sessão segura e
proteção de rotas privadas (RF-001 a RF-010). Implementar primitivas
criptográficas de autenticação do zero é desaconselhado por risco de
segurança.

## Alternativas consideradas (nível de estratégia)

| Alternativa                                                                                                     | Prós                                                                                                    | Contras                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Biblioteca de autenticação madura para Next.js (ex.: solução de sessão baseada em cookies com adaptador Prisma) | Implementação testada em produção por terceiros, suporte a hashing seguro, gestão de sessão e providers | Exige avaliar a documentação vigente no momento da Fase 1 para confirmar compatibilidade com a versão do Next.js escolhida |
| Implementação própria de autenticação (hash manual + JWT manual)                                                | Controle total                                                                                          | Alto risco de erro em detalhes críticos de segurança (expiração, rotação, storage de sessão); não recomendado              |
| Serviço de autenticação totalmente terceirizado (ex.: Auth-as-a-Service)                                        | Menor esforço de manutenção                                                                             | Custo recorrente, dependência externa forte, possível fricção com requisito de baixo custo inicial (RNF-049)               |

## Alternativas consideradas (escolha da biblioteca — Fase 2)

Pesquisa feita consultando a documentação/registro npm vigentes em
2026-07-19 (nunca presumidas por conhecimento prévio):

| Biblioteca                                   | Versão observada                                             | Avaliação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth.js / NextAuth v5**                    | `5.0.0-beta.31` (tag `beta`); `4.24.14` é a `latest` estável | Descartada para o core do produto: a v5 (compatível com App Router "moderno") ainda está em **beta** há muito tempo — não atende ao critério de maturidade. A v4 estável é focada em OAuth, com suporte a credenciais (e-mail/senha) tratado como caso de segunda classe, sem fluxo nativo de reset de senha.                                                                                                                                                                                                           |
| **Better Auth**                              | `1.6.23` (estável, publicada há poucos dias)                 | **Escolhida.** `peerDependencies` declaram suporte explícito a `next ^14/15/16`, `react ^18/19`, `prisma ^5/6/7` — compatível com a stack instalada na Fase 1. E-mail/senha é fluxo de primeira classe (`emailAndPassword`), com reset de senha nativo, proteção contra enumeração de e-mail quando `requireEmailVerification`/`autoSignIn` configurados, rate limiting embutido por rota, e plugin `admin` oficial com `role`, `banned`, `banReason`, `banExpires` e bloqueio automático de login para usuário banido. |
| **Implementação própria**                    | —                                                            | Mantida como descartada pelos motivos já registrados na avaliação de estratégia acima.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Serviço terceirizado (Auth-as-a-Service)** | —                                                            | Mantida como descartada pelos motivos já registrados (custo recorrente, RNF-049).                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Decisão

Adotar o **Better Auth** (`better-auth`) com:

- Adapter Prisma (`better-auth/adapters/prisma`), usando o `@prisma/client`
  já configurado na Fase 1.
- `emailAndPassword.enabled = true`; hashing via `scrypt` nativo da
  biblioteca (recomendado pela OWASP quando Argon2id não está disponível)
  — sem necessidade de dependência nativa adicional (RN-005).
- `minPasswordLength: 8` (padrão da biblioteca, já atende RN-003); a
  exigência de "combinação mínima adequada de caracteres" (RN-003) é
  reforçada por schema Zod próprio (`lib/validation/auth.ts`) **antes**
  de chamar o `signUp` — a biblioteca valida comprimento, nosso schema
  valida composição.
- Plugin `admin` para o campo `role` (`broker`/`admin`) e para
  bloqueio/desbloqueio de conta (`banned`, `banReason`, `banExpires`),
  substituindo o campo conceitual `User.status` do modelo de dados
  original — mesma regra de negócio (RN-006), implementação nativa da
  biblioteca em vez de campo próprio.
- `rateLimit` com regras customizadas para `/sign-in/email` e
  `/sign-up/email` (RN-008), com storage em banco de dados em produção
  (evita perda de estado do rate limit em reinícios do processo).
- `additionalFields` no `user` para `termsAcceptedAt` e
  `privacyAcceptedAt` (tipo `date`, `input: false` — nunca setados
  diretamente pelo cliente; sempre carimbados pelo nosso `server action`
  de cadastro via `databaseHooks.user.create.before`, e somente depois de
  validar que os dois aceites vieram marcados no formulário — RN-011).
- Fluxo de redefinição de senha via `sendResetPassword` (RN-014):
  resposta idêntica independente de o e-mail existir ou não, sem
  enumeração.
- Cookies de sessão seguros por padrão da biblioteca (`Secure` em
  produção, proteção CSRF nativa habilitada por padrão) — RN-012,
  RNF-034, RNF-035.
- CLI oficial (`npx @better-auth/cli generate`) para gerar/atualizar os
  models `user`, `session`, `account`, `verification` no
  `prisma/schema.prisma`, seguido de `prisma migrate dev` para a
  migração real.

Login social (Google, Facebook etc.) **não** está no escopo do MVP —
apenas e-mail/senha, conforme `docs/product/mvp-scope.md`.

## Consequências

- O campo conceitual `User.status` (enum `ACTIVE`/`BLOCKED`) do modelo de
  dados original é implementado como `user.banned` (booleano) do plugin
  `admin`, com `banReason`/`banExpires` complementares — mais expressivo
  que o enum original. `docs/architecture/data-model.md` recebe uma nota
  de implementação explicando essa correspondência.
- `User.passwordHash` não existe como coluna própria: a senha (hash
  `scrypt`) fica na tabela `account` do Better Auth (`providerId =
"credential"`), padrão da biblioteca para permitir múltiplos métodos de
  login por usuário no futuro sem quebrar o schema.
- A recuperação/redefinição de senha e a verificação de e-mail dependem
  de um provedor de envio de e-mail — ver ADR-0005
  (`0005-envio-de-email-transacional.md`), que define uma camada abstrata
  com implementação de log para desenvolvimento/teste, deixando o
  provedor real de produção como decisão pendente (não bloqueia o
  desenvolvimento).
- Entidades de suporte (`user`, `session`, `account`, `verification`) são
  geradas e mantidas pelo CLI do Better Auth; qualquer campo adicional de
  domínio deve ser adicionado via `additionalFields`, nunca editando os
  models gerados manualmente de forma incompatível com o schema esperado
  pela biblioteca.

## Referências

- https://www.better-auth.com/docs/installation
- https://www.better-auth.com/docs/authentication/email-password
- https://www.better-auth.com/docs/plugins/admin
- https://www.better-auth.com/docs/concepts/rate-limit
- https://www.better-auth.com/docs/concepts/session-management
- https://www.better-auth.com/docs/concepts/typescript (additionalFields)
- Registro npm consultado em 2026-07-19: `better-auth@1.6.23`,
  `next-auth@4.24.14` (latest) / `5.0.0-beta.31` (beta)
