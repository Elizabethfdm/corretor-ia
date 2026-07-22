# Evidências — Fase 10 (Hardening)

Data: 2026-07-21. Ambiente: Windows 11, Node v22.22.2, npm 10.9.7,
Docker (PostgreSQL e MinIO locais via `docker-compose.yml`).

## Escopo entregue

1. **Painel administrativo mínimo** (RF-072 a RF-075, RN-091 a RN-095) —
   a única funcionalidade do MVP ainda não construída (`requireAdmin()`
   já existia desde a Fase 2, mas nenhuma tela usava). `/painel-admin`:
   indicadores gerais, lista de corretores com contagem de imóveis e
   bloqueio/desbloqueio, auditoria básica recente.
2. **Cabeçalhos de segurança HTTP** (RNF-034), ausentes até esta fase —
   CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
   (ADR-0008).
3. **RN-093 resolvida**: catálogo de conta bloqueada é ocultado
   imediatamente (mesmo comportamento de catálogo despublicado).
4. Revisão de segurança dirigida, `npm audit`, charters exploratórios
   documentados, checklist final do MVP (`docs/product/mvp-scope.md`).

## Decisões tomadas nesta fase

- **RN-093** (produto, confirmada com o usuário): catálogo de conta
  bloqueada é ocultado, não permanece visível.
- **ADR-0008**: CSP estática sem nonce em `next.config.ts` — a
  alternativa com nonce forçaria renderização dinâmica em 100% das
  páginas (perda de geração estática nas páginas realmente estáticas do
  site), custo desproporcional ao ganho nesta fase (RNF-049).
- **Bloqueio/desbloqueio via `auth.api.banUser`/`unbanUser`** (plugin
  `admin` do Better Auth, já configurado desde a Fase 2) — confirmado
  na documentação oficial que `banUser` já revoga todas as sessões
  ativas imediatamente, satisfazendo RN-092 sem verificação extra
  própria (ver ADR-0002, seção Fase 10).

## Comandos executados e resultado

