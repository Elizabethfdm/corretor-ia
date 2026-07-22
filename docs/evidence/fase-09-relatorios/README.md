# Evidências — Fase 9 (Relatórios)

Data: 2026-07-21. Ambiente: Windows 11, Node v22.22.2, npm 10.9.7,
Docker (PostgreSQL e MinIO locais via `docker-compose.yml`).

## Escopo entregue

Registro dos 7 eventos de analytics do MVP (`catalog_view`,
`property_view`, `whatsapp_click`, `share_click`, `copy_link`,
`ad_generated`, `art_generated` — RN-089) e relatório em
`/painel/relatorios` com cartões de indicadores, imóvel mais acessado
no período (RF-069), filtro por período (hoje/7 dias/30 dias/
personalizado — RF-068) e estado vazio claro (RN-088), sempre isolado
por corretor (RN-082, RF-070).

## Decisões técnicas tomadas nesta fase

ADR-0007 documenta duas decisões, ambas sem dependência nova:

1. **Mitigação de duplicidade (RN-084) sem cookie de visitante nem
   `middleware.ts`** — hash calculado por requisição
   (`sha256(ip + userAgent + dia-calendário)`), não reversível (RN-087).
   A alternativa original (cookie de sessão) foi descartada porque
   Server Components não podem escrever cookies durante a renderização
   (só Server Actions/Route Handlers/middleware podem), o que exigiria
   um `middleware.ts` novo só para isso.
2. **Categoria de dispositivo por regras próprias** (Mobile/Tablet/
   Desktop/Desconhecido) em vez de uma dependência dedicada de parsing
   de User-Agent — suficiente para as 4 categorias exigidas.

## Comandos executados e resultado

