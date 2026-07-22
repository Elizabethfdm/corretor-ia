# Evidências — Fase 7 (IA para Anúncios)

Data: 2026-07-21. Ambiente: Windows 11, Node v22.22.2, npm 10.9.7,
Docker (PostgreSQL e MinIO locais via `docker-compose.yml`).

## Escopo entregue

Geração de anúncios de imóveis com IA a partir de canal, tom, tamanho,
objetivo, público-alvo e aspectos a destacar escolhidos pelo corretor.
Abstração `AiContentProvider` (ADR-0004) com dois adaptadores:
`FakeAiProvider` (determinístico, padrão em dev/testes) e
`AnthropicAiProvider` (real, via `@anthropic-ai/sdk`, Claude). Conteúdo
sempre sinalizado como "Gerado por IA", editável antes de copiar, nunca
publicado automaticamente. Histórico por imóvel, limite mensal de
gerações por corretor, timeout e tratamento de falha do provedor.

## Decisão de produto tomada nesta fase

O ADR-0004 (Fase 0) deixava em aberto qual provedor de IA usar de
verdade. **Decisão: Anthropic Claude API**, confirmada explicitamente
pelo usuário antes da implementação — envolve custo e uma chave de API
que só o proprietário do produto pode fornecer. Documentação oficial do
SDK (`@anthropic-ai/sdk` `^0.112.4`) consultada via WebFetch antes de
escrever qualquer código de integração (nunca presumida), conforme exige
`CLAUDE.md`.

## Comandos executados e resultado

| Comando                                         | Resultado                                                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                             | Sem erros (TypeScript modo estrito)                                                                            |
| `npm run lint`                                  | 0 erros, 0 warnings                                                                                            |
| `npm run build`                                 | Build de produção concluído com sucesso (confirma que `@anthropic-ai/sdk` nunca vaza para o bundle do cliente) |
| `npm run test` (Vitest)                         | 242 testes aprovados (32 arquivos) — unitário + integração contra Postgres e MinIO reais                       |
| `npm audit --audit-level=high`                  | 0 vulnerabilidades altas/críticas                                                                              |
| `npx playwright test` (5 navegadores/viewports) | **215/215 aprovados** — ver seção "Execução E2E" abaixo                                                        |

## Execução E2E

Suítes novas desta fase: `tests/e2e/advertisement-generation.spec.ts`
(1 cenário — gerar, ver selo de IA, editar) e
`tests/accessibility/advertisement-generation.spec.ts` (1 cenário — aba
vazia e com anúncio gerado, sem violações WCAG A/AA).

**Suíte completa nos 5 navegadores/viewports (`chromium-desktop`,
`firefox-desktop`, `webkit-desktop`, `mobile`, `tablet`), `--workers=1`:
215/215 aprovados**, sem nenhuma falha — incluindo os 2 cenários novos
desta fase em todos os motores, sem regressão nas fases anteriores.

**Nota sobre cobertura real do provedor Anthropic:** todos os testes
automatizados (unitário, integração e E2E) rodam contra `FakeAiProvider`
— não há `AI_API_KEY` real disponível neste ambiente de execução, então
nenhuma chamada de rede real à Anthropic foi exercida pela suíte. A
classe `AnthropicAiProvider` foi escrita e revisada contra a
documentação oficial do SDK, mas sua integração real com a API só pode
ser validada quando uma chave de API real for configurada (fora do
escopo desta fase de desenvolvimento).

## Bugs encontrados e corrigidos durante o desenvolvimento

1. **`callToAction` esquecido no schema do banco.** O modelo
   `GeneratedAdvertisement` originalmente só tinha `title`, `content` e
   `hashtags` (replicando o modelo conceitual da Fase 0) — mas RF-055
   exige "chamada para ação" como campo distinto do corpo do anúncio.
   Descoberto ao escrever o repository, antes de qualquer teste rodar.
   Corrigido adicionando a coluna; como a primeira migração já tinha
   sido aplicada localmente sem nenhum commit, as duas migrações foram
   squashadas em uma só (`prisma migrate reset` + nova migração limpa),
   evitando duas migrações sequenciais desnecessárias no histórico —
   `prisma migrate reset` é uma operação destrutiva e só foi executada
   após confirmação explícita do usuário (o próprio Prisma bloqueia essa
   ação sem consentimento explícito).
