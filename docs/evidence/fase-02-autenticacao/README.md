# Evidências — Fase 2 (Autenticação)

Data: 2026-07-20. Ambiente: Windows 11, Node v22.22.2, npm 10.9.7,
Docker 29.6.1 (PostgreSQL local via `docker-compose.yml`).

## Decisão de biblioteca

Better Auth `1.6.23` escolhido após pesquisa comparativa com Auth.js/
NextAuth (v5 ainda em beta na data da pesquisa). Detalhamento completo
em [`docs/architecture/decisions/0002-estrategia-autenticacao.md`](../../architecture/decisions/0002-estrategia-autenticacao.md).

## Comandos executados e resultado

| Comando                                   | Resultado                                                                                                                                                                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                    | Sem problemas                                                                                                                                                                                                                                                        |
| `npm run lint`                            | 0 erros, 0 warnings                                                                                                                                                                                                                                                  |
| `npm run typecheck`                       | Sem erros (TypeScript modo estrito)                                                                                                                                                                                                                                  |
| `npm run test:coverage` (Vitest)          | 8 arquivos de teste, **53 testes**, todos aprovados (29 unitários + 24 integração)                                                                                                                                                                                   |
| `npm run build`                           | Build de produção concluído com sucesso                                                                                                                                                                                                                              |
| `npm run test:e2e` (Playwright)           | **80 testes aprovados** em 5 projetos (`chromium-desktop`, `firefox-desktop`, `webkit-desktop`, `mobile`, `tablet`), incluindo acessibilidade (`@axe-core/playwright`) sem violações WCAG A/AA nas telas de autenticação, inclusive com formulário em estado de erro |
| `npx prisma migrate dev --name init_auth` | Primeira migração real aplicada com sucesso: `user`, `session`, `account`, `verification`, `rateLimit`, `audit_log`                                                                                                                                                  |
| `npm audit --audit-level=high`            | 0 vulnerabilidades altas/críticas                                                                                                                                                                                                                                    |

## Verificação empírica de comportamento da biblioteca

Antes de escrever código de produção, o comportamento real do Better
Auth foi verificado com scripts descartáveis contra o Postgres local
(nunca dados reais), consultando também a documentação oficial vigente
via WebFetch — nenhuma API foi presumida por conhecimento prévio:

1. **Formato de resposta de `signUpEmail`/`signInEmail`** — confirmado
   `{ token, user: {...} }`, com `role: "broker"` (padrão configurado),
   `banned: false`, `termsAcceptedAt`/`privacyAcceptedAt` carimbados
   automaticamente pelo hook `databaseHooks.user.create.before`.
2. **Hash de senha** — verificado que `account.password` nunca contém o
   texto puro da senha (RN-005).
3. **Cookie de sessão** — verificado via HTTP real (`curl`) que o
   cookie `better-auth.session_token` é `HttpOnly`, `SameSite=Lax`
   (e `Secure` em produção), confirmando RN-012/RNF-035.
4. **CSRF** — verificado que requisições `POST` sem cabeçalho `Origin`
   válido são rejeitadas com `403 MISSING_OR_NULL_ORIGIN` (proteção
   nativa habilitada por padrão).
5. **`signOut`** — verificado que revoga a sessão no banco (registro
   removido de `session`) e limpa os cookies (`Max-Age=0`).
6. **Bloqueio de conta (`banned`)** — verificado que uma conta com
   `banned = true` não consegue autenticar (RN-006).
7. **Link de redefinição de senha** — corrigido para usar o campo
   `token` do callback `sendResetPassword` (não a `url` padrão da
   biblioteca, que aponta para uma rota intermediária da própria API),
   construindo um link direto para `/redefinir-senha?token=...`,
   consistente com o formulário implementado. Fluxo completo
   (solicitar → extrair token da tabela `verification` → redefinir →
   logar com a nova senha) verificado de ponta a ponta.

## Problema identificado e corrigido durante o desenvolvimento

Ao rodar a suíte E2E completa (5 navegadores em paralelo), o rate
limiting de autenticação (RN-008) começou a bloquear a própria suíte de
testes com respostas `429` legítimas — na prática, uma confirmação de
que a proteção funciona. Como `next start` sempre define
`NODE_ENV=production` (inclusive quando o Playwright sobe o servidor
para os testes), o rate limiting foi condicionado também a uma flag
própria (`E2E_DISABLE_RATE_LIMIT`, setada apenas em
`playwright.config.ts`), preservando a proteção em produção real sem
travar a suíte. Ver dívida técnica registrada em
`docs/quality/test-strategy.md` (seção 12) sobre a cobertura automatizada
dedicada a esse comportamento, hoje verificada apenas empiricamente.

## Critérios de conclusão da fase (checklist)

- [x] Cadastro, login, logout, recuperação e redefinição de senha
      funcionando de ponta a ponta
- [x] Conta bloqueada não acessa o painel (RN-006)
- [x] Mensagens de erro de autenticação genéricas (RN-007)
- [x] Rate limiting configurado (RN-008, ativo em produção)
- [x] Rotas privadas protegidas; usuário autenticado redirecionado para
      fora de login/cadastro (RN-009, RN-010)
- [x] Sessão segura (`HttpOnly`, `Secure` em produção, `SameSite`) —
      RN-012
- [x] Aceite de Termos de Uso e Política de Privacidade obrigatório e
      carimbado (RN-011)
- [x] Trilha de auditoria para eventos de autenticação (RN-094)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` passando
- [x] Testes unitários, de integração e E2E passando
- [x] Nenhum segredo real versionado
- [x] Documentação atualizada (data model, matriz de rastreabilidade,
      ADRs, README, CHANGELOG)