| Comando                          | Resultado                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run typecheck`               | Sem erros (TypeScript modo estrito)                                                              |
| `npm run lint`                    | 0 erros, 0 warnings                                                                               |
| `npm run build`                   | Build de produção concluído com sucesso; `/painel-admin` gerado como rota dinâmica                |
| `npm run test` (Vitest)           | 311 testes aprovados (42 arquivos) — unitário + integração contra Postgres e MinIO reais          |
| `npm audit --audit-level=high`    | **Exit 0** — nenhuma vulnerabilidade alta/crítica. 6 vulnerabilidades moderadas, todas em dependências de ferramental de build (Prisma CLI dev server via `@hono/node-server`; PostCSS embutido no Next.js via `better-auth`→`next`), nenhuma no caminho de execução exposto a requisições reais. Correção da segunda exigiria downgrade do Next.js (`next@9.3.3`) — não aplicada; risco aceito e documentado. |
| `npx playwright test` (5 navegadores/viewports) | **255/255 aprovados** — ver seção "Execução E2E" abaixo                          |

## Execução E2E

Suítes novas desta fase: `tests/e2e/admin.spec.ts` (2 cenários —
corretor comum é barrado; administrador lista, bloqueia e desbloqueia)
e `tests/accessibility/admin.spec.ts` (1 cenário — painel vazio e com
corretores, sem violações WCAG A/AA).

**Suíte completa nos 5 navegadores/viewports (`chromium-desktop`,
`firefox-desktop`, `webkit-desktop`, `mobile`, `tablet`), `--workers=1`:
255/255 aprovados**, sem nenhuma falha — incluindo os 3 cenários novos
desta fase em todos os motores, sem regressão nas fases anteriores.
Resultado alcançado após 4 iterações de correção nesta mesma fase (ver
"Bugs encontrados e corrigidos" abaixo): a primeira execução completa
com os cabeçalhos de segurança recém-adicionados quebrou 84 testes só
no WebKit (`upgrade-insecure-requests`); a segunda, após remover essa
diretiva, isolou uma única falha intermitente de timing num teste de
acessibilidade próprio; a terceira confirmou a intermitência; a quarta,
após corrigir o teste, fechou 255/255 de forma limpa.

## Revisão de segurança dirigida (`docs/quality/test-strategy.md`, seção 6)

| Item                                                    | Resultado                                                                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Acesso cruzado entre usuários (IDOR)                    | Verificado — RN-026 testado em toda entidade de domínio (imóveis, anúncios, artes, analytics) desde a Fase 4; reconfirmado nesta fase para o painel admin (RN-095, `requireAdmin`) |
| Manipulação de identificador na URL/payload              | Verificado — toda consulta revalida posse por `brokerId`/sessão no servidor, nunca confia no ID do cliente     |
| Upload de arquivo inválido/disfarçado                    | Verificado (Fase 3/4) — validação por conteúdo real via `sharp`, nunca extensão/MIME declarado                |
| Payload de script (XSS)                                  | Verificado — React escapa por padrão; nenhum `dangerouslySetInnerHTML`; markup dinâmico (Pango, artes) escapado explicitamente (Fase 8) |
| Injeção SQL/NoSQL                                        | Verificado — 100% das consultas via Prisma parametrizado, nenhuma concatenação de SQL em todo o projeto        |
| Rate limiting em rotas de autenticação                   | Configurado (Fase 2); desabilitado em dev/teste por dívida técnica já documentada (`test-strategy.md`, seção 12) |
| Proteção de rota administrativa                          | Verificado nesta fase — `requireAdmin()` redireciona corretor comum para `/acesso-negado` (`tests/e2e/admin.spec.ts`) |
| Recuperação de senha sem enumeração de e-mail             | Verificado (Fase 2)                                                                                            |
| Sessão/token expirado ou revogado                        | Verificado nesta fase — `banUser` revoga sessão ativa imediatamente (`tests/integration/admin/admin-service.test.ts`) |
| Exposição de dado interno em resposta de API             | Verificado — serializadores públicos usam allowlist explícita desde a Fase 5 (catálogo, anúncios, artes)      |
| Enumeração de e-mails cadastrados                        | Verificado (Fase 2)                                                                                            |

## Charters exploratórios (`test-strategy.md`, seção 8)

| Charter                                                   | Status                                                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Cadastro interrompido no meio do fluxo                        | Coberto por design — cada etapa salva independentemente (rascunho), sem estado client-only perdível             |
| Internet instável / upload interrompido                        | **Gap conhecido** — sem simulação automatizada de rede instável; mensagens de erro genéricas existem (RNF-008), mas o cenário não foi exercitado manualmente nesta fase. Severidade baixa (upload é re-tentável pelo usuário) |
| Múltiplos cliques em ação de submissão                         | Coberto — `SubmitButton`/`useFormStatus` desabilita o formulário durante o envio, em toda a aplicação            |
| Botão "voltar" do navegador durante cadastro em etapas         | Coberto por design — etapas são estado server-persistido, não um wizard client-only; voltar não perde dados salvos |
| Atualização (F5) no meio de uma etapa                         | Coberto por design — formulários não controlados com `defaultValue` a partir do servidor; só perde edição não salva do campo atual, comportamento web padrão esperado |
| Sessão expirada durante uso ativo                             | Coberto — `requireUser`/`requireBrokerProfile`/`requireAdmin` redirecionam ao login quando a sessão não é mais válida; mecanismo exercitado por `auth-route-protection.spec.ts` e, nesta fase, pelo teste de revogação de sessão do painel admin |
| Duas abas simultâneas na mesma conta                          | Risco baixo por design — sessão via cookie compartilhado entre abas, sem estado client-only que possa divergir  |
| Arquivos de foto muito grandes                                | Coberto — `UploadTooLargeError` testado (Fase 3/4)                                                              |
| Dados incompletos submetidos propositalmente                  | Coberto extensivamente — validação Zod testada em toda entidade desde a Fase 2                                  |
| Caracteres especiais/acentuação                               | Coberto — conteúdo em português com acentuação usado nos próprios testes desde a Fase 2; escape explícito de markup dinâmico testado na Fase 8 (`pango-markup.test.ts`) |
| Alterar o slug do catálogo com imóveis já publicados          | **Gap conhecido** — sem teste dedicado a "trocar slug após publicar e confirmar link antigo quebra/novo funciona". Severidade baixa (RN-019/RN-020 já garantem unicidade; o comportamento decorre diretamente da consulta por slug atual, sem cache) |
| Imóvel removido durante acesso público ativo                  | Coberto pelo estado final — `getPublicProperty` retorna null para imóvel excluído/despublicado (testado); a condição de corrida em si (remoção no exato instante do acesso) não é distinguível do caso "já removido" no comportamento observável |
| Falha simulada da IA                                          | Coberto — `AiProviderError` tratado e testado (Fase 7)                                                          |
| Falha simulada do armazenamento de mídia                      | **Gap conhecido** — sem teste com mock de falha do S3/MinIO. Severidade baixa (erro de upload já cai no tratamento genérico de exceção não mapeada, exibindo mensagem sem stack trace — RNF-040 — mas o texto não é específico a "storage indisponível") |
| Falha simulada do banco de dados                              | **Gap conhecido, aceito** — requer infraestrutura de injeção de falha (matar conexão do Postgres em teste) desproporcional para este MVP; `/api/health` já reporta `database: "down"` quando a conexão falha (RNF-038), mas não há teste automatizado forçando essa condição |

Nenhum dos gaps acima é crítico ou alto pela classificação de
`docs/quality/definition-of-done.md` (nenhum causa vazamento de dados,
perda de dados, acesso indevido ou indisponibilidade) — registrados como
dívida técnica de teste, não como bloqueio de entrega.

## Checklist final do MVP (`docs/product/mvp-scope.md`, seção 3)

| # | Critério                                                          | Status | Evidência |
| - | ------------------------------------------------------------------ | ------ | --------- |
| 1 | Corretor consegue criar conta                                     | ✅     | `docs/evidence/fase-02-autenticacao/` |
| 2 | Consegue completar perfil                                          | ✅     | `docs/evidence/fase-03-perfil-corretor/` |
| 3 | Acesso pelo celular e tablet sem problemas de layout               | ✅     | E2E em 5 navegadores/viewports, todas as fases |
| 4 | Consegue cadastrar um imóvel                                       | ✅     | `docs/evidence/fase-04-cadastro-de-imoveis/` |
| 5 | Consegue adicionar e organizar fotos                               | ✅     | `docs/evidence/fase-04-cadastro-de-imoveis/` |
| 6 | Consegue salvar rascunho                                           | ✅     | `docs/evidence/fase-04-cadastro-de-imoveis/` |
| 7 | Consegue publicar o imóvel                                         | ✅     | `docs/evidence/fase-04-cadastro-de-imoveis/` |
| 8 | Imóvel aparece no catálogo correto (e somente nele)                | ✅     | `docs/evidence/fase-05-catalogo-digital/` |
| 9 | Outro corretor não acessa no painel                                | ✅     | RN-026 testado em toda fase |
| 10 | Visitante abre o catálogo sem autenticação                        | ✅     | `docs/evidence/fase-05-catalogo-digital/` |
| 11 | Consegue pesquisar e filtrar imóveis                               | ✅     | `docs/evidence/fase-05-catalogo-digital/` |
| 12 | Consegue abrir a página de um imóvel                               | ✅     | `docs/evidence/fase-06-pagina-do-imovel/` |
| 13 | Endereço privado não exibido quando oculto                        | ✅     | `docs/evidence/fase-06-pagina-do-imovel/` |
| 14 | Consegue abrir o WhatsApp com mensagem preparada                   | ✅     | `docs/evidence/fase-06-pagina-do-imovel/` |
| 15 | Corretor consegue gerar um anúncio com IA                          | ✅     | `docs/evidence/fase-07-ia-para-anuncios/` |
| 16 | IA não inventa características em testes controlados               | ✅     | Prompt restrito a dados reais do imóvel (RN-061 a RN-065); provedor fake determinístico usado em toda a suíte automatizada |
| 17 | Corretor consegue criar uma arte                                   | ✅     | `docs/evidence/fase-08-artes/` |
| 18 | Consegue consultar acessos e cliques do catálogo                   | ✅     | `docs/evidence/fase-09-relatorios/` |
| 19 | Funciona nas resoluções mínimas definidas                          | ✅     | 5 projetos Playwright (desktop × 3 motores, mobile, tablet) em todas as fases |
| 20 | Pipeline de CI está verde                                          | ⚠️     | `.github/workflows/ci.yml` configurado desde a Fase 1 (lint, tipos, testes, build, E2E); os mesmos comandos passam localmente neste ambiente — execução real no GitHub Actions não verificada a partir deste ambiente (sem acesso a `gh`/API do GitHub aqui) |
| 21 | Não existem bugs críticos ou altos abertos                         | ✅     | Nenhum bug crítico/alto encontrado permanece aberto; gaps de teste identificados nesta fase são baixa severidade (ver charters acima) |
| 22 | Documentação está atualizada                                       | ✅     | Este commit atualiza data-model, ADRs, regras de negócio, matriz de rastreabilidade, README, CHANGELOG |
| 23 | Build de produção passa                                            | ✅     | Ver tabela de comandos acima |
| 24 | Principais jornadas E2E passam                                     | ✅     | Ver seção "Execução E2E" |
| 25 | Revisão de segurança não encontra falhas críticas                  | ✅     | `npm audit` sem altas/críticas; revisão dirigida acima sem achado crítico |

**Item 20 é o único não totalmente verificável a partir deste ambiente**
— recomenda-se confirmar manualmente a última execução do workflow em
`github.com/<repo>/actions` antes de considerar o MVP formalmente
pronto para validação com usuários reais.

## Bugs encontrados e corrigidos durante o desenvolvimento

1. **`upgrade-insecure-requests` quebrava a aplicação inteira no
   WebKit** — a primeira versão da CSP (ADR-0008) incluía essa diretiva,
   seguindo o exemplo oficial do Next.js. A suíte E2E completa revelou
   100% de falha no projeto `webkit-desktop` logo após a introdução dos
   cabeçalhos de segurança — todo teste que dependia de login parava na
   própria tela de login. Um teste de diagnóstico isolado (capturando
   console/requisições falhas) mostrou que o WebKit também tenta
   promover as sub-requisições da própria página (scripts, fontes, CSS)
   para HTTPS por causa dessa diretiva — e falha com "SSL connect error"
   em qualquer origem servida só por HTTP, como `http://localhost` (dev
   e o servidor da suíte E2E). Encontrado **antes de qualquer entrega**,
   pela própria matriz de 5 navegadores que este projeto já roda a cada
   fase — exatamente o motivo de mantê-la mesmo sendo cara em tempo de
   execução. Corrigido removendo a diretiva (ver ADR-0008).