| Comando                                         | Resultado                                                                                |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run typecheck`                             | Sem erros (TypeScript modo estrito)                                                      |
| `npm run lint`                                  | 0 erros, 0 warnings                                                                      |
| `npm run build`                                 | Build de produção concluído com sucesso                                                  |
| `npm run test` (Vitest)                         | 306 testes aprovados (41 arquivos) — unitário + integração contra Postgres e MinIO reais |
| `npx playwright test` (5 navegadores/viewports) | **240/240 aprovados** — ver seção "Execução E2E" abaixo                                  |

## Execução E2E

Suítes novas desta fase: `tests/e2e/reports.spec.ts` (2 cenários —
fluxo completo de visitante + corretor gerando todos os 7 tipos de
evento e conferindo o relatório; estado vazio para corretor sem
atividade) e `tests/accessibility/reports.spec.ts` (1 cenário — página
de relatórios vazia e com dados, sem violações WCAG A/AA).

**Suíte completa nos 5 navegadores/viewports (`chromium-desktop`,
`firefox-desktop`, `webkit-desktop`, `mobile`, `tablet`), `--workers=1`:
240/240 aprovados**, sem nenhuma falha — incluindo os 3 cenários novos
desta fase em todos os motores, sem regressão nas fases anteriores.

**Observação (não é uma falha de teste nem defeito do recurso):** o log
do servidor de desenvolvimento registrou 3 ocorrências (de 240 testes,
em navegadores diferentes) de `"Falha ao registrar evento de
analytics"` com violação de chave estrangeira ao gravar um
`PROPERTY_VIEW`. Investigado: acontece quando o Next.js pré-busca em
segundo plano (`prefetch` automático de `<Link>`, ex.: a seção "Imóveis
semelhantes") um link para uma página de imóvel _depois_ que o teste já
encerrou e seu `deleteTestUserByEmail` já removeu o corretor/imóvel —
uma corrida entre a limpeza do teste e uma requisição de prefetch
órfã do navegador, não reproduzível em produção (um corretor real não é
excluído milissegundos depois de uma pré-busca de link de um
visitante). O tratamento _best effort_ de `recordAnalyticsEvent`
funcionou exatamente como projetado: capturou o erro, registrou o log e
não afetou nenhum teste nem a navegação real do visitante.

## Bugs encontrados e corrigidos durante o desenvolvimento

1. **Warning de lint pré-existente descoberto ao rodar `npm run lint`
   nesta fase** (não introduzido por ela): `tests/unit/lib/validation/artwork.test.ts`
   usava `const { subtitle: _subtitle, ...resto } = validInput` — o
   padrão de ignorar variáveis não usadas do projeto não cobre esse
   caso de desestruturação com resto. Corrigido para não depender desse
   padrão (`delete` explícito num objeto copiado).
2. **Teste próprio com expectativa de datas incorreta** (não um bug de
   produto): o teste inicial de `resolveReportDateRange` comparava
   datas via `toISOString().slice(0, 10)`, que normaliza para UTC — num
   servidor rodando fora do fuso UTC (como este ambiente), a conversão
   desloca a data por até um dia. Corrigido o teste para usar os
   getters locais (`getFullYear`/`getMonth`/`getDate`), consistente com
   como as datas são efetivamente construídas e comparadas na
   implementação (sempre em hora local, nunca misturando com UTC).
3. **Título interno vazando para o teste E2E (não para produção)**: o
   primeiro rascunho do teste E2E desta fase buscava o imóvel pelo
   `internalTitle` na página pública do catálogo — nunca funcionaria,
   já que o título interno corretamente nunca é exibido publicamente
   (RN-049/RN-065). Corrigido preenchendo também o "Título público" no
   teste, confirmando (não um bug) que a proteção de dados internos
   continua funcionando.
4. **Permissão de clipboard no Chromium headless**: o botão "Copiar
   link" não disparava a confirmação visual nem o evento `copy_link`
   durante o teste E2E porque `navigator.clipboard.writeText` exige a
   permissão `clipboard-write` explicitamente no Chromium automatizado.
   Corrigido concedendo a permissão via `context.grantPermissions` no
   teste (Firefox/WebKit não exigem isso e ignoram a chamada).

## Limitações conhecidas (não implementadas nesta fase)

- **Sem rate limiting nas Server Actions públicas de rastreamento**
  (`whatsapp_click`, `share_click`, `copy_link`) — o pior caso de abuso
  é inflar os próprios contadores do corretor dono da página; nenhum
  dado sensível é exposto. Ver ADR-0007.
- **Precisão de deduplicação um pouco menor que um cookie de sessão
  dedicado** ofereceria — duas pessoas atrás do mesmo IP/User-Agent no
  mesmo dia são tratadas como uma só "sessão". Aceitável para "mitigar
  duplicidade excessiva" (RN-084), não elimina 100% dos casos.
- **Painel administrativo com indicadores gerais** (RN-091) permanece
  fora do escopo desta fase — é parte do escopo mínimo de
  administração, previsto para a Fase 10.

## Critérios de conclusão da fase (checklist)

- [x] Registra os 7 tipos de evento do MVP (RF-067, RN-089)
- [x] Relatório isolado por corretor (RF-070, RN-082)
- [x] Filtro por período: hoje, 7 dias, 30 dias, personalizado (RF-068)
- [x] Identifica o imóvel mais acessado no período (RF-069)
- [x] Estado vazio claro quando não há dados (RF-071, RN-088)
- [x] Visualização do próprio painel não é contabilizada como pública
      (RN-083) — satisfeito estruturalmente (rastreamento só nas
      páginas públicas)
- [x] Mitigação de duplicidade por sessão (RN-084)
- [x] Data e hora registradas em todo evento (RN-085)
- [x] Referrer registrado só quando disponível (RN-086)
- [x] Nenhum dado pessoal desnecessário armazenado (RN-087) — hash não
      reversível, nunca o IP em si
- [x] Relatórios agregados, nunca lista individualizada de visitantes
      (RN-090)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` passando
- [x] Testes unitários, de integração e E2E passando
- [x] Nenhuma violação WCAG A/AA detectada automaticamente (axe-core)
- [x] Nenhum segredo real versionado; nenhuma dependência nova instalada
- [x] Documentação atualizada (data model, matriz de rastreabilidade,
      ADR-0007, regras de negócio, README, CHANGELOG, plano de fases)
