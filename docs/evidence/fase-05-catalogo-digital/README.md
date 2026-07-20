# Evidências — Fase 5 (Catálogo Digital)

Data: 2026-07-20. Ambiente: Windows 11, Node v22.22.2, npm 10.9.7,
Docker (PostgreSQL e MinIO locais via `docker-compose.yml`).

## Escopo entregue

Catálogo público (`/catalogo/[slug]`) com listagem paginada dos imóveis
disponíveis do corretor, busca por termo livre, filtros (finalidade,
tipo, cidade, bairro, faixa de preço, quartos mínimos, vagas mínimas,
características, financiamento), ordenação (recentes, menor/maior
preço, maior área, destaques), filtros refletidos na URL (RN-047) e SEO
básico via `generateMetadata` dinâmica.

## Decisão de produto tomada nesta fase

RN-046 previa exibir "reservado"/"vendido"/"alugado" "conforme
configuração de exibição" — configuração que nunca chegou a existir no
produto. Optou-se pela regra mais simples: **o catálogo mostra
exclusivamente imóveis com status "Disponível"**. Decisão registrada em
`docs/business-rules/business-rules.md` (RN-046) junto com a
justificativa e uma nota para revisitar caso o produto precise, no
futuro, de uma vitrine de imóveis já negociados.

## Comandos executados e resultado

| Comando                          | Resultado                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run typecheck`               | Sem erros (TypeScript modo estrito)                                                              |
| `npm run lint`                    | 0 erros, 0 warnings                                                                               |
| `npm run build`                   | Build de produção concluído com sucesso                                                          |
| `npm run test` (Vitest)           | 197 testes aprovados (27 arquivos) — unitário + integração contra Postgres e MinIO reais          |
| `npx playwright test` (5 navegadores/viewports) | **180/180 aprovados** — ver seção "Execução E2E" abaixo                          |

## Execução E2E

Suíte nova desta fase: `tests/e2e/catalog-listing.spec.ts` (2 cenários —
busca/filtro/ordenação com isolamento de status RN-046, e catálogo
vazio) e `tests/accessibility/catalog.spec.ts` (1 cenário — catálogo
vazio sem violações WCAG A/AA).

**Suíte completa nos 5 navegadores/viewports (`chromium-desktop`,
`firefox-desktop`, `webkit-desktop`, `mobile`, `tablet`), `--workers=1`:
180/180 aprovados**, sem nenhuma falha — incluindo os 3 cenários novos
desta fase em todos os motores. Uma primeira tentativa de execução
completa expirou por timeout do `config.webServer` (180s) antes mesmo
de iniciar os testes; um build manual (`npm run build`) confirmou que
não havia nenhum erro real (~96s, dentro do orçamento), então foi
tratado como uma lentidão pontual do ambiente e a suíte foi reexecutada
com sucesso total na tentativa seguinte.

## Verificação empírica antes de codar

Como em fases anteriores, decisões de design foram validadas por
raciocínio direto sobre o schema já existente (nenhuma entidade nova
nesta fase) e por teste de integração real contra Postgres antes de
fechar a fase: filtro por características exige TODAS as selecionadas
(E lógico, não OU) — verificado criando um imóvel com duas
características e outro com apenas uma, confirmando que o filtro com as
duas retorna somente o primeiro; ordenação por preço confirmada com
valores nulos tratados via `nulls: "last"` do Prisma (não haveria teste
de integração cobrindo isso se a sintaxe estivesse errada — o Prisma
rejeitaria a query).

## Bugs encontrados e corrigidos durante o desenvolvimento

1. **Tipo `Prisma.DecimalFilter` não existe no cliente gerado desta
   versão do Prisma** — o filtro de faixa de preço (`priceMin`/
   `priceMax`) foi inicialmente escrito com uma anotação de tipo
   explícita `Prisma.DecimalFilter`, que não existe no namespace gerado
   (`tsc` acusou `TS2694: Namespace ... has no exported member`).
   Corrigido removendo a anotação explícita e deixando o TypeScript
   inferir o tipo a partir do literal, validado contra
   `Prisma.PropertyWhereInput` no retorno da função — mesmo resultado,
   sem depender de um nome de tipo que não é público nesta versão.
2. **Ambiguidade de rótulo `RF-049` na matriz de rastreabilidade**,
   descoberta ao adicionar a linha desta fase para "nenhum dado interno
   exposto" (RN-049): já existia uma linha da Fase 4 rotulada
   `RF-049 Isolamento entre corretores`, mas o RF-049 real (ver
   `docs/requirements/functional-requirements.md`) é sobre a página de
   imóvel despublicado/inexistente (Fase 6) — não tem relação com
   isolamento nem com RN-049. As duas linhas foram corrigidas para usar
   o prefixo `RN-XXX` (não `RF-XXX`) quando a linha documenta uma regra
   sem um requisito funcional numerado correspondente — mesma convenção
   já usada na linha "RN-013 Isolamento entre contas" da Fase 2/3.

## Limitações conhecidas (não implementadas nesta fase)

- **Cartões de imóvel ainda não são links clicáveis**: a página
  individual do imóvel (Fase 6) ainda não existe, então
  `PropertyCard` é somente informativo por enquanto — vira link assim
  que a Fase 6 estiver pronta. Decisão deliberada para não criar links
  para uma rota inexistente.
- **RF-044 (SEO)**: `generateMetadata` gera título/descrição dinâmicos,
  mas não há teste automatizado dedicado verificando o conteúdo da tag
  `<title>`/meta description — verificado apenas manualmente durante o
  desenvolvimento. A cobertura automatizada de SEO fica como débito
  técnico para uma fase futura caso o produto precise de garantias mais
  fortes aqui (ex.: Open Graph, dados estruturados).
- **Filtros de cidade/bairro são texto livre (substring, case
  insensitive)**, não um seletor com os valores realmente disponíveis
  no catálogo daquele corretor — simplificação deliberada para o MVP;
  um seletor mais amigável exigiria uma consulta adicional de valores
  distintos.

## Critérios de conclusão da fase (checklist)

- [x] Catálogo público lista somente imóveis disponíveis do corretor
      correspondente ao slug (RN-046, RF-043)
- [x] Busca por termo livre (RF-038)
- [x] Filtros por finalidade, tipo, cidade, bairro, preço, quartos,
      vagas, características e financiamento (RF-039)
- [x] Ordenação por recentes, menor/maior preço, maior área e destaques
      (RF-040)
- [x] Filtros refletidos na URL e compartilháveis (RN-047, RF-041)
- [x] Paginação (RF-042)
- [x] Nenhum dado interno exposto publicamente (RN-049)
- [x] Catálogo acessível sem autenticação (RN-048)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` passando
- [x] Testes unitários, de integração e E2E passando
- [x] Nenhuma violação WCAG A/AA detectada automaticamente (axe-core)
- [x] Nenhum segredo real versionado
- [x] Documentação atualizada (data model, regras de negócio, matriz de
      rastreabilidade, README, CHANGELOG, plano de fases)