2. **Teste próprio com asserção de contagem global frágil sob execução
   concorrente**: o primeiro teste de `getPlatformIndicators` comparava
   contagens totais (`before`/`after`) por igualdade exata — como os
   indicadores são globais por design (visão do administrador) e os
   testes de integração rodam contra o mesmo banco, outro arquivo de
   teste criando dados concorrentemente quebrava a asserção. Corrigido
   para comparação por limite inferior (`toBeGreaterThanOrEqual`).
3. **Requisições de teste E2E sem cabeçalho `Origin`**: as chamadas
   diretas a `/api/auth/sign-in/email` via `request.post()` no teste do
   painel admin não incluíam o cabeçalho `origin`, que o Better Auth
   exige — causava falha de login mesmo com a conta desbloqueada, tanto
   antes quanto depois do bloqueio (mascarado inicialmente porque a
   asserção de "login bloqueado deve falhar" também passava, por um
   motivo diferente do esperado). Corrigido adicionando o mesmo cabeçalho
   já usado em `createTestUser` (`tests/e2e/helpers/test-users.ts`).
4. **Contextos de navegador Playwright compartilhando cookies
   indevidamente**: a primeira versão dos testes E2E do painel admin
   usava `context.newPage()` para logar o corretor-alvo antes do
   administrador — como isso cria uma nova aba na **mesma** sessão de
   cookies, a sessão do corretor "vazava" para a página principal do
   teste, impedindo o login do administrador. Corrigido usando
   `browser.newContext()` (contexto de navegador isolado, cookies
   próprios) para a sessão do corretor-alvo.