2. **Vazamento potencial de `internalTitle` para a IA (RN-065).** A
   primeira versão de `buildPropertySubject` usava
   `property.publicTitle || property.internalTitle` como título enviado
   ao provedor de IA — o mesmo padrão de fallback usado em
   `review-panel.tsx` (Fase 4) para a prévia do próprio corretor, mas
   inadequado aqui: `internalTitle` pode conter anotações de uso interno
   do corretor, e enviá-lo a um provedor de IA externo (mesmo que apenas
   para gerar texto, nunca exibido diretamente) viola RN-065. Descoberto
   por revisão de código antes de escrever os testes de integração — não
   por um teste que falhou. Corrigido reaproveitando a mesma função de
   síntese de título já usada pelo catálogo público (`buildPublicTitle`,
   Fase 5), extraída de `catalog-service.ts` para
   `lib/property/build-public-title.ts` para ser compartilhada entre os
   dois usos sem duplicar a lógica.
3. **Variáveis de ambiente reinventadas em vez de reaproveitar o que já
   existia.** A primeira versão do código usava `ANTHROPIC_API_KEY` e
   uma constante hardcoded para o limite mensal — só depois de escrever
   o repository é que percebi que `.env.example` já tinha `AI_API_KEY`,
   `AI_REQUEST_TIMEOUT_MS` e `AI_MONTHLY_GENERATION_LIMIT` reservados
   desde a Fase 0. Corrigido para usar exatamente essas variáveis já
   scaffoldadas, em vez de introduzir nomes próprios.

## Limitações conhecidas (não implementadas nesta fase)

- **Chamadas reais à Anthropic não testadas** neste ambiente (ver nota
  acima) — a exercer manualmente quando uma `AI_API_KEY` real estiver
  disponível.
- **Sem geração assíncrona/enfileirada.** A geração é síncrona dentro da
  própria Server Action; para o volume esperado (texto curto, poucos
  segundos de latência), isso é suficiente. O enum `AdvertisementStatus`
  já prevê `FAILED` para uma eventual implementação assíncrona futura,
  mas nenhum registro com esse status é criado nesta fase (falhas não
  são persistidas — ver `data-model.md`).
- **Limite de uso é um valor único, não "por plano"** (RN-070 fala em
  "conforme o plano do corretor") — decisão confirmada com o usuário,
  já que não existe sistema de planos/assinatura em nenhuma fase do
  produto.

## Critérios de conclusão da fase (checklist)

- [x] Corretor seleciona canal, tom, tamanho, objetivo, público-alvo e
      aspectos a destacar antes de gerar (RF-054)
- [x] IA gera título, texto, chamada para ação e hashtags (RF-055)
- [x] Conteúdo sempre sinalizado como gerado por IA (RF-056, RN-068)
- [x] Conteúdo editável antes de copiar/compartilhar (RF-057, RN-067)
- [x] Histórico de anúncios por imóvel (RF-058)
- [x] Limite de gerações bloqueado com mensagem clara (RF-059, RN-070)
- [x] Falha do provedor tratada com mensagem amigável (RF-060, RN-071)
- [x] Implementado via `AiContentProvider`, independente de fornecedor
      (RF-061, ADR-0004)
- [x] Nenhuma invenção de dados, promessa indevida ou linguagem
      discriminatória (RN-062 a RN-064)
- [x] Nenhum dado privado (endereço exato, observações internas,
      título interno) enviado à IA (RN-061, RN-065)
- [x] Nunca publica sozinho — corretor sempre revisa e age manualmente
      (RN-066)
- [x] Consumo registrado (provedor, modelo) para auditoria (RN-069)
- [x] Timeout obrigatório em toda chamada ao provedor (RN-072)
- [x] Chave de API nunca exposta ao cliente (RN-074)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` passando
- [x] Testes unitários, de integração e E2E passando
- [x] Nenhuma violação WCAG A/AA detectada automaticamente (axe-core)
- [x] Nenhum segredo real versionado
- [x] Documentação atualizada (data model, matriz de rastreabilidade,
      ADR-0004, README, CHANGELOG, plano de fases)
