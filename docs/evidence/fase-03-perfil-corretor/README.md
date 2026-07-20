# Evidências — Fase 3 (Perfil do Corretor)

Data: 2026-07-20. Ambiente: Windows 11, Node v22.22.2, npm 10.9.7,
Docker 29.6.1 (PostgreSQL e MinIO locais via `docker-compose.yml`).

## Decisão de armazenamento

MinIO (compatível com S3) escolhido para desenvolvimento local, com
`@aws-sdk/client-s3` como cliente — mesmo código funciona com qualquer
provedor real compatível com S3 em produção. Fluxo de upload simplificado
(via servidor, não URL assinada) para a foto/logo única do perfil — ver
[ADR-0003](../../architecture/decisions/0003-armazenamento-de-imagens.md)
para o raciocínio completo e o que muda na Fase 4.

## Comandos executados e resultado

| Comando                                        | Resultado                                                                                                                                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run format:check`                         | Sem problemas                                                                                                                                                                                    |
| `npm run lint`                                 | 0 erros, 0 warnings                                                                                                                                                                              |
| `npm run typecheck`                            | Sem erros (TypeScript modo estrito)                                                                                                                                                              |
| `npm run test:coverage` (Vitest)               | 106 testes aprovados (19 arquivos), incluindo os das fases anteriores — unitário + integração contra Postgres e MinIO reais                                                                      |
| `npm run build`                                | Build de produção concluído com sucesso                                                                                                                                                          |
| `npm run test:e2e` (Playwright)                | 130 execuções aprovadas em 5 projetos (Chromium, Firefox, WebKit, mobile, tablet), incluindo os novos specs de perfil, upload e publicação de catálogo, e acessibilidade sem violações WCAG A/AA |
| `npx prisma migrate dev --name broker_profile` | Migração aplicada com sucesso                                                                                                                                                                    |
| `npm audit --audit-level=high`                 | 0 vulnerabilidades altas/críticas                                                                                                                                                                |

Observação: ao rodar a suíte E2E completa com os 5 projetos em paralelo,
uma única execução apresentou `ECONNRESET` transitório (contenção de
recursos do servidor de desenvolvimento local sob carga simultânea
alta — 5 motores de navegador fazendo cadastro com hashing de senha
simultaneamente). Reexecutado isoladamente, o teste passou de forma
consistente — não é um defeito do produto. Em CI, `workers: 1` evita
essa situação (ver `playwright.config.ts`).

## Verificação empírica antes de codar

Como em fases anteriores, o comportamento de bibliotecas novas foi
validado com scripts descartáveis contra os serviços reais (Postgres +
MinIO) antes de escrever o código de produção:

1. **`sharp`** processa e comprime imagem corretamente no Windows; não
   preserva EXIF por padrão (confirmado via `sharp(buffer).metadata()`
   no resultado processado).
2. **Fluxo S3/MinIO completo** (`PutObjectCommand`, leitura pública,
   `DeleteObjectCommand`) validado de ponta a ponta antes de integrar ao
   serviço de perfil.
3. **Rejeição de conteúdo malicioso**: um "executável fake" e um SVG com
   `<script>` embutido são corretamente rejeitados pela validação de
   formato real (RN-035) — o SVG é especialmente relevante por ser um
   vetor conhecido de XSS caso fosse aceito e servido inline.

## Bugs encontrados e corrigidos durante o desenvolvimento

1. **Validação de UF aceitava apenas quando o campo estava totalmente
   ausente, não quando vinha como string vazia.** `FormData.get()` de um
   campo de texto em branco retorna `""`, não `undefined` — o
   pré-processamento do Zod só tratava `undefined` como "não informado".
   Descoberto por um teste E2E real (preenchendo o formulário como um
   usuário faria), não pelos testes unitários originais (que usavam
   objetos com a chave ausente, não `""`). Corrigido e coberto por dois
   novos testes de regressão unitários usando `""` e `null` explicitamente.
2. **Corrida entre o clique de login e uma navegação imediata em
   seguida**, em alguns testes E2E: a Server Action de login é
   assíncrona (define o cookie via `fetch`), e navegar embora
   imediatamente após o clique podia interromper essa resposta antes do
   cookie ser gravado. Corrigido centralizando o login em um helper
   (`tests/e2e/helpers/auth.ts`) que sempre aguarda o redirecionamento
   para `/painel` antes de prosseguir — mesmo padrão já usado
   corretamente na Fase 2 e agora reforçado.
3. **Upload de foto/logo antes de salvar qualquer dado de perfil
   causava um erro não tratado** (`PrismaClientKnownRequestError P2025`
   — tentativa de `update` em um registro inexistente). Corrigido no
   serviço (`ProfileNotFoundError`, mensagem amigável) e na UI (os
   formulários de upload só aparecem depois que o perfil mínimo foi
   salvo pela primeira vez).
4. **Contraste insuficiente no botão "Falar no WhatsApp"** da página
   pública do catálogo (`bg-green-600` com texto branco: 3.21:1,
   abaixo do mínimo de 4.5:1 exigido pela WCAG AA) — encontrado pelo
   teste de acessibilidade automatizado (axe-core) e corrigido para
   `bg-green-700`.
5. **Corrida em potencial na verificação de slug único**: entre o
   `SELECT` de verificação e o `upsert`, dois corretores poderiam salvar
   o mesmo slug simultaneamente. A constraint `@unique` do banco já
   impede a inconsistência de dados, mas sem tratamento o erro bruto do
   Postgres (`P2002`) vazaria como uma falha genérica. Adicionado
   `catch` específico em `saveOwnProfile` que traduz para
   `SlugTakenError` (mesma mensagem amigável do caminho comum) — não há
   teste automatizado dedicado a essa corrida específica (difícil de
   reproduzir deterministicamente), tratado como revisão de código.

Também foi necessário atualizar `.github/workflows/ci.yml` para subir o
MinIO no pipeline: o bloco `services:` do GitHub Actions não aceita um
`command:` customizado (necessário para o MinIO), então ele é iniciado
manualmente via `docker run` num passo dedicado, com espera ativa pelo
health check e criação do bucket via `minio/mc` — sequência de comandos
confirmada localmente (fora do Actions) antes de ser incorporada ao
pipeline, já que não há como executar o workflow do GitHub Actions a
partir deste ambiente.

## Critérios de conclusão da fase (checklist)

- [x] Corretor consegue salvar e editar o perfil profissional (RF-011)
- [x] Slug único, validado em tempo real, com palavras reservadas
      bloqueadas (RN-019, RN-020)
- [x] Upload de foto e logotipo com validação real de conteúdo,
      compressão e remoção de metadados (RN-021, RN-024, RN-035, RN-037)
- [x] Catálogo só publica com CRECI, WhatsApp e cidade preenchidos
      (RN-016 a RN-018)
- [x] Catálogo inativo retorna indisponível para visitantes (RN-022)
- [x] Corretor nunca acessa/edita o perfil de outro (RN-023)
- [x] Página pública mínima do catálogo funcional e acessível
- [x] `npm run lint`, `npm run typecheck`, `npm run build` passando
- [x] Testes unitários, de integração e E2E passando (todos os
      navegadores/viewports)
- [x] Nenhum segredo real versionado
- [x] Documentação atualizada (data model, matriz de rastreabilidade,
      ADR-0003, README, CHANGELOG)