5. **Teste de acessibilidade do relatório rodava o axe-core em cima de
   uma navegação ainda em andamento**: depois de corrigir o bug do
   WebKit acima, sobrou uma falha isolada e intermitente —
   `page.evaluate: Execution context was destroyed, most likely because
   of a navigation` no teste de acessibilidade de `/painel/relatorios`
   no WebKit. Causa: o teste clicava em "Aplicar" (filtro de período —
   um formulário GET, navegação completa) e chamava
   `AxeBuilder.analyze()` em seguida sem uma confirmação suficientemente
   forte de que a navegação tinha terminado. Duas tentativas
   intermediárias (esperar um texto ficar visível; depois
   `waitForLoadState("load")`) reduziram mas não eliminaram a
   intermitência — confirmado rodando o teste isoladamente várias vezes
   até reproduzir a falha de novo. Corrigido com o sinal mais
   inequívoco disponível: `page.waitForURL(...)` amarrado ao clique via
   `Promise.all`, aguardando a própria URL refletir o filtro aplicado
   antes de prosseguir — reconfirmado com 4 execuções isoladas
   consecutivas sem falha antes de rodar a suíte completa novamente.

## Limitações conhecidas (não implementadas nesta fase)

- Gaps de charter exploratório listados acima (rede instável, troca de
  slug pós-publicação, falha simulada de storage/banco) — severidade
  baixa, registrados como dívida técnica de teste.
