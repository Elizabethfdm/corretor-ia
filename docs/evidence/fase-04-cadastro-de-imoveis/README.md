# Evidências — Fase 4 (Cadastro de Imóveis)

Data: 2026-07-20. Ambiente: Windows 11, Node v22.22.2, npm 10.9.7,
Docker (PostgreSQL e MinIO locais via `docker-compose.yml`).

## Escopo entregue

Cadastro de imóvel em seis etapas (informações básicas, características,
localização, fotos, descrição, revisão e publicação), com salvamento de
rascunho independente por etapa, upload múltiplo de fotos com validação
de conteúdo real, publicação bloqueada até os critérios mínimos de
RN-043, transições de status validadas por um único mapa de estados
permitidos (RN-027), duplicação (RN-029), exclusão lógica reversível
(RN-028) e isolamento entre corretores (RN-026).

## Comandos executados e resultado

| Comando                                         | Resultado                                                                                |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run typecheck`                             | Sem erros (TypeScript modo estrito)                                                      |
| `npm run lint`                                  | 0 erros, 0 warnings                                                                      |
| `npm run build`                                 | Build de produção concluído com sucesso                                                  |
| `npm run test` (Vitest)                         | 170 testes aprovados (25 arquivos) — unitário + integração contra Postgres e MinIO reais |
| `npx prisma migrate dev --name properties`      | Migração aplicada com sucesso                                                            |
| `npm audit --audit-level=high`                  | 0 vulnerabilidades altas/críticas                                                        |
| `npx playwright test` (5 navegadores/viewports) | 165/165 aprovados — ver seção "Execução E2E" abaixo                                      |

## Execução E2E

Suíte nova desta fase: `tests/e2e/property-crud.spec.ts` (5 cenários —
cadastro completo com publicação, bloqueio de publicação incompleta,
mudanças de status/despublicação, exclusão/restauração, isolamento entre
corretores) e `tests/accessibility/property.spec.ts` (2 cenários — lista
vazia e todas as seis etapas do editor, sem violações WCAG A/AA).

Executado isoladamente em `chromium-desktop` com `--workers=1`: 33/33
aprovados (7 novos + 26 das fases anteriores, sem regressão).

**Suíte completa nos 5 navegadores/viewports (`chromium-desktop`,
`firefox-desktop`, `webkit-desktop`, `mobile`, `tablet`), `--workers=1`:
165/165 aprovados** (sem nenhuma falha), incluindo os cenários novos
desta fase em todos os motores.

Na primeira execução completa, 11 dos 165 falharam — todos com
`Test timeout of 30000ms exceeded`, sem nenhum erro de asserção ou de
lógica de negócio: 7 em `firefox-desktop`, 2 em `webkit-desktop` e 2 em
`tablet` (que usa o motor WebKit por padrão do descritor
`devices["iPad (gen 7)"]` do Playwright, não Chromium — um comentário
desatualizado no `playwright.config.ts` afirmava o contrário, corrigido
nesta fase). `chromium-desktop` e `mobile` (ambos motor Chromium)
ficaram 100% aprovados já na primeira execução (66/66). Firefox e WebKit
são mensuravelmente mais lentos automatizando esta aplicação neste
ambiente local — os mesmos cenários, sem nenhuma mudança de código,
passaram das 11 falhas para 0 apenas aumentando o timeout global de
`playwright.config.ts` de 30s para 45s e reexecutando exclusivamente os
três projetos afetados. Tratado como característica do ambiente local
(mesmo padrão já registrado no ADR/evidência da Fase 3 para uma
contenção transitória análoga), não como defeito de produto — reforçado
pelo fato de que aumentar apenas o orçamento de tempo, sem tocar em
nenhuma linha de código de produto ou de teste, foi suficiente para
zerar as falhas.

## Verificação empírica antes de codar

Como em fases anteriores, decisões de design foram validadas com um
script descartável (deletado após uso) contra o banco real antes de
escrever o código de produção definitivo: criação de rascunho, salvamento
de informações básicas com verificação de precisão decimal
(`450000.50` preservado exatamente como `"450000.5"`, nunca arredondado
por conversão via `number`), características e comodidades, bloqueio de
publicação com 4 motivos quando faltam endereço/descrição/foto, depois
com apenas 1 motivo (foto) após corrigir os demais, publicação bem
sucedida após adicionar uma foto, mudança de status para reservado,
duplicação (slug diferente, novo rascunho) e exclusão lógica + restauração.

## Bugs encontrados e corrigidos durante o desenvolvimento

1. **Enums do Prisma importados nos componentes cliente quebravam o
   build de produção.** `basic-info-form.tsx`, `characteristics-form.tsx`,
   `location-form.tsx`, `lib/property/labels.ts` e
   `lib/validation/property.ts` importavam os enums (`PropertyPurpose`,
   `FeatureType` etc.) de `@/generated/prisma/client` — o módulo
   "barril" do cliente Prisma, que também inclui a classe `PrismaClient`
   e dependências Node-only (`node:module`). Ao ser importado por um
   componente `"use client"`, o Turbopack tentava incluir essa árvore
   inteira no bundle do navegador, falhando com "the chunking context
   does not support external modules". Corrigido apontando esses
   imports para `@/generated/prisma/enums` — um módulo leve, gerado
   separadamente pelo Prisma, que contém só os objetos de enum, sem
   nenhuma dependência de runtime Node. Descoberto por `npm run build`
   (Turbopack falha na geração de produção; `npm run dev`/`typecheck`
   não detectam esse problema).
2. **Mensagem de status travada permanentemente após a primeira ação de
   ciclo de vida do imóvel.** `review-panel.tsx` originalmente usava três
   `useActionState` independentes (publicar, despublicar, mudar status) e
   escolhia qual mensagem mostrar priorizando "o primeiro que não estiver
   `idle`". Como um `useActionState` concluído nunca volta a `idle`
   sozinho, depois da primeira publicação bem-sucedida a mensagem de
   "Imóvel publicado." nunca mais saía da tela — mesmo depois de reservar,
   vender ou despublicar o imóvel com sucesso, o painel continuava
   mostrando a mensagem antiga. Descoberto por um teste E2E real
   (`property-crud.spec.ts`, cenário "permite reservar, marcar como
   vendido e despublicar"), não pelos testes unitários. A primeira
   tentativa de correção (comparar cada estado com uma `ref` do render
   anterior) esbarrou na regra de lint `react-hooks/refs` deste projeto
   (não permite acessar/alterar `ref.current` durante a renderização).
   A correção definitiva foi arquitetural, não um workaround: publicar,
   despublicar e as demais mudanças de status são todas o mesmo
   `changeStatusAction` no servidor, diferenciadas por um campo oculto
   `status` no formulário — um único `useActionState` no cliente elimina
   a ambiguidade por construção, e `publishAction`/`unpublishAction`
   (agora redundantes) foram removidos.
3. **Contraste insuficiente nos placeholders "Sem foto"/"Sem imagem"**
   (`text-zinc-400` sobre fundo branco: 2.62:1, abaixo do mínimo de
   4.5:1 da WCAG AA) — encontrado pelo teste de acessibilidade
   automatizado (axe-core) ao percorrer a etapa "Revisão e publicação".
   Corrigido para `text-zinc-500` (claro) / mantido `text-zinc-400`
   apenas no tema escuro, onde o contraste é suficiente. O mesmo padrão
   já existia, sem ter sido detectado antes, no placeholder de foto de
   perfil da Fase 3 (`image-upload-form.tsx`) — corrigido também, por
   ser exatamente o mesmo defeito.
4. **`restorePropertyAction` existia no servidor sem nenhum ponto de
   entrada na interface** — um corretor não tinha como restaurar um
   imóvel excluído, apesar do serviço, repositório e action já
   funcionarem corretamente (cobertos por teste de integração).
   Descoberto por revisão de código ao preparar a matriz de
   rastreabilidade (RF-034/RF-035 exigem restauração, não só exclusão).
   Corrigido adicionando `propertyRepository.findManyDeletedByBroker` e
   uma seção "Excluídos recentemente" na página de listagem, com botão
   de restaurar — coberto por um novo cenário E2E completo (excluir,
   verificar sumiço da lista ativa, restaurar, verificar retorno).
5. **Locators ambíguos nos próprios testes E2E/acessibilidade escritos
   nesta fase** (não bugs de produto, mas erros de teste que vale
   registrar): `getByLabel("Cidade")` casava também com o campo
   "Privacidade do endereço", porque a palavra "cidade" é uma substring
   literal de "privaCIDADE" e o Playwright faz correspondência parcial
   por padrão; `getByRole("button", { name: "Informações básicas" })`
   casava tanto com a aba de navegação quanto com o botão "Salvar
   informações básicas". Corrigidos com `{ exact: true }` e escopo pelo
   `nav` nomeado, respectivamente.
6. **Timeout de 30s insuficiente para Firefox/WebKit na suíte E2E
   completa** (ver seção "Execução E2E") — corrigido aumentando
   `timeout` de `playwright.config.ts` para 45s. Junto dessa correção, um
   comentário desatualizado no mesmo arquivo (afirmando que o projeto
   "tablet" roda no motor Chromium) foi corrigido para refletir a
   realidade — o descritor `devices["iPad (gen 7)"]` do Playwright usa
   WebKit por padrão.

## Limitações conhecidas (não implementadas nesta fase)

- **RF-023 (progresso de upload por arquivo, cancelar/tentar novamente):**
  o upload múltiplo usa uma única submissão de Server Action com
  feedback agregado ("Enviando..."/sucesso/erro), sem barra de progresso
  por arquivo nem cancelamento individual. Implementar progresso real
  por arquivo exigiria trocar o mecanismo de envio (Server Action não
  expõe eventos de progresso do jeito que `XMLHttpRequest` expõe) — não
  foi considerado prioritário frente ao volume testado (até 30 fotos de
  até 8 MB, tipicamente já comprimidas pela câmera do celular).
- **RF-027 (gerar/revisar descrição do imóvel com IA):** propositalmente
  fora de escopo desta fase — a abstração `AiContentProvider` (ADR-0004)
  só é construída na Fase 7. O campo de descrição é texto livre digitado
  pelo corretor. Uma linha do documento de requisitos (RF-027) e uma nota
  do ADR-0004 mencionavam incorretamente "Fase 4" para esse recurso;
  corrigidas para refletir o escopo real (Fase 7).
- **Revogação de acesso a mídia de imóvel excluído/despublicado:** o
  bucket MinIO permanece com leitura pública anônima; a URL de uma foto
  continua tecnicamente acessível a quem já a possuir mesmo depois do
  imóvel sair de circulação (mesma limitação já registrada no ADR-0003
  desde a Fase 3, ainda não resolvida). A avaliar antes do lançamento em
  produção.
- **Retenção por prazo da exclusão lógica (RN-028):** a exclusão é
  reversível indefinidamente — não há expurgo automático após um prazo
  configurável. Simplificação deliberada, documentada no código
  (`property-service.ts`).

## Critérios de conclusão da fase (checklist)

- [x] Corretor cadastra imóvel em etapas, com rascunho salvo
      independentemente (RF-018, RF-019, RN-044)
- [x] Upload múltiplo de fotos com validação real, capa automática,
      reordenação e exclusão (RN-033 a RN-037, RN-045)
- [x] Publicação bloqueada até critérios mínimos de RN-043
- [x] Transições de status validadas por um único mapa de estados
      permitidos, cobrindo publicar/despublicar/reservar/vender/alugar
      (RN-027, RN-032)
- [x] Duplicação de imóvel como novo rascunho (RN-029)
- [x] Exclusão lógica reversível, com restauração acessível pela UI
      (RN-028)
- [x] Slug regenerável até a primeira publicação, depois estável
      (RN-031)
- [x] Corretor nunca acessa/edita imóvel de outro (RN-026)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` passando
- [x] Testes unitários (170) e de integração passando
- [x] Testes E2E passando nos 5 navegadores/viewports (165/165)
- [x] Nenhuma violação WCAG A/AA detectada automaticamente (axe-core) em
      nenhuma etapa do cadastro
- [x] Nenhum segredo real versionado
- [x] Documentação atualizada (data model, matriz de rastreabilidade,
      ADR-0003, ADR-0004, README, CHANGELOG, plano de fases)
