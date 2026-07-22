# Evidências — Fase 6 (Página Individual do Imóvel)

Data: 2026-07-20. Ambiente: Windows 11, Node v22.22.2, npm 10.9.7,
Docker (PostgreSQL e MinIO locais via `docker-compose.yml`).

## Escopo entregue

Página pública do imóvel (`/catalogo/[slug]/[propertySlug]`) com
galeria, informações completas (características, condições, descrição,
diferenciais, proximidades, condições comerciais, código de
referência), endereço completo apenas quando `visibilityType ===
"FULL_ADDRESS"` (RN-039, RN-040), contato via WhatsApp com mensagem
padrão fixa no rodapé em mobile (RN-051, RN-052), seção de imóveis
semelhantes restrita ao mesmo corretor (RN-053) e compartilhamento
(WhatsApp, copiar link, copiar mensagem, nativo) para imóvel, catálogo
completo e resultado filtrado (RF-050 a RF-052). Cartões do catálogo
(Fase 5) passam a ser links reais.

## Correção de referência cruzada

RN-057 ("registro de clique de compartilhamento como evento agregado")
apontava para "RN-064" — regra sem relação alguma, sobre linguagem não
discriminatória em anúncios de IA (Fase 7). Corrigido em
`docs/business-rules/business-rules.md` para referenciar RN-089 (o
evento `share_click` real, dentro do bloco de analytics — RN-082 a
RN-090, Fase 9).

## Dependência entre fases (RN-057)

O registro do clique de compartilhamento como evento agregado depende
de `AnalyticsEvent`, que só é criado na Fase 9. Nesta fase os botões de
compartilhamento funcionam integralmente (WhatsApp, copiar link, copiar
mensagem, compartilhamento nativo), mas nenhum evento é gravado ainda —
tratado como escopo explicitamente adiado, não como lacuna.

## Comandos executados e resultado

| Comando                                         | Resultado                                                                                |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run typecheck`                             | Sem erros (TypeScript modo estrito)                                                      |
| `npm run lint`                                  | 0 erros, 0 warnings                                                                      |
| `npm run build`                                 | Build de produção concluído com sucesso                                                  |
| `npm run test` (Vitest)                         | 211 testes aprovados (28 arquivos) — unitário + integração contra Postgres e MinIO reais |
| `npm audit --audit-level=high`                  | 0 vulnerabilidades altas/críticas                                                        |
| `npx playwright test` (5 navegadores/viewports) | **205/205 aprovados** — ver seção "Execução E2E" abaixo                                  |

## Execução E2E

Suítes novas desta fase: `tests/e2e/property-page.spec.ts` (4 cenários
— navegação completa com detalhes/contato/semelhantes, endereço oculto
por visibilidade, compartilhamento via WhatsApp, despublicado/
inexistente retorna 404) e `tests/accessibility/property-page.spec.ts`
(1 cenário — página do imóvel sem violações WCAG A/AA).

**Suíte completa nos 5 navegadores/viewports (`chromium-desktop`,
`firefox-desktop`, `webkit-desktop`, `mobile`, `tablet`), `--workers=1`:
205/205 aprovados**, sem nenhuma falha — incluindo os 6 cenários novos
desta fase em todos os motores (o teste de compartilhamento via
WhatsApp, que depende de um domínio externo real, passou de forma
consistente nos 5 navegadores após as correções descritas na seção
"Bugs encontrados").

## Bugs encontrados e corrigidos durante o desenvolvimento

1. **Mesmo problema de `react-hooks/set-state-in-effect` da Fase 4**
   reapareceu em `ShareButtons`: a detecção de suporte a
   `navigator.share` (Web Share API) precisa ser client-only para não
   divergir entre servidor e navegador (o resultado depende do
   navegador real do visitante), mas tanto atualizar o estado dentro de
   um `useEffect` quanto ler/gravar uma `ref` durante a renderização são
   proibidos pela configuração de lint deste projeto. Resolvido sem
   nenhum dos dois padrões: o botão "Compartilhar…" é sempre renderizado
   (idêntico em servidor e cliente, sem condicional), e seu próprio
   `onClick` decide em tempo de clique — usa `navigator.share` quando
   disponível, cai para copiar o link quando não. Elimina a divergência
   de hidratação pela raiz, em vez de tentar sincronizá-la depois.
2. **Teste de compartilhamento via WhatsApp dependia do carregamento
   completo de um domínio externo real** (`wa.me`, que redireciona quase
   imediatamente para `api.whatsapp.com`) — a primeira versão do teste
   E2E travava em `popup.waitForLoadState()` aguardando a infraestrutura
   do WhatsApp, fora do controle da aplicação. Corrigido lendo a URL do
   popup imediatamente após o evento de nova página (sem aguardar
   carregamento), já que `window.open` define o destino de forma
   síncrona.
3. **Mesmo teste, dois problemas adicionais em cascata ao corrigir o
   primeiro**: (a) `decodeURIComponent` não converte `+` em espaço — só
   `%XX` — e a infraestrutura do WhatsApp reescreve espaços como `+` no
   redirecionamento, quebrando a decodificação manual; corrigido usando
   `new URL(...).searchParams.get("text")`, que decodifica corretamente
   ambas as formas. (b) Sem aguardar a navegação para a página do imóvel
   antes de clicar em "Compartilhar no WhatsApp", o clique por vezes
   acertava o botão de mesmo nome na página de catálogo (de onde o teste
   partiu) — corrigido aguardando explicitamente a URL da página do
   imóvel antes de interagir com qualquer botão dela. Nenhum dos três
   era bug de produto — todos eram falhas do próprio teste E2E, mas
   documentados porque revelam armadilhas reais de testar contra
   domínios externos.
4. **Locator `article h3` do teste de ordenação da Fase 5 quebrou**
   quando `PropertyCard` deixou de ser um `<article>` para virar um
   `<a>` (Link) nesta fase — corrigido para `page.locator("h3")`
   (único elemento desse tipo na página).

## Limitações conhecidas (não implementadas nesta fase)

- **RF-053 (registro do evento de compartilhamento)**: depende de
  `AnalyticsEvent` (Fase 9) — ver seção "Dependência entre fases" acima.
- **SEO de imagem (Open Graph)**: `generateMetadata` define título e
  descrição, mas não define `openGraph.images` com a foto de capa do
  imóvel — deixado para quando o produto precisar de pré-visualizações
  ricas ao compartilhar em redes sociais.

## Critérios de conclusão da fase (checklist)

- [x] Página do imóvel exibe galeria, informações completas e dados do
      corretor (RF-045)
- [x] Botão de contato via WhatsApp com mensagem pré-formatada,
      fixo no mobile (RF-046, RF-047, RN-051, RN-052)
- [x] Imóveis semelhantes restritos ao mesmo corretor e disponíveis
      (RF-048, RN-053)
- [x] Imóvel despublicado ou inexistente retorna indisponibilidade sem
      expor dados (RF-049, RN-032, RN-054)
- [x] Endereço completo só exposto quando configurado como tal
      (RN-039, RN-040)
- [x] Compartilhamento de imóvel, catálogo e resultado filtrado
      (RF-050 a RF-052, RN-055, RN-058, RN-059, RN-060)
- [x] Nenhum dado interno exposto (RN-049)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` passando
- [x] Testes unitários, de integração e E2E passando
- [x] Nenhuma violação WCAG A/AA detectada automaticamente (axe-core)
- [x] Nenhum segredo real versionado
- [x] Documentação atualizada (data model, regras de negócio, matriz de
      rastreabilidade, README, CHANGELOG, plano de fases)