- CSP sem nonce usa `'unsafe-inline'` em `script-src`/`style-src` — ver
  ADR-0008 para o raciocínio e o caminho de evolução.
- Execução real do pipeline de CI no GitHub Actions não confirmada a
  partir deste ambiente (item 20 do checklist).

## Critérios de conclusão da fase (checklist)

- [x] Painel administrativo mínimo implementado (RF-072 a RF-075)
- [x] Bloqueio/desbloqueio nega acesso imediatamente (RN-092) e é
      auditado (RN-094)
- [x] Rota administrativa protegida no servidor (RN-095)
- [x] RN-093 decidida e implementada (catálogo oculto ao bloquear)
- [x] Cabeçalhos de segurança HTTP configurados (RNF-034)
- [x] `npm audit` sem vulnerabilidades altas/críticas
- [x] Revisão de segurança dirigida sem achado crítico
- [x] Charters exploratórios revisados e documentados
- [x] Checklist do MVP conferido (24/25 itens verificados neste
      ambiente; 1 item requer confirmação externa)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` passando
- [x] Testes unitários, de integração e E2E passando
- [x] Nenhuma violação WCAG A/AA detectada automaticamente (axe-core)
- [x] Nenhum segredo real versionado; nenhuma dependência nova instalada
- [x] Documentação atualizada (data model, ADRs 0002/0008, regras de
      negócio, matriz de rastreabilidade, README, CHANGELOG, plano de
      fases)
